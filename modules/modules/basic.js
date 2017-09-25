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
					return U;
				})));
				return ugu();
			})
		}
		var _toAdd = function(AddedCodes,IndexedNew,ModelName,Code,IsLink,ugu){
			if (_.isEmpty(AddedCodes)) return ugu();
			var Q = {}; Q[Code] = {$in:AddedCodes}, M = mongoose.model(ModelName);
			mongoose.model(ModelName).find(Q).isactive().exec(function(err,PossibleAdded){
				var ExistedIndexed = {}; PossibleAdded.forEach(function(PA){
					ExistedIndexed[PA[Code]] = PA;
				})
				var ToSave = [];
				AddedCodes.forEach(function(AC){
					if (_.isEmpty(ExistedIndexed[AC])){
						ToSave.push((new M(IndexedNew[AC])));
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
				_.difference(_.keys(DataNew,DataOld)).forEach(function(AK){ DataOld[AK] = [];});
				_.difference(_.keys(DataOld,DataNew)).forEach(function(RK){ DataNew[RK] = [];});
				async.each(_.keys(DataOld),function(ModelName,cb){
					var M = mongoose.model(ModelName), CFG = M.cfg(), Code = CFG.Code, IsLink = (CFG.menuplace=='Link');
					var IndexedOld = {}, IndexedNew = {};
					DataOld[ModelName].forEach(function(DO){ IndexedOld[DO[Code]] = DO;})
					DataNew[ModelName].forEach(function(DN){ IndexedNew[DN[Code]] = DN;})
					var AddedCodes = _.difference(_.keys(IndexedOld),_.keys(IndexedNew));
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


	return self;
})

var FolderModel = function(name){
	
	var self = new Base(name);

	self.MInfo = {};
	self.StopModels = ["style","format","measure","tag","label"];
	self.StopFields = {
		row:{
			row:{CodeRowLink:1}
		},
		docheader: {
			doc:{CodeDoc:1}
		}
	};


	self.DependantModels = function(ModelName){
		var Result = {Out:{},My:{}};
		if (_.includes(self.StopModels,ModelName)) return Result;
		for (var Key in mongoose.modelSchemas){
			var Shema = mongoose.modelSchemas[Key].paths;
			for (var FieldName in Shema){
				var RM = Shema[FieldName].options.refmodel;
				if (!_.isEmpty(RM) && (RM==ModelName)){
					if (_.isEmpty(Result.Out[Key])) Result.Out[Key] = {};
					Result.Out[Key][FieldName] = 1;
				}
			}				
		}
		var MySchema = mongoose.modelSchemas[ModelName].paths;
		for (var FieldName in MySchema){
			var RM = MySchema[FieldName].options.refmodel;
			if (!_.isEmpty(RM) && (RM!=ModelName) ){
				if (_.isEmpty(Result.My[RM])) Result.My[RM] = {};
				Result.My[RM][FieldName] = 1;
			}
		}		
		if (self.StopFields[ModelName]){
			for (var ModelN in self.StopFields[ModelName]){
				if (Result.Out[ModelN] && _.isEqual(Result.Out[ModelN],self.StopFields[ModelName][ModelN])){
					delete Result.Out[ModelN];	
				}
				if (Result.My[ModelN] && _.isEqual(Result.My[ModelN],self.StopFields[ModelName][ModelN])) {
					delete Result.My[ModelN];	
				}
			}
		}
		return Result;
	}


	var _modelInfo = function(ModelName,cb){
		var M = mongoose.model(ModelName), CFG = M.cfg();
		self.MInfo[ModelName] = {
			Model:M,
			Code:CFG.Code,
			IsLink:(CFG.menuplace=='Link'),
			EditFields:["-_id"].concat(_.filter(CFG.EditFields,function(F){
				return F.indexOf("Link")!=0;
			})),
			Dependant:self.DependantModels(ModelName)
		};		
		return cb();
	}

	async.each(
		[
			"docfolder","docfolderdoc","doc","docrow","row","docheader","header","colsetcol","style","colset","col"
		]//
	,_modelInfo);
	//,,"col","format","measure","present","chart","presetslot","docheader","rowchartline","doctag","colsetcol","doclabel","label","docparamkey","rowsumgrp","rowtag","header"


	self.ToDump = {};
	self.ToDo = {};


	self.AddToTodo = function(ModelName,Model){
		var Code = Model[self.MInfo[ModelName].Code];
		if (!self.ToDo[ModelName]) self.ToDo[ModelName] = {};
		if (_.isEmpty(self.ToDump[ModelName]) || _.isEmpty(self.ToDump[ModelName][Code])){
			self.ToDo[ModelName][Code] = Model;	
		}		
	}

	self.AddToDump = function(ModelName,Model){
		var Code = Model[self.MInfo[ModelName].Code];
		if (!self.ToDump[ModelName]) self.ToDump[ModelName] = {};
		self.ToDump[ModelName][Code] = Model;	
	}

	self.FixTodo = function(){
		var New = _.clone(self.ToDo);
		for (var ModelName in self.ToDo){
			for (var Code in self.ToDo[ModelName]){
				if (self.ToDump[ModelName] && self.ToDump[ModelName][Code]){
					delete New[ModelName][Code];
				}
			}
		}
		for (var K in New) if (_.isEmpty(New[K])) delete New[K];
		self.ToDo = New;
	}

	self.DumpCurrent = function(done){
		var DocFolder = self.MInfo["docfolder"];
		DocFolder.Model.findOne({GitModule:self.GitName},DocFolder.EditFields.join(" ")).lean().isactive().exec(function(err,StartModel){
			self.AddToTodo("docfolder",StartModel);
			self.DoWork(function(err){
				return done(err,self.ToDump);
			});
		})
	}

	self.MaxRecursions = 10000;

	self.Skipped = [];

	self.DoWork = function(done){
		var Add = [];
		for (var ModelName in self.ToDo){
			var I = self.MInfo[ModelName], Out = I.Dependant.Out, My = I.Dependant.My;
			for (var Code in self.ToDo[ModelName]){
				var Moda = self.ToDo[ModelName][Code];
				if (!_.isEmpty(Out)){			
					for (var DepModel in Out){
						var Fields = _.keys(Out[DepModel]);
						if (!_.isEmpty(self.MInfo[DepModel])){
							var QAr = _.map(Fields,function(F){
								var P = {}; P[F] = Code;
								return P;
							});
							var Q = QAr.length>1 ? {$or:QAr}:_.first(QAr);
							Add.push({ModelName:DepModel,Query:Q});
						} else {
							if (!_.includes(self.Skipped,DepModel)) self.Skipped.push(DepModel);
						}
					}
				}
				if (!_.isEmpty(My)){			
					for (var DepModel in My){
						var Fields = _.keys(My[DepModel]);
						if (!_.isEmpty(self.MInfo[DepModel])){
							var QAr = _.map(Fields,function(F){
								var P = {}; P[F] = Moda[F];
								return P;
							});
							var Q = QAr.length>1 ? {$or:QAr}:_.first(QAr);
							Add.push({ModelName:DepModel,Query:Q});
						}
					}
				}
				self.AddToDump(ModelName,self.ToDo[ModelName][Code])
			}
		}
		if (_.isEmpty(Add)){
			self.FixTodo();
			if (_.isEmpty(self.ToDo)){
				return done();
			}
		}
		async.each(Add,function(Dep,cb){
			var M = self.MInfo[Dep.ModelName];
			M.Model.find(Dep.Query,M.EditFields.join(" ")).isactive().lean().exec(function(err,DModels){
				DModels.forEach(function(Mod){
					self.AddToTodo(Dep.ModelName,Mod);
				})			
				return cb();	
			})
		},function(err){
			self.FixTodo();
			if (_.isEmpty(self.ToDo) || (--self.MaxRecursions)<0){
				return done();
			}
			setTimeout(function(){
				self.DoWork(done);
			},0);
		})
	}





	return self;
}



setTimeout(function(){

	var Finres = new FolderModel("fin");


	//console.log(Finres.MInfo["header"].Dependant)
	//return;
	//console.log(Finres.MInfo["docfolder"].Dependant)
	//console.log(Finres.MInfo["doc"].Dependant)

	Finres.DumpCurrent(function(err,Data){
		for (var ModelName in Data){
			console.log(ModelName,":",_.keys(Data[ModelName]).length);
		}
		console.log("SKIPPED:",Finres.Skipped,Finres.MaxRecursions)
	})


//	BasicModel.Install(function(err){
//		console.log("Install complete");
//	})
	/*BasicModel.DumpCurrent(function(err,Data){
		BasicModel.UpdateModels(Data,function(err,Answer){
			console.log("Basic Model Updates Git",err,Answer);
		})
	})
	*/
},1000)





module.exports = BasicModel;