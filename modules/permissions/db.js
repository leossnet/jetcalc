var  crypto   = require('crypto');
var  _   = require('lodash');
var  mongoose   = require('mongoose');
var  bus   = require(__base+"src/bus.js");

module.exports = {
	models:{
	},
	schema: {
		userpermit: function(schema){

			schema.post('save',function(instance, done){
				bus.Emit("FLUSH:JPERMISSIONS");
				return done();
			});

			return schema;
		},
		permit: function(schema){

			schema.post('save',function(instance, done){
				bus.Emit("FLUSH:JPERMISSIONS");
				return done();
			});

			return schema;
		},
		permitrole: function(schema){

			schema.post('save',function(instance, done){
				bus.Emit("FLUSH:JPERMISSIONS");
				return done();
			});

			return schema;
		}

	}
}

