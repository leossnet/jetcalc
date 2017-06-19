var router = require('express').Router();
var models = require(__base+"src/models.js");
var mongoose = require("mongoose");
var _ = require("lodash");


router.get('/', function(req,res,next){
	var Models = mongoose.models;
	var Result = {};
	for (var M in Models){
		var Model = mongoose.model(M);
		if (typeof Model.cfg == 'function'){
			Result[M] = Model.cfg();
		}
	}	
	var M = JSON.parse(JSON.stringify(Result, function(k,v){
   		return (typeof v=="function")? v.name:v;
   	}));
	return res.json(M);
})


module.exports = router;