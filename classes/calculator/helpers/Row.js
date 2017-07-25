var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require('./Base.js');
var Doc = require('./Doc.js');
var Div = require('./Div.js');



var RowHelper = function(Context){
	Context.UseCache = false;
	Context = _.clone(Context);
	Context.PluginName = "ROW";
	var self = this;
	Context.CacheFields = ['CodeObj', 'Year', 'ChildObj','IsInput','CodeDoc'];
	Base.apply(self,Context);
	self.Context = Context;		

	self.CodeObj = self.Context.CodeObj;
	self.IsOlapDocument  = false;
	self.NameOverride = {};
	self.IsShowRoots = false;
	self.RootRows = [];
	self.LoadedRootRows = {};
	self.ObInfo = [];
	self.rows = [];

	self.IsBiztranDoc = false;
	self.Bills = [];


	self.get = function(cb1){
		self.loadFromCache(function(err,Result){
			if (Result && false) {
				var Rows = self.DebugClean(Result);
				cb1(null,Rows);	
			} else {		
				self.compileInfo(function(err,Result){
					if (err) return cb1(err);
					self.saveToCache(Result,function(err){
						var Rows = self.DebugClean(Result);
						cb1(err,Rows);	
					});
				})		
			}
		})
	}	

	self.compileInfo = function(done){
		async.series([
			self.LoadHelpersInfo,
			self.LoadRootRows,
			self.FilterRows,
			self.LoadAditionalInfo,
			self.ApplyProdsCalcSum,
			self.ApplyProdsSumGrps,
			self.OverrideNames,
			self.FormulaToPrimaries,
			self.AllTreeTags,
			self.LoadMeasures,
		],function(err,Result){
			return done(null,self.rows);
		})
	}

	self.DebugClean = function(Result){
		if (!self.Context.IsDebug){
			var CleanResult = [];
			Result.forEach(function(R){
				if (R && !R.IsRemoved) {
					R = _.omit(R,["rowpath","NoOutput","NoInput","CodeValuta","IndexRow","CodeRowLink","HasFilteredChild","CodeFormat","ForceShow","NoFiltered","FromObsolete","FromYear","FormulaFromYear","FormulaFromObsolete","Explain","ForceShow"]);
					R = _.omit(R,['Link_rowsumgrp','Link_rowobj','Link_rowtag']);
					CleanResult.push(R);	
				}
			})
			return CleanResult;
		} else {
			return Result;	
		}
	}

	self.AllTreeTags = function(done){
		var Indexed = {};
		var _allTags = function(CodeRow){
			var Result = [];
			var parents = self.parents(CodeRow,Indexed).concat([CodeRow]);
			parents.forEach(function(P){
				Result = Result.concat(Indexed[P].Tags)
			})
			return _.uniq(Result);
		};
		
		self.rows.forEach(function(R){
			if (R){
				Indexed[R.CodeRow] = R;
			}
		})
		self.rows.forEach(function(R,index){
			if (R) self.rows[index].AllTags = _allTags(R.CodeRow);
		})		
		return done();
	}

	self.LoadMeasures = function(done){
		var Measures = _.compact(_.uniq(_.map(self.rows,"CodeMeasure")));
		self.query("measure",{CodeMeasure:{$in:Measures}},"CodeMeasure SNameMeasure").exec(function(err,MS){
			var Indexed = {};
			MS.forEach(function(M){ Indexed[M.CodeMeasure] = M.SNameMeasure; });
			self.rows.forEach(function(row){
				if (!_.isEmpty(Indexed) && row.CodeMeasure && Indexed[row.CodeMeasure]){
					row.Measure = Indexed[row.CodeMeasure];
				}
			})
			return done();
		})
	}

	self.ApplyProdsCalcSum = function(done){
		var UsedProds = _.uniq(_.map(self.rows,"CodeProd"));
		if (!UsedProds.length) return done();
		self.query('prod',{IsCalcSum:true,CodeProd:{$in:UsedProds}},"-_id CodeProd").exec(function(err,CSP){
			if (CSP.length){
				self.rows.forEach(function(R,Index){
					if (R.CodeProd && CSP.indexOf(R.CodeProd)!=-1){
						self.rows[Index].IsCalcSum = true;
					}
				})
			}
			return done();
		})
	}

	self.FormulaToPrimaries = function(done){
		var Cleared = [];
		self.rows.forEach(function(Row){
			if (Row && Row.IsFormula){
				if (Row.FormulaFromYear && self.Context.Year<Row.FormulaFromYear){
					Row.IsFormula = false;
				}
				if (Row.FormulaFromObsolete && self.Context.Year>=Row.FormulaFromObsolete){
					Row.IsFormula = false;
				}
			}
			Cleared.push(Row);
		})
		self.rows = Cleared;
		return done();
	}

	self.OverrideNames = function(done){
		self.rows.forEach(function(R){
			if (R && self.NameOverride[R.CodeRow]){
				R.OriginalNameRow = R.NameRow;
				R.NameRow = self.NameOverride[R.CodeRow];
			}
		})
		return done();
	}

	self.ApplyProdsSumGrps = function(done){
		var ProdSumGrps = {}, AllSums = [];
		self.rows.forEach(function(R){
			if (R && R.UseProdSumGrps){
				ProdSumGrps[R.CodeRow] = R.Sums;
				AllSums = AllSums.concat(R.Sums);
			}
		})
		AllSums = _.uniq(AllSums);
		if (!AllSums.length) return done();
		self.query('prodsumgrp',{CodeSumGrp:{$in:AllSums}},"-_id CodeProd CodeSumGrp").exec(function(err,Sms){
			var GrProds = {};
			Sms.forEach(function(S){
				if (!GrProds[S.CodeSumGrp]) GrProds[S.CodeSumGrp] =[];
				GrProds[S.CodeSumGrp].push(S.CodeProd);
			})
			self.rows.forEach(function(r,i){
				if (ProdSumGrps[r.CodeRow]){
					var Prods = [];
					ProdSumGrps[r.CodeRow].forEach(function(GName){
						if (GrProds[GName]) {
							Prods = _.uniq(Prods.concat(GrProds[GName]));
						}
					})
					self.rows[i].Prods = Prods;
				}
			})
			return done();
		})
	}

	self.LoadAditionalInfo = function(done){
		var Used = {};
		var Fields = ["Valuta","Measure","Format","Style"];
		self.rows.forEach(function(Row){
			Fields.forEach(function(F){
				var CodeField = "Code"+F;
				if (Row && Row[CodeField]){
					if (!Used[F]) Used[F] = [];
					if (Used[F].indexOf(Row[CodeField])==-1) Used[F].push(Row[CodeField]);
				}
			})
		})
		var Loader = {};
		for (var Key in Used){
			Loader[Key] = function(ModelName,Codes){
				return function(done){
					var CodeField = "Code"+ModelName;
					var SNameField = "SName"+ModelName;
					var model = ModelName.toLowerCase();
					var Q = {}; Q[CodeField] = {$in:Codes};
					var What = ["-_id",CodeField,SNameField].join(" ");
					self.query(model,Q,What).exec(function(err,Objects){
						var Indexed = {};
						Objects && Objects.forEach(function(O){
							Indexed[O[CodeField]] = O[SNameField];
						})
						return done(err,Indexed);
					});
				}
			}(Key,Used[Key]);
		}
		async.parallel(Loader,function(err,Result){
			self.rows.forEach(function(Row,Index){
				Fields.forEach(function(F){
					var CodeField = "Code"+F;
					if (Row && Row[CodeField]){
						Row[F] = Result[F][Row[CodeField]];
					}
				})
			})
			return done(err);
		})
		
	}

	self.FilterRows = function(done){
		// Для OLAP отчетов фильрацию не применяем
		if (self.Context.IsOlap || self.IsOlapDocument || self.IsObjToRow) {
			var Rows = _.flatten(_.values(self.LoadedRows));
			Rows.forEach(function(Row,index){
				Row.lft = index*2+1;
				Row.rgt = Row.lft+1;
				Row.IsLeaf = true;
				Row.level = 1;
			})
			self.rows = Rows;
			return done();
		}
		


		var tasks = {};
		for (var RowKey in self.LoadedRows){
			tasks[RowKey] = function(RowKey){
				return function(cb){
					self.DoApplyFilter(RowKey,cb);
				}
			}(RowKey)
		}
		async.parallel(tasks,function(err,filtered){
			self.rows = _.flatten(_.values(filtered));
			if (!self.IsShowRoots){
				var Exclude = _.keys(self.LoadedRootRows);
				self.rows = _.filter(self.rows,function(o){
					return o && (Exclude.indexOf(o.CodeRow)==-1);
				})
			}
			/*if (self.IsBiztranDoc){
				console.log("BEFORE ",self.rows.length);
		        var childrenWithBills = function(Rows,Row){
		            return _.filter(Rows,function(R){
		                var HasBill = self.Bills.indexOf(R.CodeBill)!=-1;
		                var IsChildren = (R.rgt<Row.rgt && R.lft>Row.lft);
		                return HasBill && IsChildren;
		            })
		        }
		        var parentsRemain = [];
		        var FilterRows = _.filter(self.rows,function(R){
		            var HasChildren = (R.rgt-R.lft)>1;
		            var HasBill = self.Bills.indexOf(R.CodeBill)!=-1;
		            return  HasChildren || HasBill;
		        });
		        self.rows = _.filter(FilterRows,function(R){
		            var HasChildren = (R.rgt-R.lft)>1;
		            return !HasChildren || childrenWithBills(FilterRows,R).length;
		        })
		        console.log("AFTER ",self.rows.length);
    		}*/			
			return done();
		});			
	}

	self.DoApplyFilter = function(Root,done){
		var RootRow = self.LoadedRootRows[Root];
		if (!RootRow) return done("No Row for "+Root);
		var setStatus = function(Row, ForceShow, ForceRemove, Reason){
			if (ForceShow) Row.ForceShow = ForceShow;
			if (ForceRemove) Row.ForceRemove = ForceRemove;
			if (!Row.Explain) Row.Explain = [];
			if (Row.Explain.indexOf(Reason)==-1) Row.Explain.push(Reason);
			if (ForceRemove){
				if (!Row.RemoveComment) Row.RemoveComment = [];
				if (Row.RemoveComment.indexOf(Reason)==-1){
					Row.RemoveComment.push(Reason);
				}
			} 
			if (ForceShow){
				if (Row.RemoveComment) delete Row.RemoveComment;
			}
			return Row;
		}
		// 1. Проверяем HasFilteredChild вверх от корня 
		self._getRows({lft:{$lt:RootRow.lft},rgt:{$gt:RootRow.rgt}},function(err,Rows){
			if (err) return done(err);
			var RootNodesBefore = [], Flag = false;  // Flag = true - если где то выше HasFilteredChild - скорее всего ошибка в прокачке - но мы к этому готовы
			Rows.forEach(function(R){
				RootNodesBefore.unshift(R);
				if (R.HasFilteredChild && !R.NoFiltered){
					R = true;
				}
			})
			var startLevel = RootRow.rowpath.split('/').length-1;
			var Indexed = {}, Nodes = self.LoadedRows[Root];
            Nodes.forEach(function(N){
           	  N.level = N.rowpath.split('/').length-1-startLevel;
           	  N.rowpath =  N.rowpath.replace(RootRow.rowpath,'/'+RootRow.CodeRow+'/');
           	  Indexed[N.CodeRow] = N;
            })
            if (!Indexed[Root].HasFilteredChild && Flag && !Indexed[Root].NoFiltered){
               Indexed[Root].HasFilteredChild = true;
            }
 			//  NoFiltered = Показываем в любом случае + всех парентов вверх
            for (var CodeR in Indexed){
				var N = Indexed[CodeR];
				if (N.NoFiltered){
					Indexed[CodeR] = setStatus(Indexed[CodeR],true,null,"NoFiltered");
					var parents = self.parents(CodeR,Indexed);
					parents && parents.forEach(function(P){
						Indexed[P] = setStatus(Indexed[P],true,null,"NoFiltered Parent");
					})
				}
            }		
            // Если есть HasFilteredChild = отрываем всё, что не имеет rowObj ссылок
			for (var CodeR in Indexed){
				var N = Indexed[CodeR];
				if (N.HasFilteredChild){
					var children = self.children (N.CodeRow,Indexed);
					children.forEach(function(C){
						if (!Indexed[C].ForceShow){
							if (!Indexed[C].Filter.length){
								Indexed[C] = setStatus(Indexed[C],null,1,"HasFilteredChild");// -> No RowObj
							}                     
						}
					})
				}
			}
			// FromObsolete и FromYear -> отрываем все вместе с чаилдами
			// NoOutput и NoInput -> отрываем все вместе с чаилдами
			for (var CodeR in Indexed){
				var N = Indexed[CodeR];
				var RemoveStatus = [];
				if (N.FromObsolete && self.Context.Year>=N.FromObsolete) RemoveStatus.push("FromObsolete");
				if (N.FromYear && self.Context.Year<=N.FromYear) RemoveStatus.push("FromYear");
				if (N.NoInput && self.Context.IsInput) RemoveStatus.push("NoInput");	
				if (N.NoOutput && !self.Context.IsInput) RemoveStatus.push("NoOutput");	
				if (RemoveStatus.length){
					RemoveStatus.forEach(function(St){
						N = setStatus(N,null,2,St);
						var children = self.children(N.CodeRow,Indexed);
						children.forEach(function(C){
							Indexed[C] = setStatus(Indexed[C],null,2,St);			
						})
					})
				}				
			}	
			// Пробегаем по рядам и выносим вердикт
			var result = []; var parents2show = [];
			for (var CodeR in Indexed){
			    var N = Indexed[CodeR];
			    if (N.ForceRemove===2){ // Фильтрация по годам или типу формы
		        	N.IsRemoved = true;
		          	result.push(N);
				} else if (N.ForceRemove===1){ // Фильтрация по парентам            	 
					var parents = self.parents(N.CodeRow,Indexed);
				    var lastSet = false, Verdict = false;
					parents.forEach(function(P){
				    	if (Indexed[P].NoFiltered && !lastSet){
				        	Verdict = true; lastSet = true;
				        }
				        if (Indexed[P].HasFilteredChild && !lastSet){
				        	lastSet = true;
				        }
				    })
					if (Verdict){
				    	N.Error = "HasFilteredChild->NoFiltered->HasFilteredChild"; // Такого быть вроде не должно
				        result.push(N);
				    } else {
				        N.IsRemoved = true;
						result.push(N);
				   	}
				} else if (N.Filter.length){
				    var parents = self.parents(N.CodeRow,Indexed);
				    var lastSet = false, Verdict = false;
				    parents.forEach(function(P){
						if (Indexed[P].NoFiltered && !lastSet){
							Verdict = true; lastSet = true;
						}
						if (Indexed[P].HasFilteredChild && !lastSet){
							lastSet = true;
						}
					})
				    if (!lastSet) Verdict = true;
				    var TestInclude = _.intersection(N.Filter,self.ObInfo);
				    if (TestInclude.length>0 || Verdict){
	                 	if (TestInclude.length>0){
	                 		parents2show = parents2show.concat(self.parents(N.CodeRow,Indexed));	
	                 	}
				        result.push(N);
				    }  else {
                   		N.IsRemoved = true;
                   		if (!N.RemoveComment) N.RemoveComment = [];
                   		N.RemoveComment.push("Link_rowobj");
                   		result.push(N);
					}
				} else {
					result.push(N);
				}
			}
			parents2show = _.uniq(parents2show);
            var codes2stay = _.map(result,'CodeRow').concat(parents2show);
			var RealResult = [];
			for (var CodeR in Indexed){
					var N = Indexed[CodeR];
					if (parents2show.indexOf(CodeR)>=0){
                   		N.IsRemoved = false;
                   		if (!N.Explain) N.Explain = [];
                   		N.Explain.push("Show as parent for not removed row");
					}
					if (codes2stay.indexOf(CodeR)>=0){
						RealResult.push(N);
					}
			}			
			return done(null,RealResult);
		})
	}

	self.LoadRootRows = function(done){
		var Tasks = {}, Remap = {};
		self.RootRows.forEach(function(R,index){
			Remap[R.CodeRow] = {};
			Tasks[R.CodeRow] = function(Row){
				return function(cb){
					if (Row.IsExpandTree && !(self.Context.IsOlap || self.IsOlapDocument) ){
						self.LoadRowTree(Row.CodeRow,cb);	
					} else {
						self.LoadRow(Row.CodeRow,cb);	
					}					
				}
			}(R);
		})
		async.parallel(Tasks,function(err,loader){
			for (var K in loader) Remap[K] = loader[K];
			if (err) return done(err);
			self.LoadedRows = Remap;
			if (!self.LoadedRows) return done("Ошибка при загрузке дерева строк");
			return done();
		})		
	}

	self.IsObjToRow = false;

	self.LoadHelpersInfo = function(done){
		async.parallel([
			function(cb){
				var DocHelper = new Doc(self.Context);
				DocHelper.get(function(err,D){
					if (err) return cb(err);
					if (self.Context.ChildObj){
						self.CodeObj = self.Context.ChildObj;
					}
					if (D && D.IsOlap) self.IsOlapDocument = true;
					if (D && D.IsBiztranDoc) {
						self.IsBiztranDoc = true;
						self.Bills = _.map(D.Link_docbill,"CodeBill")
					}
					if (D.IsObjToRow) self.IsObjToRow = true;
					self.query('docrow',{CodeDoc:self.Context.CodeDoc},'-_id CodeRow IsExpandTree PrintNameRow IndexRow').sort({IndexRow:1}).exec(function(err,RootRows){
						if (!RootRows.length) err = err || "У документа "+self.Context.CodeDoc+" не выбраны ряды [docrow]";
						if (err) return cb(err);
						RootRows.forEach(function(RR){
							if (RR.PrintNameRow && (RR.PrintNameRow+'').length){
								self.NameOverride[RR.CodeRow] = RR.PrintNameRow;
							}
						})
						self.RootRows = RootRows;
						self.IsShowRoots = D.IsShowRoots;
						return cb();
					})
				})
			},	
			function(cb){
				var ObjHelper = new Div(self.Context);
				ObjHelper.get(function(err,Objs){
					var Info  = Objs[self.CodeObj];
					if (Info && Info.CodeObj){
						self.ObInfo = [Info.CodeObj,Info.CodeObjType].concat(Info.Groups);
					} else {
						self.ObInfo =[];
					}
					return cb(err);
				})
			}
		], done);
	}

  	self.parents = function (CodeRow,Indexed){ 
    	var N = Indexed[CodeRow], parents = [], parent = Indexed[N.CodeParentRow], limit = 50; 
    	while (parent && (--limit)>0){
    		parents.push(parent.CodeRow);
    		parent = Indexed[parent.CodeParentRow];
    	}
    	return parents;
    }

    self.children = function (CodeRow,Indexed){ 
    	var N = Indexed[CodeRow], children = []; if ((N.rgt-N.lft)==1) return children;
    	for (var CodeR in Indexed){
    		var Node = Indexed[CodeR];
    		if (Node.lft>N.lft && Node.rgt<N.rgt){
    			children.push(Node.CodeRow);
    		}
    	}
    	return children;
	}	

	self.rowInfo = {
		tree:function(Row){
			var level = 0;
			if (Row.rowpath){
				level = Row.rowpath.split('/').length-1;	
				if (self.IsShowRoots) {
					level++;
				}
			}
	      	Row.level = level;
	      	
		},
		sums:function(Row){
			Row.Sums = _.map(Row.Link_rowsumgrp,'CodeSumGrp');
		},
		filter:function(Row){
			Row.Filter = _.uniq(
				_.map(Row.Link_rowobj,'CodeObj')
				.concat(
				_.map(Row.Link_rowobj,'CodeObjGrp')
				.concat(
				_.map(Row.Link_rowobj,'CodeObjType')
				)));
		},
		tags:function(Row){
			Row.Tags = [];
			Row.Link_rowtag.forEach(function(TI){
				Row.Tags.push(TI.CodeTag+':'+(TI.Value||'1'));
			})
		},
		isLeaf:function(Row){
			Row.IsLeaf = (Row.rgt-Row.lft)===1;
		}		
	}	

	self._setRowInfo = function(Row){
		for (var methodName in self.rowInfo){
			self.rowInfo[methodName](Row);
		}
		return Row;
	}	

	self._getRows = function(query,done){
		var fields = [
			'-_id','NumRow','IndexRow','NameRow','rowpath','FromObsolete','FromYear','CodeFormat',
			"FormulaFromYear", "FormulaFromObsolete","IsRowEditFilter","CodeGrpEditFilter",
			"IsAnalytic","CodeMeasure", "CodeStyle","IsShowMeasure", "NoOutput", "NoInput",
			'IsSum','NoSum','NoDoSum','IsCalcSum','IsFormula','Formula','IsAfFormula','AfFormula','IsVirtual',
			'IsAgFormula','AsAgFormula','AgFormula','UseProdSumGrps',
			'CodeRowLink','IsMinus','IsControlPoint','CodeRow','CodeParentRow','lft','rgt',
			'HasFilteredChild','NoFiltered','Link_rowobj','Link_rowsumgrp','Link_rowtag',
			'CodeValuta','CodeProd','CodeBill','CodeAltOrg','CodeDogovor','CodeFilteredAltGrp','CodeDogovorArt'].join(' ');
		self.query('row',query,fields)
		.sort('lft')
		.populate({
			path:'Link_rowobj',
			select:'-_id CodeObj CodeObjType CodeGrp CodeRow',	
			sort:{CodeObj:1,CodeObjType:1,CodeGrp:1}
		})
		.populate({
			path:'Link_rowsumgrp',
			select:'-_id CodeSumGrp CodeRow', 	
			sort:{CodeSumGrp:1}
		})
		.populate({
			path:'Link_rowtag',
			select:'-_id CodeTag Value CodeRow',	
			sort:{CodeTag:1}
		})
		.isactive()
		.exec(function(err,Rows){
			if (err) return done(err);
			Rows && Rows.forEach(function(Row,index){
				Rows[index] = self._setRowInfo(Row);
			})
			self.UpdateRowLinks(Rows,function(err,Rows){
				return done(err,Rows);
			});
		})
	}

	self.UpdateRowLinks = function(Rows,done){
		var LinkRows = _.filter(Rows,function(R){
			return !_.isEmpty(R.CodeRowLink);
		})
		if (_.isEmpty(LinkRows)) return done(null,Rows);
		self._getRows({CodeRow:{$in:_.map(LinkRows,"CodeRowLink")}},function(err,LinkRows){
			var RI = {}; LinkRows.forEach(function(LR){ RI[LR.CodeRow] = LR;});
			Rows.forEach(function(R,I){
				if (!_.isEmpty(R.CodeRowLink)){
					Rows[I].Link2Use = _.pick(RI[R.CodeRowLink],["CodeRow","NameRow"]);
				}
			})
			return done(null,Rows);
		})
	}


	self.LoadRowTree = function(CodeRow,done){
		self._getRows({CodeRow:CodeRow},function(err,Rows){
			var P = _.first(Rows);
			self.LoadedRootRows[P.CodeRow] = P;
			if (!P) err = 'Ряд '+CodeRow+' не найден';
			if (err) return done(err);
			var result = [P];
			self._getRows({lft:{$gte:P.lft},rgt:{$lte:P.rgt},treeroot:CodeRow},function(err,Rows){
				if (!Rows || !Rows.length) err = 'IsExpandTree:1 на '+P.CodeRow+', но вложенных рядов - нет';
				if (err) return done(err);
				result = result.concat(Rows);
				return done(err,result);
			})
		})		
	}

	self.LoadRow = function(CodeRow,done){
		self._getRows({CodeRow:CodeRow},function(err,Rows){
			var R = _.first(Rows);
			self.LoadedRootRows[R.CodeRow] = R;
			return done(err,[R]);
		})
	}

    // Ненужные
	self.LoadRows = function(CodeRows,done){
		self.query('row',{CodeRow:{$in:CodeRows}},'-_id CodeRow rowpath').exec(function(err,Rows){
			var Result = [];
			Rows.forEach(function(R,Index){
				R.Path = _.compact((R.rowpath+'').split('/'));
				Result.push(_.omit(R,"rowpath"));
			})
			return done(err,Result);
		})
	}		

	// Ненужные
	self.LoadAllFormats = function(done){
		var Answer = {};
		self.query('row',{CodeFormat:{$ne:null}},'CodeRow CodeFormat').exec(function(err,Rows){
			self.query('format',{CodeFormat:{$in:_.uniq(_.map(Rows,"CodeFormat"))}},'CodeFormat FormatValue').exec(function(err,Formats){
				var Mapper = {};
				Formats.forEach(function(F){
					Mapper[F.CodeFormat] = F.FormatValue;
				})
				Rows.forEach(function(R){
					Answer[R.CodeRow] = Mapper[R.CodeFormat];
				})
				return done(err,Answer);
			})
		})
	}
	return self;

	
}

module.exports = RowHelper