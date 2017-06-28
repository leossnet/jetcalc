var fs = require("fs");
var async = require("async");
var mongoose = require("mongoose");
var _ = require("lodash");

module.exports = (new function(){
	var self = this;

	self.Permits = require(__base +'/modules/permissions/check.js');

	self.listConfigs = function(dirName,done){
	    fs.readdir(dirName, function(err, files) {
	        var modules = [];
	        async.each(files, function(module, done) {
	            var dir = `${dirName}/${module}`;
	            fs.stat(dir, function(err, stat) {
	                if (!stat.isDirectory()) return done();
	                fs.stat(`${dir}/config.json`, function(err, statcfg) {
	                	if (!statcfg || !statcfg.isFile()) return done();
		                fs.readFile(`${dir}/config.json`,function(err, config) {
		                    config = JSON.parse(config)
		                    modules.push({
		                        name: module,
		                        config: config
		                    })
		                    return done(err);
		                })
		            })
	            })
	        }, function(err) {
	            return done(err,_.filter(modules,function(p){
	                return p.config.is_enabled;
	            }));
	        })
	    })
	}    

	self.dbExtend = function(done){
		self.listConfigs(__base+"modules",function(err,list){
			var TurnedOn = _.map(_.filter(_.map(list,"config"),{is_enabled:true}),"id");
			var Extenders = {};
			TurnedOn.forEach(function(ModuleId){
				var DbFile = __base+'modules/'+ModuleId+'/db.js';
				if (fs.existsSync(DbFile)){
					Extenders[ModuleId] = require(DbFile);
				}
			})
			return done(err,Extenders);
		})
	}

	self.enabledExtensions = function(done){
		self.enabledExtensionsCfgs(function(err,List){
			return done(null, _.map(List,"name"));
		})
	}


	self.enabledExtensionsCfgs = function(done){
		self.listConfigs ("modules",function(err,modulesList){  
		    self.listConfigs ("plugins",function(err,pluginsList){  
		      var List = modulesList.concat(pluginsList);
		      List = _.filter(List,{config:{is_enabled:true}});
		      return done(null,List);
		    })
		})
	}


	self.ReqContext = function(req){
		if (!req.user) return {};
		var SandBox = req.session.sandbox, CodeUser = req.user.CodeUser, Context = {};
		var data = req.body;
		switch (req.method) {
			case 'GET': 
				data = req.query;
				break;
			default: 
				data = req.body;
				break;
		}

		Context = data.Context || data.context || data;
		Context.SandBox = null;
		if (SandBox && SandBox.On && SandBox.ToSave) Context.SandBox = SandBox.CodeUser;
		['IsInput','UseCache','IsDebug','IsOlap'].forEach(function(Field){
			Context[Field] = (Context[Field]===true || Context[Field]==="true");
		})
		Context.Year = parseInt(Context.Year);
		Context.CodeUser  = CodeUser;
		return Context;
	}

	self.Require = function(fields){
		return function(req,res,next){
			var rInfo = null;
			console.log(req.method);
			switch (req.method) {
				case 'POST':
				case 'DELETE':
				case 'PUT':
					rInfo = req.body;
					break;
				case 'GET':
					rInfo = req.query;
					break;
			}
			rInfo = rInfo || {};
			var Missed = [];
			fields.forEach(function(field){
				if (!rInfo[field]) Missed.push(field);
			});
			if (Missed.length) return next('Необходимо передать: '+Missed.join(", "));
			next();
		}
	}

	self.FindOrCreate = function(ModelName,CodeValue,done){
		var Model = mongoose.model(ModelName);
		var CFG = Model.cfg();
		var Q = {};  Q[CFG.Code] = CodeValue;
		if (!CodeValue.length){
			var M = new Model();
			return done(null, M);
		}
		Model.findOne(Q).isactive().exec(function(err,M){
			if (!M) M = new Model();
			return done(err,M);
		})
	}


	self.parseBoolean = function (test){
		return (test===true || test==="true");
	}

	self.ignoreEmpty = function(val) {
  		if ("" === val || val==undefined) {
    		return null;
  		} else {
    		return val
  		}
	}

	self.parseNumber = function (test){
		var test = self.ignoreEmpty(test);
		if (test===null || test==='null') return 0;
		if (test===undefined || test==='undefined') return 0;
		if (isNaN(test)) return 0;
		var s = (test+'').replace(',','.')
		var result = parseFloat(s);
		if (isNaN(result)) return 0;
		return result;
	}

	self.Random = function(){
		return mongoose.Types.ObjectId()+'';
	}

	self.SyncPriveleges = function(done){
	    var path = __base+"modules";
	    var Functions = require(__base+"modules/modules/functions.js");
	    self.listConfigs (path,function(err,list){  
	        list.forEach(function(L){
	            if (L.config.permissions){
	                Functions.Register(L.config.id,path,L.config.permissions);
	            }
	        })    
	        if (mongoose.models["privelege"]){
	            Functions.Sync(function(){
	                return done();
	            });
	        } else {
	        	return done();
	        }
	    })

    }


	return self;
})
