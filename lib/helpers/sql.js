var 
	mongoose  = require('mongoose')
	, _       = require('lodash')
	, async   = require('async')
;


module.exports = function(schema, options) {



	schema.statics.findQuery = function(req,what,fields){
		var Config  =  schema.statics.cfg();
		var SandBox =  req.session.sandbox;
		var IsSandBox = schema.statics.IsSandBox;
		console.log("IsSandBox",IsSandBox);
		console.log("SandBox",SandBox);
		console.log("Config",Config);
		//var query = mongoose.model()



	}



	schema.methods.directSave = function(model,info,done){
		var api = require('../helper.js');
		var Config =  schema.statics.cfg();		
		var Obj = model.toObject();
		var _id = Obj._id;
		var ModelName = Config.ModelName;
		var Fields2Save = _.intersection(_.keys(Obj),Config.EditFields);
		var O2Save = {};
		Fields2Save.forEach(function(F){
			if (Config.Booleans.indexOf(F)>=0) if (!Obj[F]) Obj[F] = 0; else Obj[F] = 1;
			if (Config.Numeric.indexOf(F)>=0) Obj[F] = parseInt(Obj[F]);
			O2Save[F] = Obj[F];
		})
		O2Save.tableName = Config.tablename;
		O2Save.codeKey = Config.Code;
		if (Obj.IsNew) O2Save.IsNew = true; else O2Save.IsNew = false;
		api.sqlDB.save(info,[O2Save],function(err,Result){
			if (err) console.log(err,Result);
			if (err) return done(err);
			O2Save = _.omit(O2Save,['tableName','codeKey','IsNew']);
			mongoose.model(ModelName).findByIdAndUpdate(_id,O2Save,function(err){
				return done(err);
			})
		})
	}	


	schema.statics.directSaveArr = function(CommitInfo,Arr,done){
		console.log(CommitInfo,Arr);
		var api = require('../helper.js');
		var Config =  schema.statics.getConfig();
		var ModelName = Config.ModelName;
		var ArrayOfObjects = [], MongoTasks = [];
		Arr.forEach(function(Obj){
			var Fields2Save = _.intersection(_.keys(Obj),Config.EditFields);
			var _id = Obj._id;
			var O2Save = {};
			Fields2Save.forEach(function(F){
				if (Config.Booleans.indexOf(F)>=0) if (!Obj[F]) Obj[F] = 0; else Obj[F] = 1;
				if (Config.Numeric.indexOf(F)>=0) Obj[F] = parseInt(Obj[F]);
				O2Save[F] = Obj[F];
			})
			O2Save.tableName = Config.Table;
			O2Save.codeKey = Config.Code;
			ArrayOfObjects.push(O2Save);
			var Q = {}; Q[O2Save.codeKey] = O2Save[O2Save.codeKey];
			MongoTasks.push(function(ModelName,O2Save,Q){
				return function(cb){
					O2Save = _.omit(O2Save,['tableName','codeKey','IsNew']);
					var M = mongoose.model(ModelName);
					M.findOne(Q).exec(function(err,Saver){
						if (err) return cb(err);
						if (Saver){
							M.findOneAndUpdate(Q,O2Save).exec(cb);	
						} else {
							M.create([O2Save],cb);
						}
					})
				}
			}(ModelName,O2Save,Q))
		})
		api.sqlDB.save(CommitInfo,ArrayOfObjects,function(err,Result){
			if (err) return done(err);
			async.parallel(MongoTasks,function(err){
				return done(err);
			});
		})
	}	
	
}