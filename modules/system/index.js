var MSystem = (new function() {
	var self = this;

	self.base = "/api/modules/system/";

    self.IsAvailable = function(){
        return PermChecker.CheckPrivelege("IsSystemSettingsEditor");
    }  

    self.Settings = ko.observable(null);

    self.Init = function(done){
    	$.getJSON(self.base+"requisites",function(data){
            self.Settings(MModels.Create("settings",data));
       		return done && done();
    	})
    }

    self.UpdateSettings = function(){
        self.IsLoading(true);
        MModels.SaveFileToGfs(self.Settings().Logo(),function(err,id){
          if (id) self.Settings().Logo(id);
          $.ajax({
                url:self.base+"requisites",
                method:'put',
                data:self.Settings().toJS(),
                success:function(data){
                    if (data.err){
                        swal("", data.err, "error")    
                    } else {
                        swal("", "Настройки обновлены", "success")    
                    }                
                    self.IsLoading(false);
                    self.Init();
                }
            })
        })
    }
   
	self.Error = ko.observable(null);
	self.IsLoading = ko.observable(false);

	self.BeforeShow = function(){

	}

	self.BeforeHide = function(){

	}

	return self;
})
ModuleManager.Modules.System = MSystem;