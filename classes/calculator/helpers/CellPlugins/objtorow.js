var _ = require("lodash");
var async = require("async");
var moment = require("moment");

// Похожий на OLAP, только рядами становятся дочерние объекты учета
// Могут выводится в дереве вместе с родителями, если есть IsShowParentObj

 
// Параметры отображения:
// 1. IsObjToRow - Список дочерних объектов
// 2. IsObjToRow + IsShowParentObj - Объект учета с промежуточными результатами + 1.
// 3. IsObjToRow + IsShowObjTree   - Не только объект учета, но и все паренты
// 
// Если строка первичная, то просто заменяется
// Если строка узел, то название заменяется, а потом все чаилды как есть 


 

var TreeHelper = require(__base+'/lib/helpers/tree.js');
var Tree = TreeHelper.Tree;

var ObjToRowStructure = function(Context,Data){
	var self = this;
	self.Context = _.clone(Context);
	self.Data = Data;


	self.FilterByYear = function(Objs){
		var Y = Number(self.Context.Year);
		var Good = [];
		Objs.forEach(function(CodeObj){
			var O = self.Data["Div"][CodeObj];
			if ((!O.DateEnd || Number(moment(O.DateEnd).format("YYYY"))>=Y) && 
				(!O.DateBegin || Number(moment(O.DateBegin).format("YYYY"))<=Y)){
				Good.push(CodeObj);
			}
		})
		return _.sortBy(Good,function(CodeObj){
			return self.Data["Div"][CodeObj].NameObj;
		})
	}

	self.BuildTreeArr = function(){
		var Doc = _.clone(self.Data.Doc);
		Objs = {}; Objs[self.Context.CodeObj] = self.FilterByYear(Doc.AllChildObjs[self.Context.CodeObj]);
		var TreeArr = [], lft = 1;
		if (!Doc.IsShowParentObj){			
			for (var CodeObj in Objs){
				var Chil = Objs[CodeObj];
				Chil.forEach(function(CCode){
					TreeArr.push({CodeRow:CCode,NameRow:self.Data.Div[CCode].NameObj,lft:lft,rgt:(lft+1),level:1});	
					lft +=2;
				})
			}
		} else {
			for (var CodeObj in Objs){
				var Chil = Objs[CodeObj];
				if (Chil && Chil.length){
				TreeArr.push({CodeRow:CodeObj,NameRow:self.Data.Div[CodeObj].NameObj,lft:lft,rgt:lft+(Chil.length+1)*2,level:1});
				lft+=1;
				Chil.forEach(function(CCode){
					TreeArr.push({CodeRow:CCode,NameRow:self.Data.Div[CCode].NameObj,lft:lft,rgt:(lft+1),level:2});
					lft+=2;
				})
				lft+=1;
				}
			}
		}
		return TreeArr;
	}


	self.get = function(done){
		var Rows = 	self.Data.Row, Cols = self.Data.Col, Doc = self.Data.Doc;
		var Objs =  self.BuildTreeArr();
		var Answer = {Header:["Объект учета"],Tree:{},Cells:[]};
 		Objs.forEach(function(O,I){
            Answer.Tree[I] = _.pick(O,['lft','rgt','level']);
        })
        Cols.forEach(function(Col){
        	Answer.Header.push(Col.NameColsetCol);
        })

        console.log(Rows);

        Objs.forEach(function(Obj){
        	var EmptRow = [Obj.NameRow];
        	Rows.forEach(function(Row){	        	
	        	Cols.forEach(function(Col){
		        	var CellName = [
		        		"$"+Row.CodeRow,
		        		"@"+Col.CodeCol,
		        		".P"+Col.ContextPeriod,
		        		".Y"+Col.Year,
		        		"#"+Obj.CodeRow+"?"
		        	].join("");
		            EmptRow.push({
		            	Cell:CellName, 
		            	IsEditablePrimary: !Col.IsFixed && self.Context.IsInput
		            });
	    		})
	    	})
	    	Answer.Cells.push(EmptRow);
        })
        return done(null,Answer);
	}

	


	return self;
}




module.exports = ObjToRowStructure;