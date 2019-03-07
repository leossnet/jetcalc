var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require(__base + 'classes/jetcalc/Helpers/Base.js');
var TreeHelper = require(__base+'/lib/helpers/tree.js');
var Tree = TreeHelper.Tree;

var ReportBuilder = (new function(){
	var self = this;
	self.ModFields = ["IsShowWithChildren","IsShowWithParent","IsShowOlap","IsToggled","IsHidden"];

  	self.ReportType = function(Mods){
		if (!_.isEmpty(_.concat(Mods.IsShowOlap,Mods.IsShowWithParent,Mods.IsShowWithChildren))){
			return "SingleView";
		} 
		return "ModifyView";
  	}

	self._children = function(CodeRow,Rows){
	      var Row = _.find(Rows,{CodeRow:CodeRow});
	      Rows = Rows.filter(function(R){
	        return Row.lft<R.lft && Row.rgt > R.rgt;
	      })
	      return _.map(Rows,"CodeRow");
	}
	self._parents = function(CodeRow,Rows){
	      var Row = _.find(Rows,{CodeRow:CodeRow});
	      Rows = Rows.filter(function(R){
	        return Row.lft>R.lft && Row.rgt < R.rgt;
	      })
	      return _.map(Rows,"CodeRow");
	}   

	self.ResultTree = function(Rows,Mods){
		var ResultRows = [];
		if (self.ReportType(Mods)=='ModifyView'){
			var CodesToHide = [];
			Mods.IsHidden.forEach(function(HC){
		  		CodesToHide = CodesToHide.concat([HC]).concat(self._children(HC,Rows));
			})
			Mods.IsToggled.forEach(function(CC){
		  		CodesToHide = CodesToHide.concat(self._children(CC,Rows));
			})
			AllHidden = _.uniq(CodesToHide);
			ResultRows = _.filter(Rows,function(R){
		  		return !_.includes(AllHidden,R.CodeRow);
			})
		} else {
			var Codes = [];
			Mods.IsShowOlap.forEach(function(RS){
			  Codes.push(RS);
			})
			Mods.IsShowWithParent.forEach(function(RP){
			  Codes.push(RP);
			  Codes = Codes.concat(self._parents(RP,Rows));
			})
			Mods.IsShowWithChildren.forEach(function(RC){
			  Codes.push(RC);
			  Codes = Codes.concat(self._children(RC,Rows));
			})
			NewTreeCodes = _.uniq(Codes);
			ResultRows = _.filter(Rows,function(R){
			  return _.includes(NewTreeCodes,R.CodeRow);
			})
		}
		if (_.isEmpty(ResultRows)) {
			return Rows; 
		} else {
			var T = new Tree("ROOT",{});
			ResultRows.forEach(function(R){
			    var Parents  = self._parents(R.CodeRow,ResultRows);
			    T.add (R.CodeRow, R, _.last(Parents) || "ROOT", T.traverseBF);
			})
			var Result = T.getFlat();
			delete T;
			return Result;
		}
	}

	self.BuildRows = function(Cx,Rows,done){
		var SetHelper = require(__base + 'classes/jetcalc/Helpers/Set.js'),
			CodeReport= Cx.CodeReport,
			Override  = Cx.RowFields;
		SetHelper.get(Cx,function(err,SetInfo){
			var Mods = {}, Report = _.find(SetInfo.List,{CodeReport:CodeReport});
			if (!_.isEmpty(Report)){
				Mods = _.pick(Report,self.ModFields);
			}
			if (!_.isEmpty(Override)){
				Mods = 	Override;
			}
			self.ModFields.forEach(function(MF){
				if (!Mods[MF]) Mods[MF] = [];
			})
			var Result = self.ResultTree(Rows,Mods);
			return done(err,Result);
		})
	}

	return self;
})


