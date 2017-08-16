var MBasket = (new function() {
   
    var self = new Module("basket");


    self.IsAvailable = function(){
        return PermChecker.CheckPrivelege("IsBasketManager");
    }

    self.MainModel = ko.observable("colset");
    self.MainCode = ko.observable("cs_val_predmes");
    self.LinkModel = ko.observable("colsetcol");

    self.Links = ko.observable(null);

    self.GroupsClosed = ko.observableArray();

    self.Close = function(data){
        if (!self.IsClosed(data)){
            self.GroupsClosed.push(data);
        } else {
            self.GroupsClosed.remove(data);
        }
    }

    self.IsClosed = function(data){
        return self.GroupsClosed().indexOf(data)!=-1;
    }

    self.SearchLinks = function(){
        self.rGet("searchlinks",{Model:self.MainModel(),Code:self.MainCode(),Link:self.LinkModel()},function(data){
            self.Links(data);
        })
    }

    self.RestoreLinks = function(data){
        self.rPut("searchlinks",{Model:self.MainModel(),Code:self.MainCode(),Link:self.LinkModel(),Date:data},function(data){
            self.SearchLinks();
        })
    }

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
