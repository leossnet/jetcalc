var MAFFormula = (new function(){
	var self = this;

	self.IsSaveAvailableFlag = ko.observable(false);

	self.IsLoading = ko.observable(false);

	self.IsSaveAvailable = function(){
		return self.IsSaveAvailableFlag() && PermChecker.CheckPrivelege("IsAFSaveAllow") && !MAggregate.IsWrongValuta();
	}


	self.base = "/api/modules/afformula/";

	self.UpdateLastCell = function(){
		var Cx = BlankDocument.table.getSelected();
		var M = BlankDocument.table.getCellMeta(Cx[0],Cx[1]);
		if (M.IsAFFormula){
			BlankDocument.LastCellFormula(M.Formula+" = "+M.CorrectValue);
			BlankDocument.LastCellType("AF");
		}
	}

	self.AFCellRender = function(instance, td, row, col, prop, value, CellInfo){
		if (CellInfo.IsAFFormula){
			if (CellInfo.IsCorrect){
				$(td).addClass("IsAFCorrect");
			} else {
				$(td).addClass("IsAFWrong");
			}
		}
	}


	self.Update = function(){
		self.IsLoading(true);
		$.getJSON(self.base+"save",{Context:CxCtrl.Context()},function(data){
			self.IsLoading(false);
			BlankDocument.Refresh();
		})
	}

  	self.CheckAF = function(){
		$.getJSON(self.base+"calculate",{Context:CxCtrl.Context()},function(data){
			if (data.err) return;
			if (_.isArray(data) && _.isArray(_.first(data))){
				var Table = MInput.table;
				var Meta = MInput.table.getCellsMeta();
				var Data = MInput.table.getData();
				var IndexedMeta = [];
				Meta.forEach(function(M,Ind){
					if (!IndexedMeta[M.row]) IndexedMeta[M.row] = [];
					IndexedMeta[M.row][M.col] = Ind;
				})
				var IsSaveAvailable = false;
				data.forEach(function(Row,RowInd){
					Row.forEach(function(Cell,ColInd){
						if(Cell && Cell!=''){
							var M  = Meta[IndexedMeta[RowInd][ColInd]];
							var OV = Data[RowInd][ColInd];
							var CI = Cell;
							M.IsAFFormula = true;
							M.Formula = Cell.Formula;
							M.IsCorrect = true
							M.CorrectValue = OV;
							if (CI.Value != OV){
								M.IsCorrect = false;
								M.CorrectValue = CI.Value;
								IsSaveAvailable = true;
							}
						}
					})
				})
				self.IsSaveAvailableFlag(IsSaveAvailable);
				try{
					MInput.HandsonRenders.RegisterRender("AFCell",[/[0-9]*?,(?![0,1]$)[0-9]*/],self.AFCellRender);
					MInput.table.render()
				} catch(e){
					console.error("AF Render Failed",e);
				}
			}
		})
	}
	return self;
})

ModuleManager.Modules.AFFormula = MAFFormula; 



ModuleManager.Events.on("modulesinited",function(){
	if (MInput){
	    MInput.Events.addListener("rendercells",function(){
	        setTimeout(MAFFormula.CheckAF,0);
	    })
	}  
	if (CxCtrl)	{
		CxCtrl.Events.addListener("documentchanged",function(){
			MAFFormula.IsSaveAvailable(false);
		})
	}
	if (BlankDocument)	{
		BlankDocument.Events.addListener("LastCellUpdate",function(){
			MAFFormula.UpdateLastCell();
		})
	}
})
