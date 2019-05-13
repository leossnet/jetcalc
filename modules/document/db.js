var  crypto   = require('crypto');
var  _   = require('lodash');
var  mongoose   = require('mongoose');
var  bus   = require(__base+"src/bus.js");

module.exports = {
	models:{
	},
	schema: {
		doc: function(schema){
			schema.pre('save',function(next, CodeUser, done){
 				this.wasNew = this.isNew;
  				next();
			});

			schema.post('save',function(instance, done){
				bus.Emit("FLUSH:JPERMISSIONS");
				return done();
			});

			return schema;
		}

	}
}

