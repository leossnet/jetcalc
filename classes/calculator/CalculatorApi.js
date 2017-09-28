var mongoose = require('mongoose');
var router   = require('express').Router();
var _        = require('lodash');
var moment = require('moment');
var async    = require('async');
var numeral    = require('numeral');
var Form = require('./Form.js');
var api  = require('../../lib/helper.js');
var config  = require('../../config.js');
var numeral  = require('numeral');
var db = require(__base+'/sql/db.js');
var RabbitManager = require('../../src/rabbitmq.js');
var lib        = require(__base+'lib/helpers/lib.js');
var _ = require("lodash");


var CheckConfig = function(CFG){
	var Err = [];
	["CodePeriod","Year","CodeDoc","CodeObj"].forEach(function(F){
		if (_.isEmpty(CFG[F]+"")) {
			Err.push(F);	
		}
	})
	return (_.isEmpty(Err))? null:Err;
}




router.get('/api/calculator/structure', function(req,res,next){
	var Context = lib.ReqContext(req);
	var Err = CheckConfig(Context);
	if (Err) return next("Не хватает параметров: "+Err.join(". "));
	var Structure = require(__base+"classes/jetcalc/Helpers/Structure.js")
	Structure.get(Context,function(err,Ans){
		if (err) return next(err);
		return res.json(Ans);
	})
})




router.get('/api/calculator/cells', function(req,res,next){
	var Context = lib.ReqContext(req);
	var Err = CheckConfig(Context);
	if (Err) return next("Не хватает параметров: "+Err.join(". "));
	RabbitManager.CountConsumers(function(ConsumersCount){
		if (!ConsumersCount){
			return next('Проблема с сервером. Ни одного расчетчика не запущено');		
		}
		Context.Priority = 9;
		RabbitManager.CalculateDocument(Context,function(err,Result){
			if (err) return next(err);
			return res.json(Result);
		})
	})
})





router.post('/api/cell/validateformula', function(req,res,next){
	var R = require(__base+"classes/calculator/RegExp.js");
	var DivHelperApi = require(__base+"classes/calculator/helpers/Div.js");
	var DivHelper = new DivHelperApi(req.body.Context);
	DivHelper.get(function(err,DivInfo){
		var CurrentObj = req.body.SubObj ? req.body.SubObj:req.body.Context.CodeObj;
		var RootObj = null;
		if (DivInfo[CurrentObj] && DivInfo[CurrentObj].RootObj){
			RootObj = DivInfo[CurrentObj].RootObj;
		}
		var Frm = req.body.Formula+"", Vars = Frm.match(R.Var), ToTest = {Row:[],Col:[],Period:[],Obj:[]};
		if (!Vars.length) return res.json({});
		Vars.forEach(function(Vara){
			_.keys(ToTest).forEach(function(K){
				var Match = Vara.match(R[K]);
				if (!_.isEmpty(Match)){
					ToTest[K] = ToTest[K].concat(_.map(Match,function(M){
						return M.substring(R.Symbols[K].length);
					}));
				}
			})
		})
		var Error = {};
		async.each(_.keys(ToTest),function(Key,cb){
			var Check = ToTest[Key];
			if (_.isEmpty(Check)) return cb();
			var ModelName = Key.toLowerCase();
			var Model = mongoose.model(ModelName), CFG = Model.cfg(), Code = CFG.Code, Q = {};
			Q[Code] = {$in:Check};
			Model.find(Q,Code).isactive().lean().exec(function(err,Existed){
				var Arr = _.map(Existed,Code);
				var Diff = _.difference(Check,Arr);
				if (Diff.indexOf("^")!=-1 && ModelName=='obj' && RootObj){
					Diff.splice(Diff.indexOf("^"),1);
				}
				if (!_.isEmpty(Diff)){
					Error[Key] = Diff;
				}
				return cb();
			})
		},function(err){
			if (_.isEmpty(Error)) return res.json({});
			return res.json({errMsg:Error});
		})

	})
})



























