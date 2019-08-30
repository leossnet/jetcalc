var MModelStore = (new function() {
    
    var self = new Module("modelstore");
    self.InputString = ko.observable();
    

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
        switch (self.Mode()){
            case "MakeDemo":
                //ModelTableEdit.InitModel("sumgrp");
                self.InputString("Строка, выводимая в консоль браузера");
            break;            
        }
        return done && done()
    }

    self.LogTest = function(){
        console.log("Строка в поле ввода: '"+self.InputString()+"'");
    }

    
    return self;
})

ModuleManager.Modules.ModelStore = MModelStore;
