var HTIController = (new function(){
    
    var self = this;


    self.Tables = {};

    self.createRetries = 10;
    self.createRetriesTimeout = 100;

    self.Create = function(ModuleName, TableName, DomPlace, Config, done){
        if (!self.Tables[ModuleName]) self.Tables[ModuleName] = {};
        if (self.Tables[ModuleName][TableName] && self.Tables[ModuleName][TableName].Table) {
            console.log("TABLE UPDATED");
            self.Update(ModuleName, TableName, Config);
            return done(null,self.Tables[ModuleName][TableName].Table);
        };
        var Dom = $(DomPlace); self.createRetries = 10;
        self._create(Dom, Config, function(err,Table){
            if (err) throw err;
            self.Tables[ModuleName][TableName] = {Table:Table,Dom:Dom};
            console.log("Table Registered ",self.Tables);
            return done(null, Table);
        })
    }

    self.Update = function(ModuleName, TableName, Config){
        if (self.Tables[ModuleName][TableName] && self.Tables[ModuleName][TableName].Table) {
            self.Tables[ModuleName][TableName].Table.updateSettings(Config);
        }
    }

    self._create = function(Dom, Config, done){
        if (--self.createRetries<=0) throw "Нет дом элемента для таблицы";
        if (_.isEmpty(Dom)){            
            setTimeout(function(){
                self._create(Dom, Config, done);
            }, self.createRetriesTimeout);
        }
        var T = new Handsontable(Dom[0], Config);
        return done(null,T);
    }

    self.Destroy = function(ModuleName,TableName){
        if (self.Tables[ModuleName] && self.Tables[ModuleName][TableName] && self.Tables[ModuleName][TableName].Table){
            self.Tables[ModuleName][TableName].Table.destroy();
            self.Tables[ModuleName][TableName].Dom.empty();
            delete self.Tables[ModuleName][TableName];
        }
    }

    self.throttleTimer = null;
    self.throttleTimeout = 100;
    self._render = function(Instance){
        if (self.throttleTimer){
            clearTimeout(self.throttleTimer); self.throttleTimer = null;
        }
        self.throttleTimer = setTimeout(function(){
            Instance.render();
            clearTimeout(self.throttleTimer); self.throttleTimer = null;   
        },self.throttleTimeout);
    }

    self.Render = function(ModuleName,TableName){
        var Table = null;
        try{
            Table = self.Tables[ModuleName][TableName].Table;
        }catch(e){
            throw "Таблица "+ModuleName+" "+TableName+" не существует";
        }
        self._render(Table);        
    }

    return self;
})




