var redis = require(__base+"src/redis");
var _ = require("lodash");



module.exports = function(Name){
	
	var self = this;
	self.Name = Name;

	self.FromCache = function(done){
		redis.mget([self.Name], function (err, res) {
			if (err) return done(err);
			if (res && res[0]){
				var Answer = null;
				try{
					Answer = JSON.parse(res[0]);
					return done(null,Answer);
				} catch(e){
					return done(e)
				}
			} else {
				return done(null,null);
			}
		})
	}
	
	self.ToCache = function(Result,done){
		redis.mset([self.Name,JSON.stringify(Result)], function (err) {
			return done(err);
	 	})
	}

	self.ClearCache = function(done){
		redis.del([self.Name], done);
	}

	return self;
}

