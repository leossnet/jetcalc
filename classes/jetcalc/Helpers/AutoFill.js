var _          = require('lodash');
var async      = require('async');
var mongoose   = require('mongoose');
var Base = require(__base + 'classes/jetcalc/Helpers/Base.js');
var Rx = require(__base+"classes/jetcalc/RegExp.js");
var db = require(__base+'/sql/db.js');

var AutoFill = (new function(){
	var self = new Base("JAFILL");

	self.HasAF = function(Cx,done){
		var ColHelper = require(__base+"classes/jetcalc/Helpers/Col.js");
		ColHelper.get(Cx,function(err,Colls){
			return done(err,!_.isEmpty(_.filter(Colls,{IsAfFormula:true})))
		})
	}

	self.GetAF = function(Cx,done){
		var StrWorker = require(__base+"classes/jetcalc/Helpers/Structure.js");
		var CalcApi = require(__base+"classes/jetcalc/CalcApi.js");
		StrWorker.get(Cx,function(err,Str){
			var AFCells = _.filter(_.flatten(Str.Cells),{IsAFFormula:true,IsPrimary:true});
			if (_.isEmpty(AFCells)) return done(err,{});
			var ToCalculate = {};
			AFCells.forEach(function(A){
				ToCalculate[A.Cell] = A.AfFormula;
			})
			CalcApi.CalculateByFormula(ToCalculate,Cx,function(err,Result){
				return done(err,Result);
			})
		})
	}

	self.Update = function(Cx,done){
		var SP = Cx.CodePeriod;
		mongoose.model("periodautofill").find({CodeSourcePeriod:SP},"-_id CodeTargetPeriod").isactive().lean().sort({Idx:1}).exec(function(err,Ps){
			var Periods = [SP].concat(_.map(Ps,"CodeTargetPeriod"));
			async.eachSeries(Periods,function(P,cb){
				var Context  = _.clone(Cx);
				Context.CodePeriod = P;
				self.SaveAF(Context,cb);
			},function(err){
				return done(err);
			})
		})
	}
	
	self.MaxRound = function(V){
    	var dig = 10, r = Math.pow(dig,dig);
        return Math.round(V * r) / r;
	}

	self.LoadPrimaries = function(Cells,done){
		var Answer = {};
		db.GetCells(["CodeCell","Value"],Cells,function(err,data){
			if (err) return done(err);
			var Indexed = {}; data = data || []; data.forEach(function(d){Indexed[d.CodeCell] = d.Value;})
			Cells.forEach(function(CodeCell){
				Answer[CodeCell] = Indexed[CodeCell] || 0;
			})
			return done(err,Answer);
		});		
	}

	self.SaveAF = function(Context,done){
		self.GetAF(Context,function(err,Cells){
			if (_.isEmpty(Cells)) return done();
			self.LoadPrimaries(_.keys(Cells),function(err,Current){
				var ToSave = {};
				for (var CodeCell in Cells){
					var V = self.MaxRound(Cells[CodeCell]);
					if (V!=Current[CodeCell]){
						ToSave[CodeCell] = V;
					}
				}
				if (_.isEmpty(ToSave)) return done();
				self.SaveCells(ToSave,Context,done);
			})
		})
	}	

	self.SaveCells = function(Cells,Context,done){
		var Arr = [];
		for (var CellName in Cells){
			var Cell = Rx._toObj(CellName);
			Arr.push({
				CodeCell:CellName,
				CodeUser:Context.CodeUser,
				Comment:'',
				CalcValue:'',				
				Value:Cells[CellName],
				CodeValuta:Context.CodeValuta
			})
		}
		db.SetCells(Arr,function(err){
			return done(err);
		})
	}




	return self;
});


module.exports = AutoFill;





