var MReport = (new function() {
	
	var self = this;

	self.IsAvailable = function(){
        var Doc = null;
        if (CxCtrl.CodeDoc())
		  Doc = MFolders.FindDocument(CxCtrl.CodeDoc());
        return Doc && !Doc.IsPresent ; 
	}

	self.IndexedCells = {};

	self.RenderStructureAfterLoad = function(done){
		var Header = self.Structure.Header;
		var TableData = self.Structure.Cells;
		var RealData = []; self.IndexedCells = {};
		TableData.forEach(function(Row,x){
			var NewRow = []; self.IndexedCells[x] = {};
			Row.forEach(function(Cell,y){
				if (_.isObject(Cell)){
					self.IndexedCells[x][y] = Cell;
					NewRow.push("");
				} else {
					self.IndexedCells[x][y] = null;
					NewRow.push(Cell);
				}
			})
			RealData.push(NewRow);
		})
		var TreeArr = self.Structure.Tree;
        var FixedLeft = 2; FixedColsWidths = [50,400];
        var Doc = MFolders.FindDocument(CxCtrl.CodeDoc()) || {};
        var HandsonRenders = new HandsonTableRenders.RenderController();        
        if (Doc.IsObjToRow){
            FixedLeft = 1; FixedColsWidths = [400];
            HandsonRenders.RegisterRender("Tree",[/[0-9]*?,0$/], HandsonTableRenders.TreeRender);
            HandsonRenders.RegisterRender("Cell",[/[0-9]*?,(?![0]$)[0-9]*/],HandsonTableRenders.CellRender);
        } else {
            HandsonRenders.RegisterRender("Code",[/[0-9]*?,0$/], HandsonTableRenders.ReadOnlyText);
            HandsonRenders.RegisterRender("Tree",[/[0-9]*?,1$/], HandsonTableRenders.TreeRender);
            if (Doc.IsShowMeasure){
                HandsonRenders.RegisterRender("Measure",[/[0-9]*?,2$/], HandsonTableRenders.ReadOnlyText);
                HandsonRenders.RegisterRender("Cell",[/[0-9]*?,(?![0,1,2]$)[0-9]*/],HandsonTableRenders.CellRender);    
            } else {
                HandsonRenders.RegisterRender("Cell",[/[0-9]*?,(?![0,1]$)[0-9]*/],HandsonTableRenders.CellRender);    
            }
            
        }
        if (Doc.IsShowMeasure){
            FixedLeft++;FixedColsWidths.push(80);
        }
        HandsonConfig = _.merge(_.clone(self.baseConfig),{
            data:RealData,
            cells:HandsonRenders.UniversalRender,
            fixedColumnsLeft: FixedLeft,
            headers: [
                Header
            ],
            tree:{
                data:TreeArr,
                icon:function(){},
                colapsed:self.Context.CodeDoc+'_report'
            }
        })
        self.CreateTable('.handsontable.single.report', HandsonConfig, function(){
            new HandsonTableHelper.HeaderGenerator(self.table);
            new HandsonTableHelper.WidthFix(self.table,100,200,FixedColsWidths);
            new HandsonTableHelper.DiscretScroll(self.table);
            new HandsonTableHelper.TreeView(self.table);
            new HandsonTableHelper.RegisterKeys(self.table);
            var Metas = self.table.getCellsMeta();
            Metas.forEach(function(Me){
                if (Me && self.IndexedCells[Me.row][Me.col]){
                    Me = _.merge(Me,self.IndexedCells[Me.row][Me.col]);
                }
            })
            self.table.render();
            return done();
        })
	}

	self = _.merge(new BaseDocPlugin(),self);
	return self;
})

ModuleManager.Modules.Report = MReport;