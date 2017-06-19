var MOlap = (new function() {
	
	var self = this;

	self.IsAvailable = function(){
		var Doc = null;
		if (CxCtrl.CodeDoc())
      Doc = MFolders.FindDocument(CxCtrl.CodeDoc());

    return Doc && Doc.IsOlap;
	}

	self.IndexedCells = {};

	self.RenderStructureAfterLoad = function(done){
		var Header = self.Structure.Header;
		var colspan = _.last(_.first(self.Structure.Header)).colspan || 1;
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
        var FixedLeft = 1;
        var HandsonRenders = new HandsonTableRenders.RenderController();
        HandsonRenders.RegisterRender("Tree",[/[0-9]*?,0$/], HandsonTableRenders.TreeRender);
        HandsonRenders.RegisterRender("Cell",[/[0-9]*?,(?![0]$)[0-9]*/],HandsonTableRenders.CellRender);
        HandsonConfig = _.merge(_.clone(self.baseConfig),{
            data:RealData,
            cells:HandsonRenders.UniversalRender,
            fixedColumnsLeft: 1,
            viewportColumnRenderingOffset:1000,
            rowHeaders:true,
            headers: Header,
            tree:{
                data:TreeArr,
                icon:function(){},
                colapsed:self.Context.CodeDoc+"_olap"
            }
        });
        FixedColsWidths = [400];   
        self.CreateTable('.handsontable.single.olap', HandsonConfig,function(){
	        new HandsonTableHelper.HeaderGenerator(self.table);
	        var MinWidth = 200;
	        if (colspan>1) MinWidth = 100;
	        new HandsonTableHelper.WidthFix(self.table,MinWidth,MinWidth,FixedColsWidths);
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

ModuleManager.Modules.Olap = MOlap;