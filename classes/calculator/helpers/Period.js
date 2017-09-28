var async = require('async');
var moment = require('moment');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require('./Base.js');



var PeriodHelper = function(Context){

	Context = _.clone(Context);
	Context.PluginName = "PERIOD";
	var self = this;
	Context.CacheFields = [];
	Base.apply(self,Context);
	self.Context = Context;

	self.periodDefine = {
		ismonth:{
			codes:['_ЯНВ','_НЕ_ЯНВ'],
			predefined:['11', '12', '13', '14', '15', '16', '17', '18', '19', '110', '111', '112']
		},
		issumperiod:{
			codes:['_МЕС_СНГ'],
			predefined:['22', '1', '24', '25', '2', '27', '28', '3', '210', '211', '4' ]
		},
		iskorrperiod:{
			codes:['KORR'],
			predefined:['31', '32','33','34','311','312','313','314','321','322','323','324','331','332','333','334','341','342','343','344']
		},
		isplanperiod:{
			codes:['PLAN'],
			predefined:['301','303','306','309','251','252','253','254']
		},
		isozhidperiod:{
			codes:[],
			predefined:['401','403','406','409']
		},
	}

	self.LoadPeriodTypes = function(done){
		var AskCodes = [];
		for (var Type in self.periodDefine){
			AskCodes = AskCodes.concat(self.periodDefine[Type].codes);
		}
		self.query('periodgrpref',{CodePeriodGrp:{$in:AskCodes}},"-_id CodePeriod CodePeriodGrp").exec(function(err,PGs){
			var Mapper = {}, Result = {}, PeriodGrps = {};
			PGs.forEach(function(PG){
				if (!Mapper[PG.CodePeriodGrp]) Mapper[PG.CodePeriodGrp] = [];
				Mapper[PG.CodePeriodGrp].push(PG.CodePeriod);
			})
			for (var Type in self.periodDefine){
				var T = self.periodDefine[Type];
				var Codes = T.predefined;
				T.codes.forEach(function(CT){
					if (!Mapper[CT]) Mapper[CT] = [];
					Codes = Codes.concat(Mapper[CT]);
				})
				Result[Type] = _.uniq(Codes);
			}
			return done(null,Result);
		})
	}


	self.get = function(done){
		self.loadFromCache(function(err,Result){
			if (Result && false) {
				return done(null,Result);
			}
			self.loadInfo(function(err,Result){
				self.saveToCache(Result,function(err){
					return done(err,Result);
				});
			})
		})
	}

	self.DisplayNames = {};

	self.loadInfo = function(done){
		var Tasks = {};
		Tasks["Formula"] = function(cb){
			var PeriodInfo = {};
			self.query('period',{IsFormula:true},"-_id CodePeriod Formula ").lean().exec(function(err,Periods){
				Periods.forEach(function(Period){
					var matches = Period.Formula.split(',');
					PeriodInfo[Period.CodePeriod] = {};
					matches && matches.forEach(function(M){
						var M = M.replaceAll('\n',''),
						    parts = M.split("="),
							periodKey = parts[0],
							periodValue = Period.CodePeriod,
							ArrInfo = null;
						if (parts[1]) {
							var arr = parts[1].split("!");
							var raw = arr[0].split(":")[0];
							var name = arr[1];
							if (name){
								if (!self.DisplayNames[Period.CodePeriod]) self.DisplayNames[Period.CodePeriod] = {};
								self.DisplayNames[Period.CodePeriod][periodKey] = name;
							}

							if (raw) {
								if (raw.indexOf('+')>=0){
									periodValue = raw.split("+");
									ArrInfo = "SUM";
								} else if (raw.indexOf('*')>=0){
									periodValue = raw.split("*");
									ArrInfo = "MULT";
								} else {
									periodValue = raw;
								}
							}
						}
						if (ArrInfo) {
							if (!PeriodInfo[Period.CodePeriod].Opinfo)	PeriodInfo[Period.CodePeriod].Opinfo = {};
							PeriodInfo[Period.CodePeriod].Opinfo[periodKey] = ArrInfo;
						}
						PeriodInfo[Period.CodePeriod][periodKey] = periodValue;
					})
				})
				return cb(null,PeriodInfo);
			})
		}
		Tasks["Simple"] = function(cb){
			self.LoadPeriodTypes(function(err,Map){
				var PeriodInfo = {};
				self.query('period',{IsFormula:false},'-_id CodePeriod MCount BeginDate EndDate NamePeriod SNamePeriod Link_periodgrpref').populate('Link_periodgrpref',"-_id CodePeriodGrp").lean().exec(function(err,Periods){
					Periods.forEach(function(Period){
						PeriodInfo[Period.CodePeriod] = {
							CodePeriod:Period.CodePeriod,
							Name:Period.NamePeriod,
							SName:Period.SNamePeriod,
							MCount:parseInt(Period.MCount),
							DCount:moment(Period.EndDate).diff(moment(Period.EndDate),"days"),
							EndDate:Period.EndDate,
							BeginDate:Period.BeginDate,
							MonthStart:Number(moment(Period.BeginDate).format('MM')),
							Grps:_.map(Period.Link_periodgrpref,'CodePeriodGrp'),
							Conditions:{}
						}
						for (var MapKey in Map){
							PeriodInfo[Period.CodePeriod].Conditions[MapKey] = Map[MapKey].indexOf(Period.CodePeriod)>=0
						}
					})
					return cb(null,PeriodInfo);
				})
			})
		}
		async.parallel(Tasks,function(err,Result){
			var Answer = _.merge(Result.Simple,Result.Formula);
			Answer.DisplayNames = self.DisplayNames;
			return done && done(err,Answer);
		})
	}
	return self;
}



module.exports = PeriodHelper;