var ModuleManager = (new function(){

    var self = this;

    self.IsLoaded = ko.observable(false);
    self.Events = new EventEmitter();
    self.Modules = {};
    self.ModulesConfigs = [];

    self.Choosed = ko.observable();

    self.IsChoosed = function(name) {
        return (name==self.Choosed());
    }

    self.IsInstalled = function(ModuleName){
        return !_.isEmpty(ModuleManager.Modules[ModuleName]);
    }

    self.Opened = ko.observable();
    self.Open = function(ModuleName){
        if (self.Opened() && self.Opened()!=ModuleName){
            self.Modules[self.Opened()].ToggleBox();
        }
        self.Opened(ModuleName);
    }
    self.Close = function(ModuleName){
        self.Opened(null);
    }
    self.ForceClose = function(){
        var M = self.Opened();
        if (M) self.Modules[M].ToggleBox();
    }

    self.Start = [];
    self.Initer = [];
    self.GuestIniter = [];

    self.Subscriptions = [];

    self._isLoading = null;
    self.IsLoading = ko.observable(false);


    self.SetModule = function(){
        var Route = MBreadCrumbs.CurrentRoute();
        var TestId = "", F = null;
        if (Route.indexOf("adminpage")!=-1){
            F = _.find(self.AdminPage(),{id:Route[Route.indexOf("adminpage")+1]});
            if (F) self.Choosed(F.id); else self.Choosed("adminpage");
        } else if (Route.indexOf("docview")!=-1){
            F = _.find(self.DocTabs(),{id:Route[Route.indexOf("docview")+2]});
            if (F) self.Choosed(F.id);
        } else {
            var pageInfo = {};
            try{
                pageInfo = pager.getActivePage().valueAccessor();
            }catch(e){
                ;
            }
            var needed = _.first(_.filter(ModuleManager.ModulesConfigs,function(M){
                 return !_.isEmpty(M.config.pages) && _.find(M.config.pages,{id:pageInfo.id});
            }))
            if (needed){
                F = needed.config;
                self.Choosed(F.id);    
            } else {
                self.Choosed(null);    
            }
        }
        if (self.Choosed() && F && self.Modules[F.class_name].ChangeModPath){
            self.Modules[F.class_name].ChangeModPath();
        }
        if (self.Choosed() && F && self.Modules[F.class_name].IsLoading){
            if (self._isLoading) self._isLoading.dispose();
            self._isLoading = self.Modules[F.class_name].IsLoading.subscribe(self.IsLoading);
        }
    }

    self.Load = function(done) {
        var Debug = {
            start : [],
            guest : [],
            auth  : []
        }
        if(self.IsLoaded()) return done(null);
        $.getJSON('/api/modules',function(modules){
            self.ModulesConfigs = modules;
            var Initer = [], GIniter = [], SIniter = [];
            self.ModulesConfigs.forEach(function(M){
                if (!self.Modules[M.config.class_name]){
                    console.log(M.config.class_name," Нет в списке");
                } else if (M.config.initial_load && self.Modules[M.config.class_name].Init){
                    if (M.config.start_load){
                        Debug.start.push(M.config.id);
                        SIniter.push(self.Modules[M.config.class_name].Init);
                    }                        
                    else if (M.config.guest_load) {
                        Debug.guest.push(M.config.id);
                        GIniter.push(self.Modules[M.config.class_name].Init);
                    } else {
                        Debug.auth.push(M.config.id);
                        Initer.push(self.Modules[M.config.class_name].Init);
                    }
                }
            })
            self.Start = SIniter;
            self.Initer = Initer;
            self.GuestIniter = GIniter;
            self.IsLoaded(true);
            return done && done();
        })
    }

    self.Init = function(done){
        self.StartInit(function(){
            self.GuestInit(function(){
                if (typeof MBreadCrumbs != 'undefined'){
                    MBreadCrumbs.Events.on("pagechanged",self.SetModule);
                }
                if (MSite.Me()) {
                    self.AuthInit(done);   
                } else {
                    self.Events.emit("modulesinited");  
                    return done();
                }            
            })
        })
    }
    
    self.AuthInit = function(done){
        if (!self.Initer.length) return done();
        async.each(self.Initer,function(f,cb){
            f(cb);
        },function(err){
            self.IsLoaded(true);
            self.Events.emit("modulesinited");
            return done && done();
        })
    }

    self.StartInit = function(done){
        if (!self.Start.length) return done();
        async.each(self.Start,function(f,cb){
            f(cb);
        },function(err){
            return done && done();
        })
    }

    self.GuestInit = function(done){
        if (!self.GuestIniter.length) return done();
        async.each(self.GuestIniter,function(f,cb){
            f(cb);
        },function(err){
            self.IsLoaded(true);
            return done && done();
        })
    }

    self.CheckAvailable = function(data){

        var Cl = ModuleManager.Modules[data.class_name];
        if (Cl && Cl.IsAvailable && Cl.IsAvailable()){
            return true;
        }
        return false;
    }
    
    self.Pages = function(){
        return _.filter(self.AllPages(),function(M){
            return !M.guest;
        });
    }

    self.GuestPages = function(){
        return _.filter(self.AllPages(),{guest:true});
    }


    self.LeftMenu = function(){
        return self._filter("leftmenu");
    }

    self.RightMenu = function(){
        return self._filter("rightmenu");
    }

    self.IsLeftMenu = function(){
        return self.LeftMenu().length>0;
    }

    self.IsRightMenu = function(){
        return self.RightMenu().length>0;
    }

    self.AdminPageInner = function(){
        return self._filter("adminplugin");
    }

    self.AdminPage = function(){
        return self._filter("adminpage");
    }
    
    self.HomePage = function(){
        return self._filter("homepage");
    }

    self.StartPageInner = function(){
        return self._filter("homepage");
    }

    self.DocumentToolButtons = function(){
        return self._filter("toolbutton");
    }

    self.TopMenu = function(){
        return self._filter("topmenu");
    }

    self.DocTabs = function(){
        return self._filter("documentpage");
    }


    self._filter = function(type){
        return _.sortBy(_.map(
                    _.filter(
                    ModuleManager.ModulesConfigs, function(M){
                        return M.config.places && M.config.places[type];
                    })
                    ,"config")
                ,"sort_index");
    }


    self.AdminPagesWithParams = function(){
        var Result = [];
        var AdminPlugins = self.AdminPage();
        AdminPlugins.forEach(function(plugin) {
            var breadcrumbs = {
                path:"/adminpage/" + plugin.id,
                title:Tr(plugin.id)
            }
            var Cl = ModuleManager.Modules[plugin.class_name];
            if (Cl.Mode){
                breadcrumbs.subtitle = Cl.Mode;
            }
            Result.push({
                id          : plugin.id,
                path        : "/adminpage/" + plugin.id,
                title       : plugin.title,
                ifmodule    : plugin.id,
                sourceOnShow: "/modules/" + plugin.id + "/index.html",
                beforeShow  : Cl.BeforeShow || function() {},
                beforeHide  : Cl.BeforeHide || function() {},
                breadcrumbs : breadcrumbs
            });
        })    
        return Result;
    }

    self.AllPages = function(){
        var pages = [];
        _.map(ModuleManager.ModulesConfigs,"config").forEach(function(MC){
            if (MC.pages){
                MC.pages.forEach(function(page){
                    if (!page.source && !page.sourceOnShow){
                        page = _.merge(page,{sourceOnShow:"/modules/"+MC.id+"/"+page.id+".html"})
                    }
                    pages.push(page);
                })
            }
        })
        return pages;
    }

    self.DocPagesWithParams = function(){
        var Result = [];
        var DocPlugins = self.DocTabs();
        DocPlugins.forEach(function(plugin) {
            var Cl = ModuleManager.Modules[plugin.class_name];
            var Page = {
                id          : plugin.id,
                title       : CxCtrl.TabName()+". "+plugin.title,
                ifmodule    : plugin.id,
                class_name  : plugin.class_name,
                sourceOnShow: "/modules/" + plugin.id + "/index.html",
                beforeShow  : Cl.BeforeShow || function() {},
                afterShow   : CxCtrl.AfterTypeShow.bind(null,plugin.id),
                beforeHide  : Cl.BeforeHide || function() {},
                nameParam   : CxCtrl.PageName 
            };
            Result.push(Page);
        })    
        return Result;
    }

    return self;
})


