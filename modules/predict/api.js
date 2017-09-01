var _ = require('lodash');
var async = require('async');
var router   = require('express').Router();
var mongoose   = require('mongoose');
var LIB        = require(__base+'lib/helpers/lib.js');
var HP = LIB.Permits; 
var Data = require(__base+"modules/predict/lib.js");

router.get('/ask', LIB.Require(["Year","Period","Object"]),function(req,res){
	var Obj = req.query.Object;
	var YearPassed = parseInt(req.query.Year);
	var Period = parseInt(req.query.Period);
	Data.do(function(err,Answer){
		var DataSet = Answer[Obj];
		if (_.isEmpty(DataSet)){
			return res.json(_.keys(Answer));
		}
		var Data2Answer = {
			Predict:{},
			Correct:{},
			Before:[]			
		}
		delete DataSet.Level; delete DataSet.Name;
		var Indexed = {};
		for (var RowName in DataSet){
			for (var Year in DataSet[RowName]){
				if (!Indexed[Year]) Indexed[Year] = {};
				for (var CodePeriod in DataSet[RowName][Year]){
					if (!Indexed[Year][CodePeriod]) Indexed[Year][CodePeriod] = {};
					Indexed[Year][CodePeriod][RowName] = DataSet[RowName][Year][CodePeriod]
				}
			}
		}
		for (var Year in Indexed){
			for (var CodePeriod in Indexed[Year]){
				var RepPeriod = parseInt(CodePeriod.substring(1));
				if (Year<YearPassed || (Year==YearPassed && RepPeriod<=Period)){
					if (Year==YearPassed && Period==RepPeriod){
						Data2Answer.Correct = (_.merge({"Год":parseInt(Year),"Период":RepPeriod},Indexed[Year][CodePeriod]));
						Data2Answer.Predict = _.clone(Data2Answer.Correct);
						for (var K in Data2Answer.Predict){
							if (K!="Год" && K!="Период"){
								Data2Answer.Predict[K] = "?";
							}
						}
					} else {
						Data2Answer.Before.push(_.merge({"Год":parseInt(Year),"Период":RepPeriod},Indexed[Year][CodePeriod]));
					}
				} else {
					;
				}
				
			}
		}


		return res.json(Data2Answer);
	})
})

router.get('/data', function(req,res){
	Data.do(function(err,Answer){
		return res.json(Answer);
	})	
})


module.exports = router;