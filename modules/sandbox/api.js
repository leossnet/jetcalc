var mongoose = require('mongoose');
var router   = require('express').Router();
var _        = require('lodash');
var async    = require('async');
var api      = require(__base+'/lib/helper.js');


var sandboxSchema = mongoose.Schema({
	CodeUser :{type: String, default:''},
	LoginUser :{type: String, default:''},
	NameCommit:{type: String  , default:''},
	SNameCommit:{type: String  , default:''},
	CreatedAt:{type: Date  , default: Date.now},
	Changed  :{type: mongoose.Schema.Types.Mixed}, 
})


sandboxSchema.methods.saveToMongo = function(done){
	var self = this;
	var Config = api.ModelsConfig;
	var Objects = self.Changed;
	var tasks = [];
	for (var ModelName in Objects){
		var Objs = Objects[ModelName];
		var Cfg = Config[ModelName];
		Objs.forEach(function(Obj2S){
			var CodeKey = _.first(_.keys(Obj2S));
			var Obj2W = _.first(_.values(Obj2S));
			var Obj = {}; Obj[Cfg.Code] = CodeKey;
			for (var F in Obj2W){
				Obj[F] = Obj2W[F].new;
			}
			var Fields2Save = _.intersection(_.keys(Obj),Cfg.EditFields);
			var O2Save = {};
			Fields2Save.forEach(function(F){
				if (Config.Booleans && Config.Booleans.indexOf(F)>=0) if (!Obj[F]) Obj[F] = 0; else Obj[F] = 1;
				O2Save[F] = Obj[F];
			})
			tasks.push(function(O2Save,CodeUser,ModelName){
					return function(done){
						var Cfg = Config[ModelName];						
						var Q = {}; Q[Cfg.Code] = O2Save[Cfg.Code];
						var U = {'$unset':{}}; U['$unset']['Sandbox.'+CodeUser] = 1;
						for (var FieldName in O2Save){
							if ([Cfg.Code].indexOf(FieldName)==-1){
								U[FieldName] = 	O2Save[FieldName];
							}
						}
						mongoose.model(ModelName).update(Q,U,done);
					}
			}(O2Save,self.CodeUser,ModelName));
		})
	}
	async.parallel(tasks,done);
}


sandboxSchema.methods.prepareForSqlSave = function(){
	var self = this;
	var Config = api.ModelsConfig;
	var Objects = self.Changed;
	var Objects2Save = [];
	for (var ModelName in Objects){
		var Objs = Objects[ModelName];
		var Cfg = Config[ModelName];
		Objs.forEach(function(Obj2S){
			var CodeKey = _.first(_.keys(Obj2S));
			var Obj2W = _.first(_.values(Obj2S));
			var Obj = {}; Obj[Cfg.Code] = CodeKey;
			for (var F in Obj2W){
				Obj[F] = Obj2W[F].new;
			}
			var Fields2Save = _.intersection(_.keys(Obj),Cfg.EditFields);
			var O2Save = {};
			Fields2Save.forEach(function(F){
				if (Cfg.Booleans && Cfg.Booleans.indexOf(F)>=0) if (!Obj[F]) Obj[F] = 0; else Obj[F] = 1;
				if (Cfg.Numeric && Cfg.Numeric.indexOf(F)>=0) Obj[F] = parseInt(Obj[F]);
				O2Save[F] = Obj[F];
			})
			O2Save.tableName = Cfg.Table;
			O2Save.codeKey = Cfg.Code;
			Objects2Save.push(O2Save);
		})
	}
	var Info = {
		NameCommit:self.NameCommit,
		SNameCommit:self.SNameCommit,
		LoginUser:self.LoginUser,
		CodeUser:self.CodeUser
	}
	return {Info:Info,Objects2Save:Objects2Save};
}

sandboxSchema.methods.GetSql = function(done){
	var self = this;
	var DB = self.prepareForSqlSave();
	DB.Info.Sql = true;
	return api.sqlDB.save(DB.Info,DB.Objects2Save);
}


sandboxSchema.methods.saveToSql = function(done){
	var self = this;
	var DB = self.prepareForSqlSave();
	api.sqlDB.save(DB.Info,DB.Objects2Save,function(err,Result){
        if(err){console.log(err);}
		return done();
	})			
}


sandboxSchema.statics.saveObjects = function(Info,done){
	var CodeUser = Info.CodeUser;
	SandBox.getSandBoxObjects(CodeUser,"Code",function(err,Objects){
		var Objects2Save = [], tasks = [];
		for (var ModelName in Objects){
			var Objs = Objects[ModelName];
			var Cfg = Config[ModelName];
			Objs.forEach(function(Obj){
				var Fields2Save = _.intersection(_.keys(Obj),Cfg.EditFields);
				var O2Save = {};
				Fields2Save.forEach(function(F){
					if (Config.Booleans.indexOf(F)>=0) if (!Obj[F]) Obj[F] = 0; else Obj[F] = 1;
					O2Save[F] = Obj[F];
				})
				O2Save.tableName = Cfg.Table;
				O2Save.codeKey = Cfg.Code;
				Objects2Save.push(O2Save);
				tasks.push(function(O2Save,CodeUser,ModelName){
					return function(done){
						var Q = {}; Q[O2Save.codeKey] = O2Save[O2Save.codeKey];
						var U = {'$unset':{}}; U['$unset']['Sandbox.'+CodeUser] = 1;
						for (var FieldName in O2Save){
							if (['tableName','codeKey',O2Save.codeKey].indexOf(FieldName)==-1){
								U[FieldName] = 	O2Save[FieldName];
							}
						}
						mongoose.model(ModelName).update(Q,U,done);
					}
				}(O2Save,CodeUser,ModelName))
			})
			api.sqlDB.save(Info,Objects2Save,function(err,Result){
				if (err) throw err;
				async.parallel(tasks,function(){
					var S = new SandBox({CodeUser:Info.CodeUser,Comment:Info.NameCommit,Changed:Objects});
					S.save(done);
				});
			})			
		}
	})
}

