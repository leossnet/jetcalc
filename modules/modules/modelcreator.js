var async = require('async');
var mongoose = require('mongoose');
var moment = require('moment');
var _ = require('lodash');

var HelpersPath = __base+"classes/jetcalc/Helpers/"; 

var ModelCreator = (new function(){
	var self = this;
		
	self.DocsToDump = function(CodeFolder,done){
		var DocsToDump = [];
		var DocFolder = require(HelpersPath+"DocFolder.js");
		DocFolder.get(function(err,Folders){
			var SubFolders = _.keys(Folders.Tree[Folders.Codes[CodeFolder]]);
			SubFolders.forEach(function(SName){
				DocsToDump = DocsToDump.concat(Folders.Tree[Folders.Codes[CodeFolder]][SName]);
			})
			return done (err,_.map(DocsToDump,"CodeDoc"));
		})
	}

	self.Dump = function(CodeFolder,done){
		var DumpFile = {};
		self.DocsToDump(CodeFolder,function(err,Docs){
			async.each(Docs,function(CodeDoc,cb){
				self.DumpDoc(CodeDoc,function(err,Result){
					DumpFile = _.merge(DumpFile,Result);
					return cb(err);
				})
			},function(err){
				return done(err,DumpFile);
			})
		})
	}

	self.DumpDoc = function(CodeDoc,done){
		console.log("Dumping",CodeDoc);
	}





	return self;
})



module.exports = ModelCreator;