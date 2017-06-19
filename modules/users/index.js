var MUsers = (new function(){

    var self = new Module("users");

    self.IsAvailable = function(){
        return PermChecker.CheckPrivelegeAny(["IsDocPermissionAssigner", "IsExtendedDocPermissionAssigner", "IsFunctionAssigner", "IsFunctionEditor", "IsDocPermissionEditor","IsUserAcceptor","IsRequestApprover"]);
    }
    self.AvPrivelegeObj = ko.observableArray();

    self.Init = function(done){ 
        if (!PermChecker.CheckPrivelege("IsDocPermissionAssigner")) return done();
        self.AvPrivelegeObj(PermChecker.AvPrivelegeObj("IsDocPermissionAssigner"));          
        self.SelectedObj(_.first(self.AvPrivelegeObj()));
        self.UpdateCounts();
        return done();
    }

    self.SendRequizites = function(){
        self.rGet("sendrequizites",{CodeUser:ModelTableEdit.LoadedModel().CodeUser()},function(data){
            swal("","Письмо отправлено","success");
        })
    }



    self.IsEmulate = ko.observable(false);

    self.EmulateStart = function(){
        self.Error(null);
        $.getJSON(self.base+"loginas",{CodeUser:ModelTableEdit.LoadedModel().CodeUser()},function(data){
            if (data.err) return self.Error(data.err);
            ModuleManager.Init(function(){
                self.IsEmulate(true);
                pager.navigate("/");
            })
        })
    }

    self.EmulateStop = function(){
        self.Error(null);
        $.getJSON(self.base+"loginasback",function(data){
            console.log(data);
            if (data.err) return self.Error(data.err);
            ModuleManager.Init(function(){
                self.IsEmulate(false);
                pager.navigate("/");
            })
        })
    }


    self.NewUsers = ko.observable(0);
    self.Requests = ko.observable(0);

    self.UpdateCounts = function(){
        if (!PermChecker.CheckPrivelegeAny(["IsRequestApprover","IsUserAcceptor"])) return;
        $.getJSON(self.base+"regcounts",function(data){
            if (data.err) return self.Error(data.err);
            self.Requests(data.Requests);
            self.NewUsers(data.NewUsers);
        })
    }


    self.BeforeHide = function(){
        self.UnSubscribe();
    }
    self.BeforeShow = function(){
        self.Subscribe();
        self.Show();
    }        
    
    self.ModelIsLoaded = function(){
        switch (self.Mode()){
            case 'Users':
            case 'NewUsers':
                self.LoadUserInfo();
            break;            
            case 'Roles':
                self.LoadTaskInfo();
            break;            
            case 'Permits':
                self.LoadPermitInfo();
            break;            
        }        
        self.Error(null);
    }

    self.ModelIsCreated = function(){
        switch (self.Mode()){
            case 'Users':
                ModelTableEdit.LoadedModel().IsConfirmed(true);
                ModelTableEdit.LoadedModel().CodeObj(self.SelectedObj());
            break;            
            case 'Permits':
                ModelTableEdit.LoadedModel().IsPublic(true);
                ModelTableEdit.LoadedModel().CodeObj(self.SelectedObj());
                self.AddPermit();
            break;            
            case 'Roles':
                ;
            break;                
            case 'Requests':
            break;            
        }        
    }

    self.ModelIsSaved = function(){
        switch (self.Mode()){
            case 'Roles':
                self.SaveTask();
            break;           
            case 'Permits':
                self.SavePermit();
            break;
        }        
    }

    self.ModelIsDeleted = function(){
        switch (self.Mode()){
            case 'Requests':
            case 'NewUsers':
                self.UpdateCounts();
            break;
        }        
    }



    self.Show = function(){
        if (!self.Mode()) return self.InitSetMode("Users");
        var Obj = self.SelectedObj();
        if (!Obj){
            self.AvPrivelegeObj(PermChecker.AvPrivelegeObj("IsDocPermissionAssigner"));          
            self.SelectedObj(_.first(self.AvPrivelegeObj()));
            Obj = self.SelectedObj();
        }
        var F = {CodeObj:Obj};
        switch (self.Mode()){
            case 'Roles':
                if (!self.IsPrivelegesLoaded()) self.LoadPriveleges();
                ModelTableEdit.InitModel("task");
                ModelTableEdit.ForceEditFields = [
                    "CodeTask","NameTask"
                ];
                ModelTableEdit.IsExtendEditor(true); 
            break;
            case 'Users':
                ModelTableEdit.InitModel("user",["NameUser","LoginUser"],{CodeUser:1},_.merge({IsConfirmed:true},F));
                ModelTableEdit.SetForceEditFields([
                    "CodeUser","NameUser", "LoginUser", "JobTitle", "WorkPhone", "MobilePhone","Birthday", "Mail", "CodeObj", "InAttentive"
                ]);
                ModelTableEdit.IsExtendEditor(true); 
            break;
            case 'Permits':
                if (!self.IsPermitsTemplateLoaded()) self.LoadPermitsTemplate();
                ModelTableEdit.InitModel("permit",["CodePermit","NamePermit"],{IsPublic:-1,CodePermit:1},{$or:[{CodeObj:Obj},{IsPublic:true}]});
                ModelTableEdit.ForceEditFields = [
                    "CodePermit","NamePermit","CodeObj","IsPublic"
                ];
                ModelTableEdit.IsExtendEditor(true); 
            break;
            case 'Requests':
                ModelTableEdit.InitModel("request",["NameUser","NameObjs","DateRequest"],{DateRequest:1},{IsVerified:true,IsAccept:false});
                ModelTableEdit.ForceEditFields = [
                    "NameUser","JobTitle","TabNum","DateRequest","Birthday","WorkPhone","MobilePhone","Mail","NameObjs","Comments"
                ];
                ModelTableEdit.IsExtendEditor(true); 
            break;
            case 'NewUsers':
                var Objs = PermChecker.AvPrivelegeObj("IsUserAcceptor");
                if (!Objs.length) return self.Error("У вас нет прав на подтверждение пользователей");
                ModelTableEdit.InitModel("user",["NameUser","JobTitle","CodeObj","CodeUser"],{CodeUser:1},{IsConfirmed:false,CodeObj:{$in:Objs}});
                ModelTableEdit.ForceEditFields = [
                    "LoginUser","NameUser","JobTitle","TabNum","Birthday","WorkPhone","MobilePhone","Mail","CodeObj"
                ];
                ModelTableEdit.IsExtendEditor(true); 
            break;
            default:
                console.log(self.Mode(),"Выбран");
        }
    }

    self.SetObj = function(V){
        self.SelectedObj(V);
        if (self.Mode()=="Users" || self.Mode() == "Permits") self.Show();
    }

    self.SelectedObj = ko.observable(null);


    self.Confirm = function(text,remove){
        swal({
          title:"",
          text: text,
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Да, удалить!",
          cancelButtonText: "Отменить",
          closeOnConfirm: false
        },
        function(){
            remove(function(){
              swal("","Удаление завершено.", "success");
            })
        });        
    }


// Users
    self.UserPermits = ko.observableArray();
    self.UserTasks   = ko.observableArray();

    self.LoadUserInfo = function(){
        self.Error (null); self.IsLoading(true); 
        var Us = ModelTableEdit.LoadedModel();
        if (!Us || !Us.CodeUser().length) return;   
        self.UserPermits([]); self.UserTasks([]);
        $.getJSON (self.base+"user/"+Us.CodeUser(),function(data){
            self.IsLoading(false);
            if (data.err) return self.Error (data.err);
            self.UserPermits(data.User.Link_userpermit);
            self.UserTasks(data.User.Link_usertask);
        })
    }    
    self.NewUserPermit = ko.observable(null);
    self.AddUserPermit = function(){
        var C = ModelTableEdit.LoadedModel().CodeUser();
        var perm = MModels.Create("userpermit",{CodeUser:C});
        self.NewUserPermit(perm);
        $('#userPermitAdd').modal('show');        
    }
    self.EditUserPermit = function(data){
        var C = ModelTableEdit.LoadedModel().CodeUser();        
        var perm = MModels.Create("userpermit",_.merge(data,{CodeUser:C}));
        self.NewUserPermit(perm);
        $('#userPermitAdd').modal('show');        
    }
    self.NewUserTask = ko.observable(null);
    self.AddUserTask = function(){
        var C = ModelTableEdit.LoadedModel().CodeUser();
        var task = MModels.Create("usertask",{CodeUser:C});
        self.NewUserTask(task);
        $('#userTaskAdd').modal('show');        
    }
    self.EditUserTask = function(data){
        var C = ModelTableEdit.LoadedModel().CodeUser();
        var task = MModels.Create("usertask",_.merge(data,{CodeUser:C}));
        self.NewUserTask(task);
        $('#userTaskAdd').modal('show');        
    }
    self.ApplyUserPermit = function(){
        var NewPermit = self.NewUserPermit().toJS();
        self.IsLoading(true);
        $.ajax({
            url : self.base+"userpermit",
            data: {userpermit:NewPermit},
            method:'post',
            success:function(data){
                self.IsLoading(false);
                if (data.err) return self.Error(data.err);
                self.NewUserPermit(null);
                $('#userPermitAdd').modal('hide');
                self.ModelIsLoaded();
            }
        })
    }


    self.ApplyUserTask = function(){
        var NewTask = self.NewUserTask().toJS();
        self.IsLoading(true);
        $.ajax({
            url : self.base+"usertask",
            data: {usertask:NewTask},
            method:'post',
            success:function(data){
                self.IsLoading(false);
                if (data.err) return self.Error(data.err);
                self.NewUserTask(null);
                $('#userTaskAdd').modal('hide');
                self.ModelIsLoaded();
            }
        })
    }
    
    self.DeleteUserPermit = function(data){
        self.Confirm("Вы собираетесь убрать пропуск у пользователя.",function(done){
            $.ajax({
                url:self.base+"userpermit",
                method:"delete",
                data:{CodeUserPermit:data.CodeUserPermit},
                success:function(){
                    self.ModelIsLoaded();
                    done && done();
                }
            })            
        })             
    }

    self.DeleteUserTask = function(data){
        self.Confirm("Вы собираетесь убрать роль у пользователя.",function(done){
            $.ajax({
                url:self.base+"usertask",
                method:"delete",
                data:{CodeUserTask:data.CodeUserTask},
                success:function(){
                    self.ModelIsLoaded();
                    done && done();
                }
            })            
        })             
    }

// Task 
    self.TaskPriveleges = ko.observableArray();
    self.LoadTaskInfo = function(){
        self.Error (null); self.IsLoading(true); 
        var Us = ModelTableEdit.LoadedModel();
        if (!Us || !Us.CodeTask().length) return;   
        self.TaskPriveleges([]); 
        $.getJSON (self.base+"task/"+Us.CodeTask(),function(data){
            self.IsLoading(false);
            if (data.err) return self.Error (data.err);
            var Privs = [];
            if (data.Link_taskprivelege){
                Privs = _.map(data.Link_taskprivelege,"CodePrivelege");
            }
            self.TaskPriveleges(Privs);
        })
    }    
    self.IsPrivelegesLoaded = ko.observable(false);
    self.Priveleges = ko.observable();
    self.LoadPriveleges = function(){
        self.IsLoading(true); self.Error(null);
        $.getJSON(self.base+"priveleges",function(data){
            if (data.err) return self.Error(data.err);
            self.IsLoading(false);
            self.Priveleges(data);
        })
    }
    self.SaveTask = function(done){
        self.IsLoading(true); self.Error(null);
        var C = ModelTableEdit.LoadedModel().CodeTask()
        $.ajax({ 
            url:self.base+'task',
            method:'put',
            data:{
                CodeTask:C,
                Priveleges:self.TaskPriveleges()
            },
            success:function(data){
                self.IsLoading(false);
                if (data.err) return self.Error(data.err);
                return done && done();
            }
        })
    }

// Permits

    self.IsPermitsTemplateLoaded = ko.observable(false);

    self.PeriodGrps = ko.observableArray();
    self.Roles = ko.observableArray();
    self.AddRoles = ko.observableArray();

    self.LoadPermitsTemplate = function(){
        self.PeriodGrps([]);self.Roles([]);self.AddRoles([]); self.IsLoading(true); self.Error(null);
        $.getJSON(self.base+"permits",function(data){
            self.IsLoading(false);
            if (data.err) return self.Error(data.err);
            self.Roles (data.Roles);
            self.AddRoles (data.AddRoles);
            self.PeriodGrps (data.PeriodGrps);
        })
    }

    self.Permit = ko.observable(null);

    self.Maxed = function(O){
        var Maxed = null; 
        if (O.DoRead) Maxed =  "DoRead";
        if (O.DoWrite) Maxed = "DoWrite";
        if (O.DoBlock) Maxed = "DoBlock";
        return Maxed;
    }

    self.LoadPermitInfo = function(){
        self.Permit(null); self.Error(null); self.IsLoading(true);
        $.getJSON(self.base+"permit",{CodePermit: ModelTableEdit.LoadedModel().CodePermit()},function(data){
            self.IsLoading(false);
            if (data.err) return self.Error(data.err);
            var newRoles = self.CreateBlankPermitRoles();
            var Existed = data || [];
            Existed.forEach(function(Ex){
                var Maxed = self.Maxed(Ex);
                if (newRoles[Ex.CodeRole][Ex.CodePeriodGrp]){
                    if (Maxed){
                        newRoles[Ex.CodeRole][Ex.CodePeriodGrp][Maxed](true);
                    }
                }
            })
            console.log(newRoles);


            self.Permit(newRoles);
        })
    }

    self.AddPermit = function(){
        var Info = self.CreateBlankPermitRoles();
        self.Permit(Info);
    }

    self.CreateBlankPermitRoles = function(){
        var Roles = self.Roles();
        if (PermChecker.CheckPrivelege("IsExtendedDocPermissionEditor")){
            Roles = Roles.concat(self.AddRoles())
        }
        var PGroups = self.PeriodGrps();
        var Result = {};
        Roles.forEach(function(R){
            Result[R.CodeRole] = {};
            PGroups.forEach(function(G){
                Result[R.CodeRole][G.CodePeriodGrp] = MModels.Create("permitrole",{CodePeriodGrp:G.CodePeriodGrp,CodeRole:R.CodeRole});
            })
            Result[R.CodeRole]["ALL"] = MModels.Create("permitrole",{CodePeriodGrp:"ALL",CodeRole:R.CodeRole});
        })
        return Result;
    }

    self.Actions = ['DoRead','DoWrite','DoBlock'];

    self.ModifyPermission = function(Action){
        var that = this;
        if (that.CodePeriodGrp()=="ALL"){
            var ToModify = self.Permit()[that.CodeRole()];
            self.PeriodGrps().forEach(function(CP){
                self.ModifyPermission.call(self.Permit()[that.CodeRole()][CP.CodePeriodGrp],Action);
            })
        }
        self.Actions.forEach(function(Act){
            that[Act](false);
        })
        if (Action!='None') that[Action](true);
    }

    self.SavePermit = function(done){
        self.Error(null); self.IsLoading(true);
        var C = ModelTableEdit.LoadedModel().CodePermit();
        var PermitRoles  = self.Permit();
        var ClearedRoles = [];
        for (var K1 in PermitRoles){
            for (var K2 in PermitRoles[K1]){
                if (K2!="ALL"){
                    var O = _.pick(PermitRoles[K1][K2].toJS(),["CodeRole","CodePeriodGrp"].concat(self.Actions));
                    O.CodePermit = C;
                    ClearedRoles.push(O);
                }
            }
        }
        ClearedRoles = _.filter(ClearedRoles,function(C){
            var R = false;
            self.Actions.forEach(function(A){
                if (C[A]) R = true;
            })
            return R;
        })
        ClearedRoles.forEach(function(C){
            if (C.DoBlock) { C.DoWrite = true; C.DoRead = true;}
            if (C.DoWrite) { C.DoRead = true;}
        })
        $.ajax({
            url:self.base+'permit',
            method:'put',
            data:{
                CodePermit:C,
                Roles:ClearedRoles
            },
            success:function(data){
                self.IsLoading(false);
                if (data.err) return self.Error(data.err);
                return done && done();
            }
        })
    }

// Requests

    self.AcceptRequest = function(){
        self.Error(null);
        if (!ModelTableEdit.LoadedModel().CodeObj()) return self.Error(Tr("codeobjisrequires"));
        self.IsLoading(true);
        $.ajax ({
            url: self.base+"requestaccept",
            type:'post',
            data: ModelTableEdit.LoadedModel().toJS(),
            success:function(data){
                self.IsLoading(false);
                if (data.err) return self.Error(data.err);
                ModelTableEdit.LoadedModel(null);
                ModelTableEdit.LoadList();
                self.UpdateCounts();
                swal('','Заявка подтверждена.','success');
            }
        });
    } 
    
    self.AcceptNewUser = function(){
        self.Error(null);
        var Data = ModelTableEdit.LoadedModel().toJS()
        if (!Data.LoginUser) return self.Error(Tr("loginisrequired"));
        self.IsLoading(true);
        $.ajax({
            url : self.base+"useraccept",
            data: {
                User2Approve:Data
            },
            method:'post',
            success:function(data){
                self.IsLoading(false);
                if (data.err) return self.Error(data.err);
                ModelTableEdit.LoadedModel(null);
                ModelTableEdit.LoadList();
                self.UpdateCounts();
                swal('','Пользователь подтвержден.','success');
            }
        });
    }

    return self;
});





ModuleManager.Modules.Users = MUsers;


ko.bindingHandlers.popover = {
    init: function(element, valueAccessor, allBindingsAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var content = $(element).find(".popover_content").html();
        $(element).data("rel","popover");
        $(element).data("placement",value.placement);
        $(element).data("content",content);
        $(element).popover({html:true});
    } 
};
