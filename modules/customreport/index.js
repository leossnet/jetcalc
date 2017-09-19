var ReportManager = (new function(){
	var self = this;

	self.NewReport = function(){
		self.CurrentReport(null);
		CustomReport.RollBack();
	}

	self.IsLoadAvailable = function(){
		return !_.isEmpty(ParamManager.List());
	}

	self.CurrentReport = ko.observable(null);

	self.LoadReport = function(){
		$("#loadreport_modal").modal("show");
	}

	self.EditFields = function(){
    	var Base = ['IndexReport','NameReport','PrintNameReport','PrintDocReport'];
    	if (PermChecker.CheckPrivelege("IsCustomReportPublicTuner",CxCtrl.CxPermDoc())){
    		Base = Base.concat(['IsPublic','IsDefault','IsPrivate','CodeGrp','CodePeriodGrp']);
    	}
    	return Base;
    }

	self.ReportLoadTree = ko.observable(null);
	self.ReportTreeDataSource = function(options, callback){
		var Answ  = {};
		if(!("text" in options) && !("type" in options)){
			return callback({ data: self.ReportLoadTree() });
		} else if("type" in options && options.type == "folder") {
			var Answ = options.additionalParameters.children;
		}
		callback({ data: Answ });
	}
	self.PrepareTree = function(){
		self.ReportLoadTree(null);
		var Reports = ParamManager.List(), CodeUser = MSite.Me().CodeUser();
		var _reparse = function(i){ return {code:i.CodeReport,text:i.NameReport, type: 'item'};}
		var Filter = {
			personal :_.map(_.filter(Reports,{CodeUser:CodeUser}),_reparse),
			public   :_.map(_.filter(_.filter(Reports,{IsPublic:true}),function(F){
				return F.CodeUser != CodeUser;
			}),_reparse),
			private  :_.map(_.filter(Reports,{IsPrivate:true}),_reparse),
		};
		var tree_data = {};
		for (var Code in Filter){
			if (!_.isEmpty(Filter[Code])){
				tree_data[Code] = {code:Code, text: Tr('customreport',Code), type: 'folder', additionalParameters:{children:Filter[Code]}};
			}
		}
		var additional = {};
	    additional.default = {code:'default', text: 'По умолчанию', type: 'item', additionalParameters:{children:[
{code: "default", text: Tr("default"), type: "item"}]}};
		tree_data = _.merge(tree_data,additional);
		self.ReportLoadTree(tree_data);
	}

	self.UpdateRowModifiers = function(){
		var Report = _.find(ParamManager.List(),{CodeReport:self.CurrentReport()});
		CustomReport.ModFields.forEach(function(Field){
			var F = {}; F[Field] = true;
			CustomReport[Field] = (Report) ? _.map(_.filter(Report.reportrow,F),"CodeRow"):[];
		})
	}

	self.ClickLoad = function(data){
		self.CurrentReport(data.code);
		self.DoLoadReport();		
	}

	self.DoLoadReport = function(){
		self.UpdateRowModifiers();
		ParamManager.SetParams();
		$("#loadreport_modal").modal("hide");
		Bus.Emit("report_loaded");
		CustomReport.Show();
	}

	self.DeleteReport = function(){
		CustomReport.rDelete ("report",{CodeReport:self.CurrentReport()},function(){
			CustomReport.RollBack();	
			$("#loadreport_modal").modal("hide");
		})
	}

	self.EditReport = ko.observable(null);

	self.SaveChanges = function(){
		var Current = self.CurrentReport();
		var Initer = {};
		if (!_.isEmpty(Current) && Current!='default'){
			var Search = {CodeReport:self.CurrentReport()};
			var Report = _.find(ParamManager.List(),Search);
			Initer = _.merge(Search,_.pick(Report,self.EditFields()));
			Initer.CodeDoc = CxCtrl.CodeDoc();
		} else {
			Initer = {IsPrivate:true,CodeDoc:CxCtrl.CodeDoc()};
		}
		var n = MModels.Create("report",Initer);
		self.EditReport(n);
		$("#savereport_modal").modal("show");
	}

	self.SaveReport = function(){
		var RowsModifiers = {};
		CustomReport.ModFieldsByType().forEach(function(F){
			RowsModifiers[F] = CustomReport[F];
		})
		CustomReport.rPost("createreport",{Data:JSON.stringify({
			Report:self.EditReport().toJS(),
			Rows:RowsModifiers,
			Params:ParamManager.ActualParams(),
			ParamSets:ParamManager.ParamSets()
		})},function(){
			CustomReport.RollBack();
			$("#savereport_modal").modal("hide");			
		})
	}

	return self;
})

	

