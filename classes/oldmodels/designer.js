var mongoose = require('mongoose');
var router   = require('express').Router();
var _        = require('lodash');
var moment   = require('moment');
var async    = require('async');
var api      = require('../../lib/helper.js');
var f        = require('../../lib/functions.js');


// Изменение отчета по умолчанию
// TODO: Права
router.put('/api/designer/settings/updatedefault', api.forceCheckRole(['IsAdmin']), function(req,res){		
	var Data = req.body;
	var P = f.m('period'), K = f.m('docparamkey');
	P.findOne({CodePeriod:Data.CodePeriod},"Link_periodgrpref").populate("Link_periodgrpref","CodePeriodGrp").lean().exec(function(err,G){
		var Grps = _.map(G.Link_periodgrpref,'CodePeriodGrp');
		var Q = {CodeDoc:Data.CodeDoc,CodeParam:{$in:_.keys(Data.Params)}};
		if (Grps.indexOf('FACT')>=0) Q.CodePeriodGrp = 'FACT';
		if (Grps.indexOf('PLAN')>=0) Q.CodePeriodGrp = 'PLAN';
		K.find(Q).lean().exec(function(err,Keys){
			var Commit = {
				NameCommit:Data.Comment,
				SNameCommit:'Изменение значений по умолчанию',
				CodeUser:req.user.CodeUser,
			}
			var UpdatedKeys = [];
			Keys.forEach(function(Key){
				Key.CodeParamSet = Data.Params[Key.CodeParam];
				UpdatedKeys.push(Key);
			})
			K.directSaveArr(Commit,Keys,function(err){
				if (err) return res.json(err);
				return res.end();
			})
		})
	})
})


router.post('/api/designer/settings/createreport', function(req,res,next){		
	var Data = req.body;
	var RK = f.m('reportparamkey'), R = f.m('report');
	var ReportP = Data.Report; ReportP.IndexReport = parseInt(ReportP.IndexReport); 
	ReportP.IsPublic = api.parseBoolean(ReportP.IsPublic);ReportP.IsPrivate = api.parseBoolean(ReportP.IsPrivate);
	var CommitInfo = {NameCommit:"Сохранение нового отчета",SNameCommit:'createreport',CodeUser:req.user.CodeUser};
	R.count({CodeReport:ReportP.CodeReport}).exec(function(err,Counter){
		if (Counter && !ReportP._id) return next("Код уже используется в отчете");
		var Rep = _.pick(ReportP,['CodeReport','IndexReport','NameReport','PrintNameReport','PrintDocReport','IsPublic','IsPrivate']);
		Rep.CodeUser = req.user.CodeUser;
		Rep.CodeDoc = Data.CodeDoc;
		Rep.IsNew   = true;
		R.directSaveArr(CommitInfo,[Rep],function(err){
			if (err) {
				return next(err);	
			}
			var Keys = [], Counter = 0;
			for (var CodeParam in Data.Params){
				var CodeParamSet = Data.Params[CodeParam];
				Keys.push({
					CodeReportParamKey:Rep.CodeReport+'_'+CodeParam,
					CodeReport:Rep.CodeReport,
					CodeParam:CodeParam,
					CodeParamSet:CodeParamSet,
					IsNew:true
				})
			}			
			RK.directSaveArr(CommitInfo,Keys,function(err){
				if (err) return next(err);
				return res.end();
			})
		})
	})
})


module.exports.router = router;