var getContext = function(Context,SandBox,CodeUser){
	Context.SandBox = null;
	if (SandBox.On) Context.SandBox = SandBox.CodeUser;
	['IsInput','UseCache','IsDebug','IsOlap'].forEach(function(Field){
		Context[Field] = (Context[Field]===true || Context[Field]==="true");
	})
	Context.Year = parseInt(Context.Year);
	Context.CodeUser  = CodeUser;
	return Context;
}

for (var Ex in Form){
	(function(router,Form,Ex){
		router.get('/api/form/'+Ex.toLowerCase(), function(req,res){
			var Context = getContext(req.query.context || req.query,req.session.sandbox,req.user.CodeUser);
			var Worker = new Form[Ex](Context);
			Worker.get(function(err,Result){
				if (err) return res.json({err:err});
				return res.json(Result);
			})
		})
	}(router,Form,Ex));
}



router.get('/api/form/info', function(req,res,next){
	var Context = getContext(req.query,req.session.sandbox,req.user.CodeUser);	
	var DocWorker = new Form['Doc'](Context);
	DocWorker.get(function(err,Doc){
		if (!Doc){
			return res.json({err:"Документ "+Context.CodeDoc+" не найден"});
		}
		if (Doc.HasChildObjs && Doc.ChildObjs.length){
			if (Doc.ChildObjs.indexOf(Context.ChildObj)==-1){
				Context.ChildObj = _.first(Doc.ChildObjs);
			}
		}
		var Parts = ['Row', 'Col'];
		if (Context.IsOlap) Parts.push('Obj');
		var Tasks = {};
		Parts.forEach(function(P){
			if (Form[P]){
				Tasks[P] = function(Worker,Context){
					return function(done){
						var W = new Worker(Context);
						W.get(done);
					}
				}(Form[P],_.clone(Context));
			}
		})
		async.parallel(Tasks,function(err,Result){
			Result.Doc = Doc;
			return res.json({err:err,Result:Result});
		})
	})
})