var ParamManager = (new function(){
	var self = this;

    self.Params = ko.observableArray();
    self.Groups = ko.observableArray();
    self.ParamsByGroup = function(CodeGroup){
    	return _.filter(self.Params(),{CodeParamGrp:CodeGroup});
    }

    self.Changes = ko.observable(0);
    self.UpdateChanges = function(V){
    	self.Changes(_.filter(V,function(P){
    		return P.NewCodeParamSet!=P.CodeParamSet;
    	}).length);
    	Bus.Emit("params_changed");
    }

    self.ActualParams = function(){
    	var Result = [];
    	self.Params().forEach(function(P){
    		var PS = _.find(P.ParamSets,{CodeParamSet:P.NewCodeParamSet});
    		if (PS){
    			Result = _.uniq(Result.concat(_.map(_.filter(PS.ParamKeys,{KeyValue:true}),"CodeParamKey")));
    		}
    	})
    	return Result;
    }   

    self.ParamSets = function(){
    	var Result = {};
    	self.Params().forEach(function(P){
    		Result[P.CodeParam] = P.NewCodeParamSet;
    	})
    	return Result;
    }

    self.PossibleParams = function(){
    	var Result = [];
    	self.Params().forEach(function(P){
    		P.ParamSets.forEach(function(PS){
    			Result = Result.concat(_.map(PS.ParamKeys,"CodeParamKey"));
    		})
    	})
    	return _.uniq(Result);
    }

    self.SetParams = function(Params){
    	var Initial = false;
    	if (_.isEmpty(Params)){
    		Params = ParamManager.Params();
    	} else {
    		Initial = true;
    	}    	
    	var CodeReport = ReportManager.CurrentReport();
    	var Override = {};
    	if (CodeReport && CodeReport!='default'){
    		var Report = _.find(self.List(),{CodeReport:CodeReport});
    		if (Report){
    			Report.reportparamkey.forEach(function(RK){
    				if (!_.isEmpty(RK.CodeParamSet)){
    					Override[RK.CodeParam] = RK.CodeParamSet;
    				}
    			})
    		}
    	}
     	if (self.ParamsSubscribe) self.ParamsSubscribe.dispose();    
     	self.Params(_.sortBy(_.map(_.filter(Params,{IsShow:true}),function(P){
     		if (!CodeReport || Initial) P.InitParamSet = P.CodeParamSet;
     		if (Override[P.CodeParam]){
     			P.NewCodeParamSet = Override[P.CodeParam];
     			P.CodeParamSet = Override[P.CodeParam];
     		} else {
     			P.CodeParamSet = P.InitParamSet;
     			P.NewCodeParamSet = P.InitParamSet;
     		}
     		return _.merge(P,{IsChanged:ko.observable(false)});
     	}),"IndexParam"));
        self.Changes(0);
		self.Groups.valueHasMutated();
     	self.ParamsSubscribe =  ko.computed(function() {
            return ko.toJS(self.Params);
        }).subscribe(self.UpdateChanges);  		
    }

    self.ParamsSubscribe = null;

    self.List = ko.observableArray();

 	self.Load = function(done){
 		 console.log("load params");
         CustomReport.rGet("params",CxCtrl.CxPermDoc(),function(data){
         	self.List(data.List);
         	ReportManager.PrepareTree();
         	if (ReportManager.CurrentReport() && ReportManager.CurrentReport()!='default'){
         		var R = _.find(data.List,{CodeReport:ReportManager.CurrentReport()});
         		if (_.isEmpty(R)){
         			ReportManager.CurrentReport(null);
         		}
         	}
         	var Params = _.values(data.Params);
         	var Groups = [], GInd = {};
         	Params.forEach(function(P){
         		if (!GInd[P.CodeParamGrp]) {
         			GInd[P.CodeParamGrp] = 1;
         			Groups.push(_.pick(P,["CodeParamGrp","NameParamGrp"]));
         		}
         	})
         	self.Groups(Groups);
         	self.SetParams(Params);
         	Bus.Emit("params_loaded");
         	return done && done();
         })
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
      var Type = self.R.Mode();
      if (Type=="ColumnsView") Type = self.R.ReportType();
      if (Type == 'ModifyView'){
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

var CustomReport = (new function() {

	var self = new Module("customreport");

	self.EditConfig = ko.observable();
	self.EditResult = ko.observable();
	self.EditChanges = ko.observable();
	self.EditChangesCount = ko.observable(0);

	self.ShowOnModules = ["report","olap","chart"];

	self.ForceHide = function(modelName){
		if (!_.includes(self.ShowOnModules,modelName)) {
			RightMenu.Hide("customreport");
			self.IsShow(false);
		}
	}

	self.IsShow = ko.observable(false);
	self.Toggle = function(){
		self.IsShow(!self.IsShow());
		if (self.IsShow()){
			RightMenu.Show("customreport");
			ReportManager.PrepareTree();
		} else {
			RightMenu.Hide("customreport");
		}
	}

    self.IsOlap = function(){
    	var Doc = null;
    	if (CxCtrl.CodeDoc()) {
			Doc = MFolders.FindDocument(CxCtrl.CodeDoc());
    	}
    	return Doc && Doc.IsOlap; 
    }
	
	self.ModFields = ["IsHidden","IsToggled","IsShowOlap","IsShowWithParent","IsShowWithChildren"];

	self.RollBack = function(){
		ReportManager.UpdateRowModifiers();
		self.EditChangesCount(0);
		ParamManager.Load(function(){
			self.Show();
		});
	}

	self.Init = function(done){
		CxCtrl.Events.addListener("documentchanged",function(){
			ParamManager.Load(function(){
				;
			});
		})
		Bus.On("current_module_changed",self.ForceHide);
		Bus.On("context_obj_change",ParamManager.Load);
		Bus.On("context_period_change",ParamManager.Load);
		self.ShowOnModules
		return done && done();
	}

	self.RowsOverride = function(){
		var RowsModifiers = {};
		if (!_.isEmpty(self.EditChanges())){
			self.ModFieldsByType().forEach(function(F){
				RowsModifiers[F] = self[F];
			})
		}
		return RowsModifiers;
	}


	self.SaveChanges = function(){
		ReportManager.SaveChanges();
	}

  	self.BeforeHide = function(){
        self.UnSubscribe({
        	save:self.SaveChanges,
        	open:ReportManager.LoadReport,
        	refresh:self.RollBack,
        	addrecord:ReportManager.NewReport
        });
        self.UnSubscribeChanges();
    }

    self.BeforeShow = function(){
        self.Subscribe({
        	save:self.SaveChanges,
        	open:ReportManager.LoadReport,
        	refresh:self.RollBack,
        	addrecord:ReportManager.NewReport
        });
        self.SubscribeChanges();
        self.Show();
    }        

	self.IsHidden = [];
	self.IsToggled = [];

	self.IsShowOlap = [];
	self.IsShowWithParent = [];
	self.IsShowWithChildren = [];

	self.ReportType = function(){
		if (_.sum([self.IsShowOlap.length,self.IsShowWithParent.length,self.IsShowWithChildren.length]) || self.IsOlap()){
			return "SingleView";
		} 
		return "ModifyView";
	}

	self.ModFieldsByType = function(){
		if (self.IsOlap()) return ["IsShowOlap"];
		return (self.ReportType()=="SingleView") ? ["IsShowOlap","IsShowWithParent","IsShowWithChildren"]:["IsHidden","IsToggled"];
	}

	self.Show = function(done){
        if (!self.Mode()) return self.InitSetMode("ColumnsView");
        switch(self.Mode()){
        	case "SingleView":
        		self.RenderShow();
        	break;
        	case "ModifyView":
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
		Bus.Off("params_changed",self.ReloadCols);
	}
	self.SubscribeChanges = function(){
		self.UnSubscribeChanges();
		self.EditChangesSubscription = self.EditChanges.subscribe(self.OnChanges);
		Bus.On("params_changed",self.ReloadCols);
	}
	self.OnChanges = function(V){
		self.ModFields.forEach(function(ModField){
			var Q = {}; Q[ModField] = true;
			self[ModField] = _.map(_.filter(self.Rows,Q),"CodeRow");
		})
		self.RenderPreview();
	}

	self.ChangesCount = ko.computed(function(){
		var ParamsChanges = ParamManager.Changes();
		var RowChanges = self.EditChangesCount();
		return ParamsChanges+RowChanges;
	})
	
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
		self.rGet('structure',_.merge(CxCtrl.CxPermDoc(),{Params:ParamManager.ActualParams()}),function(data){
			self.Rows = data.Rows;
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

	self.ReloadCols = function(){
		if (self.Mode()=='ColumnsView'){
			self.ColumnPreview();
		}
	}

	self.ColumnConfig = ko.observable();
	self.ColumnResult = ko.observable();
	self.ColumnChanges = ko.observable();
	self.ColumnChangesCount = ko.observable();	

	self.ColumnPreview = function(){
		self.LoadStructure(function(){
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
		})
	}


	return self;
})



ModuleManager.Modules.CustomReport = CustomReport;


ko.components.register('bool-param', {
    viewModel: function (params) {
    	var self = this;
    	self.data = params.data; 
    	self.IsPositiveSelected = ko.observable(false);
    	self.Text = ko.observable('');
    	var PositiveCode = "", NegativeCode = "";
    	try{
    		if (self.data.ParamSets[0].ParamKeys[0].KeyValue){
    			PositiveCode = 	self.data.ParamSets[0].CodeParamSet;
    			NegativeCode = 	self.data.ParamSets[1].CodeParamSet;
    		} else {
    			PositiveCode = 	self.data.ParamSets[1].CodeParamSet;
    			NegativeCode = 	self.data.ParamSets[0].CodeParamSet;
    		}
    	} catch(e){
    		console.warn("Неверная канструкция параметра:",self.data);
    	}
    	var Current = _.find(self.data.ParamSets,{CodeParamSet:self.data.NewCodeParamSet});
    	self.Text(Current.NameParamSet);
    	var Is = Current.CodeParamSet==PositiveCode;
    	self.IsPositiveSelected(Is);
    	self.IsPositiveSelected.subscribe(function(V){
    		if (V){
    			self.data.NewCodeParamSet = PositiveCode;
    		} else {
    			self.data.NewCodeParamSet = NegativeCode;
    		}
    		self.Text(_.find(self.data.ParamSets,{CodeParamSet:self.data.NewCodeParamSet}).NameParamSet);
    		self.data.IsChanged(self.data.NewCodeParamSet!=self.data.CodeParamSet);
    	})
	},
    template: "<div class='select' ><label  data-bind='css:{changed:data.IsChanged}'><input class='ace ace-checkbox-1' type='checkbox' data-bind='checked:IsPositiveSelected'><span class='lbl'></span><span  data-bind='text:Text'></span></label></div>",
})


ko.components.register('select-param', {
    viewModel: function (params) {
    	var self = this;
    	self.data = params.data; 
    	self.Options = _.values(self.data.ParamSets);
    	self.OptionsText = 'NameParamSet';
    	self.OptionsValue = 'CodeParamSet'
    	self.OnChange = function(){
    		self.data.IsChanged(self.data.NewCodeParamSet!=self.data.CodeParamSet);
    		self.data.IsChanged.valueHasMutated();
    	}
	},
    template: "<div class='select'><label data-bind='css:{changed:data.IsChanged},text:data.NameParam'></label><select class='form-control' data-bind='value: data.NewCodeParamSet, options: Options, optionsText: OptionsText, optionsValue: OptionsValue, event:{change:OnChange}'></select></div>",
})