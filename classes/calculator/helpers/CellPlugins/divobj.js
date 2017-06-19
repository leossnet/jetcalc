// Все дочерние объекты склеиваются в один документ
// Исходно рядов должно быть мало

var _ = require("lodash");
var async = require("async");
var RowHelper = require(__base+"classes/calculator/helpers/Row.js");

var DivObjStructure = function(Context,Data){

	var self = this;
	self.Context = _.clone(Context);
	self.Data = Data;

	self.LoadRows = function(done){
		var Tasks = {};
		Data.Doc.ChildObjs.forEach(function(CodeObj){
			Tasks[CodeObj] = function(CodeObj){
				return function(cb){
					var Helper = new RowHelper(_.merge(_.clone(self.Context),{CodeObj:CodeObj}));
					Helper.get(cb);
				}
			}(CodeObj)
		})
		async.parallel(Tasks,done);
	}

	self.get = function(done){
		self.LoadRows(function(err,RowsByObjs){
			var Objs = [];
			for (CodeObj in RowsByObjs){
				if (RowsByObjs[CodeObj].length){
					Objs.push(CodeObj);
				}
			}
			var Cols = self.Data.Col;
			var Answer = {Header:['Код','Название'],Tree:{},Cells:[]}
	        Cols.forEach(function(C){
	            Answer.Header.push(C.NameColsetCol);
	        })
	        Objs.forEach(function(CodeObj){
	        	var HeaderRow = [CodeObj,CodeObj];
	        	Cols.forEach(function(Col){
	        		HeaderRow.push("");
	        	})
	        	Answer.Cells.push(HeaderRow);
	        	var Rows = RowsByObjs[CodeObj];
		        Rows.forEach(function(Row){
		            var EmptRow = [Row.NumRow,Row.NameRow];        	
		        	Cols.forEach(function(Col){
		            	var CellName = [
		            		"$"+Row.CodeRow,
		            		"@"+Col.CodeCol,
		            		".P"+Col.ContextPeriod,
		            		".Y"+Col.Year,
		            		"#"+CodeObj+"?"
		            	].join("");
		                EmptRow.push({Cell:CellName});
		            })
		            Answer.Cells.push(EmptRow)            
		        })
	        })
	        return done(null,Answer);
		})
	}

	return self;
}




module.exports = DivObjStructure;