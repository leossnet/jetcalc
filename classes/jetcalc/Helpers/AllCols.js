var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require(__base + 'classes/jetcalc/Helpers/Base.js');

var AllCols = (new function(){

	var self = new Base("JALLCOLS");

	self.Fields = {
		col:["-_id","AsAgFormula","IsAgFormula","AgFormula","CodeCol","Formula","IsFormula","DoSum","NoCalcSum","NoCalcSumHard","NameCol","CodeValuta"],
	}

	self.SubscribeChanges(_.keys(self.Fields));

	self.get = function(done){
		self.FromCache(null,function(err,Result){
			if (Result) {
				return done (err,Result);
			}
			self.CreateInfo(function(err,Data){
				self.ToCache(null, Data, function(err){
					return done(err,Data);
				})
			})
		})
	};

	self.CreateInfo = function(done){
		var R = {};
		mongoose.model("col").find({},self.Fields["col"].join(" ")).isactive().lean().exec(function(err,Colls){
			Colls.forEach(function(Col){
				R[Col.CodeCol] = Col;
			})
			return done(err,R);
		})
	}

	return self;
})



module.exports = AllCols;