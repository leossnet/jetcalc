var mongoose   = require('mongoose');
var router     = require('express').Router();
var _          = require('lodash');
var async      = require('async');
var Regexp = require(__base+"classes/calculator/RegExp.js");

var Struct =  (new function(){
	var self = this;

	self.FindInFormula = function(Code,Formula,Codes){
		var Vars = Formula.match(Regexp.Var), Undeleted = {};
		Vars.forEach(function(V){
			var Rows = V.match(Regexp.Row);
			if (!_.isEmpty(Rows)){
				var CodeRow = _.first(Rows).replace("$","");
				if (!_.isEmpty(CodeRow) && Codes.indexOf(Code)==-1 && Codes.indexOf(CodeRow)!=-1){
					Undeleted[Code] = Formula.split(CodeRow).join("<b>"+CodeRow+"</b>");
				}
			}
		})
		return Undeleted;

	}

	self.CheckInFormula = function(Codes,done){
		var Undeleted = {};
		if (_.isEmpty(Codes)) return done(null,Undeleted);		
		mongoose.model("row").find({IsFormula:true},"CodeRow Formula").isactive().lean().exec(function(err,Rows){
			mongoose.model("col").find({IsFormula:true},"CodeCol Formula").isactive().lean().exec(function(err,Cols){
				Rows.forEach(function(R){
					var Bad = self.FindInFormula(R.CodeRow,R.Formula,Codes);
					if (!_.isEmpty(Bad)) Undeleted = _.merge(Undeleted,Bad);
				})
				Cols.forEach(function(C){
					var Bad = self.FindInFormula(C.CodeCol,C.Formula,Codes);
					if (!_.isEmpty(Bad)) Undeleted = _.merge(Undeleted,Bad);
				})
				return done(err,Undeleted);
			})
		})
	}






	self.ReparseRequest = function(AllRows){
		AllRows = AllRows || [];
		var Rows = _.filter(AllRows,function(R){
			return R.DoRemove !='true';
		});
		var DoSortByIndex = true;
		Rows.forEach(function(R){
			if (_.isEmpty(R.IndexRow)) DoSortByIndex = false;
		})
		if (DoSortByIndex && false){
			Rows = Rows.sort(function(a,b){
				if (a.level==b.level && Number(a.IndexRow)>Number(b.IndexRow)) return 1;
	    		if (a.level==b.level && Number(a.IndexRow)<Number(b.IndexRow)) return -1;
				if (a.level!=b.level) return 0;
			})
		}
		var Chunks = {}, Chunk = [], CurrentRoot = null;
		Rows.forEach(function(Row){
			if (Row.level==0) {
				if (CurrentRoot){
					Chunks[CurrentRoot] = Chunk;
					Chunk = [];
				}
				CurrentRoot = Row.CodeRow;
			}
			Chunk.push(Row);
		})
		Chunks[CurrentRoot] = Chunk;		
		return Chunks;
	}

	self.UpdateRoot = function(OldRowsH,NewRows,CodeUser,done){
		var Row = mongoose.model("row");
		Row.find({CodeRow:{$in:_.map(OldRowsH,"CodeRow")}}).isactive().exec(function(err,OldRows){
			var ExistedIndexed = {}; OldRows.forEach(function(Branch){ ExistedIndexed[Branch.CodeRow] = Branch;});
			var Root = _.first(OldRowsH).CodeRow, RootNode = ExistedIndexed[Root];
			RootNode.CodeParentRow = "";
			var ClientIndexed = {}; NewRows.forEach(function(Branch){ ClientIndexed[Branch.CodeRow] = Branch;});
			ClientIndexed[Root].CodeParentRow = "";
			var ToRemoveCodes = _.difference(_.map(OldRows,"CodeRow"),_.map(NewRows,"CodeRow").concat([Root])), 
			ToRemove = _.map(ToRemoveCodes,function(C){ // Удаляем ненужные
				return ExistedIndexed[C];
			});
			var ToAddCodes = _.difference(_.map(NewRows,"CodeRow").concat([Root]),_.map(OldRows,"CodeRow"));
			ToAddCodes.forEach(function(NCode){
				ExistedIndexed[NCode] = new Row(_.merge(ClientIndexed[NCode],{treeroot:RootNode.CodeRow}));
			})
			var Index = 0; 
			var ToUpdate = [], ByParents = {1:RootNode.CodeRow};
			for (var CodeRow in ClientIndexed){
				var R = ExistedIndexed[CodeRow], C = ClientIndexed[CodeRow];
				["NumRow","NameRow","CodeRowLink"].forEach(function(F){
					R[F] = C[F];
				})
				R.level = Number(C.level);
				R.IndexRow = Index; R.treeroot = RootNode.CodeRow;
				Index += 10;
				R.CodeParentRow = ByParents[R.level];
				ByParents[(R.level+1)] = R.CodeRow; // Обновляем парентов и порядок
				if (R.isModified()) ToUpdate.push(R); 
			}	
			ToUpdate.forEach(function(U,I){
				if (U.CodeRow == Root) ToUpdate[I].CodeParentRow = "";
			})
			if (_.isEmpty(ToRemove) && _.isEmpty(ToUpdate)) return done();
			self.CheckInFormula(_.map(ToRemove,"CodeRow"),function(err,Undeleted){
				if (err) return done(err);
				if (!_.isEmpty(Undeleted)){
					var error = ["<div>На удаляемые ряды есть формульные ссылки:</div>"];
					for (var Code in Undeleted){
						error.push(Code+": "+Undeleted[Code]);
					}
					return done(error.join("<br/>"));
				}
				async.each(ToRemove,function(R,cb){
					R.remove(CodeUser,cb);
				},function(err){
					async.each(ToUpdate,function(U,cb){ // Обновляем существующие
						U.save(CodeUser,cb)
					},function(err){
						RootNode.IndexNewTree(CodeUser,done);
					})
				})
			})
		})
	
	}

	self.RemoveRoot = function(CodeRow,CodeDoc,CodeUser,done){

	}

	self.EnsureRootsExisits = function(Codes,CodeDoc,CodeUser,done){
		var Row = mongoose.model("row"), RowLink = mongoose.model("docrow");
		async.each(Codes,function(Code,cb){
			Row.findOne({CodeRow:Code}).isactive().exec(function(err,Root){
				if (!Root) {
					Root = new Row({CodeRow:Code});
				}
				Root.treeroot = Code;
				Root.rowpath = ["/",Code,"/"].join("");
				Root.CodeParentRow = null;
				Root.level = 0;
				Root.save(CodeUser,function(err){
					if (err) return cb(err);
					var Q = {CodeRow:Code,CodeDoc:CodeDoc};
					RowLink.findOne(Q).isactive().exec(function(err,Link){
						if (!Link) {
							Link = new RowLink(_.merge(Q,{IsExpandTree:true}));
							Link.save(CodeUser,cb);
						} else {
							return cb();
						}
					})
				})
			})
		},done);
	}

	return self;
})


module.exports = Struct;
