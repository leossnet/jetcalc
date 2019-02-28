var async = require('async');
var moment = require('moment');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require(__base + 'classes/jetcalc/Helpers/Base.js');
var TreeHelper = require(__base+'/lib/helpers/tree.js');
var Tree = TreeHelper.Tree;

var StructureHelper = (new function(){

	var self = new Base("STRUCTURE");

	self.LoadInfo = function(Context,done){
		var DivHelper = require(__base+"/classes/jetcalc/Helpers/Div.js");
		var RowHelper = require(__base+"/classes/jetcalc/Helpers/Row.js");
		var ColHelper = require(__base+"/classes/jetcalc/Helpers/Col.js");
		var DocHelper = require(__base+"/classes/jetcalc/Helpers/Doc.js");		
		var Cx = _.clone(Context);
		async.parallel({
			Div:DivHelper.get,
			Col:ColHelper.get.bind(ColHelper,Cx),
			Row:RowHelper.get.bind(RowHelper,Cx),
			Doc:DocHelper.get.bind(DocHelper,Cx.CodeDoc),
			Valuta:self.ValutaInfo
		},done);
	}

	self.ValutaInfo = function(done){
		mongoose.model("valuta").find({},"CodeValuta NameValuta SNameValuta SignValuta").isactive().lean().exec(done);
	}

	self.Plugin = function(Context,INFO){
		var Plugin = Simple;
		if (Context.IsOlap && INFO.Doc.IsOlap){
			Plugin = Olap;
		}
		if (INFO.Doc.HasChildObjs && INFO.Doc.IsObjToRow){
			Plugin = ObjToRow;
		}
		if (Context.IsAgregate){
			Plugin = Agregate;
		}
		return Plugin;
	}	

	self.get = function(Cx,done){
		self.LoadInfo(Cx,function(err,INFO){
			if (err) return done(err);
			INFO.Row.forEach(function(R){
				if (!_.isEmpty(R.Link2Use)){
					R = _.merge(R,R.Link2Use);
				}
			})
			var Plugin = self.Plugin(Cx,INFO);
			Plugin.get(Cx,INFO,function(err,Answer){
				return done(err,Answer);

			});
		})
	}

	self.getCells = function(Cx,done){
		self.get(Cx,function(err,Answer){
			if (err) return done(err);
			var Result = [];
			Answer.Cells.forEach(function(Row){
				Result = Result.concat(Row);
			})
			var Cells = _.filter(Result,_.isObject);
			var CellNames = _.map(Cells,"Cell");
			var CellFormats = {};
			Cells.forEach(function(C){
				if (C.Format) CellFormats[C.Cell] = _.first(C.Format);
			})
			var AllFormats = _.uniq(_.values(CellFormats));
			if (_.isEmpty(AllFormats)){
				return done(err,_.uniq(CellNames),CellFormats,Cells);	
			} else {
				mongoose.model("format").find({CodeFormat:{$in:AllFormats}},"CodeFormat FormatValue").isactive().lean().exec(function(err,Fs){
					var FInd = {}; Fs.forEach(function(F){FInd[F.CodeFormat] = F.FormatValue;})
					for (var CellName in CellFormats){
						CellFormats[CellName] = FInd[CellFormats[CellName]];
					}
					return done(err,_.uniq(CellNames),CellFormats,Cells);	
				})
			}
		})
	}

	self.getAFCells = function(Cx,done){

	}


	return self;

})


