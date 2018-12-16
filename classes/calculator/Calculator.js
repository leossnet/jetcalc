var   config = require('../../config.js')
	, mongoose = require('mongoose')
	, api = require('../../lib/helper.js')
	, f   = require('../../lib/functions.js')
	, _ = require('lodash')
	, async = require('async')
	, moment = require('moment')
	, Helper = require('./CalculatorHelper.js')
	, Timer = Helper.Timer
	, Debuger = Helper.Debuger
	, InfoCacher = Helper.InfoCacher
	, Form = require('./Form.js')
	, CellHelper = require('./helpers/Cell.js')
	, StructureHelper = require(__base+"classes/jetcalc/Helpers/Structure.js");
;

const EventEmitter = require('events').EventEmitter;

var Info = new InfoCacher();
Info.Load(function(err){
	module.exports.events.emit('inited');
})


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
		    console.log("Time:"+label,result);
		} catch(e){;}
	};
}


module.exports = {
	events:new EventEmitter(),
	CalculateCells:function(Context,Cells,done){
		Info.Load(function(err){
			var Cont = _.clone(Context); 
			var Unmapper = new Helper.Unmapper(Cont,Info);
			Unmapper.Unmap(Cells,function(err){
				var Evaluator = new Helper.Evaluator(Unmapper);
				Evaluator.Calculate(function(err){			
					if (err) console.log(err);
					for (var CellName in Unmapper.DebugInfo){
						var RR = Unmapper.DebugInfo[CellName];
					}
					var Answ = {Cells:Unmapper.HowToCalculate,Values:Evaluator.Calculated,CellsInfo:Unmapper.DebugInfo};
					Unmapper = null; Evaluator = null;
					return done(err,Answ);				
				})
			})
		})
	},
	CalculateByFormula:function(Context,Cells,done){
		Info.Load(function(err){
			var Cont = _.clone(Context); Cont.IsExplain = true; Cont.UseCache = false;
			var Unmapper = new Helper.Unmapper(Cont,Info);
			for (var CellName in Cells){
				Unmapper.CellFormulaOverride[CellName] = Cells[CellName];
			}
			Unmapper.Unmap(_.keys(Cells),function(err){
				var Evaluator = new Helper.Evaluator(Unmapper);
				Evaluator.Calculate(function(err){			
					if (err) console.log(err);
					for (var CellName in Unmapper.DebugInfo){
						var RR = Unmapper.DebugInfo[CellName];
					}
					var Answ = {Cells:Unmapper.HowToCalculate,Values:Evaluator.Calculated,CellsInfo:Unmapper.DebugInfo};
					Unmapper = null; Evaluator = null;
					return done(err,Answ);				
				})
			})
		})
	},
	ExplainCell:function(Context,Cells,done){
		Info.Load(function(err){
			var Cont = _.clone(Context); Cont.IsExplain = true; Cont.UseCache = false;
			var Unmapper = new Helper.Unmapper(Cont,Info);
			Unmapper.Unmap(Cells,function(err){
				var Evaluator = new Helper.Evaluator(Unmapper);
				Evaluator.Calculate(function(err){			
					if (err) console.log(err);
					for (var CellName in Unmapper.DebugInfo){
						var RR = Unmapper.DebugInfo[CellName];
					}
					var Answ = {Cells:Unmapper.HowToCalculate,Values:Evaluator.Calculated,CellsInfo:Unmapper.DebugInfo};
					Unmapper = null; Evaluator = null;
					return done(err,Answ);				
				})
			})
		})
	},
	CalculateDocument:function(Context,done,final){
		StructureHelper.getCells(Context,function(err,Cells,Formats){
			var AC = new Calculator(Context,Cells,Formats);	
			AC.Do(function(err,Answer){
				if (!Answer) return done("Критическая ошибка в калькуляторе");
				AC = null;
				return done(err,Answer);
			},final)
		})
	},
	CalculateDocumentOld:function(Context,done,final){
		var Cells = new CellHelper(_.clone(Context));
		Cells.get(function(err,CellsInfo){
			var Cells = CellsInfo.Cells;
			if (Context.IsAFOnly){
				var AC = new Calculator(Context,Cells);	
				AC.DoAF(function(err,Answer){
					for (var CellName in CellsInfo.Work){
						if (CellsInfo.Work[CellName].Formatter){
						}
						var Remap = CellsInfo.Work[CellName];
						if (Remap.length==1){
							Answer.Cells[CellName] = Answer.Cells[_.first(Remap)];
						} else {
							var R = {Value: 0,Type: "FRM",FRM: Remap.join('+')}
							Remap.forEach(function(RR){
								R.Value += Answer.Cells[RR].Value;
							})
							Answer.Cells[CellName] = R;
						}
					}
					AC = null;
					return done(err,Answer);
				},final)
			} else {
				var AC = new Calculator(Context,Cells);	
				AC.Do(function(err,Answer){
					if (!Answer) return done("Критическая ошибка в калькуляторе");
					for (var CellName in CellsInfo.Work){
						var Remap = CellsInfo.Work[CellName];
						if (Remap.length==1){
							Answer.Cells[CellName] = Answer.Cells[_.first(Remap)];
						} else {
							var R = {Value: 0,Type: "FRM",FRM: Remap.join('+')}
							Remap.forEach(function(RR){
								R.Value += Answer.Cells[RR].Value;
							})
							Answer.Cells[CellName] = R;
						}
					}
					AC = null;
					return done(err,Answer);
				},final)
			}
		})
	}
}




