var mongoose = require("mongoose");
var _ = require("lodash");
var async = require("async");
var BizHelper = require(__base+"modules/biztran/helper.js");

var Planner = (new function(){

	var self = this;

	self.Timeouts = {}

	self.InProgress = {}

	self.AddPlan = function(CodeDoc,CodeUser){
		if (self.Timeouts[CodeDoc] || self.InProgress[CodeDoc]) clearTimeout(self.Timeouts[CodeDoc]);
		self.Timeouts[CodeDoc] = setTimeout(function(){
			self.InProgress[CodeDoc] = 1;
			BizHelper.SyncTree(CodeDoc,CodeUser,function(err){
				delete self.InProgress[CodeDoc];
				console.log("Sync is done for doc ",CodeDoc);
			})
		},1000)
	}

	return self;
})


var AddLinker = (new function(){
	var self = this;

	self.CFG = {
		"docrelation":"-_id CodeDocSourse CodeDocTarget",
		"billrelation":"-_id CodeBillTarget CodeBillSource IsMirror",
		"docbill":"-_id CodeDoc CodeBill"
	}

	self.Adders = function(BiztranRow,done){
		var List = {}, Adders = [], BR = mongoose.model("biztranrow");
		async.each(_.keys(self.CFG),function(modelName,cb){
			mongoose.model(modelName).find({},self.CFG[modelName]).isactive().lean().exec(function(err,Objs){
				List[modelName] = Objs;
				return cb(err);
			})
		},function(err){
			if (err) return done(err);
			var Docs = _.map(_.filter(List.docrelation,{CodeDocSourse:BiztranRow.CodeDoc}),"CodeDocTarget");
			if (_.isEmpty(Docs)) return done(err,[]);
			var Bills = {};
			List.billrelation.forEach(function(B){
				Bills[B.CodeBillSource] = {CodeBill:B.CodeBillTarget,IsMirror:B.IsMirror};
			})
			var MainBills = _.map(_.filter(List.docbill,{CodeDoc:BiztranRow.CodeDoc}),"CodeBill");
			Docs.forEach(function(CodeDoc){
				var UsedBills = _.map(_.filter(List.docbill,{CodeDoc:CodeDoc}),"CodeBill") || [];
				var NewBill = Bills[BiztranRow.CodeBill];
				if (_.isEmpty(NewBill)) return done("Не настроена модель billrelation для "+BiztranRow.CodeBill);
				if (UsedBills.indexOf(NewBill.CodeBill)!=-1){
					var Add = new BR({
						CodeDoc:CodeDoc,
						CodeBill:NewBill.CodeBill,
						CodeProd:BiztranRow.CodeProd,
						CodeObj:NewBill.IsMirror ? BiztranRow.CodeOrg:BiztranRow.CodeObj,
						CodeOrg:NewBill.IsMirror ? BiztranRow.CodeObj:BiztranRow.CodeOrg
					});
					Adders.push(Add)					
				}
			})
			return done(err,Adders);
		})
	}
	return self;
})


module.exports = {
	models:{},
	schema: {
		biztranrow: function(schema){
			schema.pre('save',function(next, done){
				var self = this, Docs = [];
				var CodeUser = self.UserEdit
				AddLinker.Adders(self,function(err,Links){
					if (err) return done(err);
					if (_.isEmpty(Links)) {
						//Planner.AddPlan(self.CodeDoc,CodeUser);
						return next();
					} 
					async.eachSeries(Links,function(L,cb){
						console.log("will save link ");
						L.userSave(CodeUser,function(err){
							if (err) console.log("================ ERR ",err);
							return cb(err);
						});
					},function(err){
						//Planner.AddPlan(self.CodeDoc,CodeUser);
						return next(err);
					})
				})
			})

			schema.pre('remove',function(next, CodeUser, done){
				var self = this, Docs = [];
				AddLinker.Adders(self,function(err,Links){
					if (err) return done(err);
					if (_.isEmpty(Links)) return next();
					async.eachSeries(Links,function(L,cb){
						mongoose.model("biztranrow").findOne(_.pick(L,["CodeDoc","CodeBill","CodeProd","CodeObj","CodeOrg"])).isactive().exec(function(err,Current){
							if (!Current) return cb();
							Current.userRemove(CodeUser,cb);
						})
					},function(){
						//Planner.AddPlan(self.CodeDoc,CodeUser);
						return next();
					})
				})
			})

			return schema; 
		}
	}
}