/*
module.exports =  function(){
	var self = this;

	self.UpdateAll = function(Context,done){
		mongoose.model("periodautofill").find({CodeSourcePeriod:Context.CodePeriod},"-_id CodeTargetPeriod").isactive().lean().exec(function(err,Ps){
			var Periods = _.map(Ps,"CodeTargetPeriod");
			Periods.push(Context.CodePeriod);
			async.each(Periods,function(P,cb){
				var CX  = _.clone(Context);
				CX.CodePeriod = P;
				self.SaveAF(CX,cb);
			},function(err){
				return done(err);
			})
		})
	}

	self.SaveAF = function(Context,done){
		self.GetAF(Context,function(err,Arr){
			var Cells = self.Primaries(Arr);
			if (!Cells.length) return done();
			var OldValues = {}, NewValues = {};
			Arr.forEach(function(Row){
				Row.forEach(function(Cell){
					if (Cell!=""){
						NewValues[Cell.CellName] = Cell.Value;
					}				
				})
			})
			self.Calculate(Context,function(err,R){
				Cells.forEach(function(CellName){
					var V = 0;
					if (R.Cells[CellName] && R.Cells[CellName].Value){
						V = R.Cells[CellName].Value;
					}
					OldValues[CellName] = V;
				})
				var ToSave = [];
				for (var CellName in NewValues){
					if (CellName && (CellName+'')!='undefined'){
						if (!OldValues[CellName] || OldValues[CellName]!=NewValues[CellName]){
							ToSave.push({Cell:CellName,Value:NewValues[CellName]});
						}
					}
				}
				if (!ToSave.length) return done();
				self.SaveToDB(ToSave, Context, done);
			})
		})
	}

	self.Round = function round(value) {
	  var  exp = 5;
	  if (typeof exp === 'undefined' || +exp === 0)
	    return Math.round(value);
	  value = +value;
	  exp = +exp;
	  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
	    return NaN;
	  value = value.toString().split('e');
	  value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));
	  value = value.toString().split('e');
	  return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
	}

	
	self.Primaries = function(Arr){
		var Cells = [];
		Arr.forEach(function(Row){
			Row.forEach(function(Cell){
				if (Cell!=""){
					Cells.push(Cell.CellName);
				}				
			})
		})
		return  _.uniq(Cells);
	}

	self.Calculate = function(Context,done){
		RabbitManager.CountConsumers(function(ConsumersCount){
			if (!ConsumersCount){
				return next('Проблема с сервером. Ни одного расчетчика не запущено');		
			}
			Context.Priority = 1;
			RabbitManager.CalculateDocument(Context,function(err,Result){
				return done(err,Result);
			})
		})
	}

	self.GetAF = function(Context,done){
		var StrWorker = require(__base+"classes/jetcalc/Helpers/Structure.js");

		var ColWorker = new Col(Context);
		var DocWorker = new Doc(Context);
		DocWorker.get(function(err,Doc){	
			ColWorker.get(function(err,Ans){
				var ColsByIndex = {}, Left = 2;
				if (Doc.IsShowMeasure){
					Left = 3;
				}
				Ans.forEach(function(Col,Ind){
					if (Col.IsAfFormula){
						ColsByIndex[Ind+Left] = Col.AfFormula;
					}
				})

				StrWorker.get(Context,function(err,Struct){
					var Answer = [], ByIndex = {}, ToCalculate = {};
					Struct.Cells.forEach(function(Row,RowInd){
						var NR = [];
						Row.forEach(function(Cell,ColInd){
							if (Cell.IsPrimary && ColsByIndex[ColInd]){
								NR.push(Cell.Cell+":"+ColsByIndex[ColInd]);
								ByIndex[Cell.Cell+":"+ColsByIndex[ColInd]] = [RowInd,ColInd];
								ToCalculate[Cell.Cell] = ColsByIndex[ColInd];
							} else {
								NR.push("");
							}
						})
						Answer.push(NR);
					})

					Calc.CalculateByFormula(Context,ToCalculate,function(err,Result){
						var VS = Result.Values || {};
						for (var CellName in ByIndex){
							var xy = ByIndex[CellName];
							var Current = Answer[xy[0]][xy[1]].split(":");
							var CellName = _.first(Current);
							var Formula = _.last(Current);
							Answer[xy[0]][xy[1]] = {
								CellName:CellName,
								Formula:Formula,
								Value:self.Round(VS[CellName])
							}
						}
						return done(null,Answer);	
					})
				})	
			})
		})
	}


	return self;
}
*/