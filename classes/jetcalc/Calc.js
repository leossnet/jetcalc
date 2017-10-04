var _ = require("lodash");
var async = require("async");
var mongoose = require("mongoose");
var Unmapper = require(__base+"classes/jetcalc/Unmap.js");
var jison  = require(__base+'classes/calculator/jison/calculator.js') // Вычислялка



var TimerCreate = function(){
	var self = this;
	self._times = {};	
	self.Result = {};	

	self.Get = function(label){
		return Math.round(self.Result[label]*100)/100
	}

	self.Init = function(){
		self._times = {};
		self.Result = {};
	}
	self.Start = function(label){
		self._times[label] = process.hrtime();
	};
	self.End = function(label){
		try{
		    var precision = 3;
		    var elapsed = process.hrtime(self._times[label]);
		    var result = (elapsed[0]* 1e9 +elapsed[1])/1000000000;
		    self.Result[label] = result;
		} catch(e){;}
	};
	return self;
}


var Calculator = function(){
	var self = this;

	self.Calculated = {};
	self.Cx = {};
	self.HowToCalculate = {};
	self.Dependable = {};
	self.PrimariesInfo = {};
	self.Valuta = {};
	self.Formulas = {};
	self.Unmapper = new Unmapper();
	self.Field  = "Value";
	self.CRecursion = 0;
	self.MaxRecursion = 10000;
	self.Result = {};

	self.Timer = new TimerCreate();

	self.Calculate = function(Cells,Cx,done){
		self.Timer.Start('Вычисление документа');		
		self.Calculated = {};
		self.Cx = Cx;
		self.Result = {};
		Cells.forEach(function(CellName){
			self.Result[CellName] = 0;
		})
		self.PrepareValuta(function(err){
			self.Timer.Start('Разбор формул');
			self.Unmapper.Unmap(Cells,Cx,function(err){
				self.Timer.End('Разбор формул');
				if (err) return done(err);
				self.Formulas = _.clone(self.Unmapper.HowToCalculate);
				self.HowToCalculate = _.clone(self.Unmapper.HowToCalculate);
				self.Dependable = _.clone(self.Unmapper.Dependable);
				var Primaries2Load = [];
				var RemainCells = {}
				for (var CellName in self.HowToCalculate){
					if (self.HowToCalculate[CellName].Type=='PRM'){
						Primaries2Load.push(CellName);
					} else if (_.includes(['HDR','ERR'],self.HowToCalculate[CellName].Type) || _.isEmpty(self.HowToCalculate[CellName].FRM)){
						self.Calculated[CellName] = 0;
					} else {
						RemainCells[CellName] = self.HowToCalculate[CellName];
					}
				}
				self.HowToCalculate = RemainCells;
				self.Timer.Start('Вычисление формул');
		 		self.LoadPrimaries(Primaries2Load,function(err){
					if (err) return done(err);
					self.CRecursion = 0;
					self._calculate(function(err){
						for (var CellName in self.Result){
							self.Result[CellName] = self.Calculated[CellName];
						}
						self.Timer.End('Вычисление формул');
						self.Timer.End('Вычисление документа');
						return done(err);
					});
				})
			})
		})
	}

	self._calculate = function(done){
		if ((++self.CRecursion)>=self.MaxRecursion) {
			console.log("Рекурсия");
			return done();
		}
		var keys2omit = [];
		for (var CellName in self.HowToCalculate){
			var Formula = self.HowToCalculate[CellName].FRM;
			if (self._isCalculateble(self.Dependable[CellName])){
				if (_.isEmpty(Formula) || Formula=='0' || Formula==0){
					self.Calculated[CellName] = 0;
				} else {
					self._calculateFormula(CellName,Formula,self.Dependable[CellName]);
				}
				keys2omit.push(CellName);
			}  
		}
		self.HowToCalculate = _.omit(self.HowToCalculate,keys2omit);
		if (_.isEmpty(self.HowToCalculate)){
			return done();
		}
		setTimeout(function(){
			self._calculate(done);
		},0)
	}

	self.LoadPrimaries = function(Primaries,done){
		if (_.isEmpty(Primaries)) return done();		
		var What2Ask = ['CodeCell','CalcValue','Comment','CodeUser','DateEdit'];
		What2Ask.push(self.Field);
		self.GetCells(What2Ask,Primaries,function(err,ResultCellsArray){
			var ResultCells = {};
			ResultCellsArray.forEach(function(RC){
				ResultCells[RC.CodeCell] = RC;
			})
			if (err) {
				Unmapper.Err.Critical("GETCELLS","ERR: "+err);
				return done (err);
			}
			if (!ResultCells) return done ('Нет ответа от SQL сервера');
			Primaries.forEach(function(PC){
				var Value2Set  = 0, IsRealNull = false, CalcValue = null, Comment = null, CodeUser = null, DateEdit = null;
				if (ResultCells[PC] ){
					DateEdit = ResultCells[PC].DateEdit;
					CodeUser = ResultCells[PC].CodeUser;
					if (!_.isEmpty(ResultCells[PC]['CalcValue'])){
						CalcValue = ResultCells[PC]['CalcValue'];
					}
					if (!_.isEmpty(ResultCells[PC].Comment)){
						Comment = ResultCells[PC].Comment;
					}
					if (ResultCells[PC][self.Field]){
						Value2Set = parseFloat(ResultCells[PC][self.Field]);
					}
					if (ResultCells[PC][self.Field] ==0 || Number(ResultCells[PC][self.Field])==0){
						IsRealNull = true;
					}
				} else {
					ResultCells[PC] = {};
					ResultCells[PC][self.Field] = 0;
				}
				self.PrimariesInfo[PC] = {
					IsRealNull:IsRealNull,
					Comment:Comment,
					CalcValue:CalcValue,
					CodeUser:CodeUser,
					DateEdit:DateEdit
				};
				self.Calculated[PC] = Value2Set;
			})
			return done();
		})
	}

	self._isCalculateble = function(Vars){
		var result = true;
		if (!Vars || !Vars.length) {
			return result;
		}
		Vars.forEach(function(V){
			if (self.Calculated[V] == void(0)){
				result = false;
			}
		})
		return result;
	}

	self._calculateFormula = function(CellName,Formula,Vars){
		if (!_.isEmpty(self.Calculated[CellName])) return;
		var InitialFormula = Formula;
		Vars && Vars.forEach(function(V){
			Formula = Formula.split(V).join(self.Calculated[V]);
		})
		Formula = Formula.replace(/-\s-/g,'+');
		var EvalResult = 0;
		try{
			eval("EvalResult="+Formula);
			if (isNaN(EvalResult)) throw 'IsNan';
		} catch (e){
			console.log(CellName,"CALCERROR: !!!!!!!!!",InitialFormula,"!!!!!!!! : "+e.message);
			try {
				EvalResult = jison.parse(Formula);
				if (EvalResult==void(0) || isNaN(EvalResult)) EvalResult = 0;
			} catch (e2){
				console.log(CellName,"CALCERROR: "+InitialFormula+" : "+e2.message);
				EvalResult = 0;
				Unmapper.Err.Set(CellName,"CALCERROR: "+InitialFormula+" : "+e2.message);
				return 0;
			}
		}
		self.Calculated[CellName] = EvalResult;
	}

	self.GetCells = function(What2Ask,Primaries,done){
		var db = require(__base+'/sql/db.js');
		db.GetCells(What2Ask,Primaries,function(err,data){
			return done(err,data || []);
		});		
	}
	

	self.PrepareValuta = function(done){
		var Fs = {
			"IsReportValuta":"ReportValue",
			"IsReportValuta1":"ReportValue1",
			"IsReportValuta2":"ReportValue2"
		};
		var Q = {$or:_.map(_.keys(Fs),function(F){
			var QP = {}; QP[F] = true;
			return QP;
		})}
		mongoose.model("valuta").find(Q,"-_id CodeValuta "+_.keys(Fs).join(" ")).isactive().lean().exec(function(err,Vs){
			Vs.forEach(function(V){
				_.keys(Fs).forEach(function(F){
					if (V[F]) self.Valuta[V.CodeValuta] = Fs[F];
				})	
			})
			if (!_.isEmpty(self.Valuta[self.Cx.CodeValuta])){
				self.Field = self.Valuta[self.Cx.CodeValuta];
			} else {
				self.Field = (Cx.IsInput) ? "Value":"ReportValue";
			}	
			return done();
		})
	}


	return self;
}


module.exports = Calculator;