var Calculator = function(Context,cells,formats){	
	
	var self = this;

	self.cells = cells;
	self.Context = Context;
	self.Formats = formats || {};

	self.DoAF = function(done,aftersavedone){
		var Unmapper = new Helper.Unmapper(self.Context,Info);
		Unmapper.UnmapAF(self.cells,function(err){
			

		})
	}

	self.ReparseFormats = function(done){
		if (_.isEmpty(self.Formats)) return done();
		var Reparsed = {};
		mongoose.model("format").find({CodeFormat:{$in:_.compact(_.uniq(_.values(self.Formats)))}}).isactive().lean().exec(function(err,Formats){
			var Indexed = {}; Formats.forEach(function(F){
				Indexed[F.CodeFormat] = F.FormatValue;
			})
			for (var CellName in self.Formats){
				Reparsed[CellName] = Indexed[self.Formats[CellName]];
			}
			self.Formats = Reparsed;
			return done(err);
		})
	}

	self.Do = function(done,aftersavedone){
		var Timer = new TimerCreate();
		Timer.Start('Вычисление документа');		
		Timer.Start('Разбор формул');
		var Unmapper = new Helper.Unmapper(self.Context,Info);
		Unmapper.Unmap(self.cells,function(err){
			Timer.End('Разбор формул'); 
			if (err) return done(err);
			self.ReparseFormats(function(err){
				var Evaluator = new Helper.Evaluator(Unmapper);
				Evaluator.Formats = self.Formats;
				Timer.Start('Вычисление формул');			
				Evaluator.Calculate(function(err){			
					if (err) return done(err);
					Timer.End('Вычисление формул');
					Timer.End('Вычисление документа');
					var AnswerToUser = {
						Cells:Evaluator.FilterResults(),
						CacheUsed:Unmapper.NoNeedToSave,
						UnmapperErrors:Unmapper.UnmapErrors,
						CalcErrors:Evaluator.CalcErrors,
						UsedDocs:Unmapper.LoadedCodeDocs,
						Time:Timer.Get('Вычисление документа'),
						TimeLabels:{
							'Разбор формул':Timer.Get('Разбор формул'),
							'Вычисление формул':Timer.Get('Вычисление формул')
						}
					}
					if (!AnswerToUser.UsedDocs.length){
						AnswerToUser.UsedDocs = _.uniq(_.map(AnswerToUser.Cells,'CodeDoc'));
					}
					setTimeout(function(){
						console.log("Сохранение кэша");
						Unmapper.UpdateCache(function(){						
							Unmapper = null; Evaluator = null; Timer = null;
							if (global.gc) { global.gc();}
							aftersavedone && aftersavedone();
						});
					},0);
					return done(null,AnswerToUser);				
				})
			})	

		});
	}
}
