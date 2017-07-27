var Workflow = (new function(){

    var self = new Module("workflow"); 


    self.History = ko.observableArray();
    self.ShowHistory = function(){
        self.History([]);
        self.rGet('history',{Context:CxCtrl.CxPermDoc()},function(data){
            self.History(data);
            $('#workflowHistory').modal('show');
        })
    }

    self.Events = new EventEmitter();
	self.CurrentState = ko.observable();
    self.Actions = ko.observableArray();

    self.StatesTranslate = {};
    self.StatesLang = {};
    self.StatesByCode = {};
    self.CSS = {
        "Opened":"label-lg label-danger",
        "Closed":"label-lg label-yellow",
        "Agreed":"label-lg label-success",
    }

    self.LoadStates = function(done){
        self.rGet("statestr",{},function(data){
            self.StatesTranslate = data.states;
            self.StatesLang = data.lang;
            if(!_.isEmpty(self.StatesTranslate)){
                for (var K in self.StatesTranslate){
                    if (K!="Default"){
                        self.StatesByCode[self.StatesTranslate[K]] = K;
                    }
                }
            }
            return done();
        })
    }

    self.Init = function(done){
        CxCtrl.Events.addListener("documentchanged",self.UpdateInfo);
        CxCtrl.Events.addListener("contextchanged",self.UpdateInfo);        
        CxCtrl.Events.addListener("pagechanged",self.UpdateInfo);
        self.LoadStates(done);
    }

    self.UpdateInfo = function(done){
        done = typeof done =='function' ? done : null;
    	var Context = CxCtrl.CxPermDoc();
    	self.Error(null); self.CurrentState(null);self.Actions([]);
        var Document = MFolders.FindDocument(Context.CodeDoc);
        self.IsBlockAllowed(false);
        if (!Document.IsInput) return done && done();
    	self.rGet("status",Context,function(data){
            MBreadCrumbs.RemoveLabels("Workflow","Pre");
            if (_.isEmpty(data.Actions)) {
                if (done && typeof done=='function') return done();
                return;
            }
            self.CurrentState(data.State.CodeState);
            var Code = self.StatesByCode[data.State.CodeState];
            MBreadCrumbs.AddLabel("Workflow","Pre",{Icon:null,CSS:self.CSS[Code],Text:self.StatesLang[Code],Title:null})
            self.Actions(data.Actions);
            self.CheckBlockAllowed();
            return done && done();
    	})
    }

    self.ExecuteResult =  ko.observable();
    self.ExecuteInfo   =  ko.observable();
    self.NeedConfirm   =  ko.observable(false);
    self.CurrentAction =  ko.observable();
    self.ForceFlag     =  ko.observable(false);

    self.ForceSave = function(){
        self.ForceFlag(true);
        self.Execute(self.CurrentAction());
    }

    self.CheckPermissions = function(){
        var Info = Workflow.ExecuteInfo();
        if (!Info || !_.keys(Info).length) return;
        var Map = {
            "CheckControlPoints":"IsOverKPBlocker",
            "CheckPeriods":"IsOverPeriodBlocker",
            "CheckDocuments":"IsOverDocBlocker",
            "CheckFiles":"IsOverFilesBlocker"
        };
        var PermissionsToCheck = [];
        for (var Key in Info){
            if (Info[Key].Status=='failed'){
                PermissionsToCheck.push(Map[Key]);
            }
        }
        var result = true, cx = CxCtrl.CxPermDoc();

        PermissionsToCheck.forEach(function(P){
            result = result && PermChecker.CheckPrivelege(P,cx);
        })
        return result||true;
    }

    self.IsBlockAllowed = ko.observable(false);

    self.CheckBlockAllowed = function(){
        self.IsBlockAllowed(PermChecker.CheckDocAccess("DoBlock",CxCtrl.CxPermDoc()));
    }

    self.Execute = function(Action){
        var url = self.ForceFlag() ? "forceexecute":"execute";
        self.ForceFlag(false); self.ExecuteResult(null); self.ExecuteInfo(null); self.NeedConfirm(false); self.CurrentAction(Action);
        self.rPut(url,{Context:CxCtrl.CxPermDoc(),Action:Action.CodeRoute},function(data){
            self.ExecuteResult(data.Status);
            self.ExecuteInfo(_.omit(data,"Status"));
            if (data.Status=="Success"){
                self.UpdateInfo(function(){
                    self.Events.emit("statuschange");
                });
                $('#workflowInfo').modal('hide');
            } else {
                self.NeedConfirm(true);
                $('#workflowInfo').modal('show');                    
            }
        })
    }


    return self;
})






ModuleManager.Modules.Workflow = Workflow;