var async = require('async');
var mongoose = require('mongoose');
var moment = require('moment');
var _ = require('lodash');
var Base = require(__base+"modules/modules/basic.js"); 

var ListModel = (new function(name){
	
	var self = new Base(name);
	self.GitName = "jetbase";

	
	self.InstallIFNeeded = function(done){
		mongoose.model("valuta").count(function(err,Counter){
			if (Counter) {
				console.log("Skipping installing List",err);
				return done();
			}
			self.Install(function(err){
				console.log("List is installed",err);
				return done();
			});
		})
	}


	self.Load = function(ModelName,Query,done){
		var M = mongoose.model(ModelName), CFG = M.cfg(), EditFields = ["-_id"].concat(_.filter(CFG.EditFields,function(F){return F.indexOf("Link")!=0;}));
		M.find(Query,EditFields.join(" ")).isactive().lean().exec(done);
	}

	self.LoadModels = function(done){
		var Result = {};
		self.Load("reportperiods",{},function(err,RPeriods){
			var AllPeriods = _.concat(_.map(RPeriods,"CodeReportPeriod"),_.map(RPeriods,"CodePeriod"));
			Result.reportperiods = RPeriods;
			self.Load("period",{CodePeriod:{$in:AllPeriods}},function(err,Periods){
				Result.period = Periods;				
				self.Load("periodgrpref",{CodePeriod:{$in:AllPeriods}},function(err,PRefs){
					var Grps = _.uniq(_.map(PRefs,"CodePeriodGrp"));
					self.Load("periodgrp",{CodePeriodGrp:{$in:Grps}},function(err,Groups){
						Result.periodgrp = Groups;
						async.each(["routecheckperiod","routerefperiod","routeperiod"],function(ModelToLoad,cb){
							self.Load(ModelToLoad,{CodePeriod:{$in:AllPeriods}},function(err,Models){
								Result[ModelToLoad] = Models;
								return cb();
							})						
						},function(err){
							var ObjGrps = _.uniq(_.map(Result.routeperiod,"CodeGrp"));
							var DocTypes = _.uniq(_.map(Result.routeperiod,"CodeDocType"));
							self.Load("doctype",{CodeDocType:{$in:DocTypes}},function(err,DT){
								Result.doctype = DT;
								self.Load("grp",{CodeGrp:{$in:ObjGrps}},function(err,OG){
									Result.grp = OG;
									async.each(["valuta","state","route"],function(ModelName,ccb){
										self.Load(ModelName,{},function(err,VL){
											Result[ModelName] = VL;
											return ccb();
										})								
									},function(err){
										return done(err,Result);
									})
								})
							});						
						})
					})
				})
			})
		})
	}

	self.GitModel = function(done){
		self.GitSettings(function(err,Set){
			self.ask("/repos/"+Set.RepoOwner+"/"+self.GitName+"/contents/Models.json","get",{},done);
		})
	}

	self.GetInfo = function(Type,done){
		self.GitModel(function(err,Data){
			var Models = {};
			try{
				Models = JSON.parse(new Buffer(Data.content, 'base64')+'');
			}catch(e){
				return done(e);
			}
			return done(err,Models);
		})
	}

	self.UpdateGit = function(Type,Content,done){
		self.GitSettings(function(err,Set){
			self.GitModel(function(err,Mod){
				var FileName = Type+".json";
				var url = ['',"repos",Set.RepoOwner,self.GitName,'contents',FileName].join("/");
				self.ask(url,"PUT",{
					message:'Update from server',
					content:new Buffer(JSON.stringify(Content,null, "\t")).toString('base64'),
					sha:Mod.sha,
					path:FileName,
					branch:'master'
				},done)
			})		
		})		
	}

	self.DumpCurrent = function(done){
		self.LoadModels(function(err,Models){
			var ReIndexed = {};
			for (var ModelName in Models){
				var Bundle = Models[ModelName];
				var M = mongoose.model(ModelName), CFG = M.cfg(), Code = CFG.Code;
				ReIndexed[ModelName] = {};
				Bundle.forEach(function(M){
					ReIndexed[ModelName][M[Code]] = M;
				})
			}

			return done(err,ReIndexed);
		})		
	}


	return self;
})

module.exports = ListModel;