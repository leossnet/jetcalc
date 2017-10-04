var _ = require("lodash");
var async = require("async");
var mongoose = require("mongoose");
var Structure = require(__base+"classes/jetcalc/Helpers/Structure.js");
var JetCalc =  require(__base+"classes/jetcalc/Calc.js");

var CalcApi = (new function(){
	var self = this;

	self.CalculateDocument = function(Cx,done){
		Structure.getCells(Cx,function(err,Cells,Formats){
      		var JC = new JetCalc();
                  JC.Calculate(Cells,Cx,function(err){
                  	var CellValues = JC.Result, AnswerCells = {}, Unmap = JC.Unmapper.HowToCalculate;
                  	for (var CellName in CellValues){
                  		var T = Unmap[CellName], M = {};
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
                  		TimeLabels:_.pick(JC.Timer.Result,["Разбор формул","Вычисление формул"])
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