var Simple = (new function(){
	var self = this;
	self.Name = "Simple";

	self.get = function(Cx,INFO,done){
		var CodeObj = Cx.CodeObj, Rows = INFO.Row, Cols = INFO.Col, Doc = INFO.Doc,
	    	Valuta = _.find(INFO.Valuta,{CodeValuta:Cx.CodeValuta}),
	    	ValutaSign = "";
	    if (Valuta){
	    	ValutaSign = _.isEmpty(Valuta.SignValuta) ? Valuta.SNameValuta:Valuta.SignValuta;
	    }
	    if (INFO.Doc.HasChildObjs && !_.isEmpty(Cx.ChildObj)){
	    	CodeObj = Cx.ChildObj;
	    }
        var FL = 2;
		var Answer = {Header:['Код','Название'],Tree:{},Cells:[]}
        if (Doc.IsShowMeasure){
            Answer.Header.push('Ед/из'); FL = 3;
        }
        Cols && Cols.forEach(function(C){
            Answer.Header.push(C.NameColsetCol);
        })
 		Rows && Rows.forEach(function(R,I){
            Answer.Tree[I] = _.pick(R,['lft','rgt','level', 'CodeRow']);
        })
        Rows && Rows.forEach(function(Row){
            var EmptRow = [Row.NumRow,Row.NameRow];        	
            if (Doc.IsShowMeasure){
                var M = Row.Measure||"";
                if (M.indexOf("[")!=-1){
                    if (!_.isEmpty(ValutaSign)) M = M.replace(/\[.*?\]/g,ValutaSign);
                    else M = M.replace("[","").replace("]","");                    
                }
                EmptRow.push(M);
            }
        	Cols && Cols.forEach(function(Col){
            	var CellName = [
            		"$",Row.CodeRow,
            		"@",Col.CodeCol,
            		".P",Col.ContextPeriod,
            		".Y",Col.Year,
            		"#",CodeObj,"?"
            	].join("");

            	var setAfFormula = "";
            	if (Col.IsAfFormula && Row.IsAFFormula){
            		setAfFormula = Row.AfFormula;
            	} else if (Col.IsAfFormula && !Col.IsFixed){
            		setAfFormula = Col.AfFormula;
            	} else if (Row.IsAfFormula){
            		setAfFormula = Row.AfFormula;
            	}

                var CellInfo = {
                    Cell:CellName,
                    IsAFFormula:(Col.IsAfFormula && !Col.IsFixed) || Row.IsAfFormula,
                    AfFormula:setAfFormula,
                    IsControlPoint:(Col.IsControlPoint && Row.IsControlPoint),
                    IsPrimary:(!Col.IsFormula && !Row.IsFormula && !Row.IsSum && (Row.rgt-Row.lft)==1),
                    IsSum:Row.IsSum,
                    ColTags:Col.TagsInfo,
                    Style:_.compact([Row.CodeStyle,Col.CodeStyle])
                };
                var Fs =  _.compact([Col.CodeFormat,Row.CodeFormat]);
                if (!_.isEmpty(Fs)){
                    CellInfo.Format = Fs;
                }
                CellInfo.IsEditablePrimary = (CellInfo.IsPrimary && !Col.IsFixed && Cx.IsInput);
                EmptRow.push(CellInfo);
            })
            Answer.Cells.push(EmptRow)            
        })
        return done(null,Answer);
	}
	return self;
})



var Agregate = (new function(){
	var self = this;
	self.Name = "Agregate";

	self.get = function(Cx,INFO,done){
		var CodeObj = "["+Cx.AgregateObjs.join(",")+"]", Rows = INFO.Row, Cols = INFO.Col, Doc = INFO.Doc,
	    	Valuta = _.find(INFO.Valuta,{CodeValuta:Cx.CodeValuta}),
	    	ValutaSign = "";
	    if (Valuta){
	    	ValutaSign = _.isEmpty(Valuta.SignValuta) ? Valuta.SNameValuta:Valuta.SignValuta;
	    }
	    if (INFO.Doc.HasChildObjs && !_.isEmpty(Cx.ChildObj)){
	    	CodeObj = Cx.ChildObj;
	    }
        var FL = 2;
		var Answer = {Header:['Код','Название'],Tree:{},Cells:[]}
        if (Doc.IsShowMeasure){
            Answer.Header.push('Ед/из'); FL = 3;
        }
        Cols && Cols.forEach(function(C){
            Answer.Header.push(C.NameColsetCol);
        })
 		Rows && Rows.forEach(function(R,I){
            Answer.Tree[I] = _.pick(R,['lft','rgt','level', 'CodeRow']);
        })
        Rows && Rows.forEach(function(Row){
            var EmptRow = [Row.NumRow,Row.NameRow];        	
            if (Doc.IsShowMeasure){
                var M = Row.Measure||"";
                if (M.indexOf("[")!=-1){
                    if (!_.isEmpty(ValutaSign)) M = M.replace(/\[.*?\]/g,ValutaSign);
                    else M = M.replace("[","").replace("]","");                    
                }
                EmptRow.push(M);
            }
        	Cols && Cols.forEach(function(Col){
            	var CellName = [
            		"$",Row.CodeRow,
            		"@",Col.CodeCol,
            		".P",Col.ContextPeriod,
            		".Y",Col.Year,
            		"#",CodeObj,"?"
            	].join("");
                var CellInfo = {
                    Cell:CellName,
                    IsAFFormula:(Col.IsAfFormula && !Col.IsFixed),
                    AfFormula:(Col.IsAfFormula && !Col.IsFixed) ? Col.AfFormula:'',
                    IsControlPoint:(Col.IsControlPoint && Row.IsControlPoint),
                    IsPrimary:(!Col.IsFormula && !Row.IsFormula && !Row.IsSum && (Row.rgt-Row.lft)==1),
                    IsSum:Row.IsSum,
                    ColTags:Col.TagsInfo,
                    Style:_.compact([Row.CodeStyle,Col.CodeStyle])
                };
                var Fs =  _.compact([Col.CodeFormat,Row.CodeFormat]);
                if (!_.isEmpty(Fs)){
                    CellInfo.Format = Fs;
                }
                CellInfo.IsEditablePrimary = (CellInfo.IsPrimary && !Col.IsFixed && Cx.IsInput);
                EmptRow.push(CellInfo);
            })
            Answer.Cells.push(EmptRow)            
        })
        return done(null,Answer);
	}
	return self;
})


