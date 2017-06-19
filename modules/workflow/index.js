var Workflow = (new function(){
    var self = this;

    self.base = "/api/modules/workflow/";
    self.Error = ko.observable();

    self.History = ko.observableArray();
    self.ShowHistory = function(){
        self.Error(null); self.History([]);
        $.getJSON(self.base+'history',{Context:CxCtrl.CxPermDoc()},function(data){
            if (data.err) return self.Error(data.err);
            self.History(data);
            $('#workflowHistory').modal('show');
        })
    }

    self.Events = new EventEmitter();

    self.Error.subscribe(function(V){
		if (V) swal('Ошибка системы блокировок',V,'error');
		self.Error(null);
	})

	self.CurrentState = ko.observable();
    self.Actions = ko.observableArray();

    self.Init = function(done){
		CxCtrl.Events.addListener("documentchanged",self.UpdateInfo);
        CxCtrl.Events.addListener("contextchanged",self.UpdateInfo);		
        CxCtrl.Events.addListener("pagechanged",self.UpdateInfo);
        return done();
    }

    self.Context = function(){
		var Context = CxCtrl.Context();
    	return _.merge(_.pick(Context,["Year","CodePeriod","CodeDoc"]),{
    		CodeObj:Context.ChildObj||Context.CodeObj
    	});
    }

    self.UpdateInfo = function(done){
        done = typeof done =='function' ? done : null;
    	var Context = self.Context();
    	self.Error(null); self.CurrentState(null);self.Actions([]);
        MBreadCrumbs.Css(null);
        var Document = MFolders.FindDocument(Context.CodeDoc);
        self.IsBlockAllowed(false);
        if (!Document.IsInput) return done && done();
    	$.getJSON(self.base+"status",Context,function(data){
    		if (data.err) {
                self.Error(data.err);   
                return done && done();   
            }
            if (_.isEmpty(data.Actions)) {
                if (done && typeof done=='function')    return done();
                return;
            }
            self.CurrentState(data.State.CodeState);
            MBreadCrumbs.Css(data.State.CodeState);
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
        var url = self.base+"execute";
        if (self.ForceFlag()) url = self.base+"forceexecute";
        self.ForceFlag(false); self.ExecuteResult(null); self.ExecuteInfo(null); self.NeedConfirm(false); self.CurrentAction(Action);
        $.ajax({
            url:url,
            data:{
                Context:self.Context(),
                Action:Action.CodeRoute
            },
            method:'put',
            success:function(data){
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
            }
        })
    }


    return self;
})






ModuleManager.Modules.Workflow = Workflow;