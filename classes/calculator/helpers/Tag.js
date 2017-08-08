var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require('./Base.js');



var TagHelper = function(Context){
	
	
	Context = _.clone(Context); 
	Context.PluginName = "TAG";
	var self = this;
	Base.apply(self,Context);
	self.Context = Context;	


	self.get = function(done){
		self.loadFromCache(function(err,Result){
			if (Result && false) {
				return done(null,Result);	
			}			
			self.loadInfo(function(err,Result){
				self.saveToCache(Result,function(err){
					return done(err,Result);	
				});
			})
		})
	}

	self.loadInfo = function(done){
		self.query('tag',{$or:[{IsObjType:true},{IsRow:true},{IsObj:true}]},'-_id CodeTag Link_objtypetag Link_rowtag')
		.populate('Link_rowtag','-_id CodeRow Value')
		.populate('Link_objtypetag','-_id CodeObjType Value')
		.isactive().exec(function(err,Tags){
			var Info = {};
			Tags.forEach(function(T){
				Info[T.CodeTag] = {};
				T.Link_rowtag.forEach(function(LR){
					Info[T.CodeTag][LR.CodeRow] = LR.Value;
				})
				T.Link_objtypetag.forEach(function(LOT){
					Info[T.CodeTag][LOT.CodeObjType] = LOT.Value;
				})
			})
			return done && done(null,Info);
		})
	}

	return self;
}



module.exports = TagHelper;