var ParamManager = (new function(){
	var self = this;

	//self.rawData =  {tabs:[], grps:[], params:[], List:[]};
    //self.choosedTab = ko.observable(null);
    //self.choosedGrp = ko.observable(null);

    self.Params = ko.observable();
    self.Groups = ko.observableArray();
    self.ParamsByGroup = function(CodeGroup){
    	return _.filter(self.Params,{CodeParamGrp:CodeGroup});
    }

 	
	self.Load = function(done){
		console.log("Loading Params For ",CxCtrl.CodeDoc());
         var Params = {};
         CustomReport.rGet("params",CxCtrl.CxPermDoc(),function(data){
         	self.Params(data.Params);
         	var Groups = {}, GInd;
         	_.values(data.Params).forEach(function(P){
         		if (!GInd[P.CodeParamGrp]) {
         			GInd[P.CodeParamGrp] = 1;
         			Groups.push(_.pick(P,["CodeParamGrp","NameParamGrp"]));
         		}
         	})
         	self.Groups(Groups);
         })
/*
    	 $.ajax({
            url:"/api/form/set",
            data:_.merge(CxCtrl.Context(),Params),
            success:function(defaultData){
            	for (var Key in self.rawData){
            		self.rawData[Key] = defaultData[Key] || []
            	}
                self.IsInited(false);
                done && done();
            }
		})
*/
    }


	return self;
})


var TreeHelper = function(CustomReport){
	var self = this;

	self.R = CustomReport;
	self.Rows = _.clone(CustomReport.Rows);

	self.ResultTreeCodes = [];
	self.ResultTreeObjs = [];


	self._children = function(CodeRow,Rows){
	  var Row = _.find(Rows,{CodeRow:CodeRow});
	  return _.map (_.filter (Rows,function(R){
	    return Row.lft<R.lft && Row.rgt > R.rgt;
	  }),"CodeRow");
	}

	self._parents = function(CodeRow,Rows){
	  var Row = _.find(Rows,{CodeRow:CodeRow});
	  return _.map (_.filter (Rows, function(R){
	    return Row.lft>R.lft && Row.rgt < R.rgt;
	  }),"CodeRow");
	}   

	self.Tree = function(){
      var AllHidden = [], NewTreeCodes = [], Filtered = [], Return = [];
      if (self.R.Mode() == 'ModifyView'){
        	var CodesToHide = [];
        	self.R.IsHidden.forEach(function(HC){
          		CodesToHide = CodesToHide.concat([HC]).concat(self._children(HC,self.Rows));
        	})
        	self.R.IsToggled.forEach(function(CC){
          		CodesToHide = CodesToHide.concat(self._children(CC,self.Rows));
        	})
        	AllHidden = _.uniq(CodesToHide);
        	Filtered = _.filter(self.Rows,function(R){
          		return AllHidden.indexOf(R.CodeRow)==-1;
        	})
      } else {
        var Codes = [];
        self.R.IsShowOlap.forEach(function(RS){Codes.push(RS);})
        self.R.IsShowWithParent.forEach(function(RP){Codes.push(RP);Codes = Codes.concat(self._parents(RP,self.Rows));})
        self.R.IsShowWithChildren.forEach(function(RC){Codes.push(RC);Codes = Codes.concat(self._children(RC,self.Rows));})
        NewTreeCodes = _.uniq(Codes);
        Filtered = _.filter(self.Rows,function(R){
          return NewTreeCodes.indexOf(R.CodeRow)!=-1;
        })
      }
      if (_.isEmpty(Filtered)) {
      	Return = self.Rows;
      } else {
        var T = new TypeTree("ROOT",{});
        Filtered.forEach(function(R){
            var Parents  = self._parents(R.CodeRow,Filtered);

            T.add (R.CodeRow, R, _.last(Parents) || "ROOT", T.traverseBF);
        })
       	Return = T.getFlat();
        delete T;
      }
      return Return;      
    }

	return self;
}


var ReportManager = (new function(){
	var self = this;

	self.NewReport = function(){
		self.CurrentReport('default');
		self.DoLoadReport();
	}

	self.CurrentReport = ko.observable(null);
	self.LoadReport = function(){
		self.PrepareTree();
		self.IsLoadReportsShow(true);
		$("#loadreport_modal").modal("show");
		$("#loadreport_modal").on("hide.bs.modal", function(e) {
			self.IsLoadReportsShow(false);
	    })	
	}

	self.EditFields = function(){
    	var Base = ['CodeReport','IndexReport','NameReport','PrintNameReport','PrintDocReport'];
    	if (PermChecker.CheckPrivelege("IsCustomReportPublicTuner",CxCtrl.CxPermDoc())){
    		Base = Base.concat(['IsPublic','IsDefault','IsPrivate','CodeGrp','CodePeriodGrp']);
    	}
    	return Base;
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
		self.rDelete ("report",{CodeReport:MCustomReport.CurrentReport()},function(){
			SettingController.LoadDefault(true,function(){
				SettingController.Init();
				$("#loadreport_modal").modal("hide");	
			});				
		})
	}

	self.EditReport = ko.observable(null);
	self.IsLoadReportsShow = ko.observable(false);
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

	



	return self;
})






