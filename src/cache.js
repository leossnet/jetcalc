var lodash = require("lodash");
var mongoose = require("mongoose");
var async = require("async");
var config = require(__base+'config.js');


// 1. Есть контекстно независимый кэш - например, rows_nalog, docfolders
// 2. Есть контекстно зависимый кэш - например, nalog_rows_IsInput_Year_CodeObj_ChildObj, docfolders_codeuser
// 3. Есть возможность инвалидировать зависимый кэш

var CacheManager = (new function(){
	var self = this;
	
	self.Redis = require("redis").createClient(config.redis);

	self.Modules = {};

	self.RegisterModule = function(ModuleName, GetBase, GetFiltered){

	}

	self.Get = function(){

	}

	self.Set = function(){

	}

	self.GetBase = function(){

	}

	self.SetBase = function(){

	}

	self.InValidate = function(){

	}

	return self;
})





var BaseCache = function(Base,BaseFields,Context,ContextFields){
	var self = this;

	self.Base = Base;
	self.BaseCacheFields = BaseFields;
	self.Context = Context;
	self.CacheFields = ContextFields;	

	self.GetBase = function(){

	}

	self.GetFiltered = function(){

	}

	return self;
}



module.exports = BaseCache;

/*
	self.query = function(modelName,query,fields){
		var Q = mongoose.model(modelName).find(query,fields);
		if (self.Context.SandBox) {
			Q.sandbox(self.Context.SandBox,true);
		} else {
			Q.isactive(); // Проверка на IsActive
		}
		Q.lean();
		return Q;
	}

	self.cacheKey = function(){
		var CacheKey = "";
		if (self.Context.CacheFields){
			var C = _.clone(self.Context);
			for (var K in C){
				if (typeof C[K] == 'object'){
					C[K] = JSON.stringify(C[K]);
				}
			}
			CacheKey = _.compact(_.values(_.pick(C,['PluginName','SandBox'].concat(self.Context.CacheFields)))).join("_");
			if (CacheKey.length>32){
				CacheKey = crypto.createHash('md5').update(CacheKey).digest('hex');
			}
		} else {
			CacheKey = crypto.createHash('md5').update(JSON.stringify(_.omit(self.Context,'UseCache'))).digest('hex');
		}
		return CacheKey;
	}

	self.loadFromCache = function(done){
		var key = self.cacheKey(); 
		if (self.Context.UseCache === false){
			return done (null,null);
		}
		redis.mget([key], function (err, res) {
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
	
	self.saveToCache = function(Result,final){
		var key = self.cacheKey();
		redis.mset([key,JSON.stringify(Result)], function (err) {
			return final(err);
	 	})
	}

 */