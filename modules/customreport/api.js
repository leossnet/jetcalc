var mongoose   = require('mongoose');
var router     = require('express').Router();
var _          = require('lodash');
var async      = require('async');
var socket     = require(__base+'/src/socket.js');
var api        = require(__base+'/lib/helper.js');

var CustomReportHelper = (new function(){
	var self = this;
	self.Context = {};
	self.SandBox = {};

	self.Rows = function(done){
		var Row = require(__base+'classes/calculator/helpers/Row.js');
		var RowHelper = new Row(self.Context);
		RowHelper.get(done);
	}

	self.Cols = function(done){
		var ColHelper = require(__base+'classes/jetcalc/Helpers/Col.js');
	    ColHelper.GetClean(self.Context,done);
	}

	self.Structure = function(Context,SandBox,done){
		if (SandBox.On) Context.SandBox = SandBox.CodeUser;
		self.Context = Context; 
		async.parallel({
			Rows:self.Rows,
			Cols:self.Cols,
		},done)
	}

	self.LoadReport = function(CodeReport,done){
		var Result = null;
		if (_.isEmpty(CodeReport)) return done(null,Result);
		var R = mongoose.model('report');
		R.findOne({CodeReport:CodeReport}).isactive().exec(done);
	}

	self.SaveReport = function(Report,Rows,Params,CodeUser,done){
		var R = mongoose.model('report');
		var MS = require(__base+'src/modeledit.js');
		var ModelEdit = new MS(CodeUser);
		self.LoadReport(Report.CodeReport,function(err,ExReport){
			var UpdateReport = _.pick(Report,['CodeDoc','IsDefault','IndexReport','NameReport','PrintNameReport','PrintDocReport','IsPublic','IsPrivate','CodeGrp','CodePeriodGrp']);
			if (_.isEmpty(ExReport)){
				ExReport = new R(UpdateReport);
				ExReport.CodeUser = CodeUser;
			} else {
				for (var K in UpdateReport) ExReport[K] = UpdateReport[K];
			}
			ExReport.save(CodeUser,function(err){
				if (err) return done(err);
				var ParamsUpdate = [];
				for (var CodeParam in Params){
					var CodeParamSet = Params[CodeParam];
					ParamsUpdate.push({
						CodeReport:ExReport.CodeReport,
						CodeParam:CodeParam,
						CodeParamSet:CodeParamSet,
					})
				}		
				var RowsUpdate = [];
				for (var KeyToSet in Rows){
					Rows[KeyToSet].forEach(function(CodeRow){
						var Row2Add =  {CodeRow:CodeRow,CodeReport:ExReport.CodeReport};
						Row2Add[KeyToSet] = true;
						RowsUpdate.push(Row2Add);
					})
				}
				ModelEdit.SyncLinks ("reportparamkey", {CodeReport:ExReport.CodeReport}, ParamsUpdate, function(err){
					ModelEdit.SyncLinks ("reportrow", {CodeReport:ExReport.CodeReport}, RowsUpdate, done);
				})
			})
		})
	}

	return self;
})


router.get('/params', function(req,res,next){
	var SetHelper = require(__base+'classes/jetcalc/Helpers/Set.js');	
	SetHelper.get(req.query,function(err,Result){
		if (err) return next(err);
		return res.json(Result);
	})
})


router.get('/structure', function(req,res,next){
	var ContextFields = ['Year', 'CodePeriod','IsInput','CodeDoc','CodeObj','ChildObj','Params',"CodeReport"];
	var Context = {IsDebug:false};
	ContextFields.forEach(function(F){
		Context[F] = req.query[F];
	})
	Context.IsInput  = api.parseBoolean(Context.IsInput);
	Context.Year = parseInt(Context.Year);
	Context.CodeObj = _.isEmpty(Context.ChildObj)?Context.CodeObj:Context.ChildObj;
	CustomReportHelper.Structure(Context,req.session.sandbox,function(err, Res){
		if (err) return next (err);
		return res.json(Res);
	}) 
})

router.post('/createreport', function(req,res,next){	
	var Data = JSON.parse(req.body.Data);
	CustomReportHelper.SaveReport(Data.Report,Data.Rows,Data.ParamSets,req.user.CodeUser,function(err){
		if (err) return next(err);
		return res.json({});
	})
})
  
router.delete('/report', function(req,res,next){	
	var CodeReport = req.body.CodeReport || "";
	if (!req.body.CodeReport.length) return next("Не указан код отчета");
	var CodeUser = req.user.CodeUser;
	mongoose.model("report").findOne({CodeReport:CodeReport}).isactive().exec(function(err,Report){
		if (!Report) return next("Отчет не найден "+CodeReport);
		var ToDelete = [];
		mongoose.model("reportparamkey").find({CodeReport:CodeReport}).isactive().exec(function(err,ReportParams){
			mongoose.model("reportrow").find({CodeReport:CodeReport}).isactive().exec(function(err,ReportRows){
				ToDelete = ToDelete.concat(ReportParams).concat(ReportRows);
				async.each(ToDelete,function(O,cb){
					O.remove(CodeUser,cb);
				},function(err){
					if (err) return next (err);
					Report.remove(CodeUser,function(err){
						if (err) return next (err);
						return res.json({});
					})
				})
			})
		})
	})	
})


























module.exports = router