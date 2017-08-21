var mongoose   = require('mongoose');
var router     = require('express').Router();
var _          = require('lodash');
var async      = require('async');
var LIB        = require(__base+'lib/helpers/lib.js');
var HP = LIB.Permits;  



var BizHelper = (new function(){
	var self = this;

	self.CFG = {
		"prod":{query:{},sort:{"NumProd":1},fields:["-_id","CodeProd","NumProd","NameProd","CodeParentProd"]},
		"org":{query:{},sort:{NameOrg:1},fields:["-_id","CodeOrg","NameOrg"]},		
		"dogovor":{query:{},sort:{"NameDogovor":1},fields:["-_id","CodeDogovor","NameDogovor"]},		
		"dogovorart":{query:{},sort:{"NameDogovorArt":1},fields:["-_id","CodeDogovorArt","NameDogovorArt"]},
		"bill":{query:{},sort:{"UseAltOrg":1,"CodeBill":1},fields:["-_id","CodeBill","NameBill"]}
	}

	self.Load = function(CodeDoc,done){
		mongoose.model('doc').findOne({CodeDoc:CodeDoc}).isactive().populate("Link_docbill").lean().exec(function(err,Doc){
			self.CFG.bill.query = {CodeBill:{$in:_.map(Doc.Link_docbill,"CodeBill")}};
			var R = {};
			async.each(["prod","org","dogovor","dogovorart","bill"],function(modelName,cb){
				mongoose.model(modelName).find(self.CFG[modelName].query,self.CFG[modelName].fields.join(" ")).isactive().sort(self.CFG[modelName].sort).lean().exec(function(err,Models){
					R[modelName] = Models;
					return cb(err);
				})
			},function(err){
				if (err) return next(err);
				var prods = R.prod, realProds = [], TreeParents = {}, TreeChildren = [], Indexed = {};			
				prods.forEach(function(Prod){
					Indexed[Prod.CodeProd] = Prod;
					TreeParents[Prod.CodeProd] = Prod.CodeParentProd;
					if (!TreeChildren[Prod.CodeParentProd]) TreeChildren[Prod.CodeParentProd] = [];
					TreeChildren[Prod.CodeParentProd].push(Prod.CodeProd);
				})
				var pR = 50;
				var _parents =  function(CodeProd){
					var Chain = [], Parent = TreeParents[CodeProd];
					while (!_.isEmpty(Parent)){
						if (--pR<=0) break;
						Chain.push(Parent);
						Parent = TreeParents[Parent];
					}
					return Chain;
				}
				prods.forEach(function(Prod){
					pR = 50; 
					if (_.isEmpty(TreeChildren[Prod.CodeProd])){
						realProds.push({
							prod:Prod,
							tree:_.map(_parents(Prod.CodeProd),function(P){
								return Indexed[P];
							})
						});
					}
				})
				R.prod = realProds;
				return done(err,R);
			})
		})
	}

	self.GenerateTree = function(){

	}




	return self;
})





router.get('/biztraninfo',  HP.TaskAccess("IsBiztranTuner"), function(req,res,next){
	BizHelper.Load(req.query.CodeDoc,function(err,Result){
		Result.prod = _.map(Result.prod,function(P){
			return P.prod;
		})
		return res.json(Result);
	})	
})

router.get('/rows',  HP.TaskAccess("IsBiztranTuner"), function(req,res,next){
	var CodeDoc = req.query.CodeDoc, CodeObj = req.query.CodeObj; 
	mongoose.model("biztranrow").find({CodeDoc:CodeDoc,CodeObj:CodeObj}).isactive().sort({Index:1}).lean().exec(function(err,List){
		return res.json(List);
	})	
})


router.put('/modifyrows',  HP.TaskAccess("IsBiztranTuner"), function(req,res,next){
	var CodeDoc = req.body.Context.CodeDoc, CodeObj = req.body.Context.CodeObj, Rows = req.body.Rows; 
	Rows.forEach(function(Row){
		Row.CodeDoc = CodeDoc;
		Row.CodeObj = CodeObj;
	})
	Rows = _.filter(Rows,function(R){
		return !_.isEmpty(R.CodeBill);
	})
	var Editor = require(__base+"src/modeledit.js");
	var Saver = new Editor(req.user.CodeUser);
	Saver.SyncLinks("biztranrow", {CodeDoc:CodeDoc,CodeObj:CodeObj}, Rows, function(err){
		if (err) return next(err);
		return res.json({});
	})
})



module.exports = router