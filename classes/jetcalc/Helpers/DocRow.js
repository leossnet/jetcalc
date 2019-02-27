var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require(__base + 'classes/jetcalc/Helpers/Base.js');

// Информация о корневом узле -> какой документ у него главный


var DocRowHelper = (new function(){

	var self = new Base("JDOCROW");

	self.Fields = {
		docrow:["-_id","CodeRow","CodeDoc","IsExpandTree"],
		doc:["-_id","CodeDoc","IsInput"],
		row:["-_id","CodeRow"]
	}

	self.SubscribeChanges(_.keys(self.Fields));

	self.get = function(done){
		self.FromCache(null,function(err,Result){
			if (Result) {
				return done (err,Result);
			}
			self.CreateInfo(function(err,Data){
				self.ToCache(null, Data, function(err){
					return done(err,Data);
				})
			})
		})
	};

	self.CreateInfo = function(done){
		var Result = {}, DocsInput = {}, DocRowsGroupped = {};
		mongoose.model("docrow").find({CodeDoc:{$ne:null}},self.Fields["docrow"].join(" ")).isactive().lean().exec(function(err,DocRows){
			mongoose.model("doc").find({},self.Fields["doc"].join(" ")).isactive().lean().exec(function(err,Docs){
				mongoose.model("row").find({CodeParentRow:null},self.Fields["row"].join(" ")).isactive().lean().exec(function(err,Roots){
					Roots.forEach(function(R){ Result[R.CodeRow] = null; });
					Docs.forEach(function(D){ DocsInput[D.CodeDoc] = D.IsInput;})
					DocRows.forEach(function(Link){
						if (!DocRowsGroupped[Link.CodeDoc]) DocRowsGroupped[Link.CodeDoc] = [];
						DocRowsGroupped[Link.CodeDoc].push(Link);
					})
					for (var CodeDoc in DocRowsGroupped){
						var Rows = DocRowsGroupped[CodeDoc];
						if (Rows.length>1){
							var Rs = _.filter(Rows,{IsExpandTree:true});
							if (Rs.length==1){
								Result[_.first(Rs).CodeRow] = CodeDoc;	
							} else {
								Rs = _.filter(Rs,function(L){
									return DocsInput[L.CodeDoc];
								});
								if (Rs.length==1){
									Result[_.first(Rs).CodeRow] = CodeDoc;	
								} else {
									Result[_.first(Rs).CodeRow] = CodeDoc;	
								}
							}
						} else {
							Result[_.first(Rows).CodeRow] = CodeDoc;
						}
					}
					mongoose.model("row").find({},"-_id CodeRow treeroot").isactive().lean().exec(function(err,Rows){
						Result.Tree = {};
						Rows.forEach(function(R){
							Result.Tree[R.CodeRow] = R.treeroot;
						})
						return done(err,Result);
					})
					
				})
			})
		})
	}


	return self;
})



module.exports = DocRowHelper;
