var ProgressBar = (new function(){
	var self = this;

	self.ProgressBars = {};

	self.Create = function(id,onProgress,done){
		self.ProgressBars[id] = {
			onProgress:onProgress,
			onComplete:function(data){
				delete self.ProgressBars[id];
				done(data);
			}
		}
	};

	self.OnMessage = function(data){
		if (data.id && self.ProgressBars[data.id]){
			if (data.status == 'progress'){
				self.ProgressBars[data.id].onProgress(data.body);
			} else if (data.status == 'complete'){
				self.ProgressBars[data.id].onComplete(data.body);
			} else {
				console.log("Unknown Progress Type",data);
			}
		}
	};

	return self;
})



var MSocket = (new function(){
	
	var self = this;

	self.Socket = null;

	self.Events = {};

	self.IsOnline = ko.observable(false);

	self.Init = function(done){
		self.Socket = io.connect(document.location.host);
		self.Socket.off();
		self.Socket.connect();
		self.RegisterEvent('err',function(e){
			return self.trace("Er",JSON.stringify(e));
		})
		self.Start("err");
		self.RegisterEvent('progress',ProgressBar.OnMessage);
		self.Start('progress');		
		self.Socket.on("disconnect",function(){
			self.IsOnline(false);
		})
		self.Socket.on("connect",function(){
			self.IsOnline(true);
			if (!_.isEmpty(self.DelayedStart)){
				self.DelayedStart.forEach(function(ev){
					self.Start(ev);
				})
				self.DelayedStart = [];
			}
		})
		MSite.Events.on("unload",function(){
			self.Socket && self.Socket.disconnect();
		})
		return done();
	}

	self.Destroy = function(){
		if (!self.Socket) return;
		self.Socket.off();
		self.Socket.disconnect();
	}

	self.Emit = function(eventName,Data){
		if (!self.Socket) return;
		self.Socket.emit(eventName,Data);
	}

	self.DelayedStart = [];

	self.Start = function(eventName){
		if (!self.Socket) {
			self.DelayedStart.push(eventName);
			return;
		}
		self.Socket.removeListener(eventName);
		if (!self.Events[eventName]) {
			;
		} else {
			self.Socket.on(eventName,self.Events[eventName]);
		}
	}

	self.Stop = function(eventName){
		if (!self.Socket) return;
		if (self.Events[eventName]) {
			self.Socket.removeListener(eventName,self.Events[eventName]);
		}
	}

	self.RegisterEvent = function(eventName, callback) {
		self.Events[eventName] = callback;
	}

	self.DeleteEvent = function(eventName, callback) {
		self.Socket.removeListener(eventName,callback);
		if (self.Events[eventName]) delete self.Events[eventName];
	}

	return self;

})


ModuleManager.Modules.Socket = MSocket;