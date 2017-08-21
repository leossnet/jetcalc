var MBiztran = (new function() {
	
	var self = new Module("biztran");

	self.IsAvailable = function(CodeDoc){
		var Doc = MFolders.FindDocument(CxCtrl.CodeDoc());
		return MFolders.FindDocument(CxCtrl.CodeDoc()).IsBiztranDoc && PermChecker.CheckPrivelege("IsBiztranTuner",CxCtrl.CxPermDoc());
	}

    self.BeforeShow = function(){
    	self.SubscribeDoc();
  		MSite.Events.off("refresh",self.RollBack);
        MSite.Events.on("refresh",self.RollBack);    	
    	self.Show();
    }

    self.BeforeHide = function(){
    	self.UnSubscribeDoc();
    	self.Rows = [];
    	if (self.table)  {
    		self.table.destroy();
    		self.table = null;
    	}
    	MSite.Events.off("refresh",self.RollBack);
    }

    self.CxChange = function(){
    	self.Show();
    }

    self.BiztranInfo = {};

    self.LoadBiztranInfo = function(done){
    	self.rGet("biztraninfo",CxCtrl.CxPermDoc(),function(data){
    		for (var ModelName in data){
    			var Arr = ModelClientConfig.CodeAndName(ModelName);
				self.BiztranInfo[ModelName] = _.map(data[ModelName],function(D){
					return _.pick(D,Arr);
				});
    		}
    		return done();
    	})
    }

    self.Debug = function(){
    	self.Rows = [{"CodeObj":"","CodeDoc":"","CodeRoot":"","CodeBill":"9001","CodeProd":"1210","CodeOrg":"001","CodeDogovor":"","Index":1},{"CodeObj":"","CodeDoc":"","CodeRoot":"","CodeBill":"9001","CodeProd":"1220","CodeOrg":"001","CodeDogovor":"","Index":2},{"CodeObj":"","CodeDoc":"","CodeRoot":"","CodeBill":"9001","CodeProd":"1220","CodeOrg":"201","CodeDogovor":"","Index":3}];
    	self.AskForRender();
    }

    self.Changes = ko.observableArray([]);
    self.DiscretChanges = {};
    self.InitialValues  = {};
    self.RowsChanged  = ko.observable(0);
    self.RowsChangedIndexes = {};
	
	self._change = function(ind,key,value,oldvalue){
		if (!self.Rows[ind]) self.Rows[ind] = (MModels.Create("biztranrow",{Index:(ind+1)}).toJS());
		self.Rows[ind][key] = value;
		self.RowsChangedIndexes[ind] = 1;
		self.RowsChanged(_.sum(_.values(self.RowsChangedIndexes)));
		self.AskForRender();
    }

    self.RenderTimer = null

    self.AskForRender = function(){
    	if (self.RenderTimer) clearTimeout(self.RenderTimer);
    	self.RenderTimer = setTimeout(function(){
    		self.RenderTable();
    		self.RenderTimer = null;
    	},200);
    }

  	self.AddChange = function(changes, source){
        switch(source) {
        	case 'edit':
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

	self.SaveChanges = function(){
		self.rPut("modifyrows",{Context:CxCtrl.CxPermDoc(),Rows:self.Rows},function(){
			self.FlushChanges();
			self.Show();
		})
	}

	self.ModelsByField = {
		"CodeBill":'bill',
        "CodeDogovor":'dogovor',
        "CodeOrg":'org',
        "CodeProd":'prod',
	}

  
	self.baseConfig = {
        rowHeaders:false,
        colHeaders:false,
        autoRowSize:true,
        minSpareCols: 0,
        minSpareRows: 50,
        currentColClassName: 'currentCol',
        currentRowClassName: 'currentRow',
        fixedColumnsLeft: 0,
        fixedRowsTop: 0,
        manualColumnResize: true,
        afterChange: self.AddChange,
        trimDropdown: false
    };

    self.MinColWidth = 100;
    self.MaxColWidth = 300;

	self.FlushChanges = function(){
		self.DiscretChanges = {};
		self.InitialValues = {};
		self.RowsChanged(0);
	}

	self.RollBack = function(){
		self.Show();
	}

	self.Rows = [];
	
	self.EditorRender = function(instance, td, row, col, prop, value, CellInfo){
		var ModelName = self.ModelsByField[prop];
		var Type = _.isEmpty(ModelName) ? "":"select";
		$(td).addClass("nowrapped");
		switch(Type){
			case 'select':
				var	Code = MModels.Config[ModelName].Code;
				var	Name = MModels.Config[ModelName].Name;
				if (!value){
					$(td).empty();
				} else {					
					var Q = {}; Q[Code] = value;
					var Found = _.find(self.BiztranInfo[ModelName],Q);
					var Text = _.isEmpty(Found) ? "":Found[Name];
					$(td).text(Text);
				}
			break;
			default:
				Handsontable.renderers.TextRenderer.apply(this, arguments);
		}
	}

	self.table = null;

	self.BeforeRemoveRow = function(rowIndex){
		self.Rows.splice(rowIndex, 1);
	}

	self.DataForTable = function(){
		var Cols2Show = ["Index","CodeBill","CodeProd","CodeOrg","CodeDogovor"], TableCells  = [];
		self.Rows.forEach(function(R){
			TableCells.push(_.pick(R,Cols2Show))
		})
		var Cols = [];
		Cols2Show.forEach(function(Col){
			var R = {data:Col,type: "text"}
			if (Col!='Index') {
				R.type = 'handsontable';
				var ModelName = self.ModelsByField[Col];
				R.handsontable = {
          			autoColumnSize: true,
          			data: self.BiztranInfo[ModelName],
          			getValue: function(ModelName) {
          				return function(){
							var Code = MModels.Config[ModelName].Code;
							var Name = MModels.Config[ModelName].Name;
          					var selection = this.getSelected();
			            	return this.getSourceDataAtRow(selection[0])[Code];
			            }
          			}(ModelName)
				}
				R.renderer = self.EditorRender;
			}
			Cols.push(R);			
		})
		var Translated = Tr(Cols2Show);
		return {
			data:TableCells,
			headers:[Translated],
			columns:Cols,
		}
	}

	self.Retries = 10;

	self.RenderTable = function(){
		var selector = '.handsontable.single:visible';
		var DomPlace = $(selector)[0];
		if (_.isEmpty($(DomPlace)) && self.Retries>0){
			self.Retries--;
			return setTimeout(self.RenderTable,100);
		}
		self.Retries = 10;
		var HandsonRenders = new HandsonTableRenders.RenderController();
		var params = {
	        fixedColumnsLeft: 0,
	        cellsParams:{}
		}	
		var Widths = [50,300,300,300,300];
		var HandsonConfig = _.merge(_.clone(self.baseConfig),params);
		try{
			var Data = self.DataForTable();
			if (!self.table) {
				self.table = new Handsontable(DomPlace, HandsonConfig);
				self.table.updateSettings(Data);
			} else {
				var Update = _.merge(HandsonConfig,Data);
				self.table.updateSettings(Update);	
			}
			new HandsonTableHelper.DiscretScroll(self.table);
	    	new HandsonTableHelper.HeaderGenerator(self.table);
	    	new HandsonTableHelper.WidthFix(self.table,self.MinColWidth,self.MaxColWidth,Widths);
    		self.table.render();
    	} catch(e){
    		console.log("Table not rendered",e);
    	}        
	}

	self.Show = function (done){
		self.LoadBiztranInfo(function(){			
			self.LoadExisted(function(){
				self.AskForRender();
				self.FlushChanges();
				return done && done();
			})
		})
	}

	self.LoadExisted = function(done){
		self.rGet("rows",CxCtrl.CxPermDoc(),function(data){
			self.Rows = data;
			return done();
		})
	}

	return self;
})

ModuleManager.Modules.Biztran = MBiztran;



