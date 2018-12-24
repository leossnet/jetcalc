var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require(__base + 'classes/jetcalc/Helpers/Base.js');

var TagHelper = (new function(){

	var self = new Base("JTAG");

	self.Fields = {
		tag:["-_id","CodeTag","NameTag","SNameTag"],
		objtypetag:["-_id","CodeTag","CodeObjType","Value"],
		rowtag:["-_id","CodeRow","CodeTag","Value"],
		objtag:["-_id","CodeObj","CodeTag","Value"],
		doctag:["-_id","CodeDoc","CodeTag","Value"],
		colsetcoltag:["-_id","CodeColsetCol","CodeTag","Value"],
		coltag:["-_id","CodeCol","CodeTag","Value"]
	}

	self.Links = {objtypetag:"CodeObjType",rowtag:"CodeRow",objtag:"CodeObj",doctag:"CodeDoc",coltag:"CodeCol",colsetcoltag:"CodeColsetCol"};

	self.SubscribeChanges(_.keys(self.Fields));

	self.get = function(done){
		self.FromCache(null,function(err,Result){
			if (Result ) {
				return done (err,Result);
			}
			self.CreateInfo(function(err,Data){
				self.ToCache(null, Data, function(err){
					return done(err,Data);
				})
			})
		})
	};


	self.ColsetColToCols = function(records,done){
		if (_.isEmpty(records)) return done(null,[]);
		mongoose.model("colsetcol").find({CodeColsetCol:{$in:_.map(records,"CodeColsetCol")}}).lean().exec(function(err,Links){
			var answer = [];
			Links.forEach(function(col){
				answer.push(_.merge({CodeCol:col.CodeCol},_.find(records,{CodeColsetCol:col.CodeColsetCol})))
			})	
			return done(err,answer);
		})
	}

	self.CreateInfo = function(done){
		var Info = {};
		async.each(_.keys(self.Fields),function(F,cb){
			mongoose.model(F).find({},self.Fields[F].join(" ")).isactive().lean().exec(function(err,Models){
				Info[F] = Models;
				return cb(err);
			})
		},function(err){
			self.ColsetColToCols(Info.colsetcoltag,function(err,ToCols){
				Info.coltag = Info.coltag.concat(ToCols);
				var Linked = _.keys(self.Links);
				var Result = {};
				Info.tag.forEach(function(T){
					Result[T.CodeTag] = T;
					Linked.forEach(function(link){
						var LinkModels = _.filter(Info[link],{CodeTag:T.CodeTag});
						Result[T.CodeTag][link] = {};
						LinkModels.forEach(function(L){
							Result[T.CodeTag][link][L[self.Links[link]]] = L.Value;
						})					
					})
				})
				return done(err,Result)			
			})
		})
	}

	return self;
})



module.exports = TagHelper;