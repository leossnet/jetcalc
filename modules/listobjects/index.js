var MListobjects = (new function() {
    
    var self = new Module("listobjects");

    self.IsAvailable = function(){
        return PermChecker.CheckPrivelege("IsListobjectsEditor");
    }

    self.BeforeShow = function(){
        self.Show();
    }


    self.SaveChanges = function(){

    }


    self.Show = function(done){
        if (!self.Mode()) return self.InitSetMode("SumGrp");
        switch (self.Mode()){
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
            case "Models":
                ModelTableEdit.InitModel("model");
            break;            
            case "Languages":
                ModelTableEdit.InitModel("language");
            break;            
            case "Langhubs":
                ModelTableEdit.InitModel("langhub");
            break;            
        }
        return done && done()
    }  

    
    return self;
})

ModuleManager.Modules.Listobjects = MListobjects;
