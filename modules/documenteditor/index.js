var MDocumentEditor = (new function() {
	
	var self = new Module("documenteditor");

	self.Document = ko.observable();
	self.DocumentSubscription = null;

	self.IsAvailable = function(CodeDoc){
		return PermChecker.CheckPrivelege("IsDocumentDesigner",CxCtrl.CxPermDoc());
	}
 
	self.Init = function (done){
		MSandBox.Events.on('sandbox_status_change',function(){
			self.Show();
		})
		return done && done();
	}

	self.ContextChange = function(){

	}

	self.BeforeShow = function(){
		MSite.Events.off("save",self.SaveChanges);
        MSite.Events.on("save",self.SaveChanges);		
        if (!self.DocumentSubscription){
	       	self.DocumentSubscription =  ko.computed(function() {
	            return ko.toJS(self.Document);
	        });
	        self.DocumentSubscription.subscribe(self.DocumentChange);
        }
		self.Show();        
	}

	self.BeforeHide = function(){
		self.DocumentSubscription.dispose();
		MDocumentEditor.DocumentSubscription = null;
		self.Document(null);
		MSite.Events.off("save",self.SaveChanges);
	}


	self.DocFieldsShablon = ['CodeDoc','NameDoc','SNameDoc','PrintNameDoc','PrintNumDoc','IsPrimary','IsAnalytic','IsOlap','CodeStyleSubtotal','CodeStyleTotal','IsInput','IsChart','IsPresent','IsShowMeasure','CodeMeasure','CodeGrp','FirstYear'];
	self.DocFields = ko.observableArray();

	self.DocumentChange = function(D){
		if (D){
			var ToRemove = [];
			if (D.IsOlap){
				ToRemove = ToRemove.concat(['IsInput','IsChart','IsPresent']);
			} else {
				ToRemove = ToRemove.concat(['CodeStyleSubtotal','CodeStyleTotal']);
			}
			if (D.IsChart){
				ToRemove = ToRemove.concat(['IsOlap','IsInput','IsPresent']);
			}			
			if (D.IsPresent){
				ToRemove = ToRemove.concat(['IsOlap','IsInput','IsChart']);
			}
			var Current = self.DocFieldsShablon;
			Current = _.difference(Current,ToRemove);
			if (!_.isEqual(self.DocFields(),Current)){
				self.DocFields(Current);	
			}			
		} else {
			if (!_.isEqual(self.DocFields(),self.DocFieldsShablon)){
				self.DocFields(self.DocFieldsShablon);
			}
		}
	}

	self.InfoByMode = function(){
		var Result = {Fields:_.uniq(self.DocFields().concat(['CodeStyleSubtotal','CodeStyleTotal'])), Links :[]};
		switch(self.Mode()){
			case "RootRows":
				Result.Links = Result.Links.concat(['docrow','docheader']);
				Result.Fields = Result.Fields.concat(['IsShowRoots',"UseMultilevelHeader"]);
			break;
			case "Placement":
				Result.Links = Result.Links.concat(['docfolderdoc','docpacket']);
				Result.Fields = Result.Fields.concat(['CodeModel','IndexDoc']);
			break;
			case "Responsables":
				Result.Links = Result.Links.concat(['doclabel']);
				Result.Fields = Result.Fields.concat(['CodeRole','FirstYear','IsDesigner','IsTester']);
			break;
			case "ChildObjs":
				Result.Links = Result.Links.concat(['docobjtype']);
				Result.Fields = Result.Fields.concat(['HasChildObjs','IsDivObj','IsObjToRow','IsShowParentObj',"IsObjTree"]);
			break;
			case "ReportSettings":
				Result.Links = Result.Links.concat(['docparamkey']);
			break;
			case "Bistran":
				Result.Links = Result.Links.concat(['docbill']);
				Result.Fields = Result.Fields.concat(['IsBiztranDoc','UseProd','UseOrg','UseDogovor','UseDogovorArt']);
			break;
		}
		return Result;
	}


	self.Show = function(){
		if (!self.Mode()) return self.InitSetMode("RootRows");
		self.rGet("document/"+CxCtrl.CodeDoc(),self.InfoByMode(),function(data){
			self.Document(ModelEdit.Model("doc",data.Doc));
		})
	}

	self.SaveChanges = function(){
		self.rPut("document/"+CxCtrl.CodeDoc(),{
			Info :self.InfoByMode(),
			Changes:JSON.stringify(self.Document().toJS())
		},function(){
			swal("","Изменения сохранены","success")				
			self.Show();
		})
	}


	self.RollBack = function(){
		self.Show();		
	}


	return self;
})

ModuleManager.Modules.DocumentEditor = MDocumentEditor;
