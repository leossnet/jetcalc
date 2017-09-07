var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require(__base + 'classes/jetcalc/Helpers/Base.js');

var SetHelper = (new function(){

	var self = new Base("SET"); 

	self.Fields = {
		//Отчет
		report:["-_id","CodeReport","IndexReport","NameReport","IsDefault","PrintNameReport","PrintDocReport","CodeUser","IsPublic","IsPrivate","CodeGrp","CodePeriodGrp"],
		//Переопределение ключей в отчете
		reportparamkey:["-_id","CodeParam","CodeParamSet","CodeReport"],
		//Переопределение рядов
		reportrow:["-_id","CodeRow","IsShowWithChildren","IsShowWithParent","IsShowOlap","IsToggled","IsHidden","CodeReport","CodeParamSet","CodeReport"],
		//Выбор ключей в документе
		docparamkey:["-_id","CodeParam","CodeParamSet","CodeDoc","CodePeriodGrp","IsShow"],
		//Параметры с дефолтным значением
		param:["-_id","CodeParam","NameParam","CodeListDefinition","IndexParam","CodeParamGrp","CodeParamTab","CodeParamSet"],
		//Набор ключей
		paramset:["-_id","CodeParamSet","NameParamSet","CodeListDefinition","Idx"],
		//Ключи в наборе
		paramsetkey:["-_id","CodeParamSet","CodeParamKey","KeyValue"],
		//Библиотека -> Объединяет Params и ParamSets
		listdefinition:["-_id","CodeListDefinition","NameListDefinition"],
		//Группировки
		paramgrp:["-_id","NameParamGrp","CodeParamGrp"],
		//Группировки
		paramtab:["-_id","NameParamTab","CodeParamTab"],
		//Фильтр по группам
		objgrp:["-_id","CodeGrp","CodeObj"],
		//Фильтр по периодам
		periodgrpref:["-_id","CodePeriod","CodePeriodGrp"]
	}

	self.SubscribeChanges(_.keys(self.Fields));

	self.LoadInfo = function(done){
		self.FromCache(function(err,Result){
			if (Result) {
				return done (err,Result);	
			}
			var INFO = {};
			async.each(_.keys(self.Fields),function(modelName,cb){
				mongoose.model(modelName).find({},self.Fields[modelName].join(" ")).isactive().lean().exec(function(err,List){
					INFO[modelName] = List;
					return cb(err);
				})
			},function(err){
				var guesType = function(ParamSets){
					if (ParamSets.length!=2){
						return "Select";
					}
					var F = ParamSets[0].ParamKeys, S = ParamSets[1].ParamKeys;
					if (F.length==1 && S.length==1){
						var FK = _.first(F), SK = _.first(S);
						if (FK.CodeParamKey==SK.CodeParamKey && FK.KeyValue==!SK.KeyValue){
							return "Boolean";
						}
					} 
					return "Select";
				}
				INFO.Groupped = {};
				var ParamGroups = {};
				INFO.paramgrp.forEach(function(PG){
					ParamGroups[PG.CodeParamGrp] = PG.NameParamGrp;
				})
				INFO.listdefinition.forEach(function(LD){
					var Param = _.first(_.sortBy(_.map(_.filter(INFO.param,{CodeListDefinition:LD.CodeListDefinition}),function(M){
						return _.pick(M,["CodeParam","NameParam","IndexParam","CodeParamGrp","CodeParamSet"]);
					}),"IndexParam"));
					var ParamSets = _.sortBy(_.map(_.filter(INFO.paramset,{CodeListDefinition:LD.CodeListDefinition}),function(M){
						return _.merge(_.pick(M,["CodeParamSet","NameParamSet","Idx"]),{ParamKeys:
							_.map(_.filter(INFO.paramsetkey,{CodeParamSet:M.CodeParamSet}),function(MM){
								return _.pick(MM,["CodeParamSet","CodeParamKey","KeyValue"]);
							})
						});
					}),"Idx");
					var IndexedParamSets = {};
					ParamSets.forEach(function(PS){
						IndexedParamSets[PS.CodeParamSet] = PS;
					})
					INFO.Groupped[Param.CodeParam] = _.merge(Param,{ParamSets:IndexedParamSets});
					INFO.Groupped[Param.CodeParam].Type = guesType(ParamSets);
					INFO.Groupped[Param.CodeParam].NameParamGrp = ParamGroups[INFO.Groupped[Param.CodeParam].CodeParamGrp];
				})
				var MapPeriods = {}, MapObjGrps = {};
				INFO.periodgrpref.forEach(function(PG){
					if (!MapPeriods[PG.CodePeriod]) MapPeriods[PG.CodePeriod] = [];
					MapPeriods[PG.CodePeriod].push(PG.CodePeriodGrp);
				})
				INFO.PeriodMap = MapPeriods;
				INFO.objgrp.forEach(function(OG){
					if (!MapObjGrps[OG.CodeObj]) MapObjGrps[OG.CodeObj] = [];
					MapObjGrps[OG.CodeObj].push(OG.CodeGrp);
				})
				INFO.ObjMap = MapObjGrps;
				self.ToCache(INFO,function(err){
					return done(err,INFO);
				})
			})
		})
	}

	self.FilterList = function(INFO,CodeDoc,CodeObj,CodeUser,done){
		var AllReports = [];
		if (!_.isEmpty(INFO.report)){
			console.log(">>> TODO");	
			console.log(INFO.report,CodeDoc,CodeObj,CodeUser);	
			console.log("TODO <<<");	
		}		
		return done(null,AllReports);
	}

	self.FilterParams = function(INFO,CodeDoc,CodePeriod,done){
		var CheckPeriod = INFO.PeriodMap[CodePeriod] || [];
		var DocKeys = _.filter(INFO.docparamkey,function(Key){
			return Key.CodeDoc==CodeDoc && CheckPeriod.indexOf(Key.CodePeriodGrp)!=-1;
		})
		var Result = {}, err = null;
		try{
			DocKeys.forEach(function(DocKey){
				Result[DocKey.CodeParam] = _.merge(INFO.Groupped[DocKey.CodeParam],{IsShow:DocKey.IsShow});
				if (!_.isEmpty(DocKey.CodeParamSet)) Result[DocKey.CodeParam].CodeParamSet = DocKey.CodeParamSet; // Спорно
				if (!_.isEmpty(Result[DocKey.CodeParam].CodeParamSet)){
					var Choosed = Result[DocKey.CodeParam].ParamSets[Result[DocKey.CodeParam].CodeParamSet];
					if (!_.isEmpty(Choosed)){
						Result[DocKey.CodeParam].KeysPositive = _.map(_.filter(Choosed.ParamKeys,{KeyValue:true}),"CodeParamKey");
						Result[DocKey.CodeParam].KeysNegative = _.map(_.filter(Choosed.ParamKeys,{KeyValue:false}),"CodeParamKey");
						Result[DocKey.CodeParam].AllKeys = _.map(Choosed.ParamKeys,"CodeParamKey");
					}
					
				}
			})
		} catch(e){
			err = e;
		}
		return done(err,Result);
	}

	self.ListFiltered = function(Cx,INFO){
		return function(done){
			self.FilterList(INFO,Cx.CodeDoc,Cx.CodeObj,Cx.CodeUser,done);
		}
	}

	self.ParamsFiltered = function(Cx,INFO){
		return function(done){
			self.FilterParams(INFO,Cx.CodeDoc,Cx.CodePeriod,done);
		}
	}

	self.get = function(Cx,done){
		self.LoadInfo(function(err,INFO){
			async.parallel({
				List:self.ListFiltered(Cx,INFO),
				Params:self.ParamsFiltered(Cx,INFO)
			},done)
		})
	}

	return self;
})

/*
setTimeout(function(){
	SetHelper.get({CodeDoc:'balans',CodePeriod:'12',CodeObj:'101',CodeUser:'admin'},function(err,Result){
		console.log(Result);

	})	

},1000)
*/

module.exports = SetHelper;