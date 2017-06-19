var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require('./Base.js');



var WorkflowHelper = function(Context){
	
	Context = _.clone(Context); 
	Context.PluginName = "WORKFLOW";
	var self = this;
	Context.CacheFields = [];
	Base.apply(self,Context);
	self.Context = Context;	

	self.get = function(done){
		 self.loadFromCache(function(err,Result){
		 	if (Result) {
		 		return done(null,Result);	
		 	}			
			self.loadInfo(function(err,Result){
				self.saveToCache(Result,function(err){
					return done(err,Result);	
				});
			})
		 })
	}

	self.LoadStates = function(done){
		self.query("state",{},"-_id CodeState NameState IsOpened IsClosed IsAgreed IsDefault").exec(done);
	}
	self.LoadRoutes = function(done){
		self.query("route",{},"-_id CodeInitState CodeRoute NameRoute CodeFinalState Link_routecheckperiod Link_routefiletype Link_routeperiod Link_routerefperiod")
		.populate("Link_routecheckperiod","-_id CodeDocType CodeGrp NoGrp RelYear CodePeriod CodeCheckPeriod CodeCheckState") // Проверка состояния зависимых периодов
		.populate("Link_routefiletype","-_id CodeDoc CodeFileType CodePeriod") // Проверка прикрепленных файлов // С группами периодов не работаем
		.populate("Link_routeperiod","-_id CodePeriod CodeDocType CodeGrp NoGrp") // Работаем только в этих периодах для нужных групп
		.populate("Link_routerefperiod","-_id CodePeriod CodeRefPeriod") // Связанные периоды 
		.exec(done);
	}

	self.LoadDocs = function(done){
		self.query("doc",{},"-_id CodeDoc CodeDocType").exec(function(err,Docs){
			var Indexed = {};
			Docs.forEach(function(D){
				if (D.CodeDocType){
					if (!Indexed[D.CodeDocType]) Indexed[D.CodeDocType] = [];
					Indexed[D.CodeDocType].push(D.CodeDoc);
				}
			})
			return done(err,Indexed);
		})
	}

	self.LoadDocPackets = function(done){
		self.query("docpacket",{},"-_id CodeDoc CodePacket").exec(function(err,Info){
			var Indexed = {};
			Info.forEach(function(I){
				if (!Indexed[I.CodePacket]) Indexed[I.CodePacket] = [];
				Indexed[I.CodePacket].push(I.CodeDoc);
			})
			return done(err,Indexed);
		})
	}

	self.LoadGroups = function(Codes,done){
		if (!Codes.length) return done(null,{});
		self.query("objgrp",{CodeGrp:{$in:Codes}},"-_id CodeObj CodeGrp").exec(function(err,Info){
			var R = {};
			Info.forEach(function(I){
				if (!R[I.CodeGrp]) R[I.CodeGrp] = [];
				R[I.CodeGrp].push(I.CodeObj);
			})
			return done(err,R);
		})
	}

	self.loadInfo = function(done){
		async.parallel({
			State:self.LoadStates,
			Route:self.LoadRoutes,
			Doc:self.LoadDocs,
			DocPacket:self.LoadDocPackets
		},function(err,Result){
			var UsedGroups = [];
			Result.Route.forEach(function(Route){
				UsedGroups = _.uniq(UsedGroups.concat(_.uniq(_.compact(_.map([].concat(Route.Link_routecheckperiod).concat(Route.Link_routeperiod),"CodeGrp")))));
			})
			self.LoadGroups(UsedGroups,function(err,Info){
				Result.ObjGrps = Info;
				return done(err,Result);
			})
		})
	}


	
		
	
	return self;
}



module.exports = WorkflowHelper;