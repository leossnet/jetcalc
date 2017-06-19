var MDebugFormula = (new function(){

	var self = this;

  self.LastCoords = [];

  self.IsDebugAvailable = function(){
    var CellType = BlankDocument.LastCellType();
    return (CellType=="FRM");
  }

  self.DebugCell = function(){
    var Cell = BlankDocument.LastCell();
    if (self.IsDebugAvailable){
      self.Debug(Cell);
    }
  }

	self.Debug = function(CellName){
        if (!CellName || !(CellName+'').indexOf('$')==-1){
            swal('','Выберите ячейку для отладки','error');
        }
    		FormulaEditor.History([]);
        FormulaEditor.History.push(CellName);
        FormulaEditor.CurrentCell(CellName);
        FormulaEditor.Do(function(){
           	FormulaEditor.IsPopupShowned(true);
          	$('#debugFormula').modal('show');
           	$('#debugFormula').unbind('hide.bs.modal');
           	$('#debugFormula').on('hide.bs.modal', function (e) {
        				BlankDocument.table.selectCell(BlankDocument.LastCoords[0],BlankDocument.LastCoords[1]);
        				FormulaEditor.IsPopupShowned(false);
    			  });
        })
  }

  self.UseRowFormula = function(){
    var Info = FormulaEditor.Info();
    FormulaEditor.Formula(Info.RowFormula);
  }

  self.UseColFormula = function(){
    var Info = FormulaEditor.Info();
    FormulaEditor.Formula((Info.ColFormula+''));
  }

	return self;
})

ModuleManager.Modules.DebugFormula = MDebugFormula; 

BlankDocument.Events.addListener("click",function(data){
  if (data.altKey){
    MDebugFormula.DebugCell();
  }
})

BlankDocument.Events.addListener("key",function(data){
	if (data.keyCode==115){
	   MDebugFormula.DebugCell();
	}
})

