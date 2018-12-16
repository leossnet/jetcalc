var _ = require("lodash");
var async = require("async");
var mongoose = require("mongoose");
var Structure = require(__base+"classes/jetcalc/Helpers/Structure.js");
var JetCalc =  require(__base+"classes/jetcalc/Calc.js");

var CalcApi = (new function(){
	var self = this;

      self.CalculateCtrlPoints = function(Cx,done){
            Structure.get(Cx,function(err,R){
                  var CPS = _.map(_.filter(_.flatten(R.Cells),{IsControlPoint:true}),"Cell");
                  if (_.isEmpty(CPS)) return done(err,{});
                  var JC = new JetCalc();
                  JC.Calculate(CPS,Cx,function(err){
                      return done(err,JC.Result);
                  })
            })
      }

      self.ExplainCell = function(CellName,ForceFormula,Context,done){
            var Cx = _.clone(Context);
            Cx.IsDebug = true; Cx.IsExplain = true; Cx.UseCache = false;
            var JC = new JetCalc();
            if (!_.isEmpty(ForceFormula)){
                  JC.Override[CellName] = ForceFormula;      
            }            
            JC.NoCacheSave = true;
            JC.Calculate([CellName],Cx,function(err){
               return done(err,{
                  Cells:JC.Unmapper.HowToCalculate,
                  CellsInfo:JC.Unmapper.DebugInfo,
                  Values:JC.Calculated
               });
            })
      }

      self.CalculateByFormula = function(Cells,Context,done){
            if (_.isEmpty(Cells)) return done();
            var Cx = _.clone(Context);
            Cx.UseCache = false;
            var JC = new JetCalc();
            JC.Override = Cells;
            JC.NoCacheSave = true;
            JC.Calculate(_.keys(Cells),Cx,function(err){
               return done(err,JC.Result);
            })
      }

	self.CalculateDocument = function(Cx,done){
		Structure.getCells(Cx,function(err,Cells,Formats){
      		var JC = new JetCalc();
                  JC.Calculate(Cells,Cx,function(err){
                  	var CellValues = JC.Result, AnswerCells = {}, Unmap = JC.Unmapper.HowToCalculate;
                  	for (var CellName in CellValues){
                  		var T = Unmap[CellName], M = {};
                              if (_.isEmpty(T)){
                                    console.log(CellName);
                              }
                  		if (!_.isEmpty(T.FRM)){
                  			M = _.pick(T,["Type","FRM","CodeDoc"]);
                  		} else {
                  			M = _.pick(T,["Type","CodeDoc"]);
                  			if (T.Type=='PRM'){
                  				M = _.merge(M,_.pick(JC.PrimariesInfo[CellName],["Comment","DateEdit","IsRealNull","CodeUser"]));
                  			}
                  		} 
                              M.Formatter = _.isEmpty(Formats[CellName]) ? "":Formats[CellName];
                  		AnswerCells[CellName] = _.merge({
                  			Value:CellValues[CellName]
                  		},M);
                  	}
                  	var AnswerToUser = {
                  		Cells:AnswerCells,
                  		CacheUsed:_.isEmpty(JC.Unmapper.NewCache),
                  		Time:JC.Timer.Get('Вычисление документа'),
                  		TimeLabels:{
                                    "Разбор формул":JC.Timer.Get("Разбор формул"),
                                    "Вычисление формул":JC.Timer.Get("Вычисление формул")
                              }
                  	}
                  	JC.Unmapper = null;
                        JC = null;
                        return done(err,AnswerToUser);
                  })
		})
	}

	return self;
})



module.exports = CalcApi;