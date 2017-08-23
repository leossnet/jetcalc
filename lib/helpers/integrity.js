var 
	mongoose  = require('mongoose')
	, _       = require('lodash')
	, async   = require('async')
;

var DependantModels = function(ModelName){
	var Result = {};
	for (var Key in mongoose.modelSchemas){
		var Shema = mongoose.modelSchemas[Key].paths;
		for (var FieldName in Shema){
			if (Shema[FieldName].options.refmodel==ModelName && FieldName.indexOf("Code")===0){
				if (_.isEmpty(Result[Key])) Result[Key] = {};
				Result[Key][FieldName] = 1;
			}
		}				
	}
	return Result;
}


module.exports = function(schema, options) {




	schema.methods.Dependent = function(done){
		var CFG = this.cfg(), ModelName = CFG.ModelName, R = DependantModels(ModelName), Code = CFG.Code, self = this;
		if (_.isEmpty(R)) return done();
		var Dependable = {};
		async.each(_.keys(R),function(model,cb){
			var Q = {}, C =  R[model], M = mongoose.model(model), CFG = M.cfg(); 
			if (_.keys(C).length>0){
				Q["$or"] = _.map(_.keys(C),function(K){
					var Z = {}; Z[K] = self[Code]
					return Z;
				});
			} else {
				Q[_.first(_.keys(C))] = self[Code];
			}
			M.find(Q,["-_id",CFG.Code].join(" ")).isactive().lean().exec(function(err,Res){
				if(!_.isEmpty(Res)) Dependable[model] = _.map(Res,CFG.Code);
				return cb();
			})
		},function(err){
			return done(err,Dependable);
		})
	}

	schema.methods.ChangeCode = function(Value,done){

	}
	

	schema.pre('remove',function(next, CodeUser, done){
		var self = this, sCFG = self.cfg(), sCode = sCFG.Code, Update = {UserEdit:CodeUser,DateEdit:Date.now()};
		if (sCFG.menuplace=="Link") return next();
		Update[sCode] = null;
		self.Dependent(function(err,Models){
			if (_.isEmpty(Models)) return next();
			async.each(_.keys(Models),function(modelName,cb1){
				var M = mongoose.model(modelName), mCFG = M.cfg(), mCode = mCFG.Code, isLink = (mCFG.menuplace=="Link");				
				async.each(Models[modelName],function(code,cb2){
					var Q = {IsActive:true}; Q[mCode] = code;
					Update.IsActive = (isLink)? false : true;
					M.findOneAndUpdate(Q,Update,cb2);
				},cb1);
			},function(err){
				if (err) console.log("INTEGRITY REMOVE ERR",err);
				return next();
			})
		})
	})

	
	
}