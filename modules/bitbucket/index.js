var MBitBucket = (new function() {
	var self = this;

	self.base = "/api/modules/bitbucket/";

	self.IsAvailable = function(){
        return PermChecker.CheckPrivelege("IsGitAdmin");
    }  

    self.IsUpdateAvailable = ko.observable(false);
    self.IsUpdateInProgress = ko.observable(false);
    self.Error = ko.observable(null);

    self.IsLoading = ko.observable(false);

    self.Init = function(done){
    	AdminPage.Events.on("adminpageshow",self.CheckUpdates);
    	return done();
    }

    self.Updates = ko.observable();

    self.CheckUpdates = function(){
        self.IsLoading(true); self.Error(null);
		$.getJSON(self.base+'status',function(data){
	        self.IsLoading(false);		
            if (data.err) return self.Error(data.err);
            var Groups = [], Arr = [];
            data.forEach(function(d){
                if (Arr.length && d.message=="Обновление боевого сервера"){
                    Groups.push(Arr); Arr = [];
                }
                Arr.push(d);
            })
            if(Arr.length) Groups.push(Arr);
            self.Updates(Groups);
		});
    }

    self.Pull = function(){
    	self.IsUpdateInProgress(true);
		$.getJSON(self.base+'pull',function(data){
			self.IsUpdateInProgress(false);
			self.CheckUpdates();
		});
    }

	return self;
})

ModuleManager.Modules.BitBucket = MBitBucket;