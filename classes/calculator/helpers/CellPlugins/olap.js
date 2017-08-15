// Ряды - вверху вторым заголовком Объекты учета - слева 

var _ = require("lodash");
var async = require("async");
var TreeHelper = require(__base+'/lib/helpers/tree.js');
var Tree = TreeHelper.Tree;


var OlapHelper = (new function(){
	var self = this;

	self.ObjTree = function(Data,Context){
		var Div = Data.Div, Doc = Data.Doc, AllStyle = Doc.CodeStyleTotal, MinStyle = Doc.CodeStyleSubtotal;
		var GT = Context.GroupType, Gr = Context.CodeGrp, GN = "Name"+GT.substring(4);
		var Objs = _.filter(Div,function(o){
			return o.Groups.indexOf(Gr)!=-1 ;
		})
		var Objs2Show = _.map(Objs,function(O){
			return _.pick(O,["CodeObj","NameObj","CodeDiv","NameDiv","CodeOtrasl","CodeCity","CodeRegion","NameOtrasl","NameCity","NameRegion"]);
		});
		var Roots = {};
		Objs2Show.forEach(function(O){
			if (!Roots[O[GT]]){
				Roots[O[GT]] = {Code:O[GT],Name:O[GN],Objects:_.filter(Objs2Show,function(S){
					return S[GT] == O[GT];
				})};
				var Codes = _.map(Roots[O[GT]].Objects,"CodeObj");
				if (Codes.length>1){
					Codes = "["+Codes.join(",")+"]";
				} 
				Roots[O[GT]].Code += ":"+Codes;
				Roots[O[GT]].Style = _.compact([MinStyle]);
			}
		})
		Roots = [{
			Code: 'ALL:['+_.map(Objs2Show,"CodeObj").join(",")+']',
    		Name: 'ВСЕГО',
    		Objects:[],
    		Style:_.compact([AllStyle])
		}].concat(_.values(Roots));

		var T = new Tree("ROOT",{});
		Roots.forEach(function(R){
			T.add(R.Code,{CodeRow:R.Code,NameRow:R.Name,Style:R.Style},"ROOT",T.traverseBF);
			R.Objects.forEach(function(O){
				T.add(O.CodeObj,{CodeRow:O.CodeObj,NameRow:O.NameObj},R.Code,T.traverseBF);
			})
		})
		return _.map(T.getFlat(),function(Ob){
			return _.omit(Ob,["code","parent"]);
		});
	}

	return self;
})
  

var OlapStructure = function(Context,Data){
	var self = this;
	self.Context = _.clone(Context);
	self.Data = Data;

	self.get = function(done){		
		var Objs = OlapHelper.ObjTree(Data,Context);
		var Rows = self.Data.Row, Cols = self.Data.Col, colspan = Cols.length;
		var Answer = {Header:[[{label:"",colspan:1}],["Объект учета"]],Tree:{},Cells:[]};
		Rows.forEach(function(R,I){
			Answer.Header[0].push({label:R.NameRow,colspan:colspan});
	        Cols.forEach(function(C){
	            Answer.Header[1].push(C.NameColsetCol);
	        })
		})
 		Objs.forEach(function(O,I){
            Answer.Tree[I] = _.pick(O,['lft','rgt','level']);
        })
		Objs.forEach(function(Obj){
			var EmptRow = [Obj.NameRow];
			var CodeObj = _.last(Obj.CodeRow.split(":"));
		    Rows.forEach(function(Row){		  
		    	Cols.forEach(function(Col){
		        	var CellName = [
		        		"$"+Row.CodeRow,
		        		"@"+Col.CodeCol,
		        		".P"+Col.ContextPeriod,
		        		".Y"+Col.Year,
		        		"#"+CodeObj+"?"
		        	].join("");
		            EmptRow.push({Cell:CellName,Style:Obj.Style});
		        })
		    })
		    Answer.Cells.push(EmptRow);
		})
        return done(null,Answer);
	}

	return self;
}



module.exports = OlapStructure;

