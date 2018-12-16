var redis = require(__base+"src/redis");
var _ = require("lodash");
var Bus = require(__base + 'src/bus.js');


module.exports = function(Name){

	var self = this;
	self.Name = Name;

	self.FromCache = function(CodeDoc, done){
		var CK = _.compact([self.Name,CodeDoc]).join("_")
		redis.mget([CK], function (err, res) {
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

	self.GetList = function(done){
		var CacheKey = [self.Name,"LIST"].join("_");
		redis.mget([CacheKey], function (err, res) {
			var List = {};
			if (res && res[0]){
				List = JSON.parse(res[0]);
			}
			return done(err,List);
		})
	}

	self.UpdateList = function(CodeDoc,done){
		if (_.isEmpty(CodeDoc)) return done();
		self.GetList(function(err,List){
			List[CodeDoc] = 1;
			redis.mset([[self.Name,"LIST"].join("_"),JSON.stringify(List)], function (err) {
				return done(err);
		 	})
		})
	}

	self.ToCache = function(CodeDoc,Result,done){
		var CK = _.compact([self.Name,CodeDoc]).join("_")
		self.UpdateList(CodeDoc,function(){
			redis.mset([CK,JSON.stringify(Result)], function (err) {
				return done(err);
		 	})
		});
	}

	self.ClearCache = function(done){
		self.GetList(function(err,List){
			var ToRemove = [self.Name];
			_.keys(List).forEach(function(L){
				ToRemove.push([self.Name,L].join("_"));
			})
			redis.del(ToRemove, done);
		})
	}

	self.FlushTimeout = null;
	self.Flush = function(){
		if (self.FlushTimeout){
			clearTimeout(self.FlushTimeout);
			self.FlushTimeout = null;
		}
		self.FlushTimeout = setTimeout(function(){
			self.ClearCache();
			clearTimeout(self.FlushTimeout);
			Bus.Emit("FLUSH:"+self.Name);
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
