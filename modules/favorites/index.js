var MFavorites = ( new function(){

    var self =  new Module("favorites");

    self.UserFavs = {
        CodeDoc:ko.observableArray(),
        CodeObj:ko.observableArray(),
        CodeDiv:ko.observableArray(),
        CodeOtrasl:ko.observableArray(),
        CodeRegion:ko.observableArray(),
        CodeGrp:ko.observableArray(),
        CodePeriod:ko.observableArray()
    }

    self.Init = function(done){
        self.RefreshFavs(done);
    }

    self.Apply = function(Favs){
        Favs = Favs || {};
        for (var Field in Favs){
            if (self.UserFavs[Field]){
                self.UserFavs[Field](Favs[Field]);
            }
        }
    };

    self.RefreshFavs = function(done){  
        self.rGet("/",{},function (data) {
             self.Apply (data);
             return done && typeof done == 'function' && done();
        })
    }

    self.IsInFavorites = function(type,code){
        return (self.UserFavs[type]().indexOf(code)!=-1);
    }

    self.ModifyFavorites = function(type,code){
        if (self.UserFavs[type]().indexOf(code)==-1){
            self.AddToFavorites(type,code,self.RefreshFavs);
        } else {
            self.RemoveFromFavorites(type,code,self.RefreshFavs);
        }
    }

    self.AddToFavorites = function(type,code,done){
        self.rPut("/",{type:type,code:code},done||function(){});
    };

    self.RemoveFromFavorites = function(type,code,done){
        self.rDelete("/",{type:type,code:code},done||function(){});
    };

    return self;
})




ModuleManager.Modules.Favorites = MFavorites;