var redis = require(__base+"src/redis");
var _ = require("lodash");
var Bus = require(__base + 'src/bus.js');


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


	self.FlushTimeout = null;
	self.Flush = function(){
		if (self.FlushTimeout){
			clearTimeout(self.FlushTimeout);
			self.FlushTimeout = null;
		}
		self.FlushTimeout = setTimeout(function(){
			console.log("FLUSH FOR:",self.Name);
			self.ClearCache();
			clearTimeout(self.FlushTimeout);
			self.FlushTimeout = null;
		},500);
	}

	self.SubscribeChanges = function(models){
		Bus.On("modelchange",function(modelName){
			if (models.indexOf(modelName)!=-1){
				self.Flush();
			}
		})
	}

	return self;
}

