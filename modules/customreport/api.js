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
		var Row = require(__base+'/classes/calculator/helpers/Row.js');
		var RowHelper = new Row(self.Context);
		RowHelper.get(done);
	}

	self.Cols = function(done){
		var Col = require(__base+'/classes/calculator/helpers/Col.js');
		var ColHelper = new Col(self.Context);
		ColHelper.get(done); 
	}

	self.Structure = function(Context,SandBox,done){
		if (SandBox.On) Context.SandBox = SandBox.CodeUser;
		self.Context = Context; 
		async.parallel({
			Rows:self.Rows,
			Cols:self.Cols,
		},done)
	}

	return self;
})



router.get('/structure', function(req,res,next){
	var ContextFields = ['Year', 'CodePeriod','IsInput','CodeDoc','CodeObj','ChildObj','UseCache','Params',"CodeReport"];
	var Context = {IsDebug:false};
	ContextFields.forEach(function(F){
		Context[F] = req.query[F];
	})
	Context.IsInput  = api.parseBoolean(Context.IsInput);
	Context.UseCache = api.parseBoolean(Context.UseCache);
	Context.Year = parseInt(Context.Year);
	CustomReportHelper.Structure(Context,req.session.sandbox,function(err, Res){
		if (err) return next (err);
		return res.json(Res);
	}) 
})
  



router.delete('/report', function(req,res,next){	
	var CodeReport = req.body.CodeReport || "";
	if (!req.body.CodeReport.length) return next("Не указан код отчета");
	var CodeUser = req.user.CodeUser;
	console.log("remove report");
	mongoose.model("report").findOne({CodeReport:CodeReport}).isactive().exec(function(err,Report){
		if (!Report) return next("Отчет не найден "+CodeReport);
		var ToDelete = [];
		mongoose.model("reportparamkey").find({CodeReport:CodeReport}).isactive().exec(function(err,ReportParams){
			mongoose.model("reportrow").find({CodeReport:CodeReport}).isactive().exec(function(err,ReportRows){
				ToDelete = ToDelete.concat(ReportParams).concat(ReportRows);
				console.log(ToDelete);
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



router.post('/createreport', function(req,res,next){	
	var Data = req.body, CodeUser = req.user.CodeUser;
	var RK = mongoose.model('reportparamkey'), R = mongoose.model('report'), RR =  mongoose.model('reportrow');
	var NewReport = new R(_.pick(Data.Report,['CodeDoc','IsDefault','IndexReport','NameReport','PrintNameReport','PrintDocReport','IsPublic','IsPrivate','CodeGrp','CodePeriodGrp']));
	NewReport.CodeUser = CodeUser;
	NewReport.SetCode(function(){
		NewReport.save(CodeUser,function(err){
			if (err) return next(err);
			var Keys = [], Counter = 0;
			for (var CodeParam in Data.Params){
				var CodeParamSet = Data.Params[CodeParam];
				Keys.push( new RK({
					CodeReport:NewReport.CodeReport,
					CodeParam:CodeParam,
					CodeParamSet:CodeParamSet,
				}))
			}			
			async.each(Keys,function(key,cb){
				key.save(CodeUser,cb);
			},function(err){
				if (err) return next(err);
				var Rows = {}, Rows2Save = [];
				if (Data.Rows && _.keys(Data.Rows).length){
					for (var Field in Data.Rows){
						Data.Rows[Field].forEach(function(cR){
							if (!Rows[cR]) Rows[cR] = {CodeRow:cR,CodeReport:NewReport.CodeReport};
							Rows[cR][Field] = true;
						})
					}
					for (var CodeRow in Rows){
						Rows2Save.push(new RR(Rows[CodeRow]));
					}
				}
				if (!Rows2Save.length) return res.json({});
				async.each(Rows2Save,function(reprow,cb){
					reprow.save(CodeUser,cb);
				},function(err){
					if (err) return next(err);
					return res.json({});
				})
			})
		})
	
	});

})


module.exports = router