var Module = function(id){

    var self = this;

    self.IsAvailable = function(){
        return true;
    }

    self.base = '/api/modules/'+id+'/';
 
    self.Error = ko.observable(null)
    self.IsLoading = ko.observable(false);


    self._isLoading = null;
    self._error = null;


    self.CxChange = function(){

    }

    self.SaveChanges = function(){
        //console.log("saving...",id);
    }

    self.SubscribeDoc = function(){
        CxCtrl.Events.on("documentchanged",self.CxChange);
        CxCtrl.Events.on("contextchanged",self.CxChange);
        MSite.Events.on("save",self.SaveChanges);

    }

    self.UnSubscribeDoc = function(){
        CxCtrl.Events.off("documentchanged",self.CxChange);
        CxCtrl.Events.off("contextchanged",self.CxChange);
        MSite.Events.off("save",self.SaveChanges);
    }


    self.ModelIsLoaded = function(){};
    self.ModelIsSaved = function(){};
    self.ModelIsCreated = function(){};
    self.ModelIsDeleted = function(){};


    self.Mode = ko.observable();

    self.Mode.subscribe(function(V){
        //console.log("Mode is changed for module ",id);
        self.ChangeModPath();
        self.Show();
    });

    self.InitSetMode = function(Value){
        var Q = window.location.search.queryObj();
        var Init = Q.Mode || Value;
        self.Mode(Init);   
    }

    self.Show = function(){

    }

    self.ChangeModPath = function(){
        var Current = self.Mode();
        if (_.isEmpty(Current) || ModuleManager.Choosed()!=id) return;
        var Query = {};
        if (!_.isEmpty(window.location.search)){
            Query = window.location.search.queryObj()    
        }
        Query.Mode = Current;
        var state = window.location.origin + window.location.pathname + toQueryString(Query);
        history.replaceState({},'',state);
    }

    self.Subscribe = function(){
        ModelTableEdit.Events.on("modelloaded",self.ModelIsLoaded);
        ModelTableEdit.Events.on("modelsaved",self.ModelIsSaved);
        ModelTableEdit.Events.on("modelcreated",self.ModelIsCreated);
        ModelTableEdit.Events.on("modeldeleted",self.ModelIsDeleted);
        self._error     = ModelTableEdit.Error.subscribe(self.Error); 
        self._isLoading = ModelTableEdit.IsLoading.subscribe(self.IsLoading); 
    }

    self.UnSubscribe = function(){
        ModelTableEdit.Events.off("modelloaded",self.ModelIsLoaded);
        ModelTableEdit.Events.off("modelsaved",self.ModelIsSaved);
        ModelTableEdit.Events.off("modelcreated",self.ModelIsCreated);
        ModelTableEdit.Events.off("modeldeleted",self.ModelIsDeleted);
        if (self._error) self._error.dispose();
        if (self._isLoading) self._isLoading.dispose();
    }

    self.BeforeShow = function(){
        
    }

    self.BeforeHide = function(){

    }

    self.Init = function(done){
        return done && done();
    }

// Для HandsonTable


    self.CreateHTable = function(TableName, DomPlace, Config, done){
        HTIController.Create(id,TableName,DomPlace, Config, done);
    }

    self.DestroyHTable = function(TableName){
        HTIController.Destroy(id,TableName);
    }

    self.RenderHTable = function(TableName){
        HTIController.Render(id,TableName);  
    }







    self.ProgressMessage     = ko.observable("");
    self.ProgressCurrentLine = ko.observable(0);
    self.ProgressLines       = ko.observable(0);
    self.Progress            = ko.observable(0);

    self.ProgressBarOn       = ko.observable(false);
   
    self.OnProgress = function(data){
        self.ProgressLines(data.Lines);
        self.ProgressCurrentLine(data.Line);
        self.Progress(data.Progress);
        self.ProgressMessage(data.Message);
    }

    self._request = function(method,urlpart,data,done){
        self.Error(null); self.IsLoading(true);
        $.ajax({
            url:self.base+urlpart,
            method:method,
            data:data,
            success:function(data){
                self.IsLoading(false);
                if (data.err) {
                    return self.Error(data.err);   
                }
                if (data.progressbar){
                    self.IsLoading(true);
                    self.ProgressMessage(""); self.ProgressCurrentLine(0); self.Progress(0);self.ProgressCurrentLine(0);
                    self.ProgressBarOn(true);
                    ProgressBar.Create(data.progressbar,self.OnProgress, function(){
                        self.IsLoading(false); self.ProgressBarOn(false); done();
                    });
                } else {
                    return done && done(data);
                }
            },
            error:function(data){
                self.IsLoading(false);
            }
        })
    }

    self.rPost = function(urlpart,data,done){
        self._request("post",urlpart,data,done);
    }

    self.rGet = function(urlpart,data,done){
        self._request("get",urlpart,data,done);
    }

    self.rPut = function(urlpart,data,done){
        self._request("put",urlpart,data,done);
    }

    self.rDelete = function(urlpart,data,done){
        self._request("delete",urlpart,data,done);
    }

    self.rPing =  function(urlpart){
        self._request("get",urlpart,{},function(){});
    }

    return self;
}


MSite.Events.on("initialnavigate",function(){
    if (window.location.pathname!="/error") return;
    var Q = window.location.search.queryObj();
    if (!Q.Module) return;
    var module   = Q.Module;
    var mode     = Q.Mode;
    var redirect = Q.Redirect;
    try{
        ModuleManager.Modules[module].Mode(mode);
        pager.navigate(redirect);
    } catch(e){
        //console.log(e);
    }
});
MSite.Events.on("navigate",function(){
    ModuleManager.ForceClose();
});