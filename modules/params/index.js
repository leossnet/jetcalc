var MParams = (new function() {
   
    var self = new Module("params");

 
    self.BeforeHide = function(){
        self.UnSubscribe();
    }

    self.BeforeShow = function(){
        self.Subscribe();
        self.Show();
    }        

    self.ModelIsCreated = function(){}
    self.ModelIsLoaded = function(){}
    self.ModelIsSaved = function(){}

    self.IsAvailable = function(){
        return PermChecker.CheckPrivelegeAny(["IsParamSetTunner"]);
    }

    self.Init = function(done){
        return done && done();
    }

    self.SaveChanges = function(){
    }

    self.Show = function(done){
        if (!self.Mode()) return self.InitSetMode("Params");
        switch (self.Mode()){
            case "Params":
                ModelTableEdit.InitModel("param");
            break;
            case "ParamSets":
                ModelTableEdit.InitModel("paramset");
            break;            
            case "ParamKeys":
                ModelTableEdit.InitModel("paramkey");
            break;            
            case "ListDefinitions":
                ModelTableEdit.InitModel("listdefinition");
            break;            
            case "ParamGrp":
                ModelTableEdit.InitModel("paramgrp");
            break;
        }
        return done && done()
    }
        
  
    
    return self;
})





ModuleManager.Modules.Params = MParams;