var RowHelper = (new function(){

	var self = new Base("JROW"); 

	self.Links = ['rowobj','rowsumgrp','rowtag','rowobjgrp','rowcoloption']

	self.FieldsToLoad = {
		row:['NumRow','IndexRow','NameRow','rowpath','FromObsolete','FromYear','CodeFormat',
			"FormulaFromYear", "FormulaFromObsolete","IsRowEditFilter","CodeGrpEditFilter",
			"IsAnalytic","CodeMeasure", "CodeStyle","IsShowMeasure", "NoOutput", "NoInput",
			'IsSum','NoSum','NoDoSum','IsCalcSum','IsFormula','Formula','IsAfFormula','AfFormula','IsVirtual',
			'IsAgFormula','AsAgFormula','AgFormula','UseProdSumGrps',
			'CodeRowLink','IsMinus','IsControlPoint','CodeRow','CodeParentRow','lft','rgt',
			'HasFilteredChild','NoFiltered','Link_rowobj','Link_rowobjgrp','Link_rowsumgrp','Link_rowtag','Link_rowcoloption',
			'CodeValuta','CodeProd','CodeBill','CodeAltOrg','CodeDogovor','CodeFilteredAltGrp','CodeDogovorArt'
		],
		rowobj:['CodeObj','CodeObjType',"CodeObjClass",'CodeGrp','CodeRow'],
		rowobjgrp:['CodeGrp','CodeRow'],
		rowsumgrp:['CodeSumGrp', 'CodeRow'],
		rowtag:['CodeTag','Value','CodeRow'],
		rowcoloption:['CodeCol','IsEditable','IsFixed'],
		docrow:['-_id','CodeRow','IsExpandTree'],
		measure:["-_id","CodeMeasure","SNameMeasure"]
	}

	self.SubscribeChanges(_.keys(self.Fields));

	self.LoadRootsFiltered = function(Cx,done){
		var Context = _.clone(Cx);
		self.ObjInfo(Context,function(err,Result){
			Context.ObjInfo = Result;
			self.LoadRoots(Context.CodeDoc,function(err,Rows){
				return done(err,self.Filter(Context,Rows));
			})
		})
	}
	self.LoadMeasures = function(done){
		mongoose.model("measure").find({},self.FieldsToLoad.measure.join(" ")).isactive().lean().exec(done);
	}

	self.get = function(Cx,done){
		self.LoadRootsFiltered(Cx,function(err,Result){
			var Concated = [];
			for (var CodeRoot in Result){
				Concated = Concated.concat(_.filter(Result[CodeRoot],function(R){
					return !R.IsRemoved;
				}));
			}
			var Roots = _.keys(Result);
			self.ApplyReport(Cx,Concated,function(err,AfterReport){
				var DocHelper = require(__base + 'classes/jetcalc/Helpers/Doc.js');
				DocHelper.get(Cx.CodeDoc,function(err,Doc){
					if (_.isEmpty(Doc)) return done(Cx.CodeDoc+" документ не найден");
					if (!Doc.IsShowRoots){
						AfterReport = _.filter(AfterReport,function(R){
							return !_.includes(Roots,R.CodeRow);
						})
					}
					return done(err,AfterReport);
				})				
			})			
		})
	};

	self.ObjInfo = function(Context,done){
		var DivHelper = require(__base+"/classes/jetcalc/Helpers/Div.js");
		DivHelper.get(function(err,DivInfo){
			var CodeObj = !_.isEmpty(Context.ChildObj) ? Context.ChildObj:Context.CodeObj;
			var Info = DivInfo[CodeObj];
			if (_.isEmpty(Info)) return done (err,[]);
			return done(err,[Info.CodeObj,Info.CodeObjType,Info.CodeObjClass].concat(Info.Groups));
		})
	}

	self.ApplyReport = function(Cx,Rows,done){
		if (Cx.CodeReport && Cx.CodeReport!='default' || !_.isEmpty(Cx.RowFields)){
			ReportBuilder.BuildRows(Cx,Rows,done);
		} else {
			return done(null,Rows);
		}
	}

	self.LoadRoots = function(CodeDoc,done){
		self.FromCache(CodeDoc,function(err,Loaded){
			if (Loaded && false) {
				return done (err,Loaded);	
			}
			var Result = {};
			done = done || function(){
				console.log("no done function");
			}
			mongoose.model("docrow").find({CodeDoc:CodeDoc},"-_id CodeRow IsExpandTree").sort({IndexRow:1}).isactive().lean().exec(function(err,Rows){
				if (err) return done(err);
				if (_.isEmpty(Rows)) return done(null,Result);
				var Roots = _.map(Rows,"CodeRow"); Roots.forEach(function(R){Result[R] = [];});
				async.each(Roots,function(CodeRow,cb){
					self.LoadRoot(CodeRow,function(err,Rows){
						Result[CodeRow] = Rows;
						return cb(err);
					})
				},function(err){
					self.ToCache(CodeDoc, Result, function(err){
						return done(err,Result);
					})
				});
			})
		})
	}

	self.LoadRoot = function(CodeRow,done){
		self.Rows({$or:[{treeroot:CodeRow},{CodeRow:CodeRow}]},{lft:1},done);
	}

	self.Rows = function(Query, Sort, done){
		var Model = mongoose.model("row");
		var Q = Model.find(Query,self.FieldsToLoad["row"].concat(_.map(self.Links,function(linkName){
			return "Link_"+linkName;
		})).join(" ")).sort(Sort);
		self.Links.forEach(function(linkName){
			Q.populate("Link_"+linkName,self.FieldsToLoad[linkName].join(" "));
		})
		Q.lean().isactive().exec(function(err,Rows){
			self.UpdateRowLinks(Rows,function(err,Rows){
				self.LoadMeasures(function(err,MeasuresArr){
					var Measures = {}; MeasuresArr.forEach(function(M){
						Measures[M.CodeMeasure] = M.SNameMeasure;
					})
					return done(err,self.AddParams(Rows,Measures));
				})
			});
		});
	}

	self.UpdateRowLinks = function(Rows,done){
		var LinkRows = _.filter(Rows,function(R){
			return !_.isEmpty(R.CodeRowLink);
		})
		if (_.isEmpty(LinkRows)) return done(null,Rows);
		self.Rows({CodeRow:{$in:_.map(LinkRows,"CodeRowLink")}},{lft:1},function(err,LinkRows){
			var RI = {}; LinkRows.forEach(function(LR){ RI[LR.CodeRow] = LR;});
			Rows.forEach(function(R,I){
				if (!_.isEmpty(R.CodeRowLink)){
					Rows[I].Link2Use = _.pick(RI[R.CodeRowLink],["CodeRow"]);
				}
			})
			return done(null,Rows);
		})
	}

	self.AddParams = function(Rows,Measures){
		var Indexed = {};
		Rows.forEach(function(Row){
			Row.rowpath = Row.rowpath || "";
			Row.Measure = (!_.isEmpty(Row.CodeMeasure)) ? Measures[Row.CodeMeasure]:"";
			Row.level = Math.max((Row.rowpath.split("/").length - 3),0);
			Row.Sums = _.map(Row.Link_rowsumgrp,'CodeSumGrp');
			Row.ColOptions = null;
			Row.Link_rowcoloption.forEach(function(colOption){
				if (!Row.ColOptions){
					Row.ColOptions = {IsEditable:false,IsFixed:false};
				}
				Row.ColOptions.IsEditable = Row.ColOptions.IsEditable || colOption.IsEditable;
				Row.ColOptions.IsFixed = Row.ColOptions.IsFixed || colOption.IsFixed;
			})			
			Row.AllFilter = [];
			Row.Filter = _.compact(_.uniq(
				_.map(Row.Link_rowobj,'CodeObj')
				.concat(
				_.map(Row.Link_rowobj,'CodeGrp')
				.concat(
				_.map(Row.Link_rowobj,'CodeObjClass')
				.concat(
				_.map(Row.Link_rowobj,'CodeObjType')
			)))));
			Row.Tags = _.map(Row.Link_rowtag, function(TI){
				return TI.CodeTag+':'+(_.isEmpty(TI.Value) ? '*':TI.Value);
			})
			Indexed[Row.CodeRow] = Row;
		})
		Rows.forEach(function(Row){
			Row.AllTags = _.uniq(_.flatten(_.concat(_.map(_.filter(Rows,function(RT){
				return RT.lft<=Row.lft && RT.rgt>=Row.lft;
			}),"Tags"))));
		})
		var _summ = function(Row){
			var Summ = {Plus:[],Minus:[],Ignore:[]};
			var Children = [];
			if (!_.isEmpty(Row.Sums)){
				Children = _.filter(Rows,function(R){
					return !_.isEmpty(_.intersection(R.Sums,Row.Sums)) && !R.IsSum;
				})
			} else {
				Children = _.filter(Rows,{CodeParentRow:Row.CodeRow});
			}
			Children.forEach(function(Child){
				if (Child.NoSum) Summ.Ignore.push(Child.CodeRow);
				else if (Child.IsMinus) Summ.Minus.push(Child.CodeRow);
				else Summ.Plus.push(Child.CodeRow);
			})
			return Summ;
		}		
		for (var CodeRow in Indexed){
			var Row = Indexed[CodeRow];
			if (Row.IsSum){
				Row.SummInfo = _summ(Row,Rows);
				Indexed[CodeRow] = Row;
			}
		}
		for (var CodeRow in Indexed){
			var R = Indexed[CodeRow];
			if (!_.isEmpty(R.Filter)){
				var Chs = self._children(CodeRow,Indexed).concat([CodeRow]);
				Chs.forEach(function(C){
					Indexed[C].AllFilter = Indexed[C].AllFilter.concat(R.Filter);
				})
			}
		}
		return _.values(Indexed);
	}

	self._setStatus = function(Row, ForceShow, ForceRemove, Reason){
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

  	self._parents = function (CodeRow,Indexed){ 
   		var N = Indexed[CodeRow]; 
    	return _.map(_.sortBy(_.filter(_.values(Indexed),function(Node){
    		return Node.lft<N.lft && Node.rgt>N.rgt;
    	}),{lft:1}),"CodeRow");
    }

    self._children = function (CodeRow,Indexed){ 
    	var N = Indexed[CodeRow]; 
    	return _.map(_.sortBy(_.filter(_.values(Indexed),function(Node){
    		return Node.lft>N.lft && Node.rgt<N.rgt;
    	}),{lft:1}),"CodeRow");
	}	

	self.Filter = function(Context,RowsIn){
		var Result = {};
		for (var CodeRow in RowsIn){
			var Rows = RowsIn[CodeRow], Indexed = {}, RealResult = [];
			Rows.forEach(function(Row){
				Indexed[Row.CodeRow] = Row;
			})
 			//  NoFiltered = Показываем в любом случае + всех парентов вверх
            for (var CodeR in Indexed){
				var N = Indexed[CodeR];
				if (N.NoFiltered){
					Indexed[CodeR] = self._setStatus(Indexed[CodeR],true,null,"NoFiltered");
					var parents = self._parents(CodeR,Indexed);
					parents && parents.forEach(function(P){
						Indexed[P] = self._setStatus(Indexed[P],true,null,"NoFiltered Parent");
					})
				}
            }		
            // Если есть HasFilteredChild = отрываем всё, что не имеет rowObj ссылок
			for (var CodeR in Indexed){
				var N = Indexed[CodeR];
				if (N.HasFilteredChild){
					var children = self._children (N.CodeRow,Indexed);
					children.forEach(function(C){
						if (!Indexed[C].ForceShow){
							if (_.isEmpty(Indexed[C].AllFilter)){
								Indexed[C] = self._setStatus(Indexed[C],null,1,"HasFilteredChild");// -> No RowObj
							}                     
						}
					})
				}
			}
			// Фильтр по группам
			/* Устарело
			for (var CodeR in Indexed){
				var N = Indexed[CodeR];
				if (N.IsRowEditFilter){
					if (!_.isEmpty(N.CodeGrpEditFilter)){
						if (Context.ObjInfo.indexOf(N.CodeGrpEditFilter)==-1){
							var children = self._children(N.CodeRow,Indexed);
							N = self._setStatus(N,null,8,"CodeGrpEditFilter");
							children.forEach(function(C){
								Indexed[C] = self._setStatus(Indexed[C],null,8,"CodeGrpEditFilter");			
							})
						}
					}
				}
			}	
			*/
			// FromObsolete и FromYear -> отрываем все вместе с чаилдами
			// NoOutput и NoInput -> отрываем все вместе с чаилдами
			for (var CodeR in Indexed){
				var N = Indexed[CodeR];
				var RemoveStatus = [];
				if (N.FromObsolete && Context.Year>=N.FromObsolete) RemoveStatus.push("FromObsolete");
				if (N.FromYear && Context.Year<=N.FromYear) RemoveStatus.push("FromYear");
				if (N.NoInput && Context.IsInput) RemoveStatus.push("NoInput");	
				if (N.NoOutput && !Context.IsInput) RemoveStatus.push("NoOutput");	
				if (RemoveStatus.length){
					RemoveStatus.forEach(function(St){
						N = self._setStatus(N,null,2,St);
						var children = self._children(N.CodeRow,Indexed);
						children.forEach(function(C){
							Indexed[C] = self._setStatus(Indexed[C],null,2,St);			
						})
					})
				}				
			}	
			// Пробегаем по рядам и выносим вердикт
			var result = []; var parents2show = [];
			for (var CodeR in Indexed){
			    var N = Indexed[CodeR];
				if (N.ForceRemove===8){ // Фильтрация по группе
		        	N.IsRemoved = true;
		          	result.push(N);
			    } else if (N.ForceRemove===2){ // Фильтрация по годам или типу формы
		        	N.IsRemoved = true;
		          	result.push(N);
				} else if (N.ForceRemove===1){ // Фильтрация по парентам            	 
					var parents = self._parents(N.CodeRow,Indexed);
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
				} else if (!_.isEmpty(N.AllFilter)){
				    var parents = self._parents(N.CodeRow,Indexed).concat([N.CodeRow]);
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
				    var TestInclude = _.intersection(N.AllFilter,Context.ObjInfo);
				    if (!_.isEmpty(TestInclude) || Verdict){
	                 	if (!_.isEmpty(TestInclude)){
	                 		parents2show = parents2show.concat(self._parents(N.CodeRow,Indexed)).concat([N.CodeRow]);	
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
			Result[CodeRow] = RealResult;
		}
		return Result;
	}

	return self;
})

module.exports = RowHelper;