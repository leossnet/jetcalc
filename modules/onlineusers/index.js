var MOnlineUsers = (new function(){

    var self = new Module("onlineusers");
    
    self.IsToggled = ko.observable(true);

    self.IsAvalable = function(){
        return PermChecker.CheckPrivelege("IsUserActivityViewer"); 
    }

    self.BrowserIcon = function(name){
        var name = name.toLowerCase();
        return {
            edge:'fa-edge purple',
            chrome:'fa-chrome green',
            firefox:'fa-firefox orange',
            opera:'fa-opera red',
        }[name];

    }

    self.Init = function(done){
        MSocket.RegisterEvent("onlineusers_count", self.Load);
        MSocket.Start("onlineusers_count");
        MSocket.RegisterEvent("onlineusers_url", self.Actions);
        self.Load();
        return done();
    }

    self.Users = ko.observable();

    self.Actions = function(data){
        console.log(data);
    }


    self.ToggleBox = function(){
        self.IsToggled(!self.IsToggled());
        if (self.IsToggled()){
            ModuleManager.Close("OnlineUsers");
            MSocket.Stop("onlineusers_url");
        } else {
            ModuleManager.Open("OnlineUsers");
            MSocket.Start("onlineusers_url");
            self.Load();
        }
    } 

    self.Count = ko.observable(0);

    self.Load = function(){
        if (self.IsToggled()){
            self.rGet("count",{},function(data){
                self.Count(data);
            })
        } else {
            self.rGet("info",{},function(data){
                self.Count(_.keys(data).length);
                var Groupped = {};
                for (var U in data){
                    var Info = data[U];
                    if (!Groupped[Info.User.CodeObj]) Groupped[Info.User.CodeObj] = [];
                    Groupped[Info.User.CodeObj].push(_.merge(Info,{Url:''}));
                }
                self.Users(Groupped);
            })
        }
    }



    return self;
})

ModuleManager.Modules.OnlineUsers = MOnlineUsers;