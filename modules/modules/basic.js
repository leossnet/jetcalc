var async = require('async');
var mongoose = require('mongoose');
var moment = require('moment');
var _ = require('lodash');
var HelpersPath = __base+"classes/jetcalc/Helpers/"; 

var Base = function(name){
	var self = this;

	self.GitName = ["jcmodel",name].join("_");

	self.request = require("request");
	self.base = "https://api.github.com";

	self.ask = function(url,type,body,done){
		self.GitSettings(function(err,Set){
	        var askUrl = self.base+decodeURIComponent(url);
	        var auth = {user:Set.GitLogin,pass:decodeURIComponent(Set.Password),sendImmediately:true}
	        var headers = {'User-Agent': Set.GitLogin};
	        if (!_.isEmpty(body)){
	            headers["Content-Type"] = "application/json";
	        }
	        self.request({
	            method: type,
	            uri:askUrl,
	            auth:auth,
	            json: body,
	            headers: headers
	        },function(error, response, body){
	            if (error) return done(error);
	            return done(null,body);
	        })
		})
    }    

	self.GitSettings = function(done){
		mongoose.model("mssettings").findOne({},"+Password").lean().exec(done);
	}

	self.Module = function(done){
		mongoose.model("msmodule").findOne({ModuleName:self.GitName}).lean().exec(done);
	}

	self.GetInfo = function(Type,done){
		self.Module(function(err,Data){
			var Models = {};
			try{
				Models = JSON.parse(new Buffer(Data[Type].trim(), 'base64')+'');
			}catch(e){
				return done(e);
			}
			return done(err,Models);
		})
	}

	self.Models = function(done){
		self.GetInfo("Models",done);
	}

	self.Data = function(done){
		self.GetInfo("Data",done);	
	}

	self.UpdateGit = function(Type,Content,done){
		self.GitSettings(function(err,Set){
			self.Module(function(err,Mod){
				var FileName = Type+".json";
				var url = ['',"repos",Set.RepoOwner,self.GitName,'contents',FileName].join("/");
				self.ask(url,"PUT",{
					message:'Update from server',
					content:new Buffer(JSON.stringify(Content)).toString('base64'),
					sha:Mod[Type+"SHA"],
					path:FileName,
					branch:'master'
				},done)
			})		
		})		
	}

	self.UpdateModels = function(Content,done){
		self.UpdateGit("Models",Content,done);
	}

	self.UpdateData = function(Content,done){
		self.UpdateGit("Data",Content,done);
	}

	self.IncrementVersion = function(done){
		self.Module(function(err,Data){
			var Current = Data.Version.split(".");
			return done(err,[_.first(Current),(Number(_.last(Current))++)].join("."));
		})
	}

	self.Install = function(){
		self.PrepareInstall(function(err,ToDo){
			console.log(ToDo);
		})
	}

	self.PrepareInstall = function(done){
		var ToDo = {Models:{ToRemove:[],ToSave:[]},Links:{ToRemove:[],ToSave:[]}};		
		var _add = function(Place,IsLink,Models){
			if (IsLink){
				ToDo.Links[Place] = ToDo.Links[Place].concat(Models);	
			} else {
				ToDo.Models[Place] = ToDo.Models[Place].concat(Models);
			} 
		}
		var _toRemove = function(ModelName,RemovedCodes,Code,IsLink,ugu){
			if (_.isEmpty(RemovedCodes)) return ugu();
			var Q = {}; Q[Code] = {$in:RemovedCodes};
			mongoose.model(ModelName).find(Q).isactive().exec(function(err,Remove){
				_add("ToRemove",IsLink,Remove);
				return ugu(err);
			})
		}
		var _toUpdate = function(ReallyModified,ModelName,Code,IsLink,ugu){
			if (_.isEmpty(ReallyModified)) return ugu();
			var Q = {}; Q[Code] = {$in:_.keys(ReallyModified)};
			mongoose.model(ModelName).find(Q).isactive().exec(function(err,Update){
				_add("ToSave",IsLink,_.compact(_.map(Update,function(U){
					for (var K in ReallyModified[U[Code]]) U[K] = ReallyModified[U[Code]][K];
					if (!U.isModified()) return null;
					console.log(ReallyModified[U[Code]])
					return U;
				})));
				return ugu();
			})
		}
		self.DumpCurrent(function(err,DataOld){
			self.Models(function(err,DataNew){
				_.difference(_.keys(DataNew,DataOld)).forEach(function(AK){ DataOld[AK] = [];});
				_.difference(_.keys(DataOld,DataNew)).forEach(function(RK){ DataNew[RK] = [];});
				async.each(_.keys(DataOld),function(ModelName,cb){
					var M = mongoose.model(ModelName), CFG = M.cfg(), Code = CFG.Code, IsLink = (CFG.menuplace=='Link');
					var IndexedOld = {}, IndexedNew = {};
					DataOld[ModelName].forEach(function(DO){ IndexedOld[DO[Code]] = DO;})
					DataNew[ModelName].forEach(function(DN){ IndexedNew[DN[Code]] = DN;})
					var AddedCodes = _.difference(_.keys(IndexedOld),_.keys(IndexedNew));
					console.log("AddedCodes",AddedCodes);
					var RemovedCodes = _.difference(_.keys(IndexedNew),_.keys(IndexedOld));
					var PossibleModified = _.intersection(_.keys(IndexedNew),_.keys(IndexedOld));
					var ReallyModified = {};
					PossibleModified.forEach(function(PM){
						if (!_.isEqual(IndexedOld[PM],IndexedNew[PM])){
							ReallyModified[PM] =  IndexedNew[PM];
						}
					})
					_toRemove(ModelName,RemovedCodes,Code,IsLink,function(err){
						_toUpdate(ReallyModified,ModelName,Code,IsLink,function(err){
							_add("ToSave",IsLink,_.map(AddedCodes,function(AC){
								return new M(IndexedNew[AC])
							}));
							return cb();
						})
					})
				},function(err){
					return done(err,ToDo);
				})
			})
		})
	}

	









	return self;
}


