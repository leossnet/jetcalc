var async = require('async');
var mongoose = require('mongoose');
var moment = require('moment');
var _ = require('lodash');

var HelpersPath = __base+"classes/jetcalc/Helpers/"; 

var ModelCreator = (new function(){
	var self = this;

	self.BasicModels = {
		col:[],
		periodgrp:[],
		period:["periodgrpref","reportperiods","periodautofill"],
		//param:["docparamkey","paramset","paramsetkey","listdefinition","paramgrp","paramtab"]
		
		
		
		
		
		


	}

	self.DumpBasic = function(done){



	}




	return self;
})



module.exports = ModelCreator;