var SandBox = mongoose.model('sandbox', sandboxSchema);

var SandBoxHelper = (new function(){
	var self = this;


	self.CountSandBoxObjects = function(CodeUser,done){
		var self = this;
		var allModels = _.keys(mongoose.models);
		var tasks = {};
		var testField = "Sandbox."+CodeUser;
		var q = {}; q[testField] = {$exists:true};
		var realq = {$or:[q,{SandboxOnly:CodeUser}]};
		console.log(realq);
		allModels.forEach(function(model){
			tasks[model] = function(model){
				return function(cb){
					mongoose.model(model).count(realq).exec(function(err,c){
						return cb(err,c);
					})
				}
			}(model);
		})
		var isNoll = function(num){return num==0;};
		async.parallel(tasks,function(err,Result){
			var Filterd = {};
			for (var I in Result){
				if (Result[I]) Filterd[I] = Result[I];
			}
			return done(err,Filterd);
		})
	}

	self.GetObjects = function(CodeUser,indexField, done){
		var self = this;
		var Config = api.ModelsConfig;
		var allModels = _.keys(mongoose.models);
		var tasks = {};
		var testField = "Sandbox."+CodeUser;
		var q = {}; q[testField] = {$exists:true};
		allModels.forEach(function(model){
			tasks[model] = function(model){
				return function(cb){
					var Name = mongoose.model(model).codeKey;
					var M = mongoose.model(model);
					mongoose.model(model).find(q).lean().exec(function(err,c){
						var ResultS = [];
						c && c.forEach(function(Obj){
							var R = {};
							var S = Obj.Sandbox[CodeUser];
							R[Obj[Config[model][indexField]]] = {};
							for (var Field in S){
								R[Obj[Config[model][indexField]]][Field] = {old:Obj[Field],new:S[Field]};
							}
							ResultS.push(R);
						})
						return cb(err,ResultS);
					})
				}
			}(model);
		})
		async.parallel(tasks,function(err,Result){
			var Filtered = {};
			for (var ModelName in Result){
				if (Result[ModelName].length) Filtered[ModelName] = Result[ModelName];
			}
			return done(err,Filtered);
		})		

	}


	return self;
})


router.get('/init', function(req,res,next){
	var CodeUser = req.user.CodeUser;
	if (!req.session.sandbox) {
    	req.session.sandbox = {
    		CodeUser:CodeUser,
    		On:false,
    		ToSave:0
    	};
    }
    SandBoxHelper.CountSandBoxObjects(CodeUser,function(err,result){
    	if (err) return next (err);
    	req.session.sandbox.ToSave = _.sum(_.values(result));
    	req.session.save(function(err){
    		if (err) return next(err);
    		return res.json(req.session.sandbox);
    	})
    })
})

router.put('/switch', function(req,res,next){
	console.log(req.session.sandbox,"<<<<<<<<<<<<<<<<");
	req.session.sandbox.On = api.parseBoolean(req.body.status);
	req.session.save(function(err){
		console.log(req.session.sandbox,">>>>>>>>>>>>>>>>>>>");
		if (err) return next (err);
		return res.json({On:req.session.sandbox.On});
	})
})

router.get('/objects', function(req,res,next){
	SandBoxHelper.GetObjects(req.user.CodeUser,'Code',function(err,Result){
		if (err) return next(err);
		return res.json(Result);
	})
})


router.delete('/objects', function(req,res){
	var CodeUser = req.user.CodeUser;
	SandBoxHelper.GetObjects(CodeUser,"Code",function(err,Objects){
		if (!_.keys(Objects).length) return res.end();
		var tasks = [];
		for (var modelName in Objects){
			var Codes = [];
			Objects[modelName].forEach(function(O){
				Codes = Codes.concat(_.keys(O));
			})
			if (Codes.length){
				tasks.push(function(ModelName,Codes){
					return function(done){
						var CodeField = api.ModelsConfig[ModelName].Code;
						var Q = {}; Q[CodeField] = {$in:Codes};
						var U = {'$unset':{}}; U['$unset']['Sandbox.'+CodeUser] = 1;
						mongoose.model(ModelName).update(Q,U,{multi:true}).exec(function(){
							return done();
						})
					}
				}(modelName,Codes))
			}
		}
		async.parallel(tasks,function(err){
			req.session.sandbox = {CodeUser:req.user.CodeUser,On:false,toSave:0};
			req.session.save(function(err){
				return res.end();	
			})
		})
	})
})

router.put('/objects', function(req,res,next){
	var CodeUser = req.user.CodeUser;
	var LoginUser = req.user.LoginUser;
	SandBoxHelper.GetObjects(CodeUser,"Code",function(err,Objects){
		if (!_.keys(Objects).length) return res.end();
		var S = new SandBox({CodeUser:CodeUser,LoginUser:LoginUser,NameCommit:req.body.comment||'Сохранение объектов',SNameCommit:'saveobjects',Changed:Objects});
		S.save(function(err){
			if (err) return next(err);
			S.saveToSql(function(err){
				if (err) return next(err);
				S.saveToMongo(function(err){
					if (err) return next(err);
					req.session.sandbox = {CodeUser:req.user.CodeUser,On:false,toSave:0};
					req.session.save(function(err){
						return res.end();
					})
				})
			})
		});
	})
})




module.exports = router;