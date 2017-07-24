var MColEditor = (new function() {
	
	var self = new Module("coleditor");


	self.Rows    = [];
	self.RawRows = [];

	self.IsAvailable = function(CodeDoc){
		var R = false;
		["IsHeaderTuner","IsColsetTuner","IsColEditor"].forEach(function(P){
			R = R || PermChecker.CheckPrivelege(P,CxCtrl.CxPermDoc())
		})
		return  R;
	}


	self.BuildRows = function(){
		var TreeArr = _.sortBy(self.RawRows,'lft');
		TreeArr = _.filter(TreeArr,function(Branch){
			return Branch.Type != "colsetcol";
		})		
		TreeArr.forEach(function(Branch){
			if (Branch.Type=='col') Branch.level--;
		})	

		self.Rows = TreeArr;
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
    	console.log(changes, source);
        switch(source){
            case 'edit':
                changes.forEach(function(change){
                    self.Rows[change[0]][change[1]] = change[3];
                    var existFlag = false;
                    for(var i = 0; i < changes.length; i++){
                        if(changes[i].CodeRow === self.Rows[change[0]].CodeRow){
                            changes[i] = self.Rows[change[0]];
                            existFlag = true;
                            break;
                        }
                    }
                    if(!existFlag){
                        self.Changes.push(self.Rows[change[0]]);
                    }
                })
                break;
            default:
                break;
        }
    }

	self.baseConfig = {
        rowHeaders:true,
        colHeaders:true,
        autoRowSize:true,
        minSpareRows: 0,
        minSpareCols: 0,
        currentColClassName: 'currentCol',
        currentRowClassName: 'currentRow',
        manualColumnResize: true,
        afterColumnResize:function(colIndex,width){
        	var current = self.FixedCols();
        	current[colIndex] = width;
        	self.FixedCols(current);
        },
        fixedRowsTop: 0,
        comments: true,
        afterChange: self.AddChange
    };


    self.MinColWidth = 100;
    self.MaxColWidth = 400;


	self.Error = ko.observable(null);

	self.Mode = ko.observable("Filter");
	
	self.Mode.subscribe(function(Value){
		if (self.table) self.RenderTable();
	})

	self.SaveChanges = function(){
		alert("Saving...");
	}

	self.RollBack = function(){
		alert("RollBack...");	
	}

	

	self.LoadRows = function(done){
		self.Error(null);
		var Context = _.pick(CxCtrl.Context(),['Year', 'CodePeriod','IsInput','CodeDoc','CodeObj','ChildObj']);
		Context.IsInput = CxCtrl.IsInput();
		$.getJSON(self.base+"/cols",Context,function(data){
			if(data.err){
				self.Error(data.err);
			}
			self.RawRows = data;
			self.BuildRows();
			self.GetClassInfo();
			return done()
		})
	}

	self._types = {
		condition:["Condition"],
		numeric  :["IndexHeader","IndexColsetCol",'Year'],
		formula  :["InitialFormula","Formula","AfFormula","AgFormula"],
		links    :["Link_coltag",'Link_colsetcolgrp','Link_colsetcolperiodgrp'],
		select   :["CodePeriodGrp","CodePeriod","CodeStyle"],
		checkbox :['IsInput',"IsFixed","IsControlPoint","IsFormula","IsAfFormula","IsAgFormula","AsAgFormula"],			
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

	self.FilterRender = function(instance, td, row, col, prop, value, CellInfo){
		if (CellInfo.IsRemoved){
			$(td).addClass('removed_by_filter');
			if (CellInfo.RemoveComment.indexOf(prop)!=-1){
				$(td).addClass('guilty_cell');
			}
		} 
	}

	self.UndefinedColRender = function(instance, td, row, col, prop, value, CellInfo){
		if (CellInfo.CodeCol=='UNDEFINED'){
			$(td).addClass('error_cell_highlight');
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
			case 'links':
				var Html = [];
				if (CellInfo.prop=='Link_colsetcolperiodgrp' && value){
					value.forEach(function(VL){
						Html.push('<span class="label label-lg '+self.GetLabelClass(VL.CodePeriodGrp)+'">'+Catalogue.GetHtml('periodgrp',VL.CodePeriodGrp)+'</span>');
					})		
				} else if (CellInfo.prop=='Link_colsetcolgrp' && value){
					value.forEach(function(VL){
						var AddSign = "";
						if (VL.NotInGrp){
							AddSign = "&nbsp;-&nbsp;";
						}
						Html.push('<span class="label label-lg '+self.GetLabelClass(VL.CodeGrp)+'">'+AddSign+VL.CodeGrp+'</span>');
					})		
				} else if (CellInfo.prop=='Link_coltag' && value){
					value.forEach(function(VL){
						Html.push('<span class="label label-lg '+self.GetLabelClass(VL.CodeTag)+'">'+VL.CodeTag+":"+(VL.Value||'*')+'</span>');
					})
				}
				$(td).html(Html.join(""));
			break; 
			default:
				Handsontable.renderers.TextRenderer.apply(this, arguments);
		}
	}


	self.table = null;

	self.Columns = function(){
		var Cols = ["CodeCol","ShowName"];			
		switch (self.Mode()){
			case "MainFields":
				Cols = Cols.concat(["InitialName","ContextPeriod","Year","InitialPeriod","InitialYear","CodeStyle","IsFixed","IsControlPoint","IndexHeader","IndexColsetCol"]);
			break;
			case "Filter":
				Cols = Cols.concat(["Condition","CodePeriodGrp",'IsInput','Link_colsetcolgrp','Link_colsetcolperiodgrp']);
			break;
			case "Formula":
				Cols = Cols.concat(["IsFormula","InitialFormula","Link_coltag","IsAfFormula","AfFormula","IsAgFormula","AsAgFormula","AgFormula"]);
			break;
		}
		return Cols;
	}

	self.DataForTable = function(){
		var Cols2Show = self.Columns(), TableCells = [];
		self.Rows.forEach(function(R){
			TableCells.push(_.pick(R,Cols2Show))
		})
		var Cols = [];
		Cols2Show.forEach(function(Col){
			var R = {data:Col,type: "text"}
			if (self.Type(Col)=='select') {
				 R.editor = 'select';
				 //R.selectOptions = _.map(list.getAll(Col.toLowerCase().replace('code','')),'name');
			}
            if (self.Type(Col)=='links') R.editor = 'link';
            if (self.Type(Col)=='formula') R.editor = 'formula';
            if (self.Type(Col)=='condition') R.editor = 'condition';
			Cols.push(R);
		})
		var Translated = Tr(Cols2Show);
		return {
			data:TableCells,
			headers:[Translated],
			columns:Cols,
		}
	}


	self.LabelClasses = {};
	self.GetLabelClass = function(Code){
		if (!self.LabelClasses[Code]){
			self.LabelClasses[Code] = "flat flatBack"+(Math.round(Math.random(20)*19)+1);
		}
		return self.LabelClasses[Code];
	}
	self.GetClassInfo = function(){
		try{
			var Sums = _.uniq(
				_.map(_.flatten(_.map(self.Rows,"Link_colsetcolgrp")),"CodeGrp").concat(
					_.map(_.flatten(_.map(self.Rows,"Link_colsetcolperiodgrp")),"CodePeriodGrp")
				)
			);
			var Tags = _.uniq(_.map(_.flatten(_.map(self.Rows,"Link_coltag")),"CodeTag"));
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

	self.FixedCols = ko.observableArray([80,400], {persist: 'coleditor'});

	self.Retries = 3;
	self.RenderTable = function(){
		var selector = '.handsontable.single:visible';
		var DomPlace = $(selector)[0];
		if (_.isEmpty($(DomPlace)) && self.Retries>0){
			self.Retries--;
			return setTimeout(self.RenderTable,100);
		}		
		self.Retries = 3;
		$(selector).empty();
		if (self.table){
            self.table.destroy();
        }
		var DomPlace = $(selector)[0];
		var HandsonRenders = new HandsonTableRenders.RenderController();
		HandsonRenders.RegisterRender("Code",[/[0-9]*?,0$/], HandsonTableRenders.ReadOnlyText);
		HandsonRenders.RegisterRender("Tree",[/[0-9]*?,1$/], HandsonTableRenders.TreeRender);
		HandsonRenders.RegisterRender("Cell",[/[/[0-9]*?,(?![0,1]$)[0-9]*/],self.EditorRender);
		if (self.Mode()=='Filter') HandsonRenders.RegisterRender("Filter",[/[0-9]*?,[0-9]*?/],self.FilterRender);
		if (self.Mode()=='MainFields') HandsonRenders.RegisterRender("Error",[/[0-9]*?,[0-9]*?/],self.UndefinedColRender);			
		var HandsonConfig = _.merge(self.baseConfig,{
		    	cells:HandsonRenders.UniversalRender,
		        fixedColumnsLeft: 2,
		        cellsParams:{},
		        tree:{
		            data:self.Rows,
		            icon:function(){},
		            colapsed:CxCtrl.Context().CodeDoc+'_coleditor'
		        }
		});		
		self.table = new Handsontable(DomPlace, HandsonConfig);
		var Data = self.DataForTable();
		self.table.updateSettings(Data);
    	new HandsonTableHelper.HeaderGenerator(self.table);
    	new HandsonTableHelper.WidthFix(self.table,self.MinColWidth,self.MaxColWidth,self.FixedCols());
    	new HandsonTableHelper.DiscretScroll(self.table);
    	new HandsonTableHelper.TreeView(self.table);
    	self.Rows.forEach(function(Row,IndexRow){
    		var Meta = _.pick(Row,["RemoveComment","IsRemoved","CodeCol"]);
    		Meta.Model = "col";
    		Data.columns.forEach(function(Col,IndexCol){
				self.table.setCellMetaObject(IndexRow,IndexCol,Meta);
    		})				
    	})
	    setTimeout(self.table.render,0);
	}

	self.ContextChange = function(){
		self.Init();
	}

	self.Show = function (){
		self.IsLoading(true);
		self.LoadRows(function(){
			self.RenderTable();
			self.IsLoading(false);
		})
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

	return self;
})

ModuleManager.Modules.ColEditor = MColEditor;
