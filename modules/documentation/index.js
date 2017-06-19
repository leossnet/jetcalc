var MDocumentation = (new function() {
	
	var self = new Module("documentation");

	self.BeforeShow = function (){
		self.LoadPage();
  	    MSite.Events.off("save",self.SavePage);
  	    MSite.Events.on("save",self.SavePage);
	}

	self.BeforeHide = function (){
		MSite.Events.off("save",self.SavePage);
	}

	self.IsAvailable = function(CodeDoc){
		return PermChecker.CheckPrivelege("IsDocumentationWriter",CxCtrl.CxPermDoc());
	}
 
	self.ShowUserHelp = function(){
		self._load(function(result){
			if (result.status=='ok'){
				self.ShowUrl('/doc/'+result.page.Code+'.html');
			} else {
				self.ShowUrl('/doc/index.html');
			}
			$('#helpModal').modal('show');	
		})
	}

	self.ShowByCode = function(Code){
		self.ShowUrl('/doc/'+Code+'.html');
		$('#helpModal').modal('show');	
	}

	self.HasPage = ko.observable(false);
	self.EditMode = ko.observable(false);

	self.Page = {
		Code:ko.observable(),
		Name:ko.observable(),
		Text:ko.observable()
	}

	self.Preview = ko.observable(null);

	self._load = function(done){
		self.rGet('/page/'+CxCtrl.CodeDoc(),{},function(result){
			return done (result);
		})
	}

	self.LoadPage = function(){
		self.EditMode (false);
		self.HasPage(false);
		self._load(function(result){
			if (result.status=='er'){
				;
			} else {
				self.HasPage(true);
				self.Page.Code(CxCtrl.CodeDoc());
				self.Page.Name(result.page.Name);
				self.Page.Text(result.page.Text);
				self.Preview(SimpleMDE.prototype.markdown(result.page.Text+''));	
			}
		});
	}

	self.NewPage = function(){
		self.Page.Code(CxCtrl.CodeDoc());
		self.Page.Name(CxCtrl.PrintNameDoc());
		var DefaultText = ['## '+CxCtrl.PrintNameDoc(),'### 1. Назначение документа','### 2. Настройка прав доступа','### 3. Регламент заполнения документа','### 4. Особенности заполнения/комментарии'].join('\n\n');
		self.Page.Text(DefaultText);
		self.EditMode(true);		
	}

	self.SavePage = function(){
		self.rPost('/page/'+CxCtrl.CodeDoc(),{Code:self.Page.Code(),Name:self.Page.Name(),Text:self.Page.Text(),Context:CxCtrl.CxPermDoc()},function(data){
			self.LoadPage();				
		})
	}

	self.ContentLoaded = function(){
		var cW = $('iframe')[0].contentWindow;
		var _$ = cW.$;
		if (!_$('body #navigate_watcher')[0]){
			_$('<script id="navigate_watcher">window.gitbook.events.on("page.change",function(){window.top.postMessage("iframe_change", "*");})</script>').appendTo(_$('body')[0]);
		}
		var Links = _$('a');
		Links.each(function(){
			var self = $(this);
			var href = self.attr('href');
			if(href.indexOf('/docview/')>=0){
				var realHref = '/docview/'+href.split('/docview/').pop();
				self.click(function(e){
   					e.preventDefault();
   					window.parent.postMessage("navigate:"+realHref,"*");
   					return false;
				})
			}
		})
	}

	self.ShowUrl = ko.observable(null);

	return self;
})

ko.bindingHandlers.documentationImage = {
  init: function(element, accessor, bindings) {
    FileAPI.event.on(element, "change", function(evt) {
      var image = FileAPI.getFiles(element)[0]
      FileAPI.upload({
        url: "/api/gfs",
        files: { file: image },
        complete: function(err, xhr) {
          var res = JSON.parse(xhr.response);
		  if (!res.id) return console.log("Ошибка добавления файла");
          MdeEditor.insertImage("/api/gfs/"+res.id);
        }
      })
    })
  }
}

MSite.Events.addListener("inited",function(){
	var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
	var eventer = window[eventMethod];
	var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
	eventer(messageEvent,function(e) {
	    var key = e.message ? "message" : "data";
	    var data = e[key];
	    if (data.indexOf('navigate:')>=0){
	    	var path = _.last(data.split('navigate:'));
	    	pager.navigate(path);
	    	$('#helpModal').modal('hide');
	    }
	    if (data.indexOf('iframe_change')>=0){
			setTimeout(function(){
				MDocumentation.ContentLoaded();
			},0)	    	
	    }
	},false);
})

ModuleManager.Modules.Documentation = MDocumentation;