var CalcManager = function(Context){
	var self = this;
	self.Context = _.clone(Context);

	

	self.Calculate = function(done){
		if (self.Context.IsInput){
			var CellWorker = new Form['Cell'](self.Context);
			CellWorker.get(function(err,CellResult){
				if (CellResult.AFCells && _.keys(CellResult.AFCells.length)){
					self.AFCells = CellResult.AFCells;
					return self.CalculateSimple(done);
					return self.CalculateWithAF(done);
				} else {
					return self.CalculateSimple(done);		
				}
			})
		} else if (self.Context.IsOlap){
			return self.CalculateOlap(done); 
		} else if (self.Context.Agregate && self.Context.Agregate.length) {
			return self.CalculateAgregate(done);
		} else {
			return self.CalculateSimple(done);
		}
	}


	// Формы отчета или ввода (без автопрокачки) для 1-го объекта учета
	self.CalculateSimple = function(done){
		self.Context.Priority = 9;
		RabbitManager.CalculateDocument(self.Context,function(err,Result){
			return done(err,Result);
		})
	}
    
    // Формы ввода с автопрокачкой
	self.CalculateWithAF = function(done){
		self.Context.Priority = 9;
		async.parallel({
			document:function(done){
				RabbitManager.CalculateDocument(self.Context,function(err,Result){
					return done(err,Result);
				})
			},
			afcells:function(done){
				RabbitManager.CalculateDocument(_.merge(self.Context,{IsAFOnly:true}),function(err,Result){

				})
			}
		}, function(err,ComplexResult){
			return done(err,ComplexResult.document);
		})
	}

	// Запуск прокачек по всем периодам
	self.SaveAutoFill = function(done){

	}

	// Расчет агрегатов
	self.CalculateAgregate = function(done){
		var Objs = self.Context.Agregate;
		var Tasks = {};
		Objs.forEach(function(CodeObj){
			Tasks[CodeObj] = function(Context,CodeObj){
				return function(done){
					var Context = _.clone(self.Context);	
					delete Context.Agregate;
					Context.Priority = 1;
					Context.CodeObj = CodeObj;
					RabbitManager.CalculateDocument(Context,done);
				}
			}(self.Context,CodeObj);
		})
		async.parallel(Tasks,function(err,ResultAll){
			var OllObjs = _.keys(ResultAll).sort();
			var Key2Set = '['+OllObjs.join(',')+']';
			var AddCells = {}, Result = {Cells:{},CacheUsed:true,UsedDocs:[],Time:0,TimeLabels:{},CellsByObj:{}};
			for (var CodeObj in ResultAll){
				Result.CellsByObj[CodeObj] = ResultAll[CodeObj].Cells;
				for (var CellName in ResultAll[CodeObj].Cells){
					var NewName = CellName.replace('#'+CodeObj+'?','#'+Key2Set+'?');
					if (!AddCells[NewName]){
						AddCells[NewName] = {Type:'FRM',FRM: (ResultAll[CodeObj].Cells[CellName].FRM+'').replace('#'+CodeObj+'?','#'+Key2Set+'?'),Value:0};
					}
					AddCells[NewName].Value += numeral(ResultAll[CodeObj].Cells[CellName].Value);
				}
			}
			var ColWorker = new Form['Col'](self.Context);
			var RowWorker = new Form['Row'](self.Context);
			ColWorker.get(function(err,Cols){
				RowWorker.get(function(err,Rows){
					var ColColdes = [], ColsHowTo = {}, RowCodes = [], RowsHowTo = {};
					Cols.forEach(function(Col){
						if (Col.IsAgFormula){
							ColsHowTo[Col.Code] = Col.AgFormula;
							ColColdes.push(Col.Code);
						} else if(Col.AsAgFormula){
							ColsHowTo[Col.Code] = Col.Formula;							
							ColColdes.push(Col.Code);
						}
					})
					Rows.forEach(function(Row){
						if (Row.IsAgFormula){
							RowsHowTo[Row.CodeRow] = Row.AgFormula;
							RowCodes.push(Row.CodeRow);
						} else if(Row.AsAgFormula){
							RowsHowTo[Row.CodeRow] = Row.Formula;
							RowCodes.push(Row.CodeRow);
						}
					})
					var RecalculateCells = {};
					/*
						var ColCode = [CellParts[1],CellParts[2],CellParts[3]].join(";")+';';
						if (ColColdes.indexOf(ColCode)!=-1){
							RecalculateCells[CellName] = ColsHowTo[ColCode];
						}
	  			    */
					for (var CellName in AddCells){
						var CellParts = CellName.match(/\$(.*?)\@(.*?)\.P(.*?)\.Y(.*?)\#(.*?)\?/).splice(1);
						if (RowCodes.indexOf(CellParts[0])!=-1){
							RecalculateCells[CellName] = RowsHowTo[CellParts[0]];
						}
					}
				    Calculator.CalculateCells(self.Context,_.keys(RecalculateCells),function(err,ResultAg){
				    	for (var CellName in RecalculateCells){
				    		AddCells[CellName] = ResultAg.Cells[CellName];
				    		AddCells[CellName].Value = ResultAg.Values[CellName];
				    		AddCells[CellName].IsAg = true;

				    	}
						Result.Cells = AddCells;
						return done (err,Result);
  					}); 
				})
			})

		})
	}

	// Расчет агрегатов
	self.CalculateOlap = function(done){
		self.Context.Priority = 9;
		RabbitManager.CalculateDocument(self.Context,function(err,Result){
			var Objs = Form.Obj(_.clone(Context));
			Objs.get(function(err,Objs){
				if (err) return next(err);
				var GroupCalc = ['CodeDiv','CodeCity','CodeRegion','CodeOtrasl','CodeGrp'];
				var Cells = Result.Cells;
				var IndexedObjs = {};
				Objs.Objs.forEach(function(O){
					IndexedObjs[O.CodeObj] = _.merge(O,{CodeGrp:Objs.Grp.CodeGrp});
				})
				var ObjSums = {};
				GroupCalc.forEach(function(F){ ObjSums[F] = {}; });
				for (var CodeObj in IndexedObjs){
					var O = IndexedObjs[CodeObj];
					GroupCalc.forEach(function(F){
						if (!ObjSums[F][O[F]]) ObjSums[F][O[F]] = [];
						ObjSums[F][O[F]].push(CodeObj);
					})
				}
				var ReIndexedCells = {}, CellsByObject = {};
				for (var CellName in Result.Cells){
					var Cell = Result.Cells[CellName];
					var CellParts = CellName.match(/\$(.*?)\@(.*?)\.P(.*?)\.Y(.*?)\#(.*?)\?/).splice(1);
					var CodeObj =  CellParts[4];
					if (!ReIndexedCells[CodeObj]) ReIndexedCells[CodeObj] = [];
					ReIndexedCells[CodeObj].push(CellName);
					if (!CellsByObject[CodeObj]) CellsByObject[CodeObj] = [];
					CellsByObject[CodeObj].push(CellName);
				}
				var AddCells = {};
				for (var GrType in ObjSums){
					for (var CodeGrType in ObjSums[GrType]){
						var Objs2Add = ObjSums[GrType][CodeGrType];
						var Key2Set = '['+Objs2Add.join(',')+']';
						Objs2Add.forEach(function(O){
							CellsByObject[O].forEach(function(CellName){
								var NewName = CellName.replace('#'+O+'?','#'+Key2Set+'?');
								if (!AddCells[NewName]){
									AddCells[NewName] = {Type:'FRM',FRM:Result.Cells[CellName].FRM,Value:0};
								}
								AddCells[NewName].Value += numeral(Result.Cells[CellName].Value);
							})
						})
					}
				}
				Result.Cells  = _.merge(Result.Cells,AddCells);
				return done(err,Result);
			})			
		})
	}
}









// Задачи на расчет
router.get('/api/cells', function(req,res,next){ 
	var Context = getContext(req.query,req.session.sandbox,req.user.CodeUser);
	RabbitManager.CountConsumers(function(ConsumersCount){
		if (!ConsumersCount){
			return next('Проблема с сервером. Ни одного расчетчика не запущено');		
		}
		var DocWorker = new Form['Doc'](Context);
		DocWorker.get(function(err,Doc){
			Context.Agregate = Context.Agregate || [];		
			if (!Doc) return next("Документ "+Context.CodeDoc+" не найден");
			if (Doc.HasChildObjs && Doc.ChildObjs.length){
				if (Doc.ChildObjs.indexOf(Context.ChildObj)==-1){
					Context.ChildObj = _.first(Doc.ChildObjs);
				}
				Context.CodeObj = Context.ChildObj;
			}
			var Calc = new CalcManager(Context);
			Calc.Calculate(function(err,Result){
				if (err) return next(err);
				return res.json(Result);
			})
		})
	})
})		


var CellSaveHelper = (new function(){
	var self = this;

	self.EnsurePresence = function(CodeUser,Cells,done){
		if (config.dbsqlmap) return done();
		var ToSync = [
			{model:"user",field:"UserEdit"},
			{model:"obj",field:"CodeObj"},
			{model:"row",field:"CodeRow"},
			{model:"col",field:"CodeCol"},
			{model:"valuta",field:"CodeValuta"}
		], Objs = {};

		async.each(ToSync,function(info,cb){
			var Codes = _.uniq(_.map(Cells,info.field));
			var Q = {};
			if(info.model=='user') Q["LoginUser"] = {$in:Codes};
			else {
				Q[info.field] = {$in:Codes};
			}
			mongoose.model(info.model).find(Q).isactive().exec(function(err,Rs){
				Objs[info.model] = _.map(Rs,function(R){
					return R.GetForSql();
				});
				cb();
			})
		},function(err){
			/*var db = require(__base+'lib/db/connector.js');
			var info = {
				NameCommit:"Сохранение ячеек. Синхронизация справочников.",
				SNameCommit:'directsave',
				CodeUser:CodeUser
			}	
			var Tasks = [];
			for (var K in Objs){
				Tasks.push(function(Arr){
					return function(cb){
						db.save(info,Arr,cb);
					}
				}(Objs[K]));
			}
			async.series(Tasks,function(err){
				console.log(">>>>>>>>>>",err);
				*/
				return done();
			//})
		});
	}


	return self;
})



router.put('/api/cells', function(req,res){	
	var CodeUser = req.user.CodeUser, Context = getContext(req.body.Context,req.session.sandbox,CodeUser);	
	var Worker = new Form.Cell(Context);
	var ToSave = req.body.Cells, ToSaveReparsed = {};
	Worker.get(function(err,Result){
		var TranslateCells = Result.Work;
		var RealSave = {};
		for (var CellName in ToSave){
			var Cells = TranslateCells[CellName];
			if (TranslateCells[CellName] && Cells.length==1){
				RealSave[_.first(Cells)] =  ToSave[CellName];
			} else {
				RealSave[CellName] = ToSave[CellName];
			}
		}
		ToSave = RealSave;
		var PossibleCells = Result.Cells;
		var CellsMissed = [];
		for (var CellName in ToSave){
			var In = CellName.match(/\$(.*?)\@(.*?)\.P(.*?)\.Y(.*?)\#(.*?)\?/).splice(1);
			var Value = (ToSave[CellName].Value+'').trim(); var IsCalcValue = (Value[0]=='=');
			var RValue =null;
			if (IsCalcValue){
				try{
					console.log("RValue"+Value);
					eval("RValue"+Value);
				} catch(e){
					RValue = 0;
				}
			}
			if (ToSave[CellName].Comment && !Value){
				Value = 0;
			}
			ToSaveReparsed[CellName]  = {
				CodeCell:CellName,
				CodeUser:req.user.CodeUser,
				Comment:ToSave[CellName].Comment?ToSave[CellName].Comment:'',
				CalcValue:(IsCalcValue)?Value:'',				
				Value:(IsCalcValue)?RValue:Value,
				CodeValuta:Context.CodeValuta
			};
			if (PossibleCells.indexOf(CellName)==-1) CellsMissed.push(CellName);
		}

		var setCells = function(Cells2Save,done){
			if (config.dbsqlmap){
				db.SetCells(Cells2Save,done);
			} else {
				db.SetCells(Cells2Save,done);
			}
		}

		//if (CellsMissed.length) return res.json({err:"Ячейки принадлежат другому документу:"+CellsMissed.join(', ')});
		mongoose.model("obj").findOne({"CodeObj":Context.CodeObj},"CodeObj CodeValuta").lean().exec(function(err, Obj){
			if (!Obj) return res.json({err:'Ошибка с выбором объекта учета'});
			if (Obj.CodeValuta!=Context.CodeValuta) return res.json({err:'Ошибка в выборе валюты'});
			var Cells2Save = _.values(ToSaveReparsed);


			//CellSaveHelper.EnsurePresence(CodeUser,Cells2Save,function(){
				setCells(Cells2Save,function(err){
					var AFHelper = require(__base+'src/afill.js');
					var AF = new AFHelper();
					AF.UpdateAll(Context,function(err){
						return res.json({err:err});
					})					
				})
			//})
		})
	})
})

router.get('/api/calcinfo', api.forceCheckRole(['IsAdmin',"IsOrgAdmin"]), function(req,res,next){
		RabbitManager.Inform();
		res.end();
});





var FormulaLoader = function(){
	var self = this;

    self.FormulaPlaces = {'col':"CodeCol",'row':"CodeRow"};

    self.Load = function(cb){
      var Tasks = {};
      for (var ModelName in self.FormulaPlaces){
      	  Tasks[ModelName] = function(ModelName,Field){
      	  	return function(done){
		      mongoose.model(ModelName).find({IsFormula:true,IsActive:true},Field+" OldFormula").lean().exec(function(err,Objs){
		      	  var Result = {};
		          Objs.forEach(function(O){ Result[ModelName+"."+O[Field]] = O.OldFormula;});
		          return done(err,Result);
	          })
      	  	}
      	  }(ModelName,self.FormulaPlaces[ModelName]);
      }
      async.parallel(Tasks,function(err,Result){
      	var Formulas = {};
      	for (var ModelName in self.FormulaPlaces){
      		var Formulas = _.merge(Formulas,Result[ModelName]);
      	}      	
      	return cb(err,Formulas);
      })      
    }

    return self;
}


 var FormualChecker = function(){
    var self = this;

    self.jison = require('../calculator/jison/parser.js');
    
    self.Do = function(cb){
      var Loader = new FormulaLoader();
      Loader.Load(function(err,Formulas){
      	  if (err) return done(err);
          var Errors = {};
          for (var Code in  Formulas){
            var TestFormula = (Formulas[Code]+'').replace(/\s+/g,' ');
            try {
              self.jison.parse(TestFormula);
            } catch(e){
            	var e = e+'';
            	if (!TestFormula.length) e = "Пустая формула";
	            Errors[Code] = {
	                Code:Code,
	                Formula:TestFormula,
	                Error:e+''
	            }
            }
          }
          return cb(null,Errors);
      })
    }
    return self;
}

var FormulaUpdateSyntacis = function(){
	var self = this;
	self.Formulas = {};
	self.FormulasAll = {};

	self.diff = require('googlediff');

	self.Rules = {
		Replaces:[
			[/f\.monthInKvart\([\s]*q\.Column\.Period[\s]*\)/g,'monthInKvart(0)'],
			[/f\.If/g,'if'],
			[/f\.round/g,'round'],
			[/System\.Math\.Round/g,'round'],
			[/f\.checklimit/g,'checklimit'],
			[/f\.choose/g,'choose'],
			[/\!\=/g,'<>'],
			[/q\.Column\.Code[\s]*\=\=[\s]*["'](.*?)["']/g,'colin($1)'],
			[/query\.Column\.Code[\s]*\=\=[\s]*["'](.*?)["']/g,'colin($1)'],
			[/([$@.].*?)\.sign(.*?)\?/g,'if ($1? > 0, {$1?})'],
			[/\$i100\.conto("SIBI")\?/g,'$i100>>("T:SIBI")?'],
		]
	}

	self.UpdateVariables = function(Formula){
		var Vars = Formula.match(self.VarRgexp);
		if (!Vars) return Formula;
		if (Formula.indexOf("onperiods")!=-1
			||Formula.indexOf("q.Zone.Type")!=-1
			) return Formula;
		var Result = {};
		var ModifyFilter = function(Filter,letter,args){
			args = args;
			if (!args.length) args = "##";
			var Groups = args.split(',');
			Groups.forEach(function(B){
				Filter.push(letter+':'+B.replace(/['"]/g,''));
			})
			return Filter;
		}
		Vars.forEach(function(V){
			var Reparsed = self.ParamsFromIncompleteVar(V);
			var Filter = [], Valuta = null;
			if (Reparsed.Mods.length){				
				Reparsed.Mods.forEach(function(M){
					if (M.args && M.args.length) M.args = (M.args+'').trim()
					switch (M.func){
						case "toparentobj":
						case "tomainobj":
						case "torootobj":
							Reparsed.Obj = "^";
						break;
						case "conto":
							Filter = ModifyFilter(Filter,"B",M.args);
						break;						
						case "altgrp":
							Filter = ModifyFilter(Filter,"G",M.args);
						break;						
						case "altdiv":
							Filter = ModifyFilter(Filter,"D",M.args);
						break;	
						case "toobj":
							Reparsed.Obj = M.args;
						break;	
						case "tovaluta":
							Reparsed.Valuta = '['+M.args+']';
						break;
						case "altobjfilter":
							var Test  = M.args.split(",");
							var Divs = [], Grps = [], Objs = [];
							Test.forEach(function(T){
								if(T.indexOf("div_")==0){
									Divs.push(T.split("div_").splice(1).join('div_'));
								} else 
								if(T.indexOf("grp_")==0){
									Divs.push(T.split("grp_").splice(1).join('grp_'));
								} else {
									Objs.push(T);
								}
							})
							if (Divs.length) Filter = ModifyFilter(Filter,"D",Divs.join(','));
							if (Grps.length) Filter = ModifyFilter(Filter,"G",Grps.join(','));
							if (Objs.length) Filter = ModifyFilter(Filter,"#",Objs.join(','));
						break;						
						case "altobj":
							Filter = ModifyFilter(Filter,"#",M.args);
						break;
						case "consobj":
						    // Проверка аргумента
							if (M.args=="_PARENT.CLASS"){
								Reparsed.ConsObj = "(^)";
							} else if (!M.args.length){
								Reparsed.ConsObj = "()";
							} else {
								Reparsed.ConsObj = "(T:"+M.args+')';
							}
						break;
						default:
							die();
					}
				})
			}
			if (Filter.length){
				Reparsed.Filter = "("+Filter.join(', ')+")";
			}
			Result[V] = self.JoinBack(Reparsed);
		})
		for (var Key in Result){
			Formula = Formula.split(Key).join(Result[Key]);
		}
		return Formula;
	}

	self.VarRgexp  = /[$@].*?\?/g;
	self.Modifiers = /\.([a-z]*)\((.*?)\)/g;

	self.JoinBack = function(R){
		var Result = "";
		for (var Key in self.Signs){
			if (R[Key] && R[Key]!='null') Result += self.Signs[Key]+R[Key];
		}
		return Result+'?';
	}

	self.Signs = {"Row": "$", "Col": "@", "Year":'.Y',"Period":".P", "Obj":"#", "ConsObj":"<<","Filter":">>","Valuta":""}

	self.ParamsFromIncompleteVar = function(v){
		var _setVar = function(unparsed,name,regexp){
	 		var t = unparsed.match(regexp);
	 		if (!t || !t[0]) return null;
	 		else return t[0];
	 	}
	 	var R = {
	 		Row:(_setVar(v, 'Row', /\$[A-Za-zА-Яа-я0-9_\.\- \,]*(?=[@?\.#])/)+'').replace(self.Signs.Row,''),
	 		Col:(_setVar(v, 'Col', /\@[A-Za-zА-Яа-я0-9_]*(?=[@?\.#])/)+'').replace(self.Signs.Col,''),
			Year:(_setVar(v, 'Year',/\.Y[-]?\d*(?=[?\.#])/)+'').replace(self.Signs.Year,''),	 		
	 		Period:(_setVar(v, 'Period',/\.P[-]?\d*(?=[?\.#])/)+'').replace(self.Signs.Period,''),
	 		Obj:(_setVar(v, 'Obj',/\#.*?(?=[?\.])/)+'').replace(self.Signs.Obj,''),
	 		Mods:[],
	 		ConsObj:null,
	 		Filter:null,
	 		Valuta:null
	 	}
	 	if (R.Row.indexOf("m150")==0 && self.CodeProds.indexOf(R.Row)!=-1){
	 		R.Row = "("+R.Row+")";
	 	}
	 	if (R.Col && R.Col.indexOf("_FA")!=-1) {
	 		if(R.Col.indexOf("_FA")==(R.Col.length-3)){
	 			R.Col = R.Col.substring(0,(R.Col.length-3));	
	 		}	 		
	 	}
	 	var modifiers = v.match(self.Modifiers)
		if (modifiers && modifiers.length){
			var Mods = [];
			var Reg = new RegExp(self.Modifiers);
			while (m = Reg.exec(v)){
				var Mod = {text:m[0],func:m[1],args:(m[2]+'').replace(/['"]/g,'')};
				Mods.push(Mod);	
			}
			R.Mods = Mods;
		}
		return R;
	}



	self.Reparse = function(Formula){
		self.Rules.Replaces.forEach(function(Arr){
			Formula = Formula.replace(Arr[0],Arr[1]);
		})
		Formula = self.UpdateVariables(Formula);
		return Formula;
	}

	self.OnlyShow = true;


	self.CodeProds = [];

	self.LoadInfo = function(done){
		mongoose.model("prod").find({IsActive:true},"-_id CodeProd").lean().exec(function(err,Prods){
			self.CodeProds = _.map(Prods,"CodeProd");
			return done(err);
		})
	}

	self.Do = function(done){
		var Loader = new FormulaLoader();
		var BulkUpdate = {
			row:mongoose.model('row').collection.initializeOrderedBulkOp(),
			col:mongoose.model('col').collection.initializeOrderedBulkOp()
		}
		var Counters = {row:0,col:0};
		self.LoadInfo(function(err){
			Loader.Load(function(err,Formulas){
				for (var Key in Formulas){
					var Old = Formulas[Key];
					var Reparsed = self.Reparse(Old);
					if (Reparsed!=Old){
						var dmp = new self.diff();
						var diff = dmp.diff_main(Old, Reparsed);
						self.Formulas[Key] = {
							Code:Key,
							OldFormula:Old,
							Formula: dmp.diff_prettyHtml(diff).replaceAll('&para;','')
						}
						var partKeys = Key.split('.');
						Counters[partKeys[0]]++;
						if (partKeys[0]=='row'){
							BulkUpdate.row.find({CodeRow:partKeys[1]}).update({$set:{Formula:Reparsed}});
						} else {
							BulkUpdate.col.find({CodeCol:partKeys[1]}).update({$set:{Formula:Reparsed}});
						}
					} else {
						self.FormulasAll[Key] = {
							Code:Key,
							OldFormula:Old,
							Formula: Reparsed
						}
					}
				}
				var doUpdate = function(counter,bulk){
					return function(done){
						if (!counter || self.OnlyShow) return done();
						bulk.execute(done);
					}				
				}
				async.parallel({
					col:doUpdate(Counters.col,BulkUpdate.col),
					row:doUpdate(Counters.row,BulkUpdate.row),
				},function(err){
					if (!_.keys(self.Formulas).length) return done(err,self.FormulasAll);
					return done(err,self.Formulas);
				})			
			})
		})
	}
}




router.get('/api/calculator/checkformula', function(req,res,next){
	var F = new FormualChecker();
	F.Do(function(err,Result){
		if (err) return next(err);
		return res.json(Result);
	})
})



router.get('/api/calculator/updateformula', function(req,res,next){
	var F = new FormulaUpdateSyntacis();
	F.Do(function(err,Result){
		if (err) return next(err);
		return res.json(Result);
	})
})







router.post('/api/cell/history', function(req,res,next){	
	var Reg = require(__base+"classes/calculator/RegExp.js");
	var CodeRow = "",CodeCol="";
	try{
		CodeRow = _.first(req.body.Cell.match(Reg.Row)).replace(Reg.Symbols.Row,"");
		CodeCol = _.first(req.body.Cell.match(Reg.Col)).replace(Reg.Symbols.Col,"");
	} catch(e){
		return next(err);	
	}
	mongoose.model("row").findOne({CodeRow:CodeRow},"CodeRow NameRow").isactive().lean().exec(function(err,Row){
		mongoose.model("col").findOne({CodeCol:CodeCol},"CodeCol NameCol").isactive().lean().exec(function(err,Col){
			db.GetCellsHistory(['CodeCell','Value','CalcValue',"CodeUser","DateEdit","Comment"],[req.body.Cell],function(err,data){
				return res.json({
					Row:[Row.CodeRow,Row.NameRow].join(". "),
					Col:[Col.CodeCol,Col.NameCol].join(". "),
					History:data
				});
			})
		})
	})
})

router.post('/api/cell/explain', function(req,res){	
	var Calculator = require('../calculator/Calculator.js');
	var Context = getContext(req.body.Context,req.session.sandbox,req.user.CodeUser);	
	var Cell = req.body.Cell;
	Calculator.ExplainCell(Context,[Cell],function(err,Result){
	  if (Result){
	  	return res.json(Result);
	  } else {
	  	return res.json({err:err});
	  }
	}); 
})

router.post('/api/cell/calculatebyformula', function(req,res){	
	var Context = getContext(req.body.Context,req.session.sandbox,req.user.CodeUser);	
	var Calculator = require('../calculator/Calculator.js');
	var Cells  = {}; Cells[req.body.Cell] = req.body.Formula.replace(/\s+/g,' ');
	Calculator.CalculateByFormula(Context,Cells,function(err,Result){
	  if (Result){
	  	return res.json(Result);
	  } else {
	  	return res.json({err:err});
	  }
	}); 
})

router.get('/api/row/finddocument', function(req,res,next){	
	var DocRowH = new Form.DocRow({UseCache:true});
	DocRowH.get(function(err,CacheRaw){
		var Cache = _.merge(CacheRaw.WithChildObjs,CacheRaw.NoChildObjs);
		mongoose.model('row').findOne({CodeRow:req.query.Row},'CodeRow NameRow rowpath').lean().exec(function(err,R){
			if (err) return next(err);
			if (!R) return next("Ряд "+req.query.Row+" не найден");
			var TestArr = R.rowpath.split('/');
			var CodeDoc = "";
			TestArr.forEach(function(TC){
				if (Cache[TC]) CodeDoc = Cache[TC];
			})
			return res.json({CodeDoc:CodeDoc});
		})			
	})
})


























module.exports.router = router; 