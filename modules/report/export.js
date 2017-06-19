var WidthFix = function(table,defaultWidth,maxWidth,fixed){
    var defaultWidth = defaultWidth, fixed = fixed ||[]; 
    var _wc = function(table,colIndex){
        var texts = table.getDataAtCol(colIndex);
        var value = defaultWidth; 
        texts && texts.forEach(function(T,I){
            if (I){
                var Text = table.getCopyableText(I,colIndex,I,colIndex).trim();
                value = Math.max(value,(9*Text.length));
            }
        })
        return value;
    }
    var widths = [];
    var RealCols = table.countCols();
    for (var i = 0; i<RealCols; i++){
        if (fixed[i]) {
          widths.push(fixed[i]); 
        } else {
          var w2c = _wc(table,i);
          if (maxWidth){
            w2c = Math.min(w2c,maxWidth);
          }
          widths.push(w2c);
        }
    }
    table.updateSettings({colWidths:widths});
    table.render();
}

var BlankDocument = (new function(){
    var self = this;
    
    self.UpdateLastCell = function(){
        return;
    }
    
    return self;
})

var ExportTableWorker = (new function() {
	
	var self = this;

	self.baseConfig = {
        autoRowSize:false,
        colHeaders:false,
        currentColClassName:"currentCol",
        currentRowClassName:"currentRow",
        fixedRowsTop:0,
        manualColumnResize:false,
        minSpareCols:0,
        minSpareRows:0,
        rowHeaders:false,
        renderer: function(instance, td, row, col, prop, value, CellInfo){
            if(! $.isNumeric(value)){
                td.innerHTML = value;
                return;
            }
            if ((value+'')!=0 && (value+'')!='NaN'){
                var Formated = numeral(value).format().replace(',', ' ');
                if (Formated!=0 && Formated!='NaN'){
                    td.innerHTML = Formated;
                }
            }
            else {
                if (!CellInfo.IsRealNull){
                    td.innerHTML = CellInfo.Value!=void(0) && CellInfo.Value!=0? CellInfo.Value:'';
                } else {
                    td.innerHTML = CellInfo.Value!=void(0)? CellInfo.Value:'';
                }
            }
        }  
    }
    
    self.IndexedCells = {};
    
	self.LoadJSON = function(filename, callback){
        $.getJSON('/tmp/' + filename + '.json', function(json) {
            try{
                self.Structure = json.Structure;
                self.Cells = json.Cells;
                return callback();
            }
            catch(e){}
        });
    }
    
    self.RenderStructure = function(done){
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
        //HandsonRenders.RegisterRender("Cell",[/[0-9]*?,(?![0,1]$)[0-9]*/],HandsonTableRenders.CellRender);
        HandsonConfig = _.merge(_.clone(self.baseConfig),{
            data:RealData,
            colHeaders: Header
        })
        self.CreateTable('.handsontable.single.report', HandsonConfig, function(){
            new WidthFix(self.table, 60, 60, [40, 250]);
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
    
    self.RenderCells = function(done){
        self.Calculate = self.Cells.Cells;
        var Metas = self.table.getCellsMeta();
        var Data = self.table.getData();
        Metas.forEach(function(Me){
            if (Me && Me.Cell){
                Me = _.merge(Me,self.Calculate[Me.Cell]);
                if (Data[Me.row] && self.Calculate[Me.Cell]){
                    Data[Me.row][Me.col] = self.Calculate[Me.Cell].Value||0;
                }
            }
        })
        self.table.updateSettings({data:Data});
        Metas.forEach(function(Me){
            if (Me && Me.Cell){
                self.table.setCellMetaObject(Me.row,Me.col,Me);
                if (Me.IsEditablePrimary) Me.readonly = false;
            }
        })
        self.table.render();
        return done();
    }
    
    self.CreateTable = function(place, HandsonConfig, done){
         var DomEl = $(place)[0];
         if(!DomEl){
             setTimeout(function(){
                 self.CreateTable(place, HandsonConfig, done)
             }, 500)
             return;
         }
         self.table = new Handsontable(DomEl, HandsonConfig);
         return done();
    }
    
    self.Build = function(){
        var args = window.location.search.split('?')[1];
        var filename = args.split('&')[0].split('=')[1];
        self.LoadJSON(filename, function(){
            self.RenderStructure(function(){
                self.RenderCells(function(){})
            })
        })
    }
    
    return self;
})

