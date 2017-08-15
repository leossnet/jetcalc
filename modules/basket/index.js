var MBasket = (new function() {
   
    var self = new Module("basket");

 
    self.BeforeHide = function(){
        
    }

    self.BeforeShow = function(){
        
        self.Show();
    }        

    self.Show = function(done){
        if (!self.Mode()) return self.Mode("Links");

        
    }
        
  
    
    return self;
})





ModuleManager.Modules.Basket = MBasket;
