var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var f = require('../../../lib/functions.js');
var Base = require('./Base.js');



var SetHelper = function(Context){
	
	Context = _.clone(Context);
	Context.PluginName = "SET";
	var self = this;
	Context.CacheFields = ['CodePeriod','CodeDoc'];
	Base.apply(self,Context);
	self.Context = Context;		




	self.get = function(done){
		async.parallel({
			Defaults:self._getDefault,
			List:self.loadPossibleReports
		},function(err,Loaded){
			var Answer = Loaded.Defaults;
			var DefaultList = {CodeReport:'default',NameReport:'По умолчанию',Params:{}}
			if (Answer){
				Answer.params && Answer.params.forEach(function(P){
					DefaultList.Params[P.CodeParam] = P.DefaultParamSet;
				})
				Answer.List = [DefaultList].concat(Loaded.List);
			}
			return done(err,Answer);
		})		
	}


	self._getDefault = function(done){
		self.loadFromCache(function(err,Result){
			if (Result && false) {
				return done(null,Result);	
			} else {
				self.check (function(err){
					if (err) return done(err);
					self.loadPossibleParams(function(err,Result){
						self.saveToCache(Result,function(err){
							return done(err,Result);	
						});						
					})
				})
			}
		})
	}



	self.loadPossibleReports = function(done){
		var Answer = [], Indexed = {};
		mongoose.model('report').find({CodeDoc:self.Context.CodeDoc},
			"CodeReport IndexReport NameReport IsDefault PrintNameReport PrintDocReport CodeUser IsPublic IsPrivate CodeGrp CodePeriodGrp Link_reportparamkey Link_reportrow")
			.populate('Link_reportparamkey','-_id CodeParam CodeParamSet')
			.populate('Link_reportrow','-_id CodeRow IsShowWithChildren IsShowWithParent IsShowOlap IsToggled IsHidden CodeReport CodeParamSet')
			.sort({IndexReport:1}).lean().isactive().exec(function(err,Rs){
			Rs && Rs.forEach(function(R){
				R.Params = {};
				R.Link_reportparamkey.forEach(function(P){
					R.Params[P.CodeParam] = P.CodeParamSet;
				})
			})
			return done && done(err,Rs);
		})
	}


	self.check = function(done){
		return done();
	}

	self.CodePeriodGrps = [];

	self.getPeriodGrps = function(done){
		self.query('periodgrpref',{CodePeriod:self.Context.CodePeriod},'-_id CodePeriodGrp').exec(function(err,Gs){
			if (err) return done(err);
			self.CodePeriodGrps = _.map(Gs,"CodePeriodGrp").concat(['NONE']);
			return done()
		})
	}


	self.loadPossibleParams = function(done){
		var tabs = {}, grps = {}, params = {}, result = {};
	    self.getPeriodGrps(function(err){
	    	if (err) return done(err);
	        self.query('docparamkey',{CodeDoc:self.Context.CodeDoc,CodePeriodGrp:{$in:self.CodePeriodGrps},IsShow:true},"-_id CodeParam CodeParamSet").exec(function(err,cDs){
	    	  if (err) return done(err);	        	
	          var MAP = f.remap(cDs,'CodeParam','CodeParamSet');
	          var allParams  = _.map (cDs,'CodeParam');
	          var defaultSet = _.map (cDs,'CodeParamSet');
	          allParams.forEach(function(DP){
	              result[DP]  = {NameParam:'',CodeParam:DP, IndexParam:0, NameListDefinition:'', DefaultParamSet:MAP[DP],ParamSets:{}};
	          })  
	          self.query('param',{CodeParam:{$in:allParams}},'-_id CodeParam NameParam CodeListDefinition IndexParam CodeParamGrp CodeParamTab').exec(function(err,cPs){
				if (err) return done(err);
	            var MAP = f.remap(cPs,'CodeParam');
	            for (var i in MAP){
	                var I = MAP[i];
	                result[i].NameParam = I.NameParam;
	                result[i].IndexParam = I.IndexParam;
	                result[i].CodeParamGrp = I.CodeParamGrp;
	                result[i].CodeParamTab = I.CodeParamTab;
	                result[i].CodeListDefinition = I.CodeListDefinition;
	            }
	            var allListDefinitions = _.map(cPs,'CodeListDefinition');
		        self.query('paramset',{CodeListDefinition:{$in:allListDefinitions}},'-_id CodeParamSet SNameParamSet CodeListDefinition').sort({Idx:1}).exec(function(err,cPSs){
				  if (err) return done(err);		        	
		          var MAP = f.remap(cPSs,'CodeListDefinition','CodeParamSet');
		          var NMAP = f.remap(cPSs,'CodeParamSet','SNameParamSet');
		          for (var i in result){
		              var I = result[i];
		              MAP[I.CodeListDefinition].forEach(function(PsP){
		                result[i].ParamSets[PsP] = {
		                    CodeParamSet:PsP,
		                    SNameParamSet:NMAP[PsP],
		                    ParamKeys:{}
		                }
		              })
		          }
		          var allParamSets = _.uniq(_.map(cPSs,'CodeParamSet'));
		          self.query('paramsetkey',{CodeParamSet:{$in:allParamSets}},'-_id CodeParamSet CodeParamKey KeyValue').exec(function(err,cPKs){
					  if (err) return done(err);		          	
		              var MAP = {}; cPKs.forEach(function(cD){if (!MAP[cD.CodeParamSet]) MAP[cD.CodeParamSet] = []; MAP[cD.CodeParamSet].push({Key:cD.CodeParamKey,Value:cD.KeyValue});});
		              for (var i in result){
		                var I = result[i];
		                for (var j in I.ParamSets){
		                  MAP[j] && MAP[j].forEach(function(PsP){
		                      result[i].ParamSets[j].ParamKeys[PsP.Key] = PsP.Value;
		                  })
		                }
		              }
		              self.query('listdefinition',{CodeListDefinition:{$in:allListDefinitions}},'-_id CodeListDefinition SNameListDefinition').exec(function(err,cLds){
						  if (err) return done(err);		              	
		                  var MAP = f.remap(cLds,'CodeListDefinition','SNameListDefinition');
		                  for (var i in result){
		                    result[i].NameListDefinition = MAP[result[i].CodeListDefinition];
		                  }
		                  self.query('paramgrp',{CodeParamGrp:{$in:_.uniq(_.map(_.values(result),"CodeParamGrp"))}},'-_id NameParamGrp CodeParamGrp').exec(function(err,nameGrps){
							if (err) return done(err);		                  	
		                    var MAP = f.remap(nameGrps,'CodeParamGrp','NameParamGrp');
		                    for (var i in result){
		                      result[i].NameParamGrp = MAP[result[i].CodeParamGrp];
		                      result[i] = _.omit(result[i],'CodeParamGrp');
		                    }                            
		                    self.query('paramtab',{CodeParamTab:{$in:_.uniq(_.map(_.values(result),"CodeParamTab"))}},'-_id NameParamTab CodeParamTab').exec(function(err,nameTabs){
							  if (err) return done(err);		                    	
		                      var MAP = f.remap(nameTabs,'CodeParamTab','NameParamTab');
		                      for (var i in result){result[i].NameParamTab = MAP[result[i].CodeParamTab];result[i] = _.omit(result[i],'CodeParamTab');}                            
		                      params = _.values(result);
		                      params.sort(function(a,b){ return a.IndexParam-b.IndexParam;})
		                      params.forEach(function(p){ if (!tabs[p.NameParamTab]) tabs[p.NameParamTab] = [];tabs[p.NameParamTab].push(p.CodeParam);})
		                      params.forEach(function(p){if (!grps[p.NameParamGrp]) grps[p.NameParamGrp] = [];grps[p.NameParamGrp].push(p.CodeParam);})
		                      params.forEach(function(P){if (_.keys(P.ParamSets).indexOf(P.DefaultParamSet)==-1){P.DefaultParamSet = _.first(_.keys(P.ParamSets));}})
		                      return done(null,{
		                      	tabs:tabs,
								grps:grps,
								params:params
		                      });
		                    })
		                 })
		              })
		           })
		        })
	          })
	        })
	    })
	}

	return self;
}		




module.exports = SetHelper;