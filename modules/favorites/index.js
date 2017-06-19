var MFavorites = ( new function(){

    var self = this;


    self.base = "/api/modules/favorites"; 


    self.UserFavs = {
        CodeDoc:ko.observableArray(),
        CodeObj:ko.observableArray(),
        CodeDiv:ko.observableArray(),
        CodeOtrasl:ko.observableArray(),
        CodeRegion:ko.observableArray(),
        CodeGrp:ko.observableArray(),
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
        $.ajax({
            url:self.base,
            success:function (data) {
                 self.Apply (data);
                 return done && done();
            }               
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
        $.ajax({
            url:self.base,
            type:'put',
            data:{
                type:type,
                code:code
            },
            success:function () {
                return done();  
            }
        })  
    };

    self.RemoveFromFavorites = function(type,code,done){
        $.ajax({
            url:self.base,
            type:'delete',
            data:{
                type:type,
                code:code
            },
            success:function () {
                return done();  
            }
        })
    };

    return self;
})




ModuleManager.Modules.Favorites = MFavorites;