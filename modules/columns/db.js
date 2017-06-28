var  mongoose   = require('mongoose');

module.exports = {
	models:{
	},
	schema: {
		header: function(schema){
			schema.pre('save',function(next, CodeUser, done){
				var self = this;
				mongoose.model("header").find({}).isactive().lean().exec(function(err,Headers){
					var max = 100, indexed = {};
					Headers.forEach(function(H){
						indexed[H.CodeHeader] = H.CodeParentHeader;
					})
					var _p = function(CodeHeader){
						if ((--max)==0) return false;
						if (indexed[CodeHeader]) return _p(indexed[CodeHeader]);
						return true;
					}
					if (!_p[self.CodeHeader]) return done("Рекурсия в дереве заголовков");
					return next();
				})

			});
			return schema; 
		}
	}
}

