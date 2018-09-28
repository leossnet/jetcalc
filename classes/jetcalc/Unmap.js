var _ = require("lodash");
var async = require("async");
var mongoose = require("mongoose");
var HPath = __base+"classes/jetcalc/Helpers/";
var Rx = require(__base+"classes/jetcalc/RegExp.js");
var RowHelper = require(HPath+"Row.js");
var jison_prepare  = require(__base+'classes/calculator/jison/compile.js'); // Упрощалка
var RabbitMQClient = require(__base + "src/rabbitmq_wc.js").client;
var config = require(__base+"config.js");

var CacheClient = new RabbitMQClient({queue_id: config.rabbitPrefix+"calc_cache"});

CacheClient.connect(function(err) {
    if (err) console.log("cache saver error",err);
})

var Unmaper = function(){
	var self = this;

	self.HowToCalculate = {};
	self.Dependable = {};
	self.Matrix = {};
	self.ToUnmap = {};
	self.Cx = {};
	self.Recursions = 0;
	self.MaxRecursion = 100000;
	self.Help = {};
	self.Err = new ErrorCatcher();
	self.DebugInfo = {};
	self.NewCache = [];
	self.Override = {};
	self.NoCacheSave = false;

	self.Prepare = function(done){
		async.each(["DocRow","Div","Period","Tag","AllCols"],function(HName,cb){
			var H = require(HPath+HName);
			H.get(function(err,In){
				self.Help[HName] = In;
				return cb(err);
			})
		},done);
	}

	self.Unmap = function(Cells,Cx,done){
		self.Cx = Cx;
		if (_.isEmpty(Cells)) return done();
		Cells.forEach(function(CellName){
			self.Matrix[CellName] = Rx._toObj(CellName);
		})		
		//console.log("UNMAP 1");
		self.FromCache(Cells,function(err,Remain){
			//console.log("UNMAP 2",Remain);
			if (_.isEmpty(Remain)) {
				//console.log("UNMAP 2.5");
				return done();
			}	
			self.NewCache = _.clone(Remain);
			self.ToUnmap = {};
			for (var CellName in self.Matrix){
				if (_.includes(Remain,CellName)){
					self.ToUnmap[CellName] = self.Matrix[CellName];
				}
			}
			//console.log("UNMAP 3");			
			self.Prepare(function(err){
				//console.log("UNMAP 4");			
				self._unmap(function(err){
					//console.log("UNMAP 5");			
					self.NewCache.forEach(function(CellName){
						self.HowToCalculate[CellName].CodeDoc = self._docByRow(self.Matrix[CellName].Row);	
					})
					//console.log("UNMAP 6");			
					self.ToCache(function(err){
						//console.log("UNMAP 7");			

						if (err) console.log("CACHE ERR ",err);
						return done(err);
					});
				})
			})
		})
	}

	self.FromCache = function(Cells,done){
		if (self.Cx.UseCache===false) return done(null,Cells);
		Redis.Get(Cells,function(err,CellResults){
			var GoodCells = [];
			CellResults.forEach(function(Cell){
				self.Dependable[Cell.Cell] = Cell.Dependable;
				self.HowToCalculate[Cell.Cell] = _.pick(Cell,["Type","FRM","CodeDoc"]);
				for (var CodeCell in Cell.Vars){
					var I = Cell.Vars[CodeCell];
					self.Dependable[CodeCell] = I.Dependable;
					self.HowToCalculate[CodeCell] = _.pick(I,["Type","FRM","CodeDoc"]);
					GoodCells.push(CodeCell);
				}
				GoodCells.push(Cell.Cell);			
			})
			var RemainCells = _.difference(Cells,GoodCells);
			return done(err,RemainCells);
		})
	}

	self.ToCache = function(done){
		if (self.NoCacheSave) return done();
		CacheClient.sendMessage({
			NewCache:self.NewCache,
			HowToCalculate:self.HowToCalculate,
			Dependable:self.Dependable,
			Errors:self.Err.Errors
		},function(err){
			console.log("Cache is set");
		});
		return done();		
	}

	self._unmap = function(done){
		var Remain = _.clone(self.ToUnmap), NewUnmap = {};
		if (_.isEmpty(Remain)) return done();
		//console.log("_unmap 1");
		self.LoadDocs(Remain,function(err){
			//console.log("_unmap 2",Remain);
			for (var CodeCell in Remain){
				var Cell = Remain[CodeCell];
				var RType = self.RowColFormula(Cell);
				//console.log("RType",RType);
				if (!_.isEmpty(RType.FRM)){
					self.HowToCalculate[Cell.Cell] = RType;
					self.HowToCalculate[Cell.Cell].FRM = self.PrepareFormula(RType.FRM,Cell);
					//console.log(">>>>>",self.HowToCalculate[Cell.Cell].FRM);
					if (!_.isEmpty(self.Dependable[Cell.Cell])){
						self.Dependable[Cell.Cell].forEach(function(PossibleAdd){
							if (_.isEmpty(self.HowToCalculate[PossibleAdd])){
								NewUnmap[PossibleAdd] = Rx._toObj(PossibleAdd);
							}
						})
					}
				} else {
					self.HowToCalculate[Cell.Cell] = RType;
				}
			}
			//console.log("_unmap 3");
			self.ToUnmap = NewUnmap;
			self._unmap(done);
		})
	}
	
	self.LoadedRows = {};

	self.LoadDocs = function(Remain,done){
		var ToLoad = [];
		_.values(Remain).forEach(function(R){
			var Ind = [R.Obj,self._docByRow(R.Row)].join("!");
			if (_.isEmpty(self.LoadedRows[Ind])) ToLoad.push(Ind);	
		})
		ToLoad = _.uniq(ToLoad);
		if (_.isEmpty(ToLoad)) return done();
		async.each(ToLoad,function(CxP,cb){
			var Arr = CxP.split("!");
			var Cx = {IsInput:self.Cx.IsInput,CodeObj:Arr[0],CodeDoc:Arr[1],Year:self.Cx.Year};
			RowHelper.get(Cx,function(err,Rows){
				self.LoadedRows[CxP] = {};
				if (!_.isEmpty(Rows)){
					Rows.forEach(function(R){
						self.LoadedRows[CxP][R.CodeRow] = R;
					})
				}
				return cb();
			});
		}, done);
	}


	self.PrepareFormula = function(Formula,Cell){
		var d = false;
		if (Formula==0 || _.isEmpty(Formula)) return Formula;
		d && console.log("1",Formula);
		Formula  = (Formula+"");
		d && console.log("2",Formula);
		Formula = Formula.replace(/\s+/g,' ');	
		d && console.log("3",Formula);
		Formula = self.RemoveRootObjs((Formula+''),Cell);
		d && console.log("4",Formula);
		Formula = self.RemoveTags((Formula+''),Cell);
		d && console.log("5",Formula);		
		Formula = self.SimplifyFormula((Formula+''),Cell);
		d && console.log("6",Formula);		
		Formula = self.UpdateModifiers((Formula+''),Cell);
		d && console.log("7",Formula);
		Formula = self.ExtendVariables((Formula+''),Cell);		
		d && console.log("8",Formula);
		return Formula;
	}
	
	self._parseFilter = function(Filter){
		var R = {};
		var Arr = (Filter+'').split(",");
		Arr.forEach(function(Part){
			var RPart = Part.split(":");
			if (RPart.length==2){
				R[RPart[0].trim()] = RPart[1].trim();
			}
		})
		return R;
	}

	self.UpdateModifiers = function(Formula,Cell){
		var Vars = Formula.match(Rx.Vars);
		var Replaces = [];
		Vars && Vars.forEach(function(Var){
			var Mods = Var.match(Rx.Mods);
			if (!_.isEmpty(Mods)){
				var Objs = [];				
				var Incomplete = Rx._fromIncomplete(Var,Cell);	
				Mods.forEach(function(Mod){
					var Parts = Mod.match(Rx.Mod);
					try{
						var R = Parts[0], T = Parts[1], F = self._parseFilter(Parts[2]); 
						switch(Parts[1]){
							case "<<<":
							Objs = _.map(_.filter(self.Help.Div,function(O){
								if (F.G && O.Groups.indexOf(F.G)!=-1) return true;
								if (F.C && O.CodeObjClass==F.C) return true;
								if (F.T && O.CodeObjType==F.T) return true;
								if (F.D && O.CodeDiv==F.D) return true;
								if (F.R && O.CodeRegion==F.R) return true;
								if (F.S && O.CodeOtrasl==F.S) return true;
								return false;
							}),"CodeObj");
							if (!_.isEmpty(Objs)) Incomplete.Obj = "["+Objs.join(",")+"]";
							break;
							case "<<":
							var ObjInfo = self.Help.Div[Incomplete.Obj];
							Objs = _.filter(ObjInfo.AllChildren,function(OC){
								var O = self.Help.Div[OC];
								if (F.G && O.Groups.indexOf(F.G)!=-1) return true;
								if (F.C && O.CodeObjClass==F.C) return true;
								if (F.T && O.CodeObjType==F.T) return true;
								if (F.D && O.CodeDiv==F.D) return true;
								if (F.R && O.CodeRegion==F.R) return true;
								if (F.S && O.CodeOtrasl==F.S) return true;
								return false;
							});
							if (!_.isEmpty(Objs)) Incomplete.Obj = "["+Objs.join(",")+"]";
							break;
							default:
							throw "Не реализовано: "+Parts[1];
						}
					} catch(e){
						console.log("Ошибка в модификаторах ",e);
					}
					Replaces.push({Var:Var,Value:Rx._toCell(Incomplete)});
				})									
			}
		})		
		Replaces = _.sortBy(Replaces,function(o) { return -1*o.Var.length; })
		Replaces.forEach(function(Rep){
			Formula = Formula.split(Rep.Var).join(Rep.Value);
		})
		return Formula;
	}

	self.SimplifyFormula = function(Formula,Cell){
		var P = self.Help.Period[Cell.Period];
		var Rows = self._rows(Cell);
		var Row = Rows[Cell.Row];
		var Col = self.Help.AllCols[Cell.Col];
		var Obj = self.Help.Div[Cell.Obj] || Cell.Obj; 
		//console.log(Obj);
		var CellCx = {
			grp: Obj.Groups,
			year: Cell.Year,
			obj:  Cell.Obj,
			row: Cell.Row, 
			col: Cell.Col, 			
			period:[Cell.Period].concat(P.Grps),
			months:P.MonthStart,
			MCOUNT:P.MCount,
			DCOUNT:P.DCount,
			coltags:Col.Tags,
			rowtags:Row.Tags,
			treetags:Row.AllTags,
			objtags:Obj.Tags,
			path:Row.rowpath
		};
		jison_prepare.setContext(CellCx);
		try{
			Formula = jison_prepare.parse(Formula);
		} catch(e){
			self.Err.Set(Cell.Cell,'FRM:'+Cell.Type.FRM+' : '+e.message);
		}
		return Formula;		
	}

	self.RemoveTags = function(Formula,Cell){
		var Tags = _.uniq(Formula.match(Rx.Tags)); // Заменяем тэги
		Tags.forEach(function(Tag){
			var Value = self.TagValue(Cell,Tag);
			if (Value=="UNKNOWNTAG") self.Err.Set(Cell.Cell,'TAG:'+Tag+":NO_VALUE");
			Formula = Formula.split(Tag).join(Value);
		})
		return Formula;
	}

	self.RemoveRootObjs = function(Formula,Cell){
		var Vars = Formula.match(Rx.Vars);
		Vars && Vars.forEach(function(Var){
			var Incomplete = Rx._fromIncomplete(Var,Cell);
			if (Incomplete.Obj=="^^") {
				var NewVar = Var.split("#^^").join("#"+self._rootObj(Cell.Obj));	
				Formula = Formula.split(Var).join(NewVar);
			} else if (Incomplete.Obj=="^") {
				var NewVar = Var.split("#^").join("#"+self._parentObj(Cell.Obj));	
				Formula = Formula.split(Var).join(NewVar);
			} else {
				var LvlRx = (Incomplete.Obj+'').match(/\^\(([0-9]+)\)/);
				if (LvlRx && !_.isEmpty(LvlRx[1])){
					try{
						var Parents = self.Help.Div[Cell.Obj].Parents;
						var Lvl = parseInt(LvlRx[1]);
						if (!_.isEmpty(Parents[Lvl]+"")){
							var NewVar = Var.split(_.first(LvlRx)).join(""+Parents[Lvl]);	
							Formula = Formula.split(Var).join(NewVar);
						}

					} catch(e){
						console.log("parents level failed ",LvlRx,Cell);
					}
				}
			}
		})
		return Formula;
	}

	self.ExtendVariables = function(Formula,Cell){
		//console.log("===ExtendVariables",Formula,Cell);
		var Vars = _.uniq(Formula.match(Rx.Vars));
		Vars && Vars.forEach(function(Var){
			var Incomplete = Rx._fromIncomplete(Var,Cell);
		//	console.log("Incomplete",Incomplete);
			var ToVar = Rx._toCell(Incomplete);
		//	console.log("ToVar 1",ToVar);			
			ToVar = self.Extract(ToVar,Cell);
		//	console.log("ToVar 2",ToVar);						
			Formula = Formula.split(Var).join(ToVar);			
		})
		//console.log("===ExtendVariables",Formula,"<<<<< RESULT");
		return Formula;
	}

	self.AddDependable = function(pCell,cCell){
		if (_.isEmpty(self.Dependable[pCell])) self.Dependable[pCell] = [];
		if (self.Dependable[pCell].indexOf(cCell)==-1){
			self.Dependable[pCell].push(cCell);
		}
	}

	self.Extract = function(Var,Cell){
		var Cx = Rx._toObj(Var);
		var _paramToArr = function(param){
			return (param.indexOf("[")==0) ? param.replace("[","").replace("]","").split(","):[param];
		}
		var Rows = _paramToArr(Cx.Row);
		var Objs = _paramToArr(Cx.Obj);
		var Cols = _paramToArr(Cx.Col);
		var Years = _paramToArr(Cx.Year);
		var Periods = [], PeriodOp = "SUM";

		if (_.includes(self.Help.Period.FormulaPeriods,Cx.Period)){
			var InfoPeriod = self.Help.Period[Cx.Period] || {};
			var Info = InfoPeriod[Cell.Period];
			if (_.isEmpty(Info)){
				self.Err.Set(Cell.Cell,"Unknown period formula "+Cell.Period+", "+Cx.Period);
				console.log("Unknown period formula ",Cell.Period+", "+Cx.Period);
				return "0";	
			}
			if (!Array.isArray(Info)){
				var YearOffset = 0;
				try{
					var name2test = self.Help.Period.DisplayNames[Cx.Period][Cell.Period];
					var testArr = name2test.split(":");
					if (testArr.length>1){
						YearOffset = _.last(testArr);
					}
				} catch(e){
					console.log(e);
				}
				var Ar = Info.split(":");
				if (Ar.length>1) {
					Years.forEach(function(Y){ Y = Y+Number(Ar[1]);})	
				}

				if (YearOffset){
					Years.forEach(function(Y,ind){ 
						Years[ind] = Number(Y)+Number(YearOffset);
					})		
				}
				Periods = [_.first(Ar)];
			} else {
				Periods = Info;
				if (!_.isEmpty(InfoPeriod.Opinfo) && !_.isEmpty(InfoPeriod.Opinfo[Cell.Period])){
					PeriodOp = InfoPeriod.Opinfo[Cell.Period];
				}				
			}
		} else {
			Periods = [Cx.Period];
		}
		var Parts = [], Year = Var.Year;
		Rows.forEach(function(R){
			Cols.forEach(function(C){
				Objs.forEach(function(O){
					Years.forEach(function(Y){
						var ByPeriod = []
						Periods.forEach(function(P){
							var ACell = Rx._toCell(_.merge(_.clone(Cx),{
								Row:R,Col:C,Obj:O,Year:Y,Period:P
							}));
							ByPeriod.push(ACell);
							self.AddDependable(Cell.Cell,ACell);
						})
						Parts.push(ByPeriod);
					})
				})
			})
		})
		if (!Array.isArray(_.first(Parts))){
			return _.first(ByPeriod);
		} else {
			var Rsx = [];
			Parts.forEach(function(Part){
				var Sig = (PeriodOp=="MULT")?" * ":" + ";
				var J = Part.length>1 ? "("+Part.join(Sig)+")":Part.join("+");
				Rsx.push(J);
			})
			return (Rsx.length==1) ? _.first(Rsx):"("+Rsx.join(" + ")+")";
		}		
	}
	
	self.DefaultTags = {
		"KMULT":1000
	}

	self.TagValue = function(Cell, TagNameRaw){
		var TagName = _.trimStart(TagNameRaw,'_').replace("{","").replace("}","");
		var TagInfo = self.Help.Tag[TagName];
		if (_.isEmpty(TagInfo)) {
			if (self.DefaultTags[TagName]) return self.DefaultTags[TagName];
			return "UNKNOWNTAG";
		};
		var Obj = self.Help.Div[Cell.Obj];
		var Rows = self._rows(Cell), Row = Rows[Cell.Row];
		var ParentRows = _.sortBy(_.filter(_.values(Rows),function(R){
			return R.rgt>=Row.rgt && R.lft<=Row.lft;
		}),"lft");
		var Value = null;
		ParentRows.forEach(function(PR){
			if (!Value && !_.isEmpty(TagInfo.rowtag[PR.CodeRow])){
				Value = TagInfo.rowtag[PR.CodeRow];
			}
		})
		if (!Value && !_.isEmpty(TagInfo.objtypetag[Obj.CodeObjType])){
			Value = TagInfo.objtypetag[Obj.CodeObjType];
		}
		if (!Value && self.DefaultTags[TagName]) Value = self.DefaultTags[TagName];
		if (!Value) Value = "UNKNOWNTAG";
		// Цепочка объектов ToDo
		return Value;
	}

	self.RowColFormula = function(Cell){
		var Rows = self._rows(Cell);
		var Row = Rows[Cell.Row];
		var Col = self.Help.AllCols[Cell.Col];
		var Result = null, ResultDescription = null, Choosed = null;
		if (!_.isEmpty(self.Override[Cell.Cell])){
			Result = {Type:'FRM',FRM:self.Override[Cell.Cell]};
		}
		if (!Result && _.isEmpty(Col)){
			self.Err.Set(Cell.Cell,"COL:"+Cell.Col+':UNK');			
			Result = {Type:"ERR"};	
			ResultDescription = "Колонка не найдена";
		}
		if (!Result  && _.isEmpty(Row)) {
			Result = {Type:"FRM",FRM:0};	
			self.Err.Set(Cell.Cell,"ROW:"+Cell.Row+':UNK');
			ResultDescription = "Ряд не найден/отфильтрован";
		}
		if (!Result && (!Row.IsFormula && !Col.IsFormula && !Row.IsSum)) {
			if ((Row.rgt-Row.lft)==1)  {
				Result = {Type:"PRM"};
				ResultDescription = "Первичная";
				if (Cell.Obj.indexOf("[")!=-1){
					var Objs = Cell.Obj.replace("[","").replace("]","").split(",");
					var FRMArr = [];
					Objs.forEach(function(SingleObj){
						FRMArr.push(Cell.Cell.replace(Cell.Obj,SingleObj));
					})
					Result = {Type:"FRM",FRM:FRMArr.join("+")};
					ResultDescription = "Суммирование первичных ячеек";
				}
			} else  {
				Result = {Type:"HDR"};
				ResultDescription = "Заголовок";
			}
		}
		if (!Result && Col.IsFormula && Row.IsFormula) {
			if (!Result && Col.DoSum && Row.IsCalcSum) {
				Result = {Type:"FRM",FRM:Row.Formula};	
				Choosed = "Row";
				ResultDescription = "Формула и в ряду и в колонке, Колонка - DoSum, Ряд - IsCalcSum";	
			}
		}
		if (!Result && (Col.IsFormula && !Row.IsSum)) {
			Result = {Type:"FRM",FRM:Col.Formula};
			Choosed = "Col";
			ResultDescription = "Формула в колонке/Ряд - не IsSum";
		}
		if (!Result && (!Col.IsFormula && Row.IsFormula && !Row.IsSum)) {
			Result = {Type:"FRM",FRM:Row.Formula};
			Choosed = "Row";
			ResultDescription = "Формула в ряду/Колонка - без формулы";
		}
		if (!Result && Col.IsAgFormula && Row.IsSum){
			Result = {Type:"FRM",FRM:Col.AgFormula};	
			Choosed = "Col";
			ResultDescription = "Формула агрегации в колонке, Ряд - IsSum/Колонка - IsAgFormula";
		}
		if (!Result && Col.AsAgFormula && Row.IsSum){
			Result = {Type:"FRM",FRM:Col.Formula};	
			Choosed = "Col";
			ResultDescription = "Формула агрегации в колонке, Ряд - IsSum/Колонка - AsAgFormula";
		}
		if (!Result && Col.IsFormula && Row.IsSum){
			if (!Result && Col.NoCalcSumHard) {
				Result = {Type:"FRM",FRM:Col.Formula};	
				Choosed = "Col";
				ResultDescription = "Формула в колонке, Ряд - IsSum/Колонка - NoCalcSumHard";
			}
			if (!Result && Col.NoCalcSum && !Row.IsCalcSum) {
				Result = {Type:"FRM",FRM:Col.Formula};	
				Choosed = "Col";
				ResultDescription = "Формула в колонке, Ряд - IsSum/Колонка - NoCalcSum, Ряд - нет IsCalcSum";	
			}
			if (!Result && Col.DoSum && Row.NoDoSum){
				Result = {Type:"FRM",FRM:Col.Formula};	
				Choosed = "Col";
				ResultDescription = "Формула в колонке, Ряд - IsSum/Колонка - DoSum, Ряд - NoDoSum";	
			}
			if (!Result  && (Row.IsCalcSum || Col.DoSum)) {
				Result = {Type:"SUM"};	
				Choosed = "Row";
				if (Row.IsCalcSum){
					ResultDescription = "Сумма по рядам, Ряд - IsSum/Ряд - IsCalcSum";		
				} else {
					ResultDescription = "Сумма по рядам, Ряд - IsSum/Колонка - DoSum";		
				}
			}
			if (!Result){
				Choosed = "Col";
				Result = {Type:"FRM",FRM:Col.Formula};
				ResultDescription = "Формула в колонке";		
			}
		}
		if (!Result && !Col.IsFormula && Row.IsSum && Col.NoCalcSum && !Row.IsCalcSum){
			Result = {Type:"FRM",FRM:0};	
			Choosed = "Col";
			ResultDescription = "Формулы в колонке - нет, Ряд - IsSum/Колонка - NoCalcSum, Ряд - нет IsCalcSum";	
		}
		if (!Result && Row.IsSum) {
			Result = {Type:"SUM"};
			Choosed = "Row";
			ResultDescription = "Сумма по рядам, Ряд - IsSum";
		}
		if (!Result){
			Result = {Type:"UNK"};
			ResultDescription = "Не понятно как считать";	
		}
		if (Result.Type=='SUM'){
			if (Row.IsFormula){
				Result = {Type:'FRM', FRM:Row.Formula};
			} else {
				try{
					var SumInfo = Row.SummInfo;
					Result.FRM = "";
					if (!_.isEmpty(SumInfo.Plus)) Result.FRM += "$"+SumInfo.Plus.join('? + $')+'?';
					if (!_.isEmpty(SumInfo.Minus)) Result.FRM += " - $"+SumInfo.Minus.join('? - $')+'?';
					if (_.isEmpty(Result.FRM)){
						Result = {Type:'FRM', FRM:'0'};
					}
				} catch(e){
					self.Err.Set(Cell.Cell,'ROW:'+Cell.Row+":UNK_SUM"+e);
					Result = {Type:'FRM', FRM:'0'};
				}
			}
		} 
		if (self.Cx.IsExplain){
			if (!Row) Row = {}; if (!Col) Col = {};
			var RowMarks = Row.Tags||[]; var ColMarks = Col.Tags||[];
			if (Row.Sums) RowMarks = _.merge(RowMarks,Row.Sums);
			var RA = ['IsSum','IsCalcSum','NoDoSum'];
			RA.forEach(function(F){
				if (Row[F]) RowMarks.push(F);
			});
			var CA = ['NoCalcSumHard','DoSum'];
			CA.forEach(function(CF){
				if (Col[CF]) ColMarks.push(CF);
			});
			self.DebugInfo[Cell.Cell] = {
				CellName:Cell.Cell,
				What:Choosed,
				Text:ResultDescription,
				Formula:Result.FRM,
				CodeRow:Cell.Row,
				CodeCol:Cell.Col,
				RowFormula:Row.Formula,
				ColFormula:Col.Formula,
				Type:Result.Type,
				RowName:Row.NumRow+'. '+Row.NameRow,
				ColName:Col.NameCol,
				Period:Cell.Period,
				Obj:Cell.Obj,
				Year:Cell.Year,
				Doc:self._docByRow(Row.CodeRow),
				RowMarks:_.uniq(RowMarks),
				ColMarks:_.uniq(ColMarks)
			};
		}
		return Result;
	}

	self._parentObj = function(CodeObj){
		var In = self.Help.Div[CodeObj];
		if (!_.isEmpty(In) && !_.isEmpty(In.CodeParentObj)){
			return In.CodeParentObj;
		}
		return CodeObj;
	}

	self._rootObj = function(CodeObj){
		var In = self.Help.Div[CodeObj];
		if (!_.isEmpty(In) && !_.isEmpty(In.RootObj)){
			return In.RootObj;
		}
		return self._parentObj(CodeObj);
	}


	self._docByRow = function(CodeRow){
		return self.Help.DocRow[self.Help.DocRow.Tree[CodeRow]];
	}

	self._rows = function(Cell){
		var Ind = [Cell.Obj,self._docByRow(Cell.Row)].join("!");
		return self.LoadedRows[Ind];
	}

	return self;
}


