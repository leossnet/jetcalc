var 
	mongoose  = require('mongoose')
	, _       = require('lodash')
	, async   = require('async')
;


module.exports = function(schema, options) {

	schema.methods.ChangeCode = function(Value,done){

	}
	
	schema.pre('save',function(next,CodeUser,done){
		console.log("Model is saved");
		next();
	})

	schema.pre('remove',function(next, CodeUser, done){
		console.log("Model is removed");
		next();
	})

	
	
}