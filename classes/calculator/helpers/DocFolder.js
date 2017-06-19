var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require('./Base.js');
var Obj = require('./Div.js');



var DocFolderHelper = function(Context){
	
	Context = _.clone(Context); 
	Context.PluginName = "DOCFOLDER";
	var self = this;
	Context.CacheFields = [];
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

	self.Docs = function(done){
		self.query('doc',{}, "-_id CodeDoc CodeDocType PrintNameDoc PrintNumDoc NameDoc IsShowMeasure IsTester IsChart IsPresent IsInput IsOlap IsDesigner IsDivObj IsObjToRow IsShowParentObj CodeGrp HasChildObjs Link_docobjtype Link_docrow IndexDoc CodeRole")
		.sort({IndexDoc:1})
		.populate('Link_docobjtype','-_id CodeObjClass CodeObjType')
		.populate({
			path: 'Link_docrow',
			match: {IsExpandTree:true},
			select: '-_id CodeRow',
		})
		.isactive()
		.exec(function(err,Ds){
			console.log("ALL DOCS",_.filter(Ds,{CodeDoc:'nalog'}));
			return done (err,Ds);
		})
	}

	self.DocFolderDocs = function(done){
		self.query('docfolderdoc',{}, "-_id CodeDocFolder CodeDoc").exec(function(err,Ds){
			return done (err,Ds);
		})
	}

	self.DocFolders = function(done){
		self.query('docfolder',{}, "-_id CodeDocFolder NameDocFolder Icon CodeParentDocFolder IndexDocFolder").sort({IndexDocFolder:1}).exec(function(err,Ds){
			return done (err,Ds);
		})
	}

	self.ObjHelper = function(done){
		var ObjHelper = new Obj(self.Context);
		ObjHelper.get(function(err,D){
			return done(null,D);
		})
	}

	self.loadInfo = function(done){
		var Docs = {}, Children = {}, DocsInFolder = {}, DocFolders = {}, Icons = {}, RootFolder = "ROOT";
		async.parallel({
			Docs:self.Docs,
			DocFolders:self.DocFolders,
			Links:self.DocFolderDocs,
			Objs:self.ObjHelper
		},function(err,Result){
			Result.Docs.forEach(function(D){
				Docs[D.CodeDoc] = D;
			})
			var _children = function(CodeFolder,Folders){
				var Result = [];
				Folders.forEach(function(F){
					if (F.CodeParentDocFolder==CodeFolder){
						Result.push(F.CodeDocFolder);
					}
				})
				return Result;
			}
			Result.DocFolders.forEach(function(F){
				DocFolders[F.CodeDocFolder] = F;
				Icons[F.NameDocFolder] = F.Icon;
				Children[F.CodeDocFolder] = _children(F.CodeDocFolder,Result.DocFolders);
			})
			Children[RootFolder] = [];
			Result.DocFolders.forEach(function(F){
				if (!F.CodeParentDocFolder){
					Children[RootFolder].push(F.CodeDocFolder);
				}
			})
			Result.Links.forEach(function(Link){
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
			var _docobjtypelinks = function(Objs,Links){
				var Indexer = {};
				for (var CodeObj in Objs){
					if (Objs[CodeObj].AllChildren.length>1){
						var subR = [];
						Objs[CodeObj].AllChildren.forEach(function(sOCode){
							var Children = Objs[sOCode];
							Links.forEach(function(Q){
								if ((!Q.CodeObjType || Children.CodeObjType==Q.CodeObjType) 
								&&  (!Q.CodeObjClass || Children.CodeObjClass==Q.CodeObjClass)){
									subR.push(sOCode);
								}
							})
						})
						if (subR.length){
							Indexer[CodeObj] = subR;
						}
					}
				}
				return Indexer;
			}
			for (var CodeDoc in Docs){
				if (Docs[CodeDoc].HasChildObjs){
					Docs[CodeDoc].SubObjs = _docobjtypelinks(Result.Objs, Docs[CodeDoc].Link_docobjtype);
				}
				Docs[CodeDoc] = _.omit(Docs[CodeDoc],"Link_docobjtype");				
			}
			var UnemptyStructure = {};
			for (var CodeDocFolder in Structure){
				if (_.keys(Structure[CodeDocFolder]).length){
					for (var CodeSubFolder in Structure[CodeDocFolder]){
						if (_.keys(Structure[CodeDocFolder][CodeSubFolder]).length && Structure[CodeDocFolder][CodeSubFolder].Docs){
							var K1 = DocFolders[CodeDocFolder].NameDocFolder;
							var K2 = DocFolders[CodeSubFolder].NameDocFolder;
							if (!UnemptyStructure[K1]) UnemptyStructure[K1] = {};
							if (!UnemptyStructure[K1][K2]) UnemptyStructure[K1][K2] = [];
							Structure[CodeDocFolder][CodeSubFolder].Docs.forEach(function(CodeDoc){
								UnemptyStructure[K1][K2].push(Docs[CodeDoc]);
							})
						}
					}
				}
			}
			for (var Key1 in UnemptyStructure){
				for (var Key2 in UnemptyStructure[Key1]){
					UnemptyStructure[Key1][Key2] = _.sortBy(UnemptyStructure[Key1][Key2],"IndexDoc");
				}
			}
			console.log({Tree:UnemptyStructure,Icons:Icons});
			return done(null,{Tree:UnemptyStructure,Icons:Icons});			
		})
		
	}

	return self;
}



module.exports = DocFolderHelper;