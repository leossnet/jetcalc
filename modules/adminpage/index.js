var AdminPage = (new function(){
	var self = this;
	self.base = "/api/modules/adminpage/";

	self.Events = new EventEmitter();

	self.PageShow = function(){
		//m_admin.startWatchCalcLog
		//m_sysLog.loadLog,
		self.Events.emit("adminpageshow");
	}

	self.PageHide = function(){
		//m_admin.stopWatchCalcLog
		self.Events.emit("adminpagehide");
	}

	self.IsAvailableFlag = ko.observable(false);

	self.CheckAvailable = function(){
		var R = false;
		ModuleManager.AdminPage().forEach(function(AP){
      		R = R || ModuleManager.Modules[AP.class_name].IsAvailable();
		})
		self.IsAvailableFlag(R);
	}






	return self;
})


ModuleManager.Events.on("modulesinited",function(){
	AdminPage.CheckAvailable();
})  

ModuleManager.Modules.AdminPage = AdminPage;

