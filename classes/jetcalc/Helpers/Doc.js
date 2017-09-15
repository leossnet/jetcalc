var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require(__base + 'classes/jetcalc/Helpers/Base.js');
var Div = require(__base + 'classes/jetcalc/Helpers/Div.js');

var DocHelper = (new function(){

	var self = new Base("JDOC"); 
	
	self.Fields = {
		doc:["-_id","CodeDoc","IsBiztranDoc","NameDoc","PrintNameDoc","PrintNumDoc","IsShowMeasure","IsShowRoots","IsPrimary","IsAnalytic","IsOlap","IsInput","IsChart","IsPresent","IsDivObj","IsObjToRow","IsShowParentObj","CodeModel","CodeGrp","CodeRole","CodeDocType","HasChildObjs","CodeStyleTotal","CodeStyleSubtotal"],
		docobjtype:["-_id","CodeObjClass","CodeObjType","CodeDoc"],
		docbill:["-_id","CodeDoc","CodeBill"],
		doclabel:["-_id","CodeLabel","IsSignature","IsApproval","CodePeriodGrp","CodeDoc"],
		label:["-_id","CodeLabel","NameLabel","Idx"],
		labeluser:["-_id","CodeLabel","CodeUser","CodeObj"],
		user:["-_id","CodeUser","NameUser","CodeObj","JobTitle"]
	}
	
	self.SubscribeChanges(_.keys(self.Fields));

	self.get = function(CodeDoc,done){
		self.LoadInfo(function(err,INFO){
			return done(err,self.Choose(INFO,CodeDoc));
		})
	};

	self.Choose = function(INFO,CodeDoc){
		var Doc =  INFO[CodeDoc];
		if (!_.isEmpty(Doc.ObjFilter)){
			var Objs = [];
			Doc.ObjFilter.forEach(function(OF){
				Objs = Objs.concat(_.map(_.filter(INFO.Div,OF),"CodeObj"));
			})
			var ReGroupped = {};
			Objs.forEach(function(CodeObj){
				var I = INFO.Div[CodeObj];
				if (!ReGroupped[I.CodeOrg]) ReGroupped[I.CodeOrg] = [];
				ReGroupped[I.CodeOrg].push(CodeObj);
			})
			Doc.Objs = ReGroupped;
		}
		return Doc;
	}

	self.LoadInfo = function(done){
		Div.get(function(err,DivInfo){
			self.FromCache(null,function(err,Result){
				if (Result) {
					return done (err,_.merge(Result,{Div:DivInfo}));	
				}
				self.CreateInfo(function(err,Data){
					self.ToCache(null, Data, function(err){					
						return done(err,_.merge(Data,{Div:DivInfo}));
					})
				})
			})
		})
	}

	self.CreateInfo = function(done){
		var INFO = {};
		async.each(_.keys(self.Fields),function(ModelName,cb){
			mongoose.model(ModelName).find({},self.Fields[ModelName].join(" ")).isactive().lean().exec(function(err,Models){
				INFO[ModelName] = Models;
				return cb(err);
			})
		},function(err){
			if (err) return done(err);
			var Result = {};
			INFO.doc.forEach(function(Doc){
				Doc.Bills = _.map(_.filter(INFO.docbill,{CodeDoc:Doc.CodeDoc}),"CodeBill");
				Doc.ObjFilter = _.map(_.filter(INFO.docobjtype,{CodeDoc:Doc.CodeDoc}),function(OF){
					var P = {};
					["CodeObjClass","CodeObjType"].forEach(function(F){
						if (!_.isEmpty(OF[F])) P[F] = OF[F];
					})
					return P;
				});
				Doc.Labels = _.sortBy(_.map(_.filter(INFO.doclabel,{CodeDoc:Doc.CodeDoc}),function(DocLabel){
					var Users = _.filter(INFO.labeluser,{CodeLabel:DocLabel.CodeLabel}), UsersIndexed = {};
					Users.forEach(function(UL){
						UsersIndexed[UL.CodeObj] = _.find(INFO.user,{CodeUser:UL.CodeUser});
					})
					return  _.merge(_.merge(DocLabel,_.find(INFO.label,{CodeLabel:DocLabel.CodeLabel})),{
						Users:UsersIndexed
					});
				}),"Idx");
				Result[Doc.CodeDoc] = Doc;
			})
			return done(err,Result);
		})		
	}

	return self;
})



module.exports = DocHelper;