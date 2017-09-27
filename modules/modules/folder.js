var async = require('async');
var mongoose = require('mongoose');
var moment = require('moment');
var _ = require('lodash');
var Base = require(__base+"modules/modules/basic.js"); 

var FolderModel = function(name){
	
	var self = new Base(name);

	self.MInfo = {};
	self.StopModels = ["style","format","measure","tag","label","valuta","period","grp","role","sumgrp","paramgrp"];
	self.StopFields = {
		row:{row:{CodeRowLink:1},docrow: { CodeRow: 1 }},
		docheader:{doc:{CodeDoc:1}},
		header:{docheader:{CodeHeader:1}},
		col:{colsetcol:{CodeCol:1}},
		colset:{header:{ CodeHeader:1}},
		colsetcol:{doc:{CodeDocSource:1}},
		param:{docparamkey:{CodeParam:1}},
		paramset:{docparamkey:{CodeDocParamKey:1}},
		rowtag:{row:{CodeRow:1}},
		periodgrp:{docheader: { CodePeriodGrp: 1 },colsetcolperiodgrp: { CodePeriodGrp: 1 },doclabel: { CodePeriodGrp: 1 },docparamkey: { CodePeriodGrp: 1 }},
		coltag:{col:{CodeCol:1}}
	};

	self.DependantModels = function(ModelName){
		var Result = {Out:{},My:{}};
		if (_.includes(self.StopModels,ModelName)) return Result;
		for (var Key in mongoose.modelSchemas){
			var Shema = mongoose.modelSchemas[Key].paths;
			for (var FieldName in Shema){
				var RM = Shema[FieldName].options.refmodel;
				if (!_.isEmpty(RM) && (RM==ModelName)){
					if (_.isEmpty(Result.Out[Key])) Result.Out[Key] = {};
					Result.Out[Key][FieldName] = 1;
				}
			}				
		}
		var MySchema = mongoose.modelSchemas[ModelName].paths;
		for (var FieldName in MySchema){
			var RM = MySchema[FieldName].options.refmodel;
			if (!_.isEmpty(RM) && (RM!=ModelName) ){
				if (_.isEmpty(Result.My[RM])) Result.My[RM] = {};
				Result.My[RM][FieldName] = 1;
			}
		}		
		if (self.StopFields[ModelName]){
			for (var ModelN in self.StopFields[ModelName]){
				if (Result.Out[ModelN] && _.isEqual(Result.Out[ModelN],self.StopFields[ModelName][ModelN])){
					delete Result.Out[ModelN];	
				}
				if (Result.My[ModelN] && _.isEqual(Result.My[ModelN],self.StopFields[ModelName][ModelN])) {
					delete Result.My[ModelN];	
				}
			}
		}
		return Result;
	}

	var FolderModels = [
		"docfolder","docfolderdoc","doc","docrow","row","docheader","header","colsetcol","style","colset","col",
		"periodgrp","rowsumgrp","rowtag","coltag","colsetcolgrp","present","chart","presetslot","rowchartline",
		"doctag","doclabel","label","colsetcolperiodgrp","docparamkey","param","listdefinition","paramset","paramgrp",
		"measure","period","role","sumgrp","format","grp","paramsetkey","paramkey"
	];

	async.each(
		FolderModels
	, function(ModelName,cb){
		var M = mongoose.model(ModelName), CFG = M.cfg();
		self.MInfo[ModelName] = {
			Model:M,
			Code:CFG.Code,
			IsLink:(CFG.menuplace=='Link'),
			EditFields:["-_id"].concat(_.filter(CFG.EditFields,function(F){
				return F.indexOf("Link")!=0;
			})),
			Dependant:self.DependantModels(ModelName)
		};		
		return cb();
	});

	self.ToDump = {};
	self.ToDo = {};


	self.AddToTodo = function(ModelName,Model){
		var Code = Model[self.MInfo[ModelName].Code];
		if (!self.ToDo[ModelName]) self.ToDo[ModelName] = {};
		if (_.isEmpty(self.ToDump[ModelName]) || _.isEmpty(self.ToDump[ModelName][Code])){
			self.ToDo[ModelName][Code] = Model;	
		}		
	}

	self.AddToDump = function(ModelName,Model){
		var Code = Model[self.MInfo[ModelName].Code];
		if (!self.ToDump[ModelName]) self.ToDump[ModelName] = {};
		self.ToDump[ModelName][Code] = Model;	
	}

	self.FixTodo = function(){
		var New = _.clone(self.ToDo);
		for (var ModelName in self.ToDo){
			for (var Code in self.ToDo[ModelName]){
				if (self.ToDump[ModelName] && self.ToDump[ModelName][Code]){
					delete New[ModelName][Code];
				}
			}
		}
		for (var K in New) if (_.isEmpty(New[K])) delete New[K];
		self.ToDo = New;
	}

	self.DumpCurrent = function(done){
		var DocFolder = self.MInfo["docfolder"];
		DocFolder.Model.findOne({GitModule:self.GitName},DocFolder.EditFields.join(" ")).lean().isactive().exec(function(err,StartModel){
			if (StartModel){
				self.AddToTodo("docfolder",StartModel);
			}
			self.DoWork(function(err){
				return done(err,self.ToDump);
			});
		})
	}

	self.DumpPeriods = function(done){
		var DocFolder = self.MInfo["docfolder"];
		DocFolder.Model.findOne({GitModule:self.GitName},DocFolder.EditFields.join(" ")).lean().isactive().exec(function(err,StartModel){
			self.AddToTodo("docfolder",StartModel);
			self.DoWork(function(err){
				return done(err,self.ToDump);
			});
		})
	}

	self.MaxRecursions = 10000;

	self.Skipped = [];

	self.DoWork = function(done){
		var Add = [];
		console.log(">>>>>>>>>>>>>>");
		console.log(">>>>>>>>>>>>>>");
		console.log(_.keys(self.ToDo));
		console.log(">>>>>>>>>>>>>>");
		console.log(">>>>>>>>>>>>>>");
		for (var ModelName in self.ToDo){
			var I = self.MInfo[ModelName], Out = I.Dependant.Out, My = I.Dependant.My;
			for (var Code in self.ToDo[ModelName]){
				var Moda = self.ToDo[ModelName][Code];
				if (!_.isEmpty(Out)){			
					for (var DepModel in Out){
						var Fields = _.keys(Out[DepModel]);
						if (!_.isEmpty(self.MInfo[DepModel])){
							var QAr = _.map(Fields,function(F){
								var P = {}; P[F] = Code;
								return P;
							});
							var Q = QAr.length>1 ? {$or:QAr}:_.first(QAr);
							Add.push({ModelName:DepModel,Query:Q});
						} else {
							if (!_.includes(self.Skipped,DepModel)) self.Skipped.push(DepModel);
						}
					}
				}
				if (!_.isEmpty(My)){			
					for (var DepModel in My){
						var Fields = _.keys(My[DepModel]);
						if (!_.isEmpty(self.MInfo[DepModel])){
							var QAr = _.map(Fields,function(F){
								var P = {}; P[F] = Moda[F];
								return P;
							});
							var Q = QAr.length>1 ? {$or:QAr}:_.first(QAr);
							Add.push({ModelName:DepModel,Query:Q});
						}
					}
				}
				self.AddToDump(ModelName,self.ToDo[ModelName][Code])
			}
		}
		if (_.isEmpty(Add)){
			self.FixTodo();
			if (_.isEmpty(self.ToDo)){
				return done();
			}
		}
		async.each(Add,function(Dep,cb){
			var M = self.MInfo[Dep.ModelName];
			M.Model.find(Dep.Query,M.EditFields.join(" ")).isactive().lean().exec(function(err,DModels){
				DModels.forEach(function(Mod){
					self.AddToTodo(Dep.ModelName,Mod);
				})			
				return cb();	
			})
		},function(err){
			self.FixTodo();
			if (_.isEmpty(self.ToDo) || (--self.MaxRecursions)<0){
				return done();
			}
			setTimeout(function(){
				self.DoWork(done);
			},0);
		})
	}


	return self;
}

module.exports = FolderModel;