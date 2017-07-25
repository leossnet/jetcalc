var mongoose   = require('mongoose');
var router     = require('express').Router();
var _          = require('lodash');
var async      = require('async');

module.exports = (new function(){
	var self = this;

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
			var ClientIndexed = {}; NewRows.forEach(function(Branch){ ClientIndexed[Branch.CodeRow] = Branch;});
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
				["NumRow","NameRow"].forEach(function(F){
					R[F] = C[F];
				})
				R.level = Number(C.level);
				R.IndexRow = Index; R.treeroot = RootNode.CodeRow;
				Index += 10;
				R.CodeParentRow = ByParents[R.level];
				ByParents[(R.level+1)] = R.CodeRow; // Обновляем парентов и порядок
				if (R.isModified()) ToUpdate.push(R); 
			}		
			console.log("updating ",ToUpdate.length);
			async.each(ToRemove,function(R,cb){
				R.remove(CodeUser,cb);
			},function(err){
				async.each(ToUpdate,function(U,cb){ // Обновляем существующие
					U.save(CodeUser,cb)
				},function(err){
					console.log("err",err);
					RootNode.IndexNewTree(CodeUser,done);
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
					console.log("ADD ROOT");
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
