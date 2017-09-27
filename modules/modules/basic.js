var async = require('async');
var mongoose = require('mongoose');
var moment = require('moment');
var _ = require('lodash');

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
					content:new Buffer(JSON.stringify(Content,null, "\t")).toString('base64'),
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

	self.Install = function(done){
		self.PrepareInstall(function(err,ToDo){
			console.log(ToDo);
			async.each(ToDo.Models.ToRemove,function(Model,cb1){
				console.log("Remove Model",Model);
				Model.remove("",cb1);
			},function(err){
				if (err) return done(err);
				async.each(ToDo.Models.ToSave,function(Model,cb2){
					console.log("Add Model",Model);
					Model.save("",cb2);
				},function(err){
					if (err) return done(err);
					async.each(ToDo.Links.ToRemove,function(Model,cb3){
						console.log("Remove Link",Model);
						Model.remove("",cb3);
					},function(err){
						if (err) return done(err);
						console.log("Add Link");
						async.each(ToDo.Links.ToSave,function(Model,cb4){
							Model.save("",cb4);
						},done);
					})
				})
			})
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
					return U;
				})));
				return ugu();
			})
		}
		var _toAdd = function(AddedCodes,IndexedNew,ModelName,Code,IsLink,ugu){
			if (_.isEmpty(AddedCodes)) return ugu();
			var Q = {}; Q[Code] = {$in:AddedCodes};
			mongoose.model(ModelName).find(Q).isactive().exec(function(err,PossibleAdded){
				var ExistedIndexed = {}; PossibleAdded.forEach(function(PA){
					ExistedIndexed[PA[Code]] = PA;
				})
				var ToSave = [];
				AddedCodes.forEach(function(AC){
					if (_.isEmpty(ExistedIndexed[AC])){
						var N = new (mongoose.model(ModelName))(IndexedNew[AC]);
						ToSave.push(N);
					} else {
						for (var K in IndexedNew[AC]){
							ExistedIndexed[AC][K] = IndexedNew[AC][K];
						}
						if (ExistedIndexed[AC].isModified()){
							ToSave.push(ExistedIndexed[AC]);
						}
					}
				})
				_add("ToSave",IsLink,ToSave);				
				return ugu();
			})
		}
		self.DumpCurrent(function(err,DataOld){
			self.Models(function(err,DataNew){
				_.difference(_.keys(DataNew),_.keys(DataOld)).forEach(function(AK){ DataOld[AK] = {};});
				_.difference(_.keys(DataOld),_.keys(DataNew)).forEach(function(RK){ DataNew[RK] = {};});
				async.each(_.keys(DataOld),function(ModelName,cb){
					var M = mongoose.model(ModelName), CFG = M.cfg(), Code = CFG.Code, IsLink = (CFG.menuplace=='Link');
					var IndexedOld = DataOld[ModelName], IndexedNew =DataNew[ModelName];
					var RemovedCodes = _.difference(_.keys(IndexedOld),_.keys(IndexedNew));
					var AddedCodes = _.difference(_.keys(IndexedNew),_.keys(IndexedOld));
					var PossibleModified = _.intersection(_.keys(IndexedNew),_.keys(IndexedOld));
					var ReallyModified = {};
					PossibleModified.forEach(function(PM){
						if (!_.isEqual(IndexedOld[PM],IndexedNew[PM])){
							ReallyModified[PM] =  IndexedNew[PM];
						}
					})
					_toRemove(ModelName,RemovedCodes,Code,IsLink,function(err){
						_toUpdate(ReallyModified,ModelName,Code,IsLink,function(err){
							_toAdd(AddedCodes,IndexedNew,ModelName,Code,IsLink,cb);
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

module.exports = Base;