var BasicModel = (new function(){
	
	var self = new Base("basic");

	self.BasicModels = {
		periods:["period","periodgrpref","reportperiods","periodautofill"],
		valuta:["valuta"],
		workflow:["state","route","routecheckperiod","routerefperiod","routeperiod"],
		columns:["col"],
		listobjects:["format","style","measure"]
	}

	self.DumpCurrent = function(done){
		var Dump = {};
		async.each(_.keys(self.BasicModels),function(Module,cb){
			var models = self.BasicModels[Module];
			async.each(models,function(ModelName,next){
				var Model = mongoose.model(ModelName);
				var CFG = Model.cfg(), EditFields = _.filter(CFG.EditFields,function(F){
					return F.indexOf("Link")!=0;
				});
				Model.find().isactive().lean().exec(function(err,Ms){
					Dump[ModelName] = _.map(Ms,function(M){
						return _.pick(M,EditFields);
					})
					return next(err);
				})
			},cb)
		},function(err){
			return done(err,Dump);
		})
	}

	self.CalculateDiff = function(done){
		var Result = {
			ToRemove:[],
			ToSave:[]
		}
		self.DumpCurrent(function(err,Current){
			if (err) return done(err);
			self.Models(function(err,New){
				if (err) return done(err);
				console.log(New,Current);
			})
		})
	}

	


	return self;
})



setTimeout(function(){
	BasicModel.Install(function(err){
		console.log("Install complete");
	})
	/*BasicModel.DumpCurrent(function(err,Data){
		BasicModel.UpdateModels(Data,function(err,Answer){
			console.log("Basic Model Updates Git",err,Answer);
		})
	})
	*/
},1000)





module.exports = BasicModel;