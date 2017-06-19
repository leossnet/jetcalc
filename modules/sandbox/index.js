var MSandBox = (new function() {
	var self = this;

	self.base = '/api/modules/sandbox';

	self.Init = function(done){
		MSocket.RegisterEvent('sandboxchange',MSandBox.OnChangeEvent);
	    self.InitSandBox();
	    MSocket.Start('sandboxchange'); // Сигнал с сервера, о том что объекты добавлены в SandBox - принудительное включение режима
	    return done();
	}


	self.On = ko.observable(false);
	self.ToSave = ko.observable(0);

	self.ObjectsToSave =  ko.observable();
	self.CommitComment = ko.observable("");


	self.IsInited = ko.observable(false);
	self.Error  = ko.observable();
	
	self.Error.subscribe(function(V){
		//if (V) swal('Ошибка SandBox',V,'error');
		//self.Error(null);
	})

	self.LoadSandboxObjects = function(){
		self.ObjectsToSave(null);
		$.getJSON(self.base+'/objects',function(data){
			if (data.err) return self.Error(data.err);
			console.log(">>>",data);
			self.ObjectsToSave(data);
		})
	}

	self.ClearChanges = function(){
		$.ajax({
			url:self.base+'/objects',
			type:'delete',
			success:function(data){
				if (data.err) return self.Error(data.err);
				self.ObjectsToSave(null);
				self.CommitComment('');
				self.InitSandBox();
			}
		});
	}

	self.ApplyChanges = function(){
		$.ajax({
			url:self.base+'/objects',
			data:{
				comment:self.CommitComment()
			},
			type:'put',
			success:function(data){
				self.CommitComment('');
				self.ObjectsToSave(null);				
				self.InitSandBox();
			}
		});
	}

	self.Events = new EventEmitter();

	self.InitSandBox = function(){
		$.getJSON(self.base+'/init',function(data){
			if (data.err){
				return self.Error(data.err);
			}
			self.On(data.On);
			self.ToSave(data.ToSave);
			self.IsInited(true);
		})
	}

	self.Switch = function(done){
		self.On(!self.On());
		$.ajax({
			url:self.base+'/switch',
			method:'put',
			data:{status:self.On()},
			success:function(data){
				if (data.err){
					return self.Error(data.err);
				}
				self.Events.emit("sandbox_status_change");	
				if (done && typeof done=='function'){
					done();
				}
			}
		})
	}

	self.OnChangeEvent = function(data){
		if (!self.On()){ 
			self.Switch(function(){
				console.log("self.Init");
				self.InitSandBox();	
			});			
		} else {
			self.InitSandBox();
		}
	}
	return self;
})
ModuleManager.Modules.SandBox = MSandBox;

