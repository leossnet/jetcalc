var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require('./Base.js');



var DivHelper = function(Context){
	
	Context = _.clone(Context); 
	Context.PluginName = "DIV";
	var self = this;
	Context.CacheFields = [];
	Base.apply(self,Context);
	self.Context = Context;	

	self.get = function(done){
		var RealHelper = require(__base+"classes/jetcalc/Helpers/Div.js");
		RealHelper.get(done);
	}

	
	return self;
}



module.exports = DivHelper;