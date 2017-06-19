var MBreadCrumbs = (new function(){
	var self = this;

	self.Pages = ko.observableArray();

	self.Css = ko.observable();

	self.Events = new EventEmitter();

	self.Init = function(done){
		MSite.Events.on("initialnavigate",self.BreadcrumbsCompute);
		MSite.Events.on("navigate",self.BreadcrumbsCompute);
		return done();
	}

	self.BreadcrumbsCompute = function () {
		self.CurrentPath(window.location.pathname.substring(1));
		self.CurrentRoute(self.CurrentPath().split('/'));
		var test = self.CurrentRoute();
		setTimeout(self._breadcrumbsFromPages,0);
	}
	
	self.CurrentPath = ko.observable("");
	self.CurrentRoute = ko.observableArray();


	self.CheckPath = function(path){
		return self.CurrentPath().indexOf(path)>=0;
	}
	
	self._breadcrumbsFromPages = function(){
		self.Css(null);
		var pages = [];
		var page = pager.activePage$();
		var maxStack = 20;
		while(page){
			if (page.valueAccessor && page.valueAccessor().breadcrumbs){
				var r = page.valueAccessor().breadcrumbs;
				pages.unshift(r);
			}
			page = page.parentPage;
			if (--maxStack<0)  break;
		}
		self.Pages(pages);
		self.Events.emit("pagechanged");
	}

	
	return self;
})

ModuleManager.Modules.BreadCrumbs = MBreadCrumbs;