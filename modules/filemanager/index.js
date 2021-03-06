var MFileManager = (new function() {
	
	var self = new Module("filemanager");

	self.Init = function(done){
		CxCtrl.Events.addListener("documentchanged",function(){
			MFileManager.CountAttaches();
		})
		return done();
	}

	self.ContextChange = function(){
		self.Reload();
	}

	self.IsAvailable = function(CodeDoc){
 		var Doc = MFolders.FindDocument(CxCtrl.CodeDoc());
        return !_.isEmpty(Doc);
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

	self.IsShowPreview = ko.observable(false);
	self.IsShowRemoved = ko.observable(false);

	self.TogglePreview = function(){
		self.IsShowPreview(!self.IsShowPreview());		
	}
	self.ToggleRemoved = function(){
		self.IsShowRemoved(!self.IsShowRemoved());		
	}

	self.IsPDFPreview = ko.observable(false);

	self.ShowPDFByCode = function(CodeFile){
		self.rGet("filebycode",{CodeFile:CodeFile},function(data){
			self.ChoosenAttach(MModels.Create("file",data));
			self.Preview();
		})
	}

	self.Preview = function(){
		$('#attachPreviewPdf').modal('show');
		self.IsPDFPreview(true);
		$('#attachPreviewPdf').on('hide.bs.modal', function(){
			$('#attachPreviewPdf').off('hide.bs.modal');
			self.IsPDFPreview(false)	
		}); 
	}

	self.RemoveAttach = function(){

	}

	self.RestoreAttach = function(){

	}


	self.ChoosenAttach = ko.observable(null);

	self.BeforeShow = function (){
		self.Reload();
	}

	self.Reload = function(){
		self.LoadFiles(function(){
			setTimeout(function(){
				if (self.Files.length)	{
					self.RenderTable();
				}
			},0)
		})
	}

	self.Files = [];

	self.Counter = ko.observable();

	self.CountAttaches = function(){
		self.Counter(0);
		self.rGet("count",{Context:CxCtrl.CxPermDoc()},function(data){
			self.Counter(data);
		})

	}
	self.IsEmptyTable = ko.observable(false);

	self.LoadFiles = function(done){
		self.Files = []; 
		self.rGet(CxCtrl.CodeDoc(),{Context:CxCtrl.CxPermDoc()},function(data){
			self.Files =  data;
			self.Files.forEach(function(F){
				if (F.HashCode){
					F.Name = "<span class='link-icon' name='"+F.Name+"' >"+F.Name+"</span>";
				}
			})
			if (!self.Files.length) self.IsEmptyTable(true);
			else self.IsEmptyTable(false);
			return done();			
		});
	}

	self.FileRender = function(instance, td, row, col, prop, value, CellInfo){
		CellInfo.readOnly=true;
		$(td).addClass("nowrapped");			
		if (CellInfo.Type=='File'){
			switch (prop){
				case 'CodeUser':
					value = Catalogue.GetHtml('user',value);
				break;
				case 'CodeFileType':
					value = Catalogue.GetHtml('filetype',value);
				break;
			}
		}
		Handsontable.renderers.HtmlRenderer.apply(this, arguments);

	}


	self.DataForTable = function(){
		var Cols2Show = ["Name","CodeFileType","DateDoc","CodeUser","Comment"], TableCells = [];
		self.Files.forEach(function(R){
			TableCells.push(_.pick(R,Cols2Show))
		})
		var Cols = [];
		Cols2Show.forEach(function(Col){
			var R = {data:Col,type: "text"}
			if (Col=='DateDoc'){
				R = _.merge(R,{
					type: 'date',
					dateFormat: 'DD.MM.YYYY HH:mm',
					correctFormat: true,
					defaultDate: '01.01.1900 00:01'
				})
			}
			if (Col=='CodeFileTypes') {
				 R.editor = 'select';
				 R.selectOptions = _.map(Catalogue.GetAll("filetype"),'name');
			}
			Cols.push(R);
		})
		var Translated = Tr("filemanager",Cols2Show);
		return {
			data:TableCells,
			headers:[Translated],
			columns:Cols,
		}
	}
  
  	self.OnFileChoose = function(event,xy){
  		var Info = self.table.getCellMeta(xy.row,xy.col);

  		if (Info.Type=='File'){
  			self.ChoosenAttach(MModels.Create("file",self.Files[xy.row]));
  		} else {
  			self.ChoosenAttach(null);
  		}
  	}

	self.RenderTable = function(){
		var selector = '.handsontable.single:visible';
		$(selector).empty();
		if (self.table) self.table = null;
		var DomPlace = $(selector)[0];
		var HandsonRenders = (new HandsonTableRenders.RenderController());
		HandsonRenders.RegisterRender("Tree",[/[0-9]*?,0$/], HandsonTableRenders.TreeRender);
		HandsonRenders.RegisterRender("Cell",[/[/[0-9]*?,(?![0]$)[0-9]*/],self.FileRender);
		var HandsonConfig = ({
	    	cells:HandsonRenders.UniversalRender,
	        fixedColumnsLeft: 0,
	        cellsParams:{},
	       	colHeaders: true,
	       	rowHeaders:false,
	       	stretchH: 'last',
	       	dblClickCell: self.EditAttach,
	       	beforeOnCellMouseDown: self.OnFileChoose,
	        tree:{
	            data:self.Files,
	            icon:function(){},
	            colapsed:CxCtrl.Context().CodeDoc+'FileManager'
	        },
	        colWidths:[400,300,120,100,100]
	    })
 		try{
            self.table.destroy();
            self.table = null;
        } catch(e){
            //console.log(e);
        }       
		self.table = new Handsontable(DomPlace, HandsonConfig);
		var Data = self.DataForTable();
		self.table.updateSettings(Data);
    	new HandsonTableHelper.HeaderGenerator(self.table);
    	new HandsonTableHelper.TreeView(self.table);
    	self.Files.forEach(function(FileInfo,IndexRow){
    		Data.columns.forEach(function(Col,IndexCol){
				self.table.setCellMetaObject(IndexRow,IndexCol,FileInfo);
    		})				
    	})
	    setTimeout(self.table.render,0);
	}	

	self.NewAttach = ko.observable(null);

	self.EditAttach =  function (row, col, instance) {
		var Meta = instance.getCellMeta(row, col);
		if (Meta.Type=='File'){
			var NA = MModels.Create("file",_.pick(Meta,['_id',"NameFile","File","SNameFile","NumDoc","CodeFileType","Comment",'CodeObj','CodeDoc','CodePeriod','YearData']));
			NA.File(NA.NameFile());
			self.NewAttach(NA);
			$('#attachDialog').modal('show');
			self.IsAttachShow(true);
			$('#attachDialog').on('hide.bs.modal', self.CleanNewAttach); 
		}
	}

	self.CreateNewAttach = function (){
		var Cx = CxCtrl.Context();
		var NA = MModels.Create("file",_.pick(Cx,['CodeObj','CodeDoc','CodePeriod','YearData']));		
		NA.YearData = Cx.Year;
		self.NewAttach(NA);
	}

	self.CleanNewAttach = function(){
		self.NewAttach(null);
		self.IsAttachShow(false);
		self.Error(null);
	}

	self.ShowAddAttachDialog = function(){
		self.CreateNewAttach();
		$('#attachDialog').modal('show');
		self.IsAttachShow(true);
		$('#attachDialog').on('hide.bs.modal',function(){
			$('#attachDialog').off('hide.bs.modal');
			self.CleanNewAttach();
		}); 
	}

	self.IsAttachShow = ko.observable(false);

	self.RemoveFile = function(data){
		var D = self.ChoosenAttach().toJS();
		swal({
            title: "",
            text: "Вы собираетесь удалить файл "+D.NameFile,
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Да, удалить!",
            cancelButtonText: "Отменить",
            closeOnConfirm: true
        },
        function () {
            self._remove(D);
        });
	}

	self._remove = function(data){
		self.rDelete(data._id,{Context:{CodeDoc:data.CodeDoc,CodeObj:data.CodeObj}},function(){
			self.Reload();
			self.CountAttaches();
		})
	}

	self.AddAttach = function(){
		if (!self.NewAttach().File()){
			return self.Error("Добавьте файл");
		}
		var File2Save = self.NewAttach().File();
		if (typeof File2Save =='object'){
			if (!self.NewAttach().NameFile()){
				self.NewAttach().NameFile(File2Save.name);
			}
		}
		MModels.SaveFileToGfs(File2Save,function(err,id){
			if (err) return self.Error(err);
			var File2Send = _.omit(self.NewAttach().toJS(),"File");
			if (id) File2Send = _.merge(File2Send,{HashCode:id});
            var Data2Send = {
            	File:File2Send
            }
            self.rPost("",Data2Send,function(data){
				$('#attachDialog').modal('hide');
				self.CleanNewAttach();	
				self.CountAttaches();
				self.Reload();
	    	})
		})
	}

	return self;
})

ModuleManager.Modules.FileManager = MFileManager;