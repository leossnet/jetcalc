var MTransaction = (new function() {
   
    var self = new Module("transaction");

 
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
        return PermChecker.CheckPrivelegeAny(["IsTransactionTunner"]);
    }

    self.Init = function(done){
        return done && done();
    }

    self.SaveChanges = function(){
    }

    self.Show = function(done){
        if (!self.Mode()) return self.InitSetMode("BillRelations");
        switch (self.Mode()){
            case "BillRelations":
                ModelTableEdit.InitModel("billrelation");
            break;
            case "DocBills":
                ModelTableEdit.InitModel("docbill");
            break;            
            case "DocRelations":
                ModelTableEdit.InitModel("docrelation");
            break;            
            case "ColRelations":
                ModelTableEdit.InitModel("colrelation");
            break;            
            case "Bills":
                ModelTableEdit.InitModel("bill");
            break;            
            case "Prods":
                ModelTableEdit.InitModel("prod");
            break;           
            case "Dogovors":
                ModelTableEdit.InitModel("dogovor");
            break;            
            case "DogovorTypes":
                ModelTableEdit.InitModel("dogovortype");
            break;
        }
        return done && done()
    }
        
  
    
    return self;
})





ModuleManager.Modules.Transaction = MTransaction;