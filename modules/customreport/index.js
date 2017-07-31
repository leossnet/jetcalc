var MCustomReport = (new function() {
	
	var self = this;

	self.base = '/api/modules/customreport';

	self.table        = null;
	self.previewTable = null;

	self.Rows = [];
	self.Cols = [];

	self.ContextChange = function(){
		self.Init();
	}

	self.IsAvailable = function(CodeDoc){
		return true;
	}

    self.IsOlap = function(){
    	var Doc = null;
    	if (CxCtrl.CodeDoc()) {
				Doc = MFolders.FindDocument(CxCtrl.CodeDoc());
    	}
    	return Doc && Doc.IsOlap; 
    }

    self.EditFields = function(){
    	var Base = ['CodeReport','IndexReport','NameReport','PrintNameReport','PrintDocReport'];
    	if (PermChecker.CheckPrivelege("IsCustomReportPublicTuner",CxCtrl.CxPermDoc())){
    		Base = Base.concat(['IsPublic','IsDefault','IsPrivate','CodeGrp','CodePeriodGrp']);
    	}
    	return Base;
    }

	self.IsHidden = [];
	self.IsToggled = [];

	self.IsShowOlap = [];
	self.IsShowWithParent = [];
	self.IsShowWithChildren = [];		

	self.ModFields = ["IsHidden","IsToggled","IsShowOlap","IsShowWithParent","IsShowWithChildren"];

	self.ReportType = function(){
		if (_.sum([self.IsShowOlap.length,self.IsShowWithParent.length,self.IsShowWithChildren.length]) || self.IsOlap()){
			return "SingleView";
		} 
		return "ModifyView";
	}

	self.NewReport = function(){
		self.CurrentReport('default');
		self.DoLoadReport();

	}

	self.CurrentReport = ko.observable(null);

	self.LoadError = ko.observable(null);
	self.IsLoadReportsShow = ko.observable(false);
	self.ReportLoadTree = {};

	self.ReportTreeDataSource = function(options, callback){
		var Answ  = {};
		if(!("text" in options) && !("type" in options)){
			return callback({ data: self.ReportLoadTree });
		} else if("type" in options && options.type == "folder") {
			var Answ = options.additionalParameters.children;
		}
		callback({ data: Answ });
	}

	self.PrepareTree = function(){
		var all = SettingController.Reports(), CodeUser = MSite.Me().CodeUser();
		var _reparse = function(i){ return {code:i.CodeReport,text:i.NameReport, type: 'item'};}
		var Filter = {
			personal :_.map(_.filter(all,{CodeUser:CodeUser}),_reparse),
			public   :_.map(_.filter(all,{IsPublic:true}),_reparse),
			private  :_.map(_.filter(all,{IsPrivate:true}),_reparse),
		};
		var tree_data = {};
		for (var Code in Filter){
			if (Filter[Code].length){
				tree_data[Code] = {code:Code, text: Tr('customreport',Code), type: 'folder', additionalParameters:{children:Filter[Code]}};
			}
		}
		var additional = {};
		var grps = _.compact(_.map(all,"CodeGrp"));
		if (grps.length){
			additional.forgroups = {code:'forgroups', text: 'Для предприятий', type: 'folder', additionalParameters:{children:[]}};
			var ByGroups = {};
			grps.forEach(function(CodeGroup){
				ByGroups[CodeGroup] = _.map(_.filter(all,{CodeGrp:CodeGroup}),_reparse);
			})
			grps.forEach(function(CodeGroup){
				tree_data['forgroups'].additionalParameters["children"].push({code:CodeGroup, text: CodeGroup, type: 'folder', additionalParameters:{children:ByGroups[CodeGroup]}});
			})
		}
	    additional.default = {code:'default', text: 'По умолчанию', type: 'item'};
		tree_data = _.merge(tree_data,additional);
		self.ReportLoadTree = tree_data;
	}
	
	self.LoadReport = function(){
		self.PrepareTree();
		self.IsLoadReportsShow(true);
		$("#loadreport_modal").modal("show");
		$("#loadreport_modal").on("hide.bs.modal", function(e) {
			self.IsLoadReportsShow(false);
        })	
	}

	self.DoLoadReport = function(){
		var Report = _.find(SettingController.Reports(),{CodeReport:self.CurrentReport()});
		self.ModFields.forEach(function(Field){
			if (Report.code=='default'){
				self[Field] = [];
			} else {
				var F = {}; F[Field] = true;
				self[Field] = _.map(_.filter(Report.Link_reportrow,F),"CodeRow");
			}
		})
		var ReMerge = {}; var Null = {};
		self.ModFields.forEach(function(Set){ Null[Set] = false;})
		self.ModFields.forEach(function(Field){
			self[Field].forEach(function(CodeRow){
				if (!ReMerge[CodeRow]){
					ReMerge[CodeRow] = _.clone(Null);
				}
				ReMerge[CodeRow][Field] = true;
			})
		})
		self.Rows.forEach(function(R,I){
			if (ReMerge[R.CodeRow]){
				self.Rows[I] = _.merge(self.Rows[I],ReMerge[R.CodeRow]);
			} else {
				self.Rows[I] = _.merge(self.Rows[I],_.clone(Null));
			}
		})
		self.Render();
		if (self.Mode()!=self.ReportType() && self.Mode()!='ColumnsView'){
			self.Mode(self.ReportType());
		}
		SettingController.SelectReport(Report);
		$("#loadreport_modal").modal("hide");
	}

	self.DeleteReport = function(){
		$.ajax({
			url:self.base+'/report',
			data:{CodeReport:MCustomReport.CurrentReport()},
			method:"delete",
			success:function(data){
				if (data.err) {
					return self.Error(data.err);	
				}
				SettingController.LoadDefault(true,function(){
					SettingController.Init();
					$("#loadreport_modal").modal("hide");	
				});				
			}
		})
	}

	self.Init = function (){
		self.LoadStructure(function(){				
			self.IsLoading(false);
			SettingController.Init();
			self.Render();
			if (CxCtrl.CodeReport()!='default'){
			}
		})
	}


	self.LoadStructure  = function(done){
		$.ajax({
			url:self.base+'/structure',
			data:CxCtrl.Context(),
			success:function(data){
				if (data.err) {
					return self.Error(data.err);	
				}
				self.Rows = data.Rows;
				self.Rows.forEach(function(R,index){
					self.Rows[index] = self.Rows[index];//_.merge(,m);
				})
				self.UpdateRowsParams();
				self.Cols = data.Cols;
				return done();
			}
		})
	}

	self.UpdateRowsParams = function(){
		self.Rows.forEach(function(R,index){
			var Mods = {}; 
			self.ModFields.forEach(function(Field){
				Mods[Field] = self[Field].indexOf(R.CodeRow)!=-1;
			})
			self.Rows[index] = _.merge(self.Rows[index],Mods);
		})
	}


	self.IsLoading = ko.observable(false);

	self.CollapseAllRows = function(){
        var Info = self.table.getSettings().tree;
        var RowCodes = [];
        for (var Index in Info.data){
            var R = Info.data[Index];
            if ((R.rgt-R.lft)>1){
                RowCodes.push(parseInt(Index));
            }
            self.table.collapsedRows(RowCodes);
        }
        if (self.Mode()=='SingleView'){
	        var Info2 = self.previewTable.getSettings().tree;
	        var RowCodes2 = [];
	        for (var Index in Info2.data){
	            var R = Info2.data[Index];
	            if ((R.rgt-R.lft)>1){
	                RowCodes2.push(parseInt(Index));
	            }
	        }
	        self.previewTable.collapsedRows(RowCodes2);
    	}
    }

    self.ExpandAllRows = function(){
        self.table && self.table.collapsedRows([]);
        self.previewTable && self.previewTable.collapsedRows([]);
    }

	self.Error = ko.observable(null);

	self.Mode = ko.observable("SingleView"); // SingleView, ModifyView, ColumnsView

	self.Mode.subscribe(function(Value){
		self.Render();
		if (Value!='ColumnsView') setTimeout(self.Render,500);// Баг не обновляется ширина strechH last
	}) 		


	self.EditReport = ko.observable(null);

	self.SaveError = ko.observable(null);

	self.SaveChanges = function(){
		var u = MSite.Me().CodeUser();
		var _defaults = {
			IsPrivate:true
		};
		var n = MModels.Create("report",_.merge({CodeDoc:CxCtrl.CodeDoc()},_defaults));
		self.EditReport(n);
		$("#savereport_modal").modal("show");
	}


	self.SaveReport = function(){
		self.SaveError(null);
		var RowsModifiers = {};
		self.ModFields.forEach(function(F){
			RowsModifiers[F] = self[F];
		})
		var Data = {
			Report:self.EditReport().toJS(),
			Rows:RowsModifiers,
			Params:ko.toJS(SettingController.resParams)
		}
		$.ajax({
			url:self.base+'/createreport',
			method:"post",
			data:Data,
			success:function(answer){
				if (answer.err) return self.Error(answer.err);
				SettingController.LoadDefault(true);
				SettingController.Init(true);
				SettingController.IsShowList(true);				
				$("#savereport_modal").modal("hide");
				self.Init();
			}
		})

	}

	self.RollBack = function(){
		self.Init();
	}

	self.RenderT = null;

	self.Render  = function(){
		if (self.RenderT) clearTimeout(self.RenderT);
		self.RenderT = setTimeout(self._render,500)
	}

	self._render = function(){
		var Emulate = {}
		self.ModFields.forEach(function(Field){
			Emulate[Field] = self[Field];
		})
		TreeReparser.ResultTree(self.Rows,Emulate);
		if (self.Mode()=='ColumnsView'){
			self.RenderWithCols();
			SettingController.ResetTabGrp();
			SettingController.IsShow(true);				
		} else {
			self.RenderWithPreview();
			SettingController.IsShow(false);
		}
	}

    self.CheckedRender = function(instance, td, row, col, prop, value, CellInfo){
		$(td).addClass("checkboxed");			
		Handsontable.renderers.CheckboxRenderer.apply(this, arguments);
	}
	
    self.RegisterChange = function(changes, source){
        switch(source){
            case 'autofill':
            case 'paste':
            case 'radio':
            case 'edit':
            	changes.forEach(function(change){
            		var rI = change[0], prop = change[1], oldV = change[2], newV = change[3], meta = self.table.getCellMeta(rI,0);
            		var R = _.find(self.Rows,{CodeRow:meta.CodeRow});
            		var C = meta.CodeRow;
            		R[prop] = newV;
					if (self.Mode()=='ModifyView'){                			                		
                		if (prop=='IsToggled') {
                			if (newV){
                				self.IsToggled.push(C);
                				if (R.IsHidden){
                					self.table.setDataAtCell(rI,0,false,'radio');
                				}
                			} else {
                				self.IsToggled.remove(C);
                			}
                		} else {
							if (newV){
                				self.IsHidden.push(C);
                				if (R.IsToggled){
                					self.table.setDataAtCell(rI,1,false,'radio');
                				}
                			} else {
                				self.IsHidden.remove(C);
                			}
                		}
                	} else if(self.Mode()=='SingleView'){
                		if (newV){
                			self[prop].push(R.CodeRow);
                		} else {
                			self[prop].remove(R.CodeRow);
                		}
                	}
                	self.Render();
            	})                	
           break;
        }
    } 


    self.RenderWithCols = function(){
        var Header = Tr('customreport',['CodeRow','NameRow']);
		var HandsonRenders = new HandsonTableRenders.RenderController();
        var TreeArr = {}, Rows = TreeReparser.ResultTreeObjs; 
        Rows.forEach(function(R,I){
            TreeArr[I] = _.pick(R,['lft','rgt','level']);
        })
        var DomPlace = $('.handsontable.single:visible')[0], TableCells = [];
        Rows.forEach(function(Row){
	    	var EmptRow = _.pick(Row,['NumRow','NameRow']);
	        TableCells.push(EmptRow)
	    })
	    HandsonRenders.RegisterRender("Code",[/[0-9]*?,0$/], HandsonTableRenders.ReadOnlyText);
	    HandsonRenders.RegisterRender("Tree",[/[0-9]*?,1$/], HandsonTableRenders.TreeRender);
		Header = Header.concat(_.map(self.Cols,"NameColsetCol"));
		var columns = [{data:'NumRow',type:'text'},{data:'NameRow',type:'text'}];
		self.Cols.forEach(function(H){
			columns.push({type:'text'});
		})
        var HandsonConfig = {
        	data:TableCells,columns:columns,
        	cells:HandsonRenders.UniversalRender,
            colHeaders: Header, fixedColumnsLeft: 2,
            rowHeaders:true,autoRowSize:true,manualRowMove:true,
			tree:{
		        data:TreeArr,
		        icon:function(){},
		        colapsed:CxCtrl.Context().CodeDoc+'_customreport'
		    }
        };
        try{
            self.table.destroy();
            self.table = null;
        } catch(e){
            ;
        }
        if (!self.table)
        self.table = new Handsontable(DomPlace, HandsonConfig);
        new HandsonTableHelper.WidthFix(self.table,100,200,[50,400]);
        new HandsonTableHelper.DiscretScroll(self.table);
        new HandsonTableHelper.TreeView(self.table);
        self.table.render();
    }

    self.RenderWithPreview = function(){
    	self.RenderEditTable();
		self.RenderPreviewTable();        	
    }

	self.FilterRender = function(instance, td, row, col, prop, value, CellInfo){
		if (CellInfo.CodeRow){
			if (TreeReparser.ResultTreeCodes.length && TreeReparser.ResultTreeCodes.indexOf(CellInfo.CodeRow)==-1){
				$(td).addClass('removed_by_filter customreport');
			}
		} 
	}


    self.RenderEditTable = function(){
    	var Header  = Tr('customreport',['CodeRow','NameRow']), columns = [] , 
    	addCols = [], FixedColsWidths = [70], DomPlace = $('.handsontable.single:visible')[0];
    	if (self.Mode()=='SingleView'){
    		addCols = ['IsShowOlap','IsShowWithParent','IsShowWithChildren'];
    	} else {
    		addCols = ['IsHidden','IsToggled'];
    	}
    	if (self.IsOlap()){
    		if (self.Mode()!="SingleView"){
    			self.Mode("SingleView")
    		}
    		addCols = ['IsShowOlap'];
    	}
    	Header = Tr('customreport',addCols).concat(Header);
    	var HandsonRenders = new HandsonTableRenders.RenderController();	
    	addCols.forEach(function(AC,Index){
    		FixedColsWidths.shift(20);
    		columns.push({data:AC,type:'checkbox'});
    		HandsonRenders.RegisterRender(AC,[new RegExp("[0-9]*?,"+Index+"$")], self.CheckedRender);
    	})
    	columns = columns.concat([{data:'NumRow',type:'text'},{data:'NameRow',type:'text'}]);
        HandsonRenders.RegisterRender("Code",[new RegExp("[0-9]*?,"+addCols.length+"$")], HandsonTableRenders.ReadOnlyText);
        HandsonRenders.RegisterRender("Tree",[new RegExp("[0-9]*?,"+(addCols.length+1)+"$")], HandsonTableRenders.TreeRender);
		HandsonRenders.RegisterRender("Filter",[/[0-9]*?,[0-9]*?/],self.FilterRender);            
        var TreeArr = {}, TableCells = [];
        self.Rows.forEach(function(R,I){
            TreeArr[I] = _.pick(R,['lft','rgt','level']);
        })
        self.Rows.forEach(function(Row){
        	var EmptRow = _.pick(Row,['CodeRow','lft','rgt','level','IsHidden','IsToggled','NumRow','NameRow','IsShowOlap','IsShowWithParent','IsShowWithChildren']);
            TableCells.push(EmptRow)
        })
        var HandsonConfig = {
        	data:TableCells,cells:HandsonRenders.UniversalRender,
			fixedColumnsLeft:0,manualRowMove: true,autoRowSize:true,
			afterChange:self.RegisterChange,columns:columns,
			colWidths:FixedColsWidths,
			colHeaders:Header, stretchH: 'last',								
			tree:{
		        data:TreeArr,
		       	icon:function(){},
		        colapsed:CxCtrl.Context().CodeDoc+'customreport'
		    }
        }
        try{
            self.table.destroy();
            self.table = null;
        } catch(e){
            ;
        }
        if (!self.table)
        self.table = new Handsontable(DomPlace, HandsonConfig);
        new HandsonTableHelper.DiscretScroll(self.table);
        new HandsonTableHelper.TreeView(self.table);
		self.Rows.forEach(function(Row,IndexRow){
    		var Meta = _.pick(Row,["CodeRow"]);
    		Header.forEach(function(Col,IndexCol){
				self.table.setCellMetaObject(IndexRow,IndexCol,Meta);
    		})				
    	})
        self.table.render();
    }

    self.RenderPreviewTable = function(){
    	if (self.Mode()=='ColumnsView') return;
		var Header  = Tr('customreport',['CodeRow','NameRow']), DomPlace = $('.handsontable.preview:visible')[0];
    	var HandsonRenders = new HandsonTableRenders.RenderController();	
    	columns = [{data:'NumRow',type:'text'},{data:'NameRow',type:'text'}];
        HandsonRenders.RegisterRender("Code",[new RegExp("[0-9]*?,0$")], HandsonTableRenders.ReadOnlyText);
        HandsonRenders.RegisterRender("Tree",[new RegExp("[0-9]*?,1$")], HandsonTableRenders.TreeRender);
        var TreeArr = {}, TableCells = [];
        var Rows = TreeReparser.ResultTreeObjs;            
        Rows.forEach(function(R,I){
            TreeArr[I] = _.pick(R,['lft','rgt','level']);
        })
        Rows.forEach(function(Row){
        	var EmptRow = _.pick(Row,['CodeRow','NumRow','NameRow','lft','rgt','level']);
            TableCells.push(EmptRow)
        })
        var HandsonConfig = {
        	data:TableCells,cells:HandsonRenders.UniversalRender,
			fixedColumnsLeft:0,manualRowMove: false,autoRowSize:true,
			afterChange:self.RegisterChange,columns:columns,
			colWidths:[40],
			colHeaders:Header, stretchH: 'last',				
			tree:{
		        data:TreeArr,
		       	icon:function(){},
		        colapsed:CxCtrl.Context().CodeDoc+'customreport_preview'
		    }
        }
        try{
            self.previewTable.destroy();
            self.previewTable = null;
        } catch(e){
            ;
        }
        self.previewTable = new Handsontable(DomPlace, HandsonConfig);
        new HandsonTableHelper.DiscretScroll(self.previewTable);
        new HandsonTableHelper.TreeView(self.previewTable);
        self.previewTable.render();
    }
	return self;
})


ModuleManager.Modules.CustomReport = MCustomReport;
