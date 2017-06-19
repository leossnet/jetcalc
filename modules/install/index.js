var Install = (new function(){
	var self = this;

	self.base = "/api/modules/install/"; 

	self.Init = function(done){
		$.getJSON(self.base+"needinstall",function(data){
			console.log(data);
			return done();
		})
	}

	return self;
})


ModuleManager.Modules.Install = Install;