var Olap = (new function(){
	var self = this;
	self.Name = "Olap";
	
	self.get = function(Cx,INFO,done){
		var Objs = self.ObjTree(INFO,Cx);
		var Rows = INFO.Row, Cols = INFO.Col, colspan = Cols.length;
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

	self.ObjTree = function(Data,Context){		
		var Div = Data.Div, Doc = Data.Doc, AllStyle = Doc.CodeStyleTotal, MinStyle = Doc.CodeStyleSubtotal;
		var GT = Context.GroupType || "CodeCity", Gr = Context.CodeGrp, GN = "Name"+GT.substring(4);
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


var ObjToRow = (new function(){
	var self = this;
	self.Name = "ObjToRow";

	self.get = function(Cx,INFO,done){
		var Rows = 	INFO.Row, Cols = INFO.Col, Doc = INFO.Doc;
		var Objs =  self.BuildTreeArr(Cx,INFO);
		var Answer = {Header:["Объект учета"],Tree:{},Cells:[]};
 		Objs.forEach(function(O,I){
            Answer.Tree[I] = _.pick(O,['lft','rgt','level']);
        })
        Cols.forEach(function(Col){
        	Answer.Header.push(Col.NameColsetCol);
        })
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
		            	IsEditablePrimary: !Col.IsFixed && Cx.IsInput
		            });
	    		})
	    	})
	    	Answer.Cells.push(EmptRow);
        })
        return done(null,Answer);
	}

	self.FilterByYear = function(Cx,INFO,DocObjs){
		var Objs = [];
		for (var Code in DocObjs){
			Objs = Objs.concat(DocObjs[Code])
		}
		var Y = Number(Cx.Year);
		var Good = [];
		Objs.forEach(function(CodeObj){
			var O = INFO.Div[CodeObj];
			if ((!O.DateEnd || Number(moment(O.DateEnd).format("YYYY"))>=Y) && 
				(!O.DateBegin || Number(moment(O.DateBegin).format("YYYY"))<=Y)){
				Good.push(CodeObj);
			}
		})
		return _.sortBy(Good,function(CodeObj){
			return INFO.Div[CodeObj].NameObj;
		})
	}

	self.BuildTreeArr = function(Cx,INFO){
		var Doc = INFO.Doc, Objs = {}; 
		var SubObjs = (!_.isEmpty(Doc.SubObjs[Cx.CodeObj])) ? _.pick(Doc.SubObjs,Cx.CodeObj):Doc.SubObjs;
		for (var Code in SubObjs){
			Objs[Code] = self.FilterByYear(Cx,INFO,SubObjs[Code]);
		}
		var TreeArr = [], lft = 1;
		if (!Doc.IsShowParentObj){			
			for (var CodeObj in Objs){
				var Chil = Objs[CodeObj];
				Chil.forEach(function(CCode){
					TreeArr.push({CodeRow:CCode,NameRow:INFO.Div[CCode].NameObj,lft:lft,rgt:(lft+1),level:1});	
					lft +=2;
				})
			}
		} else {
			for (var CodeObj in Objs){
				var Chil = Objs[CodeObj];
				if (Chil && Chil.length){
					TreeArr.push({CodeRow:CodeObj,NameRow:INFO.Div[CodeObj].NameObj,lft:lft,rgt:lft+(Chil.length+1)*2,level:1});
					lft+=1;
					Chil.forEach(function(CCode){
						TreeArr.push({CodeRow:CCode,NameRow:INFO.Div[CCode].NameObj,lft:lft,rgt:(lft+1),level:2});
						lft+=2;
					})
					lft+=1;
				}
			}
		}
		return TreeArr;
	}

	return self;
})
module.exports = StructureHelper;