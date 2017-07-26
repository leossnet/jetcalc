var MSystem = (new function() {
	var self = new Module("system");

    self.Error.subscribe(function(V){
        if (V) swal("", V, "error");
    })

    self.IsAvailable = function(){
        return PermChecker.CheckPrivelege("IsSystemSettingsEditor");
    }  

    self.Settings = ko.observable(null);

    self.Init = function(done){
    	self.rGet("requisites",{},function(data){
            self.Settings(MModels.Create("settings",data));
       		return done && done();
    	})
    }

    self.UpdateSettings = function(){
        self.IsLoading(true);
        MModels.SaveFileToGfs(self.Settings().Logo(),function(err,id){
          if (id) self.Settings().Logo(id);
          MModels.SaveFileToGfs(self.Settings().Icon(),function(err,id){
              if (id) self.Settings().Icon(id);
              self.rPut("requisites",self.Settings().toJS(),function(data){
                    self.Init();
                    swal("", "Настройки обновлены", "success");                
              })
          })
        })
    }
   
	return self;
})

ModuleManager.Modules.System = MSystem;