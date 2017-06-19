var MCalcLog = (new function() {

	var self = new Module("calclog");

	self.IsAvailable = function(){
        return PermChecker.CheckPrivelege("IsCalcLogWatcher");
    }  

    self.Queues = ko.observable(0);
    self.Channels = ko.observable({});
    self.Log = ko.observableArray();

    self.Init = function(done){
        AdminPage.Events.on("adminpageshow",self.StartWatch);
    	AdminPage.Events.on("adminpageshide",self.StopWatch);
    	return done();
    }

    self.StartWatch = function(){
        MSocket.RegisterEvent("calcsInfo", self.Update);
        MSocket.Start("calcsInfo");
        self.InitialLoad();
    }

    self.StopWatch = function(){
        MSocket.Stop("calcsInfo",self.Update);
    }

    self.Update = function(data){
        self.Queues(data.Queues);
        self.Channels(data.Channels);
        self.Log(data.Log);
    }

    self.IsClearCacheInProgress = ko.observable(false);


    self.ClearCache = function(){
        self.IsClearCacheInProgress(true);
        self.rGet("clearcache",{},function(){
            self.IsClearCacheInProgress(false);
        })        
    }

    self.InitialLoad = function(){
        self.rGet("info",{},self.Update);
    }


	return self;
})

ModuleManager.Modules.CalcLog = MCalcLog;