var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');



var Helper = (new function(){
	var self = this;

	self.Links = ['rowobj','rowsumgrp','rowtag']

	self.FieldsToLoad = {
		row:['NumRow','IndexRow','NameRow','rowpath','FromObsolete','FromYear','CodeFormat',
			"FormulaFromYear", "FormulaFromObsolete","IsRowEditFilter","CodeGrpEditFilter",
			"IsAnalytic","CodeMeasure", "CodeStyle","IsShowMeasure", "NoOutput", "NoInput",
			'IsSum','NoSum','NoDoSum','IsCalcSum','IsFormula','Formula','IsAfFormula','AfFormula','IsVirtual',
			'IsAgFormula','AsAgFormula','AgFormula','UseProdSumGrps',
			'CodeRowLink','IsMinus','IsControlPoint','CodeRow','CodeParentRow','lft','rgt',
			'HasFilteredChild','NoFiltered','Link_rowobj','Link_rowsumgrp','Link_rowtag',
			'CodeValuta','CodeProd','CodeBill','CodeAltOrg','CodeDogovor','CodeFilteredAltGrp','CodeDogovorArt'
		],
		rowobj:['CodeObj','CodeObjType','CodeGrp','CodeRow'],
		rowsumgrp:['CodeSumGrp', 'CodeRow'],
		rowtag:['CodeTag','Value','CodeRow']
	}

	self.LoadRootsFiltered = function(Cx,done){
		var Context = _.clone(Cx);
		self.DocInfo(Context.CodeDoc,function(err,Doc){
			self.ObjInfo(Context,function(err,Result){
				Context.ObjInfo = Result;
				self.LoadRoots(Doc,Context,function(err,Rows){
					return done(err,self.Filter(Context,Rows));
				})
			})
		})
	}

	self.DocInfo = function(CodeDoc,done){
		mongoose.model("doc").findOne({CodeDoc:CodeDoc}).isactive().lean().exec(done);
	}

	self.ObjInfo = function(Context,done){
		var DivHelper = require(__base+"/classes/jetcalc/Helpers/Div.js");
		DivHelper.get(function(err,DivInfo){
			var CodeObj = !_.isEmpty(Context.ChildObj) ? Context.ChildObj:Context.CodeObj;
			var Info = DivInfo[CodeObj];
			if (_.isEmpty(Info)) return done (err,[]);
			return done(err,[Info.CodeObj,Info.CodeObjType].concat(Info.Groups));
		})
	}

	self.LoadRoots = function(Doc,Cx,done){
		var Result = {};
		var CodeDoc = Doc.CodeDoc;
		done = done || function(){
			console.log("no done function");
		}
		mongoose.model("docrow").find({CodeDoc:CodeDoc,IsExpandTree:true},"-_id CodeRow CodeBiztranObj IsExpandTree").sort({IndexRow:1}).isactive().lean().exec(function(err,Rows){
			if (err) return done(err);
			if (_.isEmpty(Rows)) return done(null,Result);
			/*if (Doc.IsBiztranDoc){
				Rows = _.filter(Rows,{CodeBiztranObj:Cx.CodeObj});
			}*/
			var Roots = _.map(Rows,"CodeRow"); Roots.forEach(function(R){Result[R] = [];});
			async.each(Roots,function(CodeRow,cb){
				self.LoadRoot(CodeRow,function(err,Rows){
					Result[CodeRow] = Rows;
					return cb(err);
				})
			},function(err){
				return done(err,Result);
			});
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
			return done(err,self.AddParams(Rows));
		});
	}

	self.AddParams = function(Rows){
		var Indexed = {};
		Rows.forEach(function(Row){
			Row.rowpath = Row.rowpath || "";
			Row.level = Math.max((Row.rowpath.split("/").length - 3),0);
			Row.Sums = _.map(Row.Link_rowsumgrp,'CodeSumGrp');
			Row.AllFilter = [];
			Row.Filter = _.compact(_.uniq(
				_.map(Row.Link_rowobj,'CodeObj')
				.concat(
				_.map(Row.Link_rowobj,'CodeGrp')
				.concat(
				_.map(Row.Link_rowobj,'CodeObjType')
			))));
			Row.Tags = _.map(Row.Link_rowtag, function(TI){
				return TI.CodeTag+':'+(_.isEmpty(TI.Value) ? '*':TI.Value);
			})
			Indexed[Row.CodeRow] = Row;
		})
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
			    if (N.ForceRemove===2){ // Фильтрация по годам или типу формы
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

module.exports = Helper;