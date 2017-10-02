var _ = require("lodash");
var async = require("async");
var mongoose = require("mongoose");
var HPath = __base+"classes/jetcalc/Helpers/";
var Rx = require(__base+"classes/jetcalc/RegExp.js");
var RowHelper = require(HPath+"Row.js");


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
		if (_.isEmpty(Cells)) return done(err,{});
		Cells.forEach(function(CellName){
			self.Matrix[CellName] = Rx._toObj(CellName);
		})
		self.ToUnmap = _.clone(self.Matrix);
		self.Prepare(function(err){
			self._unmap(function(err){
				console.log("All Unmapped!");
				//console.log(self.Err);
				//console.log(self.LoadedRows);
				console.log(self.HowToCalculate);
				//console.log(self.Dependable);
				return done();
			})
		})
	}

	self.LoadedRows = {};

	self._unmap = function(done){
		var Remain = _.clone(self.ToUnmap), NewUnmap = {};
		if (_.isEmpty(Remain)) return done();
		self.LoadDocs(Remain,function(err){
			for (var CodeCell in Remain){
				var Cell = Remain[CodeCell];
				var RType = self.RowColFormula(Cell);
				if (!_.isEmpty(RType.FRM)){
					var WorkFormula = self.PrepareFormula(RType.FRM,Cell);
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
			self.ToUnmap = NewUnmap;
			self._unmap(done);
		})
	}

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
			var Cx = {IsInput:false,CodeObj:Arr[0],CodeDoc:Arr[1],Year:self.Cx.Year};
			RowHelper.get(Cx,function(err,Rows){
				self.LoadedRows[CxP] = {};
				Rows.forEach(function(R){
					self.LoadedRows[CxP][R.CodeRow] = R;
				})
				return cb();
			});
		}, done);
	}


	self.PrepareFormula = function(Formula,Cell){
		Formula  = (Formula+"");
		Formula = self.RemoveTags(Formula,Cell);
		Formula = self.ExtendVariables(Formula,Cell);
		return Formula;
	}

	self.RemoveTags = function(Formula,Cell){
		var Tags = _.uniq(Formula.match(Rx.Tags)); // Заменяем тэги
		Tags.forEach(function(Tag){
			var Value = self.TagValue(Cell,Tag);
			if (_.isEmpty(Value)) self.Err.Set(Cell.Cell,'TAG:'+Tag+":NO_VALUE");
			Formula = Formula.split(Tag).join(Value);
		})
		return Formula;
	}

	self.ExtendVariables = function(Formula,Cell){
		var Vars = Formula.match(Rx.Vars), Dependable = [];
		Vars && Vars.forEach(function(Var){
			var Incomplete = Rx._fromIncomplete(Var,Cell);
			if (Incomplete.Obj=="^^") Incomplete.Obj = self._rootObj(Cell.Obj);
			if (Incomplete.Obj=="^") Incomplete.Obj = self._parentObj(Cell.Obj);
			var ToVar = Rx._toCell(Incomplete);
			ToVar = self.Extract(ToVar,Cell);
			Dependable.push(ToVar);
			Formula = Formula.split(Var).join(ToVar);			
		})
		self.HowToCalculate[Cell.Cell] = Formula;
		self.Dependable[Cell.Cell] = Dependable;
		return Formula;
	}

	self.Extract = function(Var,Cell){
		var Cx = Rx._toObj(Var);
		var _paramToArr = function(param){
			return (param.indexOf("[")==0) ? param.replace("[").replace("]").split(","):[param];
		}
		var Rows = _paramToArr(Cx.Row);
		var Objs = _paramToArr(Cx.Obj);
		var Cols = _paramToArr(Cx.Col);
		var Years = _paramToArr(Cx.Year);
		var Periods = [], PeriodOp = "SUM";
		if (_.includes(self.Help.Period.FormulaPeriods,Cx.Period)){
			var InfoPeriod = self.Help.Period[Cx.Period] || {};
			var Info = _.isEmpty(InfoPeriod[Cell.Period])? InfoPeriod[self.Cx.CodePeriod]:InfoPeriod[Cell.Period];
			if (!Array.isArray(Info)){
				var Ar = Info.split(":");
				if (Ar.length>1) {
					Years.forEach(function(Y){ Y = Y+Number(Ar[1]);})	
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
		var ByPeriod = [], Year = Var.Year;
		Rows.forEach(function(R){
			Cols.forEach(function(C){
				Objs.forEach(function(O){
					Years.forEach(function(Y){
						Periods.forEach(function(P){
							ByPeriod.push(Rx._toCell(_.merge(_.clone(Cx),{
								Row:R,Col:C,Obj:O,Year:Y,Period:P
							})));
						})
					})
				})
			})
		})
		if (ByPeriod.length==1){
			return _.first(ByPeriod);
		} else {
			console.log(ByPeriod);
			die();
		}
		
	}
	
	self.DefaultTags = {
		"KMULT":1000
	}

	self.TagValue = function(Cell, TagNameRaw){
		var TagName = _.trimStart(TagNameRaw,'_');
		var TagInfo = self.Help.Tag[TagName];
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
		// Цепочка объектов ToDo
		return Value;
	}

	self.RowColFormula = function(Cell){
		var Rows = self._rows(Cell);
		var Row = Rows[Cell.Row];
		var Col = self.Help.AllCols[Cell.Col];
		var Result = null, ResultDescription = null, Choosed = null;
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
		if (!Result && (Col.IsFormula && !Row.IsSum)) {
			Result = {Type:"FRM",FRM:Col.Formula};
			Choosed = "Col";
			ResultDescription = "Формула в колонке/Ряд - не IsSum";
		}
		if (!Result && (!Col.IsFormula && Row.IsFormula)) {
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
				Doc:self.DocRowInfo[Row.CodeRow],
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


module.exports = Unmaper;