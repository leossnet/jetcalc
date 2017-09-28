var async = require('async');
var mongoose = require('mongoose');
var moment = require('moment');
var _ = require('lodash');
var Base = require(__base + 'classes/jetcalc/Helpers/Base.js');


var DocFolderHelper = (new function(){

	var self = new Base("JDOCFOLDER");

	self.Fields = {
		docfolderdoc:["-_id","CodeDocFolder","CodeDoc"],
		docfolder:["-_id","CodeDocFolder","NameDocFolder","Icon","CodeParentDocFolder","IndexDocFolder"]
	}

	self.SubscribeChanges(_.keys(self.Fields));

	self.get = function(done){
		self.LoadInfo(function(err,INFO){
			var Answ = {Tree:INFO.Tree,Icons:INFO.Icons,Codes:INFO.Codes};
			for (var K1 in Answ.Tree){
				for (var K2 in Answ.Tree[K1]){
					Answ.Tree[K1][K2] = _.map(Answ.Tree[K1][K2],function(CodeDoc){
						return INFO.Doc[CodeDoc];
					})
				}
			}
			return done(err,Answ);
		})
	}

	self.LoadInfo = function(done){
		var DocHelper = require(__base + 'classes/jetcalc/Helpers/Doc.js');
		async.parallel({
			Doc:DocHelper.LoadInfo
		},function(err,INFO){
			self.FromCache(null,function(err,Data){
				if (Data) {
					return done (err,_.merge(INFO,Data));
				}
				self.load(function(err,Data){
					self.ToCache(null,Data,function(err){
						return done(err,_.merge(INFO,Data));
					})
				})
			})
		})
	}

	self.load = function(done){
		var R = {};
		async.each(_.keys(self.Fields),function(ModelName,cb){
			mongoose.model(ModelName).find({},self.Fields[ModelName]).isactive().lean().exec(function(err,Models){
				R[ModelName] = Models;
				return cb(err);
			})
		},function(err){
			if (err) return done(err);
			var _children = function(CodeFolder,Folders){
				return _.map(_.filter(Folders,{CodeParentDocFolder:CodeFolder}),"CodeDocFolder");
			}
			var Docs = {}, Children = {}, DocsInFolder = {}, DocFolders = {}, Icons = {}, RootFolder = "ROOT", Codes = {};
			R.docfolder.forEach(function(F){
				DocFolders[F.CodeDocFolder] = F;
				Codes[F.CodeDocFolder] = F.NameDocFolder;
				Icons[F.NameDocFolder] = F.Icon;
				Children[F.CodeDocFolder] = _children(F.CodeDocFolder,R.docfolder);
			})
			Children[RootFolder] = [];
			R.docfolder.forEach(function(F){
				if (!F.CodeParentDocFolder){
					Children[RootFolder].push(F.CodeDocFolder);
				}
			})
			R.docfolderdoc.forEach(function(Link){
				if (!DocsInFolder[Link.CodeDocFolder]){
					DocsInFolder[Link.CodeDocFolder] = [];
				}
				DocsInFolder[Link.CodeDocFolder].push(Link.CodeDoc);
			})
			var UsedDocFolders = _.keys(DocsInFolder);
			var Structure = {};
			Children[RootFolder].forEach(function(Folder){
				if (Folder!=RootFolder) {
					Structure[Folder] = {};
					if (DocsInFolder[Folder]){ Structure[Folder].Docs = DocsInFolder[Folder];}
					if (Children[Folder]) {
						Children[Folder].forEach(function(CF){
							if (CF!=RootFolder) {
								Structure[Folder][CF] = {};
								if (DocsInFolder[CF]){ Structure[Folder][CF].Docs = DocsInFolder[CF];}
							}
						})
					}
				}
			})
			var UnemptyStructure = {};
			for (var CodeDocFolder in Structure){
				if (_.keys(Structure[CodeDocFolder]).length){
					for (var CodeSubFolder in Structure[CodeDocFolder]){
						if (_.keys(Structure[CodeDocFolder][CodeSubFolder]).length && Structure[CodeDocFolder][CodeSubFolder].Docs){
							var K1 = DocFolders[CodeDocFolder].NameDocFolder;
							var K2 = DocFolders[CodeSubFolder].NameDocFolder;
							if (!UnemptyStructure[K1]) UnemptyStructure[K1] = {};
							UnemptyStructure[K1][K2] = Structure[CodeDocFolder][CodeSubFolder].Docs;
						}
					}
				}
			}
			return done(null,{Tree:UnemptyStructure,Icons:Icons,Codes:Codes});
		})
	}

	return self;
})

	

module.exports = DocFolderHelper;
