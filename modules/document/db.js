var  crypto   = require('crypto');
var  _   = require('lodash');
var  mongoose   = require('mongoose');
var  bus   = require(__base+"src/bus.js");

module.exports = {
	models:{
	},
	schema: {
		doc: function(schema){
			schema.pre('save',function(next, done){
				console.log('pre save from document')
				 this.wasNew = this.isNew;
				 console.log('pre save from document - done')
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