var ErrorCatcher = function(){
	var self = this;
	
	self.Errors = {}; // CellName => [Errors]
	self.Critical = {};

	self.Critical = function(Code,ErrorMessage){
		if (_.isEmpty(self.Critical[Code])) self.Critical[Code] = [];	
		if (!_.includes(self.Critical[Code],ErrorMessage)){
			self.Critical[Code].push(ErrorMessage);
		}			
	}

	self.Set = function(CellName,ErrorMessage){
		if (_.isEmpty(self.Errors[CellName])) self.Errors[CellName] = [];
		if (!_.includes(self.Errors[CellName],ErrorMessage)){
			self.Errors[CellName].push(ErrorMessage);
		}
	}

	return self;
}	


var Redis = (new function(){
	var redis = require("redis");
	var config = require(__base+"config.js");
	var self = this;
	self.client = redis.createClient(config.redis);

	self.Get = function(Cells,done){
		var chunks = _.chunk(Cells, 100); 
		var Answer = [];
	 	async.each(chunks, function(chunk, callback) {
	 		self.client.mget(chunk, function (err, res) {
				res && res.forEach(function(r){
					var R = JSON.parse(r);
					if (R){
						Answer.push(R);
					}
				})
				return callback();
	 		})
	 	},function(err){
	 		return done(err,Answer);
	 	})
	}

})

module.exports = Unmaper;