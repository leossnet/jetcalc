var mongoose   = require('mongoose');
var _          = require('lodash');
var async      = require('async');
var Col = require(__base+"classes/calculator/helpers/Col.js");
var Doc = require(__base+"classes/calculator/helpers/Doc.js");
var Calc = require(__base+"classes/calculator/Calculator.js");
var RabbitManager = require(__base+'/src/rabbitmq.js');
var db = require(__base+'/sql/db.js');








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

	self.SaveToDB = function(Cells,Context,done){
		var ToSaveReparsed = {};
		Cells.forEach(function(Cell){
			var CellName = Cell.Cell, Value = Cell.Value;
			var In = CellName.match(/\$(.*?)\@(.*?)\.P(.*?)\.Y(.*?)\#(.*?)\?/).splice(1);
			ToSaveReparsed[CellName]  = {
				CodeCell:CellName,
				CodeUser:Context.CodeUser,
				Comment:'',
				CalcValue:'',
				Value:self.Round(Value),
				CodeValuta:Context.CodeValuta
			};
		})
		db.SetCells(_.values(ToSaveReparsed),function(err){
			return done(err);
		})
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

	self.HasAF = function(Context,done){
		var ColWorker = new Col(Context);
		ColWorker.get(function(err,Ans){		
			var R = _.filter(Ans,{IsAfFormula:true}).length!=0;
			return done(err,R);
		})
	}

	return self;
}