var CustomReport = (new function() {

	var self = new Module("customreport");

	self.EditConfig = ko.observable();
	self.EditResult = ko.observable();
	self.EditChanges = ko.observable();
	self.EditChangesCount = ko.observable();

    self.IsOlap = function(){
    	var Doc = null;
    	if (CxCtrl.CodeDoc()) {
			Doc = MFolders.FindDocument(CxCtrl.CodeDoc());
    	}
    	return Doc && Doc.IsOlap; 
    }


	self.RollBack = function(){
		self.Init();
	}

	self.Init = function(done){
		CxCtrl.Events.addListener("documentchanged",function(){
			ParamManager.Load();
		})
		return done();
	}

  	self.BeforeHide = function(){
        self.UnSubscribe({
        	save:self.SaveChanges
        });
        self.UnSubscribeChanges();
    }

    self.BeforeShow = function(){
        self.Subscribe({
        	save:self.SaveChanges
        });
        self.SubscribeChanges();
        self.Show();
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

	self.Show = function(done){
        if (!self.Mode()) return self.InitSetMode("SingleView");
        switch(self.Mode()){
        	case "SingleView":
        		["IsShowOlap","IsShowWithParent","IsShowWithChildren"].forEach(function(F){
        			self[F] = [];
        		})
        		self.RenderShow();
        	break;
        	case "ModifyView":
        		["IsHidden","IsToggled"].forEach(function(F){
        			self[F] = [];
        		})
        		self.RenderShow();
        	break;
        	case "ColumnsView":
        		self.ColumnPreview();
        	break;
        }
	}

	self.EditChangesSubscription = null;
	self.UnSubscribeChanges = function(){
		if (self.EditChangesSubscription) self.EditChangesSubscription.dispose();
	}
	self.SubscribeChanges = function(){
		self.UnSubscribeChanges();
		self.EditChangesSubscription = self.EditChanges.subscribe(self.OnChanges);
	}
	self.OnChanges = function(V){
		self.ModFields.forEach(function(ModField){
			var Q = {}; Q[ModField] = true;
			self[ModField] = _.map(_.filter(self.Rows,Q),"CodeRow");
		})
		self.RenderPreview();
	}
	
	self.RenderShow = function(){
		self.LoadStructure(function(){				
 			var ColWidths = [];
            var ToTranslate = {}
            var Columns = [], EditCols = (self.Mode()=='SingleView') ? ["IsShowOlap","IsShowWithParent","IsShowWithChildren"]:["IsHidden","IsToggled"];
            if(self.IsOlap()) {
            	self.Mode("SingleView"); EditCols = ["IsShowOlap"];
            }
            EditCols.forEach(function(ColName){
            	Columns.push({type:"checkbox",data:ColName,title:Tr(ColName)});
            	ColWidths.push(40);
            })
            Columns.push({type:"text",data:"NumRow",title:Tr("NumRow"),readOnly:true}); ColWidths.push(70);
            Columns.push({type:"text",data:"NameRow",title:Tr("NameRow"),readOnly:true,renderer:HandsonTableRenders.TreeRender}); ColWidths.push(400);
			var TreeArr = {};
        	self.Rows.forEach(function(R,I){
            	TreeArr[I] = _.pick(R,['lft','rgt','level']);
        	})            
            var Config = {
                Columns:Columns,
                Rows:self.Rows,
                CFG:{
                    colWidths: ColWidths,
                    colHeaders: true,
                    stretchH:'last',
                    Plugins:["Tree"],
                    tree:{
		        		data:TreeArr,
		       			icon:function(){},
		        		colapsed:CxCtrl.Context().CodeDoc+'customreport'
		        	}
                }
			}
            self.EditConfig(Config);	
            self.SubscribeChanges();
		})
	}

	self.Rows = [];
	self.Cols = [];

	self.LoadStructure  = function(done){
		self.rGet('structure',CxCtrl.CxPermDoc(),function(data){
			self.Rows = data.Rows;
			self.Rows.forEach(function(R,index){
				self.Rows[index] = self.Rows[index];
			})
			self.UpdateRowsParams();
			self.Cols = data.Cols;
			return done();
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

	self.PreviewConfig = ko.observable();
	self.PreviewResult = ko.observable();
	self.PreviewChanges = ko.observable();
	self.PreviewChangesCount = ko.observable();	

	self.RenderPreview = function(){
		var T = new TreeHelper(self);
		var Rows = T.Tree(), ColWidths = [], ToTranslate = {}, Columns = [];
        Columns.push({type:"text",data:"NumRow",title:Tr("NumRow"),readOnly:true}); ColWidths.push(70);
        Columns.push({type:"text",data:"NameRow",title:Tr("NameRow"),readOnly:true,renderer:HandsonTableRenders.TreeRender}); ColWidths.push(400);
		var TreeArr = {};
    	Rows.forEach(function(R,I){
        	TreeArr[I] = _.pick(R,['lft','rgt','level']);
    	})            
        var Config = {
            Columns:Columns,
            Rows:Rows,
            CFG:{
                colWidths: ColWidths,
                colHeaders: true,
                stretchH:'last',
                Plugins:["Tree"],
                tree:{
	        		data:TreeArr,
	       			icon:function(){},
	        		colapsed:CxCtrl.Context().CodeDoc+'customreport_preview'
	        	}
            }
		}
        self.PreviewConfig(Config);
	}

	self.ColumnConfig = ko.observable();
	self.ColumnResult = ko.observable();
	self.ColumnChanges = ko.observable();
	self.ColumnChangesCount = ko.observable();	

	self.ColumnPreview = function(){
		var T = new TreeHelper(self);
		var Rows = T.Tree(), ColWidths = [], ToTranslate = {}, Columns = [];
        Columns.push({type:"text",data:"NumRow",title:Tr("NumRow"),readOnly:true}); ColWidths.push(70);
        Columns.push({type:"text",data:"NameRow",title:Tr("NameRow"),readOnly:true,renderer:HandsonTableRenders.TreeRender}); ColWidths.push(400);
		self.Cols.forEach(function(H){
			Columns.push({type:'text',title:H.NameColsetCol,readOnly:true}); ColWidths.push(100);
		})
		var TreeArr = {};
    	Rows.forEach(function(R,I){
        	TreeArr[I] = _.pick(R,['lft','rgt','level']);
    	})            
        var Config = {
            Columns:Columns,
            Rows:Rows,
            CFG:{
                colWidths: ColWidths,
                colHeaders: true,
                fixedColumnsLeft:2,
                Plugins:["Tree"],
                tree:{
	        		data:TreeArr,
	       			icon:function(){},
	        		colapsed:CxCtrl.Context().CodeDoc+'customreport_preview_column'
	        	}
            }
		}
        self.ColumnConfig(Config);
	}


	return self;
})




/*



var MCustomReport = (new function() {
	
	var self = new Module("customreport");


    








	self.LoadStructure  = function(done){
		self.rGet('structure',CxCtrl.CxPermDoc(),function(data){
			self.Rows = data.Rows;
			self.Rows.forEach(function(R,index){
				self.Rows[index] = self.Rows[index];//_.merge(,m);
			})
			self.UpdateRowsParams();
			self.Cols = data.Cols;
			return done();
		})
	}



	self.Render = function(){
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
            		var rI = change[0], prop = change[1], oldV = change[2], newV = change[3], meta = self.EditTable.getCellMeta(rI,0);
            		var R = _.find(self.Rows,{CodeRow:meta.CodeRow});
            		var C = meta.CodeRow;
            		R[prop] = newV;
					if (self.Mode()=='ModifyView'){                			                		
                		if (prop=='IsToggled') {
                			if (newV){
                				self.IsToggled.push(C);
                				if (R.IsHidden){
                					self.EditTable.setDataAtCell(rI,0,false,'radio');
                				}
                			} else {
                				self.IsToggled.remove(C);
                			}
                		} else {
							if (newV){
                				self.IsHidden.push(C);
                				if (R.IsToggled){
                					self.EditTable.setDataAtCell(rI,1,false,'radio');
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
                	self.RenderPreviewTable();
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
            //self.table.destroy();
            //self.table = null;
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







	return self;
})
*/

ModuleManager.Modules.CustomReport = CustomReport;





ko.bindingHandlers.checkBox = {
  init: function(element, valueAccessor, allBindingsAccessor) {
    var value     = valueAccessor();
    var unwrValue = ko.unwrap(valueAccessor());
    $(element).click(function(){
      if (_.startsWith(value(),'NOT_')) {
        value((value()+'').substring(4,value().length));
      } else {
        value('NOT_' + value());
      }
    });
  },
  update: function(element, valueAccessor, allBindingsAccessor) {
    var value = ko.unwrap(valueAccessor());
    if (_.startsWith(value,'NOT_')){
      $(element).prop('checked',false);
    } else {
      $(element).prop('checked',true);
    }
  }
}

