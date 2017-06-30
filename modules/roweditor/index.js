var MRowEditor = (new function() {
	
	var self = new Module("roweditor");

	self.IsAvailable = function(CodeDoc){
		var Doc = MFolders.FindDocument(CxCtrl.CodeDoc());
		return (!_.isEmpty(Doc.Link_docrow) || Doc.IsObjToRow) && PermChecker.CheckPrivelege("IsRowTuner",CxCtrl.CxPermDoc());
	}

	self.ContextMenu = function(){
        var M = {
        	row_below: {
				name: 'Добавить ряд',
				action:function(act,place){
					var i = place.end.row;
					self.Rows.splice((i+1), 0, {
						CodeRow:self.NewCode(i),
						NameRow:'Новый ряд',
						NumRow:"",
						level:1,
						IsNew:true
    				})
    				self.AskForRender();
				}
        	},
	        hsep15: "---------",
 			remove_row: {
          		name: 'Удалить ряд',
          		disabled: function () {
          			var cx = self.table.getSelected();
          			return !_.isNumber(cx[0]) || !self.Rows[cx[0]].IsNew;
          		}
        	}
        }
        return {
            callback:function (key, options) {
                if (M[key] && M[key].action){
                    setTimeout(M[key].action.bind(null,key, options),0);
                } else {
                    console.log(key, options," <<<<<< ");
                }
            },
            items:M
        }
    }

    self.BeforeShow = function(){
    	self.SubscribeDoc();
    	self.Show();
    }

    self.BeforeHide = function(){
    	self.UnSubscribeDoc();
    	self.Rows = null;
    	if (self.table)  {
    		self.table.destroy();
    		self.table = null;
    	}
    }

    self.CxChange = function(){
    	self.Show();
    }

    self.RootBase = "";
    self.NewCode = function(ind,key,value,oldvalue){
    	var RootCode = "";
    	for (var index = ind; index>=0; index--){
    		if (self.Rows[index] && self.Rows[index].level==0){
    			RootCode = self.Rows[index].CodeRow;
    			break;
    		}
    	}
    	var _toNum = function(Code){
    		var r = 0;
    		try{
    			r = Number(_.last(self.Rows[ind-1].CodeRow.split(RootCode))) || 0;	
    		} catch(e){
    			;
    		}
    		return r;
    	}
		if (key=='NumRow' && RootCode && value) {
			return [RootCode,value].join("");
		} else {
			var postfix = 0;
    		if (self.Rows[ind-1] && self.Rows[ind+1] && self.Rows[ind+1].level){
    			var prev = _toNum(self.Rows[ind-1].CodeRow), post = _toNum(self.Rows[ind+1].CodeRow);
    			postfix =  Math.round((prev+post)/2);
    			console.log("1",ind,postfix,RootCode,self.Rows[ind-1].CodeRow);
    		} else {
    			if ((self.Rows[ind-1] && self.Rows[ind-1].level==0) || !self.Rows[ind-1] || !self.Rows[ind-1].CodeRow){
    				if (self.Rows[ind-1] && self.Rows[ind-1].CodeRow){
						postfix = _toNum(self.Rows[ind-1].CodeRow)+10;
						console.log("2",ind,postfix,RootCode,self.Rows[ind-1].CodeRow);						
    				} else {
    					postfix = 10;	
    					console.log("3",ind,postfix,RootCode);						
    				}    				
    			} else {
    				postfix = _toNum(self.Rows[ind-1].CodeRow)+10;
    				console.log("4",ind,postfix,RootCode,self.Rows[ind-1].CodeRow);
    			} 
    		}
	    	return RootCode+postfix;
		}
    }

	self.LoadRows = function(WithoutCache,done){
		var Context = _.merge(_.pick(CxCtrl.Context(),['CodeObj', 'Year', 'ChildObj','CodeDoc',"IsInput"]),{IsDebug:true,UseCache:WithoutCache ? false:true});
		self.rGet("/rows",Context,function(data){
			data.forEach(function(d){
				d.DoRemove = false; d.IsNew = false;
			})
			self.Rows = data;
			self.GetClassInfo();
			var Doc = MFolders.FindDocument(CxCtrl.CodeDoc());
			var Root = _.first(Doc.Link_docrow);
			if (Root && Root.CodeRow) self.RootBase = Root.CodeRow;
			return done && done()
		})
	}

    self.Changes = ko.observableArray([]);
    self.DiscretChanges = {};
    self.InitialValues  = {};
    self.RowsChanged  = ko.observable(0);
	
	self._change = function(ind,key,value,oldvalue){
    	if (!self.Rows[ind])  {
			self.Rows[ind] = {
				CodeRow:self.NewCode(ind,key,value,oldvalue),
				NameRow:'Новый ряд',
				NumRow:"",
				level:1,
				IsNew:true
    		}
    		self.AskForRender();
    	}
		self.Rows[ind][key] = value;    	
    	var Cr = self.Rows[ind].CodeRow;
    	if (!self.Rows[ind].IsNew){
	    	if (self.InitialValues[Cr] && self.InitialValues[Cr][key]==value && self.DiscretChanges[Cr] && self.DiscretChanges[Cr][key]){
	    		delete self.DiscretChanges[Cr][key];
	    		if (!_.values(self.DiscretChanges[Cr]).length) delete self.DiscretChanges[Cr];
	    	} else {
	    		if (!self.DiscretChanges[Cr]) self.DiscretChanges[Cr] = {};	
	    		if (!self.InitialValues[Cr])  self.InitialValues[Cr] = {};
				if (!self.InitialValues[Cr][key]) self.InitialValues[Cr][key] = oldvalue;
	    		self.DiscretChanges[Cr][key] = value;
	    	}
	    }    	
    	self.RowsChanged(_.keys(self.DiscretChanges).length+_.filter(self.Rows,{IsNew:true}).length);
    }

    self.RenderTimer = null

    self.AskForRender = function(){
    	console.log("ASK");
    	if (self.RenderTimer) clearTimeout(self.RenderTimer);
    	self.RenderTimer = setTimeout(function(){
    		self.RenderTable();
    		self.RenderTimer = null;
    	},200);
    }

  	self.AddChange = function(changes, source){
        switch(source) {
        	case 'edit':
                changes.forEach(function(change){
                	self._change(change[0], change[1], change[3], change[2]);
                })
                break;
            case 'autofill':
            case 'paste':
            case 'undo':
                changes.forEach(function(change){
                	self._change(change[0], change[1], change[3], change[2]);
                })
                break;
            default:
                break;
        }
    }

    self.SelectedRow = ko.observable();

    self.Deselect = function(){
    	self.SelectedRow(null);
    }
    
    self.Select = function(x,y){
    	var meta = self.table.getCellMeta(x,y);
    	if (meta && meta.CodeRow) self.SelectedRow(meta.CodeRow);
    }


	self.SaveChanges = function(){
		if (self.Mode()=="Structure") {
			self.rPut("structure",{
				Context:CxCtrl.CxPermDoc(),
				Rows:_.map(_.filter(self.Rows,function(R){
			 			return !_.isEmpty(R.CodeRow);
					}),function(R){
						return _.pick(R,["level","CodeRow","NumRow","NameRow","DoRemove","IsNew","CodeParentRow","IndexRow"]);
					})
			},function(){
				self.Show();
			})
		} else {
			self.rPut('/rows',{
				Modify: JSON.stringify(self.DiscretChanges),
				Context: CxCtrl.CxPermDoc()
			},function(){
				self.Show();
			})
		}
	}


























	self._types = {
		checkbox      :["IsFormula","IsAfFormula","IsVirtual","IsAgFormula","AsAgFormula","IsAnalytic", "IsControlPoint", "UseProdSumGrps","NoOutput", "NoInput","HasFilteredChild", "NoFiltered","IsRowEditFilter","IsShowMeasure","IsSum", "NoSum", "IsMinus", "IsCalcSum", "NoDoSum","DoRemove"],
		text          :["CodeRow","NameRow","NumRow"],
		numeric       :["FromObsolete", "FromYear","FormulaFromYear", "FormulaFromObsolete"],
		formula       :["AgFormula","AfFormula","Formula"],
		link          :["Link_rowsumgrp", "Link_rowtag", "Link_rowobj"],
		select_table  :["CodeMeasure", "CodeFormat", "CodeStyle", "CodeValuta","CodeGrpEditFilter","CodeProd", "CodeAltOrg", "CodeDogovor", "CodeFilteredAltGrp", "CodeDogovorAkt", "CodeRowLink"],//,"CodeParentRow"
		autocomplete  :[]
	}

	self.ModelsByField = {
		"CodeMeasure":'measure',
        "CodeFormat":'format',
        "CodeProd":'prod',
        "CodeAltOrg":'org',
        "CodeDogovor":'dogovor',
        "CodeFilteredAltGrp":'grp',
        "CodeDogovorAkt":'dogovorakt',
        "CodeGrpEditFilter":'grp',
        "CodeStyle":'style',
        "CodeRowLink":"row",
        "CodeValuta":'valuta',
        "CodeParentRow":'row',
	}

	self.Type = function(FieldName){
		var R = "";
		for (var Key in self._types){
			if (self._types[Key].indexOf(FieldName)!=-1){
				R = Key; break;
			}
		}
		return R;
	}
    
  
    
  
	self.baseConfig = {
        rowHeaders:true,
        colHeaders:true,
        autoRowSize:true,
        minSpareCols: 0,
        currentColClassName: 'currentCol',
        currentRowClassName: 'currentRow',
        fixedRowsTop: 0,
        manualColumnResize: true,
        comments: true,
        afterChange: self.AddChange,
        trimDropdown: false,
        afterDeselect:self.Deselect,
        afterSelectionEnd:self.Select
    };



    self.MinColWidth = 100;
    self.MaxColWidth = 300;

	
	self.Mode.subscribe(function(Value){
		if (self.table){
			self.AskForRender();
			self.FlushChanges();
		}
	})

	self.FlushChanges = function(){
		self.DiscretChanges = {};
		self.InitialValues = {};
		self.RowsChanged(0);
	}



	self.RollBack = function(){
		self.Show();
	}

	self.Rows = [];
	
	self.LabelClasses = {};
	self.GetLabelClass = function(Code){
		if (!self.LabelClasses[Code]){
			self.LabelClasses[Code] = "flat flatBack"+(Math.round(Math.random(20)*19)+1);
		}
		return self.LabelClasses[Code];
	}
	self.GetClassInfo = function(){
		try{
			var Sums = _.uniq(_.map(_.flatten(_.map(self.Rows,"Link_rowsumgrp")),"CodeSumGrp"));
			var Tags = _.uniq(_.map(_.flatten(_.map(self.Rows,"Link_rowtag")),"CodeTag"));
			Sums.forEach(function(Sum,Index){
				if (Index>20) self.LabelClasses[Sum] = "flat flatBack";
				else self.LabelClasses[Sum] = "flat flatBack"+(Index);
			})
			Tags.forEach(function(Tag,Index){
				if (Index>20) self.LabelClasses[Tag] = "flat flatBack";
				else self.LabelClasses[Tag] = "flat flatBack"+(Index);
			})
		} catch(e){
			;
		}
	}


	self.EditorRender = function(instance, td, row, col, prop, value, CellInfo){
		var Type = self.Type(CellInfo.prop);
		$(td).addClass("nowrapped");
		switch(Type){
			case 'checkbox':
				$(td).addClass("checkboxed");			
				Handsontable.renderers.CheckboxRenderer.apply(this, arguments);
			break;
			case 'numeric':
				Handsontable.renderers.NumericRenderer.apply(this, arguments);
				if (value=='0'){
					$(td).empty();				
				}					
			break;			
			case 'select_table':
				if (!value){
					$(td).empty();
				} else {
					var ModelName = self.ModelsByField[prop];
					var Html = Catalogue.GetHtml(ModelName,value);
					$(td).html(Html);
				}
			break;
			case 'link':
				if (value){
					var Html = [];
					switch(CellInfo.prop){
                        case 'Link_rowtag':
                            value.forEach(function(VL){
                                Html.push('<span class="label label-lg '+self.GetLabelClass(VL.CodeTag)+'">' + VL.CodeTag +':'+(VL.Value||'*') +'</span>');
						     })
                            break;
                        case 'Link_rowobj':
                            value.forEach(function(VL){

                                var V = {
                                	CodeObj:VL.CodeObj? Catalogue.GetHtml("obj",VL.CodeObj):"",
                                	CodeGrp:VL.CodeGrp? Catalogue.GetHtml("grp",VL.CodeGrp):"",
                                	CodeObjType:VL.CodeObjType? Catalogue.GetHtml("objtype",VL.CodeObjType):"",
                                }
                                Html.push('<span class="label label-lg flat flatBack1">'+_.compact(_.values(V)).join(":")+'</span>');
						     })
                            break;
                        case 'Link_rowsumgrp':
                             value.forEach(function(VL){
                                Html.push('<span class="label label-lg '+self.GetLabelClass(VL.CodeSumGrp)+'">' + VL.CodeSumGrp + '</span>');
						     })
                            break;
                	}
	     			$(td).html(Html.join(""));                    	
               }
			break;
            case 'autocomplete':
                if(value){
                    $(td).html(value.split('.').slice(1).join('.'));
                }
                else{$(td).html('');}
            break;
			default:
				Handsontable.renderers.TextRenderer.apply(this, arguments);
		}
	}

	self.FilterRender = function(instance, td, row, col, prop, value, CellInfo){
		if (CellInfo.IsRemoved){
			$(td).addClass('removed_by_filter');
			if (CellInfo.RemoveComment.indexOf(prop)!=-1){
				$(td).addClass('guilty_cell');
			}
		} 
	} 

	self.table = null;
    
    self.linkObjectsFields = {
        Link_rowsumgrp :["CodeSumGrp"],
        Link_rowtag :["CodeTag", "Value"],
        Link_rowobj :["CodeObj", "CodeGrp", "CodeObjType"]
    }

	self.Columns = function(){
		var Cols = ["CodeRow","NumRow","NameRow"];
		switch (self.Mode()){
			case "Structure":
				Cols = ['level',"IndexRow"].concat(Cols).concat(["DoRemove","CodeParentRow"]);//
			break;	
			case "MainFields":
				Cols = Cols.concat(["CodeRowLink","CodeMeasure","CodeFormat", "CodeStyle",  "CodeValuta", "IsAnalytic", "IsControlPoint"]);
			break;
			case "Filter":
				Cols = Cols.concat([ "HasFilteredChild", "NoFiltered", "Link_rowobj", "NoOutput", "NoInput", "FromObsolete", "FromYear", "IsRowEditFilter", "CodeGrpEditFilter"]);
			break;
			case "Summ":
				Cols = Cols.concat(["IsSum", "Link_rowsumgrp", "NoSum", "IsMinus", "IsCalcSum", "NoDoSum", "UseProdSumGrps"]);
			break;
			case "Formula":
				Cols = Cols.concat(["Link_rowtag", "IsFormula", "Formula", "FormulaFromYear", "FormulaFromObsolete", "IsAgFormula","AsAgFormula","AgFormula","IsAfFormula","AfFormula","IsVirtual"]);
			break;
			case "Bistran":
				Cols = Cols.concat(["CodeProd", "CodeAltOrg", "CodeDogovor", "CodeFilteredAltGrp", "CodeDogovorArt"]);
			break;
		}
		return Cols;
	}
    

	self.BeforeRemoveRow = function(rowIndex){
		self.Rows.splice(rowIndex, 1);
	}

	self.BeforeCreateRow = function(rowIndex,colIndex,mode){
		return;
		var currentIndex = self.table.getSelected()[0];
		var current = self.Rows[currentIndex];
		var next = self.Rows[currentIndex+1];
		var num = "???";
		if (current && next){
			num = numbro((Number(current.NumRow) + Number(next.NumRow))/2).format("#.##");
		}
		var NewRow = {
			CodeRow:self.NewCode(),
			NameRow:'Новый ряд',
			NumRow:num,
			level:current.level,
			IsNew:true
		}
		self.Rows.splice(rowIndex, 0, NewRow);
		var Data = self.DataForTable();
		self.table.updateSettings(Data);
		self.UpdateTableMeta(Data);
	}


	self.DataForTable = function(){
		var Cols2Show = self.Columns(), TableCells = [];
		self.Rows.forEach(function(R){
			TableCells.push(_.pick(R,Cols2Show))
		})
		var Cols = [];
		Cols2Show.forEach(function(Col){
			var R = {data:Col,type: "text"}
			var T = self.Type(Col);
			if (T=='select') {
				 R.editor = 'select';
				 R.selectOptions = _.map(list.getAll(Col.toLowerCase()),'name');
			}
			if (T=='autocomplete'){
				R.type = 'autocomplete';
				R.strict = false;
				R.model = self.ModelsByField[Col];
				R.source = function(Model){
					return  function (query, callback) {
					Catalogue.SearchModel(Model,query,function(Res){
						return callback(_.map(Res,function(Rt){
							return Rt.id+'.'+Rt.name;
						}));
					});
				}
				}(R.model);
			}
            if (T=='link')   R.editor = 'link';
            if (T=='formula') R.editor = 'formula';
            if (T=='select_table') {
            	R.editor = 'select_table';
				R.model = self.ModelsByField[Col];
            }
			Cols.push(R);
		})
		var Translated = Tr(Cols2Show);
		console.log("TableCells",TableCells.length);
		return {
			data:TableCells,
			headers:[Translated],
			columns:Cols,
		}
	}

	self.Retries = 3;

	self.RenderTable = function(){
		var selector = '.handsontable.single:visible';
		var DomPlace = $(selector)[0];
		if (_.isEmpty($(DomPlace)) && self.Retries>0){
			self.Retries--;
			return setTimeout(self.RenderTable,100);
		}
		var HandsonRenders = new HandsonTableRenders.RenderController();
		var TreeArr = _.sortBy(self.Rows,'lft');		
		var RowsInfo = {};
		var Widths = [100,50,400];
		var params = {
	    	cells:HandsonRenders.UniversalRender,
	        fixedColumnsLeft: 3,
	        cellsParams:{},	 
	        levels:RowsInfo,
	        minSpareRows:(self.Mode()=='Structure') ? 100:0,
	        tree:{
	            data:TreeArr,
	            icon:function(){},
	            colapsed:CxCtrl.Context().CodeDoc+'RowEditor'
	        }
		}		
		if (self.Mode()=="Structure"){
			HandsonRenders.RegisterRender("Lvl",[/[0-9]*?,0$/], self.LvlRenderer);
			HandsonRenders.RegisterRender("Index",[/[0-9]*?,1$/], Handsontable.renderers.TextRenderer);
			HandsonRenders.RegisterRender("Num",[/[0-9]*?,2$/], Handsontable.renderers.TextRenderer);
			HandsonRenders.RegisterRender("Code",[/[0-9]*?,3$/], Handsontable.renderers.TextRenderer);			
			TreeArr.forEach(function(TA){
				if (TA) RowsInfo[TA.CodeRow] = TA.level;
			})			
			HandsonRenders.RegisterRender("RawTree",[/[0-9]*?,4$/], self.RawTree);	
			HandsonRenders.RegisterRender("Remove",[/[0-9]*?,5$/], Handsontable.renderers.CheckboxRenderer);	
			HandsonRenders.RegisterRender("ParentRow",[/[0-9]*?,6$/], HandsonTableRenders.ReadOnlyText);	
			params.manualRowMove = true;
			Widths = [80,40].concat(Widths).concat([100]);
		} else {
			HandsonRenders.RegisterRender("Num",[/[0-9]*?,0$/], HandsonTableRenders.ReadOnlyText);
			HandsonRenders.RegisterRender("Code",[/[0-9]*?,1$/], HandsonTableRenders.ReadOnlyText);
			HandsonRenders.RegisterRender("Tree",[/[0-9]*?,2$/], HandsonTableRenders.TreeRender);	
		}
		HandsonRenders.RegisterRender("Cell",[/[/[0-9]*?,(?![0,1,2]$)[0-9]*/],self.EditorRender);
		if (self.Mode()=='Filter') HandsonRenders.RegisterRender("Filter",[/[0-9]*?,[0-9]*?/],self.FilterRender); 
		if (self.Mode()=="Structure"){
			params.contextMenu =  self.ContextMenu();
			//params.beforeCreateRow = self.BeforeCreateRow;
			//params.beforeRemoveRow = self.BeforeRemoveRow;
		}
		var HandsonConfig = _.merge(_.clone(self.baseConfig),params);

		console.log(HandsonConfig);

		try{
			var Data = self.DataForTable();
			if (!self.table) {
				console.log("Creating new table");
				self.table = new Handsontable(DomPlace, HandsonConfig);

				self.table.updateSettings(Data);
			} else {
				var Update = _.merge(HandsonConfig,Data);
				console.log(Update);
				self.table.updateSettings(Update);	
			}
			
			
	    	new HandsonTableHelper.HeaderGenerator(self.table);
	    	new HandsonTableHelper.WidthFix(self.table,self.MinColWidth,self.MaxColWidth,Widths);
	    	new HandsonTableHelper.DiscretScroll(self.table);
	    	if (self.Mode()!="Structure"){
	    		new HandsonTableHelper.TreeView(self.table);
	    	}
    		self.UpdateTableMeta(Data);
    		self.table.render();
    	} catch(e){
    		console.log("Table not rendered");
    	}
        
	}


	self.UpdateTableMeta = function(Data){
		self.Rows.forEach(function(Row,IndexRow){
    		var Meta = _.pick(Row,["RemoveComment","IsRemoved","CodeRow"]);
    		Meta.Model = "row";
    		Data.columns.forEach(function(Col,IndexCol){
				self.table.setCellMetaObject(IndexRow,IndexCol,Meta);
    		})				
    	}) 
	}


	self.CollapseAllRows = function(){
        var Info = self.table.getSettings().tree;
        var RowCodes = [];
        for (var Index in Info.data){
            var R = Info.data[Index];
            if ((R.rgt-R.lft)>1){
                RowCodes.push(parseInt(Index));
            }
        }
        self.table.collapsedRows(RowCodes);
    }

    self.ExpandAllRows = function(){
        self.table.collapsedRows([]);
    }	

	self.Show = function (WithoutCache,done){
		if (!self.Mode()) return self.InitSetMode("Structure");
		self.LoadRows(WithoutCache,function(){
			self.AskForRender();
			self.FlushChanges();
			return done && done();
		})
	}

	self.LvlRenderer = function(instance, td, row, col, prop, value, CellInfo){
		var V = parseInt(value) || 0, html = "";
		for (var i=0; i<V; i++) html+='<i class="fa fa-icon fa-caret-right"></i>';
		$(td).html(html);
	}

	self.RawTree = function(instance, td, row, col, prop, value, cellProperties){
        Handsontable.renderers.HtmlRenderer.apply(this, arguments);
        var Lvl = parseInt(instance.getData()[row][0]);
        td.className = 'simplecell treeCell';
        switch (Lvl) {
            case 0 : $(td).toggleClass('zeroLevel'); break;
            case 1 : $(td).toggleClass('topLevel'); break;
            case 2 : $(td).toggleClass('subLevel'); break;
            break;
        }
        $(td).css("padding-left", (Lvl-1)*20 + 'px');
        cellProperties.readOnly = false;
    }


	return self;
})

ModuleManager.Modules.RowEditor = window.MRowEditor;



ko.bindingHandlers.treeEdit = {
    init: function(element, valueAccessor, allBindingsAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        $(element).nestable();
    },
    update: function(element, valueAccessor, allBindingsAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        $(element).nestable();
    } 
};



