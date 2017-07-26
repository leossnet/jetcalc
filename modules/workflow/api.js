var mongoose = require('mongoose');
var router   = require('express').Router();
var async    = require('async');
var _        = require('lodash');
var RabbitManager = require('../../src/rabbitmq.js');
var lib        = require(__base+'lib/helpers/lib.js');
var Loader = require(__base+"classes/calculator/helpers/Workflow.js");
var Calculator = require(__base+'classes/calculator/Calculator.js');
var Structure  = require(__base+'classes/calculator/helpers/Structure.js');
var HP = require(__base+'lib/helpers/lib.js').Permits; 

var DataHistory = mongoose.model('datahistory', mongoose.Schema({
	CodeStateFrom  : {type: String, default:''},
	CodeStateTo    : {type: String, default:''},
	CodePeriod     : {type: String, default:'', index:true},
	YearData       : {type: Number, default:0, index:true},
	CodeDoc        : {type: String, default:'', index:true},
	CodeObj        : {type: String, default:'', index:true},
	UserEdit       : {type: String, default:''},	
	DateEdit       : {type: Date, default:Date.now,  index:true}
}));


var Helper = (new function(){
	var self = this;


	self.SetDefaultState = function(Data,done){
		self.Info(function(err,Loaded){
			var DefaultState = _.find(Loaded.State,{IsDefault:true});
			if (!DefaultState) return done();
			Data.CodeState = DefaultState.CodeState;
			return done(err,Data);
		})
	}

	self.GetData = function(Context,done){
		var Q = {
			CodePeriod:Context.CodePeriod,
			CodeObj:Context.CodeObj,
			YearData:Number(Context.Year),
			CodeDoc:Context.CodeDoc
		} 
		var CodeUser = Context.CodeUser;
		if (_.compact(_.values(Q)).length!=4){
			return done("Нужен полный контекст");
		}
		var DataModel = mongoose.model("data");
		DataModel.findOne(Q).isactive().exec(function(err,Data){
			if (Data) {
				if (!Data.CodeState){
					self.SetDefaultState(Data,function(err,Updated){
						Updated.save(CodeUser,function(err){
							if (err) console.log(err);	
							return done (null,Updated);
						})
					});
				} else {
					return done(null,Data);
				}
			} else {
				Data = new DataModel(Q);
				self.SetDefaultState(Data,function(err,Updated){
					if (err) console.log(err);
					if (!Updated) return done();
					Updated.save(CodeUser,function(err){
						if (err) console.log(err);
						return done (null,Updated);
					})
				})
			}
		})
	}

	self.Status = function(Context,done){
		self.Info(function(err,Loaded){
			self.GetData(Context,function(err,Data){
				if (!Data) return done();
				var State = _.find(Loaded.State,{CodeState:Data.CodeState});
				return done(null,_.pick(State,["NameState","CodeState"]));
			})
		})
	}

	self.AvailableActions = function(Status,Context,done){
		self.Info(function(err,Loaded){
			if (!Status) return done();
			var Routes = _.filter(Loaded.Route,{CodeInitState:Status.CodeState});
			console.log("AAAAAAAA",Status.CodeState,"STATUS",Routes.length,Routes,Context.CodePeriod);
			var Filtered = [];
			Routes.forEach(function(R){
				var Enabled = false;
				var Links = R.Link_routeperiod;
				Links.forEach(function(Link){
					if (Link.CodePeriod==Context.CodePeriod){
						if (Link.CodeDocType && Loaded.Doc[Link.CodeDocType] && Loaded.Doc[Link.CodeDocType].indexOf(Context.CodeDoc)!=-1){
							Enabled = true;
						} 
						if (Link.CodeGrp && (
							Loaded.ObjGrps[Link.CodeGrp].indexOf(Context.CodeObj)==-1 && Link.NoGrp
						||  Loaded.ObjGrps[Link.CodeGrp].indexOf(Context.CodeObj)!=-1 && !Link.NoGrp
						)){
							Enabled = true;
						}
					}
				})
				if (Enabled) Filtered.push(R);
			})
			return done(err,_.map(Filtered,function(M){
				return _.pick(M,["NameRoute","CodeFinalState","CodeRoute"]);
			}))
		})
	}

	self.Loaded = null;

	self.StatesTranslate = {

	}



	self.Info = function(done){
		if (self.Loaded) return done(null,self.Loaded);
		var L = new Loader({UseCache:false});
		L.get(function(err,Load){
			self.Loaded = Load;
			["Default","Opened","Closed","Agreed"].forEach(function(P){
				var Q = {}; Q["Is"+P] = true;
				var F = _.find(Load.State,Q);
				self.StatesTranslate[P] = (F)? F.CodeState:null;
			})
			console.log(self.StatesTranslate);
			return done(err,self.Loaded);
		});
	}

	self.CheckFiles = function(Route,Context,done){
		var Files2Check = _.filter(Route.Link_routefiletype,{CodeDoc:Context.CodeDoc,CodePeriod:Context.CodePeriod});
		if (!Files2Check.length) return done(null,{Status:"skipped",Info:"Нет обязательных файлов"});
		var Types = _.map(Files2Check,"CodeFileType");
		var Q = {
			CodePeriod:Context.CodePeriod,
			CodeObj:Context.CodeObj,
			YearData:Number(Context.Year),
			CodeDoc:Context.CodeDoc
		};
		mongoose.model("file").find(Q,"-_id CodeFileType").isactive().lean().exec(function(err,existed){
			var ExistedFiles = _.map(existed,"CodeFileType");
			var Diff = _.difference(Types,ExistedFiles);
			if (!Diff.length) return done(null,{Status:"passed",Info:"Необходимые файлы найдены"});
			return done(null,{Status:"failed",Info:"Необходимо прикрепить файлы: "+Diff.join(", ")});
		})
	}


	self.CheckPeriods = function(Route,Context,done){
		self.Info(function(err,Loaded){
			var Links = _.filter(Route.Link_routecheckperiod,{CodePeriod:Context.CodePeriod});
			var Periods2Check = [], Test = [];
			Links.forEach(function(Link){
				var K = Link.CodeCheckPeriod+":"+Link.CodeCheckState;
				if (Link.CodeDocType && Loaded.Doc[Link.CodeDocType] && Loaded.Doc[Link.CodeDocType].indexOf(Context.CodeDoc)!=-1){
					if (Test.indexOf(K)==-1){
						Periods2Check.push({CodePeriod:Link.CodeCheckPeriod,CodeState:Link.CodeCheckState});
						Test.push(K);
					}
				} 
				if (Link.CodeGrp && (
					Loaded.ObjGrps[Link.CodeGrp].indexOf(Context.CodeObj)==-1 && Link.NoGrp
				||  Loaded.ObjGrps[Link.CodeGrp].indexOf(Context.CodeObj)!=-1 && !Link.NoGrp
				)){
					if (Test.indexOf(K)==-1){
						Periods2Check.push({CodePeriod:Link.CodeCheckPeriod,CodeState:Link.CodeCheckState});
						Test.push(K);						
					}
				}
			})
			if (!Periods2Check.length){
				return done(null,{Status:"skipped",Info:"Нет связанных периодов"})
			}
			var Failed = [];
			async.each(Periods2Check,function(PeriodInfo,cb){
				self.GetData(_.merge(_.clone(Context),{CodePeriod:PeriodInfo.CodePeriod}),function(err,Data){
					if (Data.CodeState!=PeriodInfo.CodeState){
						Failed.push(PeriodInfo);
					}
					return cb();
				})

			},function(err){
				if (!Failed.length) return done(null,{Status:"passed",Info:"Связанные периоды проверены"});
				var InfoArr = [];
				Failed.forEach(function(F){
					InfoArr.push(F.CodePeriod+" : "+F.CodeState);
				})
				return done(null,{Status:"failed",Info:"Необходимые статусы связанных периодов: "+InfoArr.join(", ")});
			})
		})
	}

	self.CheckDocuments = function(Route,Context,done){
		self.Info(function(err,Loaded){
			var Docs2Check = Loaded.DocPacket[Context.CodeDoc];
			if (!Docs2Check || !Docs2Check.length){
				return done(null,{Status:"skipped",Info:"Нет зависимых документов"});
			}
			var Failed = []; ;
			if (Route.CodeFinalState!=Helper.StatesTranslate["Closed"]){
				return done(null,{Status:"skipped",Info:"Не проверяем зависимые документы"});	
			} 
			async.each(Docs2Check,function(CodeDoc,cb){
				self.GetData(_.merge(_.clone(Context),{CodeDoc:CodeDoc}),function(err,Data){
					if (Data.CodeState==Helper.StatesTranslate["Opened"]){
						Failed.push(CodeDoc);
					}
					return cb();
				})
			},function(err){
				if (!Failed.length) return done(null,{Status:"passed",Info:"Зависимые документы не открыты"});
				return done(null,{Status:"failed",Info:"Необходимо заблокировать документы: "+Failed.join(", ")});
			})
		})
	}

	self.CheckControlPoints = function(Route,Context,done){
		Context = _.merge(_.clone(Context),{UseCache:true,IsInput:true,CodeReport:"default",Codevaluta:'RUB'});
		var S = new Structure(Context);
		var CPS = [];
		S.get(function(err,Info){
			Info.Cells.forEach(function(Row){
				CPS = _.uniq(CPS.concat(_.map(_.filter(Row,{IsControlPoint:true}),"Cell")));
			})
			if (!CPS.length) return done(null,{Status:"skipped",Info:"Нет контрольных точек"});	
			Calculator.CalculateCells(Context,CPS,function(err,Result){
		      	var BadPoints = [];
		      	for (var Key in Result.Values){
		      		if (CPS.indexOf(Key)!=-1 && Result.Values[Key]){
		      			BadPoints.push(Key);
		      		}
		      	}
		      	if (!BadPoints.length) return done(null,{Status:"passed",Info:"Контрольные точки сошлись"});
		      	return done(null,{Status:"failed",Info:"Контрольные точки не сошлись: "+BadPoints.length+" шт."});	
  			})
		})
	}

	self.CheckRoute = function(Route,Context,done){
		var Checkers = ["CheckPeriods","CheckDocuments","CheckFiles","CheckControlPoints"];
		var Tasks = {};
		Checkers.forEach(function(CheckName){
			Tasks[CheckName] = function(CheckName){
				return function(cb){
					self[CheckName](Route,Context,cb);
				}
			}(CheckName);
		})
		async.parallel(Tasks,function(err,Result){
			var Ordered = {};
			Checkers.forEach(function(Key){
				Ordered[Key] = Result[Key];
			})
			return done(err,Ordered);
		})
	}

	self.ChangeStatus = function(Action,Context,done){
		// Сбрасываем у докпакетов
		// Одновременно со ссылочными периодами
		self.Info(function(err,Loaded){
			self.GetData(Context,function(err,Data){
				var Route = _.find(Loaded.Route,{CodeRoute:Action});

				var History = new DataHistory(_.merge(
					_.pick(Data,[
						"CodePeriod","YearData","CodeDoc","CodeObj","UserEdit","DateEdit"
					]),{
					CodeStateFrom  : Data.CodeState,
					CodeStateTo    : Route.CodeFinalState
				}));
				History.save(function(err){
					Data.CodeState = Route.CodeFinalState;
					Data.save(Context.CodeUser,function(err){
						return done(err);
					})
				})
			})
		})
	}

	self.Execute = function(CodeAction,Context,done){
		self.Info(function(err,Loaded){
			self.GetData(Context,function(err,Data){
				var Route = _.find(Loaded.Route,{CodeRoute:CodeAction});
				self.CheckRoute(Route,Context,function(err,Explain){
					Explain = Explain || {};
					for (var Key in Explain){
						if (Explain[Key].Status=="failed"){
							err = true;
						}
					}
					if (err) {
						return done(err,Explain);
					} else {
						self.ChangeStatus(CodeAction,Context,function(err,Explain){
							return done(err,Explain);
						})
					} 
				})
			})
		})
	}

	return self;
})


router.get('/status', function(req,res,next){ 
	var Context = lib.ReqContext(req);
	Context.CodeUser = req.user.CodeUser;
	Helper.Status(Context,function(err,Current){
		if (err) return next(err);
		Helper.AvailableActions(Current,Context,function(err,Info){
			if (err) return next(err);
			return res.json({State:Current,Actions:Info});
		})
	})
})


router.put('/execute', HP.DocAccess("DoBlock"), function(req,res,next){ 
	var Context = lib.ReqContext(req);
	Context.CodeUser = req.user.CodeUser;
	Helper.Execute(req.body.Action, Context, function(err,Info){
		Info = Info || {};
		for (var Code in Info){
			if (Info[Code].Status=="failed") err = true;
		}

		if (err) {
			Info.Status = "Failed";
		} else {
			Info.Status = "Success";
		}
		return res.json(Info);
	})
})



router.get('/statestr',function(req,res,next){ 
	Helper.Info(function(){
		return res.json(Helper.StatesTranslate);
	})
})


router.get('/history', HP.DocAccess("DoBlock"), function(req,res,next){ 
	var Context = lib.ReqContext(req);
	console.log(Context);
	mongoose.model("datahistory").find({CodeDoc:Context.CodeDoc,CodeObj:Context.CodeObj,CodePeriod:Context.CodePeriod,YearData:Context.Year},"UserEdit CodeStateFrom CodeStateTo CodePeriod YearData DateEdit").sort({DateEdit:-1}).lean().exec(function(err,Data){
		return res.json(Data);
	})
})


router.put('/forceexecute', HP.DocAccess("DoBlock"), function(req,res,next){ 
	var Context = lib.ReqContext(req);
	Context.CodeUser = req.user.CodeUser;
	var PermissionMap =  {
            "CheckControlPoints":"IsOverKPBlocker",
            "CheckPeriods":"IsOverPeriodBlocker",
            "CheckDocuments":"IsOverDocBlocker",
            "CheckFiles":"IsOverFilesBlocker"
	}
	Helper.Execute(req.body.Action, Context, function(err,Info){
		var NeedToCheck = [];
		for (var Code in Info){
			if (Info[Code].Status=="failed") NeedToCheck.push(PermissionMap[Code]);
		}
		var Error = [];
		NeedToCheck.forEach(function(Permission){
			if (!HP.CheckPrivelege(Permission,Context,req.session.permissions)){
				Error.push(Permission);
			}
		})
		if (Error.length){
			return next("Нужны права: "+Error.join(", "));
		}
		Helper.ChangeStatus(req.body.Action,Context,function(err,Result){
			if (err) return next("Ошибка смены статуса: "+err);
			return res.json(_.merge(Result,{Status:"Success"}));
		})
	})
})



module.exports = router;