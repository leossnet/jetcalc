var MRows = (new function() {
    
    var self = new Module("rows");

    self.IsAvailable = function(){
        return PermChecker.CheckPrivelege("IsRowEditor");
    }

    self.BeforeShow = function(){
        self.Show();
    }


    self.SaveChanges = function(){

    }


    self.Show = function(done){
        if (!self.Mode()) return self.InitSetMode("Root");
        switch (self.Mode()){
            case "Root":
                ModelTableEdit.InitModel("row",{CodeRow:1},{CodeParentRow:{$in:[null,""]}});
            break;            
            case "SumGrp":
                ModelTableEdit.InitModel("sumgrp");
            break;            
            case "Measure":
                ModelTableEdit.InitModel("measure",{NumMeasure:1});
            break;            
            case "Format":
                ModelTableEdit.InitModel("format");
            break;             
            case "Style":
                ModelTableEdit.InitModel("style");
            break;             
            case "Tags":
                ModelTableEdit.InitModel("tag");
            break;            
        }
        return done && done()
    }  

    
    return self;
})

ModuleManager.Modules.Rows = MRows;
