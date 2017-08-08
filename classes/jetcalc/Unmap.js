var  mongoose = require('mongoose');
var  _ = require('lodash');
var  async = require('async');
var  jison_prepare  = require(__base+'classes/calculator/jison/compile.js'); // Упрощалка
var  jison          = require(__base+'classes/calculator/jison/calculator.js'); // Вычислялка
var  Regs = require(__base+"classes/calculator/RegExp.js");
var fs = require("fs");

var CellPlugins = [], CellPluginDir = __base+"classes/jetcalc/CellPlugins/";
var PluginFiles = fs.readdirSync(CellPluginDir);
var PluginPrepare = [];
PluginFiles.forEach(function(PF){
	CellPlugins[PF] = require(CellPluginDir+PF);
	if (CellPlugins[PF].Prepare) PluginPrepare.push(CellPlugins[PF].Prepare);
})


var Unmapper = function(){
	var self = this;

	self.Depends = {};

	self.ToUnmap = {};

	self.HowToCalculate = {};

	self.Unmap = function(Cells,done){
		async.parallel(PluginPrepare,function(err){
			Cells.forEach(function(Cell){
				self.ToUnmap[Cell] = {};
			})
		})
	}

	self._unmap = function(){

	}

	self.RowColFormula = function(){

	}

	self.ExtendVarsInFormula = function(Formula){

	}

	self.Modifiers = function(){

	}

	self.SimplifyFormula = function(){

	}


	return self;
}




setTimeout(function(){
	var Worker = new Unmapper();
	Worker.Unmap(["$p1304700@SUMMA.P11.Y2017#202_PLMET_01_CESTAL_01?"],function(done){

	});	

},1000)



