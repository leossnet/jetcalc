var async = require('async');
var mongoose = require('mongoose');
var moment = require('moment');
var _ = require('lodash');
var Base = require(__base + 'classes/jetcalc/Helpers/Base.js');

var PeriodHelper = (new function(){

	var self = new Base("JPERIOD"); 

	self.Fields = {
		periodgrpref:["-_id","CodePeriod","CodePeriodGrp"],
		period:["-_id","IsFormula","CodePeriod","Formula","MCount","BeginDate","EndDate","NamePeriod","SNamePeriod"]
	}

	self.SubscribeChanges(_.keys(self.Fields));

	self.get = function(done){
		self.FromCache(null,function(err,Result){
			if (Result && false) {
				return done (err,Result);	
			}
			self.load(function(err,Data){
				self.ToCache(null,Data,function(err){
					return done(err,Data);
				})
			})
		})
	}

	self.load = function(done){
		var INFO = {};
		async.each(_.keys(self.Fields),function(modelToLoad,cb){
			mongoose.model(modelToLoad).find({},self.Fields[modelToLoad].join(" ")).isactive().lean().exec(function(err,Models){
				INFO[modelToLoad] = Models;
				return cb();
			})
		},function(err){
			if (err) return done(err);
			var Groups = {};
			INFO.periodgrpref.forEach(function(GrpLink){
				if (!Groups[GrpLink.CodePeriod]) Groups[GrpLink.CodePeriod] = [];
				Groups[GrpLink.CodePeriod].push(GrpLink.CodePeriodGrp);
			})
			var FormulaPeriods = _.filter(INFO.period,{IsFormula:true});
			var SimplePeriods = _.filter(INFO.period,{IsFormula:false});
			var PeriodInfo = {};
			SimplePeriods.forEach(function(Period){
				PeriodInfo[Period.CodePeriod] = {
					CodePeriod:Period.CodePeriod,
					Name:Period.NamePeriod,
					SName:Period.SNamePeriod,
					MCount:parseInt(Period.MCount),
					DCount:moment(Period.EndDate).diff(moment(Period.BeginDate),"days"),
					EndDate:Period.EndDate,
					BeginDate:Period.BeginDate,
					MonthStart:Number(moment(Period.BeginDate).format('MM')),
					Grps:Groups[Period.CodePeriod]
				}
			})
			var DisplayNames = {};
			FormulaPeriods.forEach(function(Period){
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
							if (!DisplayNames[Period.CodePeriod]) DisplayNames[Period.CodePeriod] = {};
							DisplayNames[Period.CodePeriod][periodKey] = name;
						}						
						if (raw) {
							if (raw.indexOf('+')>=0){
								periodValue = raw.split("+");
								ArrInfo = "SUM";
							} else if (raw.indexOf('*')>=0){
								periodValue = raw.split("*");
								ArrInfo = "MULT";
							} else {
								periodValue = name;
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
			PeriodInfo.DisplayNames = DisplayNames;
			PeriodInfo.FormulaPeriods = _.map(FormulaPeriods,"CodePeriod");
			PeriodInfo.SimplePeriods = _.map(SimplePeriods,"CodePeriod");
			return done(err,PeriodInfo);
		})
	}


	return self;
})


module.exports = PeriodHelper;

	