var MModules = (new function () {

    var self = new Module("modules");

    self.Requizites = ko.observable(null);

    self.Init = function(done){
        self.rGet("requisites",{},function(data){
            self.Requizites(MModels.Create("settings",data));
            return done && done();
        })
    }

    self.WelcomeHtml = function(){
      return SimpleMDE.prototype.markdown(self.Requizites().WelcomeMessage());
    }

    self.Selected = ko.observable(null);

    self.ModelsContent = ko.observable(null);

    self.BuildModel = function(){
        self.ModelsContent(null);
        self.LoadModelContent(function(){
            $('#modelChoosePopup').modal('show');
            $('#modelChoosePopup').unbind('hide.bs.modal');
            $('#modelChoosePopup').on('hide.bs.modal', function (e) {
                self.ModelsContent(null);
            })
        });
    }

    self.ChooseAll = function(){
        var Cur = self.ModelsContent();
        for (var ModelName in Cur){
            Cur[ModelName].forEach(function(M,i){
                Cur[ModelName][i].Choosed = true;
            })
        }
        self.ModelsContent(Cur);
    }

    self.LoadModelContent = function(done){
        self.rGet("modelcontent",{Model:MModules.Selected().ModuleName()},function(data){
            self.ModelsContent(data);
            return done();
        })
    }

    self.ApplyModelChange = function(){
        var DataToSend = {}, Data = self.ModelsContent();
        for (var ModelName in Data){
            var CodeField = MModels.Create(ModelName).Code;
            DataToSend[ModelName] = _.map(_.filter(Data[ModelName],{Choosed:true}),CodeField);
        }
        self.rPut("modelcontent",{Model:MModules.Selected().ModuleName(),Data:DataToSend},function(data){
            $('#modelChoosePopup').modal('hide');
            swal("","Модель обновлена","success");
        })
    }

    self.RefreshModules = function(){
        self.LoadGitModules();
    }

    self.Loader = function(){

    }

    self.BrutalReload = function(){
        window.location.reload();
    }

    self.InstallGitModule = function(){
        self.rGet("installgit",{module:self.Selected().ModuleName()},self.BrutalReload);
    }

    self.UnInstallGitModule = function(){
        self.rDelete("uninstallgit",{module:self.Selected().ModuleName()},self.BrutalReload);
    }

    self.UpdateGitModule = function(){
        self.rGet("updategit",{module:self.Selected().ModuleName()},self.BrutalReload);
    }


    self.IsAvailable = function () {
        return PermChecker.CheckPrivelege("IsModulesAdmin");
    }

    self.Settings = ko.observable(null);

    self.LoadSettings = function(){
        self.rGet("settings",{},function(data){
            self.Settings(MModels.Create("mssettings",data));
        })
    }

    self.BeforeShow = function(){
        MSite.Events.off("save",self.SaveChanges);
        MSite.Events.on("save",self.SaveChanges);
        self.Show();
    }

    self.BeforeHide = function(){
        MSite.Events.off("save",self.SaveChanges);
    }

    self.GitModules = ko.observableArray();

    self.LoadGitModules = function(){
        self.Selected(null);
        var T = (self.Mode()=='ChooseModels') ? "model":"module";
        self.rGet("gitmodule",{Type:T},function(List){
            self.GitModules(_.map(List,function(L){
                return MModels.Create("msmodule",L);
            }))
        })
    }



    self.SelectModule = function(data){
        self.Selected(data);
    }

    self.IsSelected = function(data){
        return self.Selected() && self.Selected().ModuleName() == data.ModuleName();
    }


    self.Labels = {
        "Вопрос по коду":"label-info",
        "Вопрос по функционалу":"label-purple",
        "Дубликат":"label-grey",
        "Не ошибка":"label-light",
        "Ошибка":"label-danger",
        "Новая функциональность":"label-success"
    }

    self.FindGitModules = function(){
        self.rGet("syncgitmodules",{},self.RefreshModules)
    }

    self.Issues = ko.observableArray();
    self.IssueState = ko.observable("open");

    self.SetIssueState = function(data){
        self.IssueState(data);
        self.LoadIssues();
    }

    self.LoadIssues = function(){
        self.Issues([]);
        self.rGet("issues",{State:self.IssueState()},function(data){
            self.Issues(_.map(data,function(d){
                return MModels.Create("msissue",d);
            }))
        })
    }

    self.Show = function(){
		if (!self.Mode())  return self.InitSetMode ("Settings");
        switch (self.Mode()){
            case "Settings":
                self.LoadSettings();
            break;
            case "Issues":
                self.LoadIssues();
            break;
            case "ChooseModules":
            case "ChooseModels":
                self.LoadGitModules();
            break;
        }
    }

    self.SyncPriveleges = function(){
        self.rGet("syncpriveleges",{},function(){
            ;
        })
    }

    self.SaveChanges = function(){
        if (self.Mode()=='Settings'){
            MModels.SaveFileToGfs(self.Requizites().Logo(),function(err,id){
              if (id) self.Requizites().Logo(id);
              MModels.SaveFileToGfs(self.Requizites().Icon(),function(err,id){
                if (id) self.Requizites().Icon(id);
                self.rPut("settings",{
                    settings:self.Settings().toJS(),
                    requisites:self.Requizites().toJS()
                },function(){
                    self.LoadSettings();
                    self.Init();
                })
              })
            })
        }
    }


    return self;
})

ModuleManager.Modules.Modules = MModules;

ko.bindingHandlers.svgencoded = {
    init: function(element, valueAccessor, allBindingsAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var Setter = ''
        if (!_.isEmpty(value)){
            Setter = base64.decode((value+'').trim());
        }

        $(element).html(Setter)
    },
};
