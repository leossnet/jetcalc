var MDocumentEditor = (new function () {

    var self = new Module("documenteditor");

    self.Document = ko.observable();

    self.IsAvailable = function (CodeDoc) {
        return PermChecker.CheckPrivelege("IsDocumentDesigner", CxCtrl.CxPermDoc());
    }

    self.Init = function (done) {
        MSandBox.Events.on('sandbox_status_change', function () {
            self.Load();
        })
        return done && done();
    }

    self.ContextChange = function () {

    }

    self.BeforeShow = function () {
        self.Load();
        MSite.Events.off("save", self.SaveChanges);
        MSite.Events.on("save", self.SaveChanges);
    }

    self.Mode.subscribe(function () {
        self.Load();
    })

    self.BeforeHide = function () {
        self.Document(null);
        MSite.Events.off("save", self.SaveChanges);
    }


    self.DocFields = ['CodeDoc', 'NameDoc', 'SNameDoc', 'PrintNameDoc', 'PrintNumDoc', 'IsPrimary', 'IsAnalytic', 'IsOlap', 'IsInput', 'IsChart', 'IsPresent', 'IsShowMeasure', 'CodeMeasure', 'CodeGrp', 'FirstYear'];


    self.InfoByMode = function () {
        var Result = {
            Fields: self.DocFields,
            Links: []
        };
        switch (self.Mode()) {
            case "RootRows":
                Result.Links = Result.Links.concat(['docrow', 'docheader']);
                Result.Fields = Result.Fields.concat(['IsShowRoots']);
                break;
            case "Placement":
                Result.Links = Result.Links.concat(['docfolderdoc', 'docpacket']);
                Result.Fields = Result.Fields.concat(['CodeModel', 'IndexDoc']);
                break;
            case "Responsables":
                Result.Links = Result.Links.concat(['doclabel']);
                Result.Fields = Result.Fields.concat(['CodeRole', 'FirstYear', 'IsDesigner', 'IsTester']);
                break;
            case "ChildObjs":
                Result.Links = Result.Links.concat(['docobjtype']);
                Result.Fields = Result.Fields.concat(['HasChildObjs', 'IsDivObj', 'IsObjToRow', 'IsShowParentObj', "IsObjTree"]);
                break;
            case "ReportSettings":
                Result.Links = Result.Links.concat(['docparamkey']);
                Result.Fields = Result.Fields.concat(['IsActiveCondition']);
                break;
            case "Bistran":
                Result.Links = Result.Links.concat(['docbill']);
                Result.Fields = Result.Fields.concat(['IsBiztranDoc', 'UseProd', 'UseOrg', 'UseDogovor', 'UseDogovorArt']);
                break;
        }
        return Result;
    }


    self.Load = function () {
        if (!self.Mode()) return self.InitSetMode("RootRows");
        self.rGet("document/" + CxCtrl.CodeDoc(), self.InfoByMode(), function (data) {
            self.Document(ModelEdit.Model("doc", data.Doc));
        })
    }

    self.SaveChanges = function () {
        self.rPut("document/" + CxCtrl.CodeDoc(), {
            Info: self.InfoByMode(),
            Changes: JSON.stringify(self.Document().toJS())
        }, function () {
            swal("", "Изменения сохранены", "success")
            self.Load();
        })
    }


    self.RollBack = function () {
        self.Load();
    }


    return self;
})

ModuleManager.Modules.DocumentEditor = MDocumentEditor;

var ExtractObject = function (obj) {
    var ret = obj.toJS();
    _.keys(obj).forEach(function (k) {
        console.log(k)
        if (k.startsWith("Code") && k != "Code") {

        }
        if (k.startsWith("Link_")) {
            obj[k]().forEach(function (lk) {})
        }
        
    })
    return JSON.stringify(ret, null, '\t');
}
