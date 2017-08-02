var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require('./Base.js');



var DocRowHelper = function(Context){
	
	Context = _.clone(Context); 
	Context.PluginName = "DOCROW";
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

	self.loadInfo = function(done){
		var Result = {}, DocsInput = {}, DocRowsGroupped = {};
		mongoose.model("docrow").find({},"-_id CodeRow CodeDoc IsExpandTree").isactive().lean().exec(function(err,DocRows){
			mongoose.model("doc").find({},"-_id CodeDoc IsInput").isactive().lean().exec(function(err,Docs){
				mongoose.model("row").find({CodeParentRow:null},"-_id CodeRow").isactive().lean().exec(function(err,Roots){
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
									cosole.log("Unknown",Rs);
									Result[_.first(Rs).CodeRow] = CodeDoc;	
								}
							}
						} else {
							Result[_.first(Rows).CodeRow] = CodeDoc;
						}
					}
					return done(err,Result);
				})
			})
		})
	}


	// Условия определения главного узла
	// 1.   Документ без IsOlap IsChart IsPresent
	// 2.   IsExpandTree у ссылки true + условие
	// 3.   Документы на корневых объектах учета core.Docs.HasChildObjs=0
	// 3.1  Количество корневых узлов - выбирается документ с наименьшим числом корневых узлов в таблице link.DocRows
	// 3.2  Длина кода документа - выбирается документ с наименьшей длиной кода в поле core.Docs.CodeDoc
	// 4.   Документы на дочерних объектах учета core.Docs.HasChildObjs=1
	// 4.1  Определяется тип или класс объекта учета из контекста 
	// 4.2. В таблице link.DocObjs фильтруется перечень документов, из которых нужный определяется по типу или классу.
	// 4.3. Если все параметры сошлись, но осталось несколько документов, то выбирается документ с более коротким кодом core.Docs.CodeDoc

	self.loadInfoOld = function(done){
		// 1. Загружаем все ссылки DocRow
		var Result = {}, Explain  = {}, ResultByObjs = {};
		var RowDocsRaw = {};
		var DocsInfo   = {}, RowDocInfo = {}, FallBack = {};
		self.query('doc',{},"-_id CodeDoc IsInput IsOlap IsChart IsPresent HasChildObjs Link_docrow Link_docobjtype").populate("Link_docobjtype","-_id CodeObjClass CodeObjType").exec(function(err,Docs){
			var ExcludeDocs = [];
			Docs.forEach(function(Doc){
				if (Doc.IsOlap || Doc.IsPresent || Doc.IsChart){
					ExcludeDocs.push(Doc.CodeDoc);
				} else {
					DocsInfo[Doc.CodeDoc] = _.pick(Doc,["CodeDoc","IsInput","IsOlap","HasChildObjs"]);
					DocsInfo[Doc.CodeDoc].RowLinks = Doc.Link_docrow.length;
					DocsInfo[Doc.CodeDoc].CodeLength = Doc.CodeDoc.length;
					DocsInfo[Doc.CodeDoc].ObjInfo = Doc.Link_docobjtype;
				}
			})
			self.query('docrow',{},"-_id CodeRow CodeDoc IsExpandTree").exec(function(err,DRAs){
				var DRs = [];
				DRAs.forEach(function(DR1){
					if (ExcludeDocs.indexOf(DR1.CodeDoc)==-1){
						DRs.push(DR1);
					} else {
						FallBack[DR1.CodeRow] = DR1.CodeDoc;
					}
				})
				DRs.forEach(function(DR){
					if (!RowDocsRaw[DR.CodeRow]) RowDocsRaw[DR.CodeRow] = [];
					RowDocsRaw[DR.CodeRow].push(DR.CodeDoc);
					if (!RowDocInfo[DR.CodeDoc]) RowDocInfo[DR.CodeDoc] = {};
					RowDocInfo[DR.CodeDoc][DR.CodeRow] = DR.IsExpandTree;
				})				
				var Remain = {};
				for (var CodeRow in RowDocsRaw){
					if (RowDocsRaw[CodeRow].length==1){
						Result[CodeRow] = _.first(RowDocsRaw[CodeRow]);
					} else {
						Remain[CodeRow] = RowDocsRaw[CodeRow];
					}
				}
				for (var CodeRow in Remain){
					var PossibleDocs = Remain[CodeRow];
					var HasChildObjs = false;
					PossibleDocs.forEach(function(PD){
						if (DocsInfo[PD] && DocsInfo[PD].HasChildObjs) HasChildObjs = true;
					})
					if (!HasChildObjs){
						var Infos = []
						PossibleDocs.forEach(function(PD){
							if (DocsInfo[PD]){
								DocsInfo[PD].IsExpandTree = RowDocInfo[PD][CodeRow];
								Infos.push(DocsInfo[PD]);
							}	
						})
						// Количество корневых узлов, длина кода документа
						Infos = Infos.sort(function(a,b){
							if (a.IsExpandTree<b.IsExpandTree) return 1; else
							if (a.IsExpandTree>b.IsExpandTree) return -1; else
							if (a.RowLinks>b.RowLinks) return 1; else
							if (a.RowLinks<b.RowLinks) return -1; else 
							if (a.CodeLength>b.CodeLength) return 1; else
							if (a.CodeLength<b.CodeLength) return -1;
							return 0;
						})
						Explain[CodeRow] = [];
						Infos.forEach(function(In){
							Explain[CodeRow].push(_.pick(In,['CodeDoc','IsExpandTree','RowLinks','CodeLength']));
						})
						if (Infos.length){
							Result[CodeRow] = _.first(Infos).CodeDoc;
						}
					} else {
						var SmallResult = {};
						PossibleDocs.forEach(function(PD){
							if (!SmallResult[CodeRow]) SmallResult[CodeRow] = {Empty:{Empty:[]}};
							if (DocsInfo[PD]) {
								DocsInfo[PD].IsExpandTree = RowDocInfo[PD][CodeRow];
								var ObjInfo = DocsInfo[PD].ObjInfo;						
								if (!ObjInfo.length) SmallResult[CodeRow].Empty.Empty.push(DocsInfo[PD]);
								ObjInfo.forEach(function(OI){
									if(!SmallResult[CodeRow][OI.CodeObjClass]) SmallResult[CodeRow][OI.CodeObjClass] = {};
									if(!SmallResult[CodeRow][OI.CodeObjClass][OI.CodeObjType]) SmallResult[CodeRow][OI.CodeObjClass][OI.CodeObjType] = [];
									SmallResult[CodeRow][OI.CodeObjClass][OI.CodeObjType].push(DocsInfo[PD]);
								})
							}
						})
						for (var CodeRow in SmallResult){
							for (var CodeClass in SmallResult[CodeRow]){
								for (var CodeType in SmallResult[CodeRow][CodeClass]){
									var Docs = SmallResult[CodeRow][CodeClass][CodeType];
									if (Docs.length!=1){
										Explain[CodeRow] = [];
										Docs.forEach(function(In){
											Explain[CodeRow].push(_.merge(
												_.pick(In,['CodeDoc','IsExpandTree','RowLinks','CodeLength','ObjInfo'])
												,{Key:CodeRow+"."+CodeClass+"."+CodeType})
											);
										})
									}
									_.set(ResultByObjs,CodeRow+"."+CodeClass+"."+CodeType,_.first(_.map(Docs,"CodeDoc")));
								}
							}
						}
					}
				}
				var Answer = {
					WithChildObjs:ResultByObjs,
					NoChildObjs:Result,
					FallBack:FallBack
				}
				if (self.Context.IsDebug){
					Answer.Debug = Explain;
				}
				return done && done(null,Answer);
			})
		})
	}

	return self;
}



module.exports = DocRowHelper;