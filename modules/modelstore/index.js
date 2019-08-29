var MModelStore = (new function() {
    
    var self = new Module("modelstore");

    self.IsAvailable = function(){
        return PermChecker.CheckPrivelege("IsMakedemo");
    }

    self.BeforeShow = function(){
        self.Show();
    }


    self.SaveChanges = function(){

    }


    self.Show = function(done){
        if (!self.Mode()) return self.InitSetMode("MakeDemo");
        // switch (self.Mode()){
        //     case "MakeDemo":
        //         ModelTableEdit.InitModel("sumgrp");
        //     break;            
        // }
        return done && done()
    } 

    self.Test = function(done){
        self.console.log("Это тест!");
    }

    
    return self;
})

ModuleManager.Modules.ModelStore = MModelStore;
