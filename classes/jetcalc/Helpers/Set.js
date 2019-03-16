var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require(__base + 'classes/jetcalc/Helpers/Base.js');
var PeriodHelper = require(__base + 'classes/jetcalc/Helpers/Period.js');
var DivHelper = require(__base + 'classes/jetcalc/Helpers/Div.js');

var SetHelper = (new function(){

	var self = new Base("JSET"); 

	self.Fields = {
		//Отчет
		report:["-_id","CodeReport","IndexReport","NameReport","IsDefault","PrintNameReport","PrintDocReport","CodeUser","IsPublic","IsPrivate","CodeGrp","CodePeriodGrp","CodeDoc"],
		//Переопределение ключей в отчете
		reportparamkey:["-_id","CodeParam","CodeParamSet","CodeReport"],
		//Переопределение рядов
		reportrow:["-_id","CodeRow","IsShowWithChildren","IsShowWithParent","IsShowOlap","IsToggled","IsHidden","CodeReport","CodeParamSet","CodeReport"],
		//Выбор ключей в документе
		docparamkey:["-_id","CodeParam","CodeParamSet","CodeDoc","CodePeriodGrp","IsShow"],
		//Параметры с дефолтным значением
		param:["-_id","CodeParam","NameParam","SNameParam","CodeListDefinition","IndexParam","CodeParamGrp","CodeParamTab","CodeParamSet"],
		//Набор ключей
		paramset:["-_id","CodeParamSet","NameParamSet","SNameParamSet","CodeListDefinition","Idx"],
		//Ключи в наборе
		paramsetkey:["-_id","CodeParamSet","CodeParamKey","KeyValue"],
		//Библиотека -> Объединяет Params и ParamSets
		listdefinition:["-_id","CodeListDefinition","NameListDefinition","SNameListDefinition"],
		//Группировки
		paramgrp:["-_id","NameParamGrp","SNameParamGrp","CodeParamGrp","IndexParamGrp"],
		//Группировки
		paramtab:["-_id","NameParamTab","SNameParamTab","CodeParamTab"],
	}

	self.SubscribeChanges(_.keys(self.Fields));

	self.LoadInfo = function(done){
		var INFO_H = {PeriodMap:{},ObjMap:{}};
		PeriodHelper.get(function(err,PeriodsInfo){
			var PData = _.forEach(_.filter(_.values(PeriodsInfo),function(P){
				return !_.isEmpty(P.Grps)
			}),function(P){
				INFO_H.PeriodMap[P.CodePeriod] = P.Grps;
			});
			DivHelper.get(function(err,DivInfo){
				_.forEach(_.values(DivInfo),function(D){
					INFO_H.ObjMap[D.CodeObj] = D.Groups;
				});
				self.FromCache(null,function(err,Result){
					if (Result && false) {
						return done (err,_.merge(Result,INFO_H));	
					}
					var INFO = {};
					async.each(_.keys(self.Fields),function(modelName,cb){
						mongoose.model(modelName).find({},self.Fields[modelName].join(" ")).isactive().lean().exec(function(err,List){
							INFO[modelName] = List;
							return cb(err);
						})
					},function(err){
						var ModFields = ["IsShowWithChildren","IsShowWithParent","IsShowOlap","IsToggled","IsHidden"];
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
							ParamGroups[PG.CodeParamGrp] = _.isEmpty(PG.SNameParamGrp) ? PG.NameParamGrp:PG.SNameParamGrp;
						})
						INFO.listdefinition.forEach(function(LD){
							var Param = _.first(_.sortBy(_.map(_.filter(INFO.param,{CodeListDefinition:LD.CodeListDefinition}),function(M){
								return _.pick(M,["CodeParam","NameParam","SNameParam","IndexParam","CodeParamGrp","CodeParamSet"]);
							}),"IndexParam"));
							var ParamSets = _.sortBy(_.map(_.filter(INFO.paramset,{CodeListDefinition:LD.CodeListDefinition}),function(M){
								return _.merge(_.pick(M,["CodeParamSet","NameParamSet","SNameParamSet","Idx"]),{ParamKeys:
									_.map(_.filter(INFO.paramsetkey,{CodeParamSet:M.CodeParamSet}),function(MM){
										return _.pick(MM,["CodeParamSet","CodeParamKey","KeyValue"]);
									})
								});
							}),"Idx");
							if (!_.isEmpty(Param)){
								INFO.Groupped[Param.CodeParam] = _.merge(Param,{ParamSets:ParamSets});
								INFO.Groupped[Param.CodeParam].Type = guesType(ParamSets);
								INFO.Groupped[Param.CodeParam].NameParamGrp = ParamGroups[INFO.Groupped[Param.CodeParam].CodeParamGrp];
							}
						})				
						INFO.Reports = _.map(INFO.report,function(R){
							var RInfo = _.merge(R,{
								reportparamkey:_.filter(INFO.reportparamkey,{CodeReport:R.CodeReport}),
								reportrow:_.filter(INFO.reportrow,{CodeReport:R.CodeReport})
							});
							ModFields.forEach(function(MF){
								var Search = {}; Search[MF] = true;
								RInfo[MF] = _.map(_.filter(RInfo.reportrow,Search),"CodeRow");
							});
							var AllKeys = [];
							RInfo.reportparamkey.forEach(function(RK){
								try{
									AllKeys = AllKeys.concat(_.map(_.filter(_.find(INFO.Groupped[RK.CodeParam].ParamSets,{CodeParamSet:RK.CodeParamSet}).ParamKeys,{KeyValue:true}),"CodeParamKey"));
								} catch(e){
									console.log("Err",e);
								}
							})
							RInfo.Keys = _.uniq(AllKeys);
							return RInfo;
						}); 
						["report","reportrow","reportparamkey"].forEach(function(F){
							delete INFO[F];
						})
						self.ToCache(null,INFO,function(err){
							return done(err,_.merge(INFO,INFO_H));
						})
					})
				})
			})
		})
	}

	self.FilterList = function(INFO,CodeDoc,CodePeriod,CodeObj,CodeUser,done){
		var Reports = _.filter(_.filter(INFO.Reports,{CodeDoc:CodeDoc}),function(R){
			var Result = true;
			if (!_.isEmpty(R.CodePeriodGrp) && !_.includes(INFO.PeriodMap[CodePeriod],R.CodePeriodGrp)){
				Result = false;
			}
			if (!_.isEmpty(R.CodeGrp)  && !_.includes(INFO.ObjMap[CodeObj],R.CodeGrp)){
				Result = false;	
			}
			if (R.IsPrivate && R.CodeUser!=CodeUser){
				Result = false;		
			}
			return Result;
		})
		return done(null,Reports);
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
			self.FilterList(INFO,Cx.CodeDoc,Cx.CodePeriod,Cx.CodeObj,Cx.CodeUser,done);
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
			},function(err,Res){
				if (err) return done(err);
				var Keys = [];
				for (var CodeParam in Res.Params){
					var KeysObj = _.find(Res.Params[CodeParam].ParamSets,{CodeParamSet:Res.Params[CodeParam].CodeParamSet});
					if (KeysObj){
						Keys = _.uniq(Keys.concat(_.map(_.filter(KeysObj.ParamKeys,{KeyValue: true}),"CodeParamKey")));
					}
				}
				Res.Keys = Keys;
				return done(err,Res);
			})
		})
	}

	return self;
})


module.exports = SetHelper;