var CxCtrl = (new function () {

    var self = this;

    self.UseCache = ko.observable(true);
    self.IsKvart = ko.observable(false);
    self.IsShowMonthPlan = ko.observable(false, {
        persist: 'cxShowMonthPlan'
    });
    self.PageName = ko.observable(null, {
        persist: 'cxPage'
    });

    self.ToggleShowMonthPlan = function () {
        self.IsShowMonthPlan(!self.IsShowMonthPlan());
        self.UpdateSubPeriods();
    }

    self.Events = new EventEmitter();

    self.ToggleIsInput = function () {
        self.IsInput(!self.IsInput());
        self.Update('IsInput', self.IsInput());
    }

    self.Reloader = {};

    self.ChangeDivObj = function () {
        self.Override.SetDivObj(true);
        self.Update();
    }

    self.IsDivObj = ko.observable(false); // Склеенные объекты учета

    self.IsAgregate = ko.observable(false);

    self.ChangeAgregateMode = function () {
        self.IsAgregate(!self.IsAgregate());
        if (self.IsAgregate()) {
            if (self.Agregate()) {
                self.Update('Agregate', self.Agregate());
            }
        } else {
            self.Update('CodeObj', self.CodeObj());
        }
    }

    self.CxPermDoc = function () {
        return {
            CodeDoc: self.CodeDoc(),
            CodeObj: self.CodeObj(),
            Year: self.Year(),
            CodePeriod: self.Override.CodePeriod() || self.CodePeriod()
        };
    }

    self.ParamsChanged = function () {
        var NewParams = SettingController.diffParams();
        if (NewParams.length) {
            var Override = SettingController.ActualParams();
            self.Override.Params(Override);
        } else {
            self.Override.Params(null);
        }
        self.Update('params');
    }

    self.ReportChanged = function () {
        var R = SettingController.ChoosedReport();
        var CodeReport = "default";
        if (R) CodeReport = R.CodeReport;
        self.CodeReport(CodeReport);
        self.Update('report');
    }


    self.Agregate = ko.observable(null);
    self.AgregateType = ko.observable(null);


    self.ChangeTimer = null;
    self.AfterShowUpdate = {
        document: -1,
        type: -1
    };

    self.AfterPageShow = function (CodeDoc) {
        console.log("AfterPageShow",arguments,">>>>>>>>>>>>>>>>>>>>>>>>");
        if (CodeDoc != self.CodeDoc()) {
            self.AfterShowUpdate.document = CodeDoc;
        }
        console.log("AfterPageShow",CodeDoc);
        if (self.ChangeTimer) clearTimeout(self.ChangeTimer);
        self.ChangeTimer = setTimeout(function(){
            self.UpdateViewShow();
            clearTimeout(self.ChangeTimer);
            self.ChangeTimer = null;
        }, 100);
    }

    self.AfterTypeShow = function (Type) {
        if (Type != self.PageName()) {
            self.AfterShowUpdate.type = Type;
        }
        console.log("AfterTypeShow",Type);
        if (self.ChangeTimer) clearTimeout(self.ChangeTimer);
        self.ChangeTimer = setTimeout(function(){
            self.UpdateViewShow();
            clearTimeout(self.ChangeTimer);
            self.ChangeTimer = null;
        }, 100);
    }

    self.Error = ko.observable(null);

    self.Error.subscribe(function (V) {
        //if (V) swal("",V,'error');
    })

    self.UpdateViewShow = function () {
        console.log("UpdateViewShow",">>>>>>>>>>>>>>>>>>>>>>>>>>>>",arguments);
        if (!ModuleManager.IsLoaded()) return;
        self.Error(null);
        if (MPrint.IsPrint()) self.AfterShowUpdate = {
            document: -1,
            type: -1
        };
        if (self.AfterShowUpdate.document == -1 && self.AfterShowUpdate.type == -1 && MBreadCrumbs.CheckPath('docview')) return;
        var CodeDoc = [null, -1].indexOf(self.AfterShowUpdate.document) == -1 ? self.AfterShowUpdate.document : self.CodeDoc();
        var PageName = [null, -1].indexOf(self.AfterShowUpdate.type) == -1 ? self.AfterShowUpdate.type : self.PageName();
        PageName = PageName || "report";
        var ToUpdate = "document",
            Value = "";
        var Doc = MFolders.FindDocument(CodeDoc);
        if (Doc.IsPresent && ["input", "report"].indexOf(PageName) != -1) PageName = "presentation";
        if (ToUpdate == 'document') {
            if (Doc) {
                if (
                    PageName == 'olap' && !Doc.IsOlap ||
                    PageName == 'input' && !Doc.IsInput ||
                    PageName == 'chart' && !Doc.IsChart ||
                    PageName == 'presentation' && !Doc.IsPresent
                ) PageName = 'report';
                var C = MAggregate.GetCorrectCodeObj(Doc.CodeDoc, self.CodeObj());
                if (C != self.CodeObj()) {
                    self.CodeObj(C);
                }
            } else {
                return self.Error("Документ " + CodeDoc + " не найден");
            }
        }
        var Doc = MFolders.FindDocument(CodeDoc);
        if (Doc.HasChildObjs) {
            if (!self.ChildObj() && Doc.SubObjs && Doc.SubObjs[self.CodeObj()]) {
                self.ChildObj(_.first(Doc.SubObjs[self.CodeObj()]));
            }
            self.ChildObjs(Doc.SubObjs[self.CodeObj()]);
        } else {
            self.ChildObj(null);
            self.ChildObjs([]);
        }
        self.IsDivObj(Doc.IsDivObj);
        pager.navigate(["/docview", CodeDoc, PageName].join('/'));
        var DocPlugins = ModuleManager.DocTabs();
        var Choosed = _.first(_.filter(DocPlugins, function (P) {
            return P.id == PageName;
        }));
        if (Choosed) {
            ToUpdate = "page", Value = PageName;
        }
        console.log("SUPER UPDATE",self.AfterShowUpdate);
        if (self.AfterShowUpdate.document != -1) {
            console.log("documentchanged ================== ",self.AfterShowUpdate.document);
            
            self.ChangeDocPath();
            self.Override.Params(null);
        } else {
            self.Events.emit("pagechanged");
            self.ChangeDocPath();
        }
        setTimeout(function () {
            self.AskForUpdate(CodeDoc,ToUpdate, Value);
        }, 0);
        self.AfterShowUpdate = {
            document: -1,
            type: -1
        };
    }

    self.Update = function (type, value) {
        self.AskForUpdate (null, type, value);
    }

    self.AskForUpdateThrottle = null;
    self.AskForUpdate = function(CodeDoc, ToUpdate, Value){
        console.log("ASK",ToUpdate, Value);
        if (self.AskForUpdateThrottle){
            clearTimeout(self.AskForUpdateThrottle);
        }       
        self.AskForUpdateThrottle = setTimeout (function(ToUpdate, Value){
            return function(){
                if (CodeDoc){
                    self.UpdateDocInfo(function(){
                        self.Events.emit("documentchanged");
                        self.DoUpdate(ToUpdate, Value);
                    })    
                } else {
                    self.DoUpdate(ToUpdate, Value);
                }
            }
        }(ToUpdate, Value),500);
    }

    self.DoUpdate = function (type, value) {
        if (self.AskForUpdateThrottle){
            clearTimeout(self.AskForUpdateThrottle);
            self.AskForUpdateThrottle = null;
        }
        var Updater = [],
            UpdateNeeded = true;
        switch (type) {
            case "report":
                Updater = ['Col', 'Row'];
                break;
            case "params":
                Updater = ['Col'];
                break;
            case "document":
                Updater = null; // Полное обновление
                break;
            case "page":
                pager.navigate('/docview/' + self.CodeDoc() + '/' + value);
                var DocPlugins = ModuleManager.DocTabs();
                var Choosed = _.first(_.filter(DocPlugins, function (P) {
                    return P.id == value;
                }));
                if (Choosed) {
                    Updater = -1;
                    if (ModuleManager.Modules[Choosed.class_name].BeforeShow) {
                        ModuleManager.Modules[Choosed.class_name].BeforeShow();
                    } else {
                        ModuleManager.Modules[Choosed.class_name].Init();
                    }
                } else {
                    Updater = ['Col', 'Row']; // колонки у рядов фильтр NoInput и NoOutput
                    if (value == 'olap') Updater.push('Obj');
                }
                break;
            case "CodeGrp":
            case "CodeRegion":
            case "CodeDiv":
            case "CodeOtrasl":
                var Remap = {
                    CodeRegion: "region",
                    CodeDiv: "div",
                    CodeOtrasl: "otrasl",
                    CodeGrp: "grp"
                };
                self.AgregateType(Remap[type]);
                self.Agregate(value);
                Updater = null; // Полное обновление
                break;
            case "cells":
                if (!self.UseCache()) {
                    Updater = null; // Полное обновление  
                }
                break;
            case "grouptype":
                self.GroupType(value);
                UpdateNeeded = false;
                break;
            case "grp":
                self.CodeGrp(value);
                Updater = ['Obj'];
                break;
            case "page":
                self.PageName(value);
                Updater = null; // Полное обновление
                break;
            case "obj":
                self.ChildObj(null);
                self.CodeObj(value);
                Updater = ['Row', "Doc"];
                break;
            case "childobj":
                self.ChildObj(value);
                Updater = ['Row'];
                break;
            case "subperiod":
                if (!value || self.Override.CodePeriod() == value.code) {
                    self.Override.CodePeriod(null);
                    self.Override.Year(null);
                    Updater = ['Col', 'Set'];
                } else {
                    self.Override.CodePeriod(value.code);
                    Updater = ['Col', 'Set'];
                    if (value.anotherYear) {
                        self.Override.Year(Number(self.Year()) + value.year);
                        Updater.push('Row');
                    }
                }
                break;
            case "period":
                Updater = ['Col', 'Set'];
                self.CodePeriod(value);
                self.Override.CodePeriod(null);
                if (self.Override.Year()) {
                    Updater.push('Row');
                    self.Override.Year(null);
                }
                self.UpdateSubPeriods();
                break;
            case "year":
                self.Year(value);
                self.Override.Year(null);
                Updater = ['Row', 'Col'];
                break;
            case "valuta":
                self.CodeValuta(value);
                break;
            default:
                console.log("Changing ... ", type, value);
        }
        if (Updater == -1) return;
        var DocPlugin = _.find(ModuleManager.DocTabs(), {
            id: self.PageName()
        });
        if (DocPlugin) {
            console.log("DocPlugin UPDATE ContextChange",DocPlugin);
            var P = ModuleManager.Modules[DocPlugin.class_name];
            if (P.ContextChange) {
                P.ContextChange();
            }
            self.Events.emit("contextchanged", type);
            self.ChangeDocPath();
        } else {
            console.log("DocumentForm");
            /*if (UpdateNeeded){
                DocumentForm.Work(Updater);
            } else {
                DocumentForm.Refresh();
            }*/
        }
    }

    self.Context = function () {
        var Test = _.last(window.location.pathname.split('/'));
        if (self.PageName() != Test) {
            self.PageName(Test);
        }
        var Result = {
            CodePeriod: self.CodePeriod(),
            Year: self.Year(),
            CodeValuta: self.CodeValuta(),
            IsInput: self.PageName() == 'input',
            IsOlap: self.PageName() == 'olap',
            UseCache: self.UseCache(),
            IsDebug: false,
            CodeDoc: self.CodeDoc(),
            CodeObj: self.CodeObj(),
            ChildObj: self.ChildObj(),
            CodeReport: self.CodeReport(),
            CodeGrp: self.CodeGrp(),
            GroupType: self.GroupType()
        }
        if (self.IsAgregate()) {
            try {
                Result.Agregate = _.find(MFavorites.Agregates()[self.AgregateType()], {
                    code: self.Agregate()
                }).objs;
                Result.AgregateType = {
                    Model: self.AgregateType(),
                    Code: self.Agregate()
                };
                if (!Result.Agregate.length) throw "Пустой агрегат";
            } catch (e) {
                console.log(e);
            }
        }
        for (var Key in self.Override) {
            if (self.Override[Key]() && self.Override[Key]() != Result[Key]) {
                Result[Key] = self.Override[Key]();
            }
        }
        return Result;
    }

    self.ChildObjs = ko.observableArray();

    self.CodeDoc = ko.observable(null, {
        persist: 'cxCodeDoc'
    });
    self.CodeReport = ko.observable('default');
    self.CodeObj = ko.observable(null, {
        persist: 'cxCodeObj'
    });
    self.ChildObj = ko.observable(null, {
        persist: 'cxChildObj'
    });
    self.CodeValuta = ko.observable(null, {
        persist: 'cxCodeValuta'
    });
    self.CodePeriod = ko.observable(null, {
        persist: 'cxCodePeriod'
    });
    self.Year = ko.observable(null, {
        persist: 'cxYear'
    });
    self.IsInput = ko.observable(null, {
        persist: 'cxIsInput'
    });
    self.CodeGrp = ko.observable(null, {
        persist: 'cxCodeGrp'
    });
    self.KvartPeriod = ko.observable(null, {
        persist: 'cxKvartPeriod'
    })
    self.MesPeriod = ko.observable(null, {
        persist: 'cxMesPeriod'
    })
    self.GroupType = ko.observable(null, {
        persist: 'cxGroupType'
    });



    self.Override = {
        CodePeriod: ko.observable(null, {
            persist: 'cxOvCodePeriod'
        }),
        Year: ko.observable(null, {
            persist: 'cxOvYear'
        }),
        SetDivObj: ko.observable(false, {
            persist: 'cxDivObj'
        }),
        Params: ko.observable(null)
    }

    self.RedirectRules = {};
    self.SubPeriods = ko.observableArray();

    self.UpdateSubPeriods = function () {
        var Subs = [];
        if (MPeriods.Map()[self.CodePeriod()]) {
            Subs = MPeriods.Map()[self.CodePeriod()];
        }
        if (!self.IsShowMonthPlan()) {
            Subs = _.filter(Subs, function (p) {
                return !p.isoptional;
            });
        }
        self.SubPeriods(Subs);
    }

    self.defaultValuta = function () {
        var Valuta = "RUB";
        try {
            Valuta = _.find(MFavorites.Agregates().obj, {
                code: self.CodeObj()
            }).Valuta;
        } catch (e) {;
        }
        return Valuta;
    }

    self.Valutas = function () {
        var vs = ['RUB', 'USD', 'EUR'];
        var add = self.defaultValuta();
        if (vs.indexOf(add) == -1) {
            vs.unshift(add);
        }
        return vs;
    }

    self.Doc = ko.observable();
    self.PrintNameDoc = ko.observable('');
    self.PrintNumDoc = ko.observable('');

    self.DocTitle = ko.computed(function () {
        var p = self.CodePeriod();
        var sp = self.Override.CodePeriod();
        var y = self.Year();
        var sy = self.Override.Year();
        var n = self.PrintNameDoc();
        var sc = self.ChildObj();
        if (n) {
            var s = "";
            if (sc && MFolders.FindDocument(self.CodeDoc()).IsDivObj) {
                s = '<span class="info"> / ' + Catalogue.GetHtml('obj', sc) + "</span>";
            }
            if (sp) p = sp;
            if (sy) y = sy;
            var r = "";
            var R = SettingController.ChoosedReport();
            if (R && R.CodeReport != 'default') {
                r = '<span class="info"> / ' + SettingController.ChoosedReport().NameReport + "</span>";
            }
            if (self.PrintNameDoc() && self.PrintNameDoc().length) {
                return self.PrintNameDoc() + ' за ' + Catalogue.GetHtml('period', p) + ' ' + y + s + r;
            }
            MSite._breadcrumbsFromPages();
        } else {
            return '';
        }
    })

    self.TabName = function(){
        var Doc = CxCtrl.CodeDoc();
        var Info = MFolders.FindDocument(Doc);
        if (Info){
            if (!_.isEmpty(Info.SNameDoc)) return Info.SNameDoc;
            if (Info.PrintNameDoc) return Info.PrintNameDoc;
            if (Info.NameDoc) return Info.NameDoc;
        }
        return "";
    }

    self.UpdateDocInfo = function (CodeDoc, done) {
        var Doc = MFolders.FindDocument(self.CodeDoc());
        var N = _.isEmpty(Doc.PrintNameDoc) ? Doc.NameDoc : Doc.PrintNameDoc;
        self.PrintNameDoc(N);
        self.PrintNumDoc(Doc.PrintNumDoc);
        $.getJSON("/api/form/doc", _.merge(self.Context(), {
            CodeDoc: CodeDoc
        }), function (data) {
            if (!data.err) {
                self.Doc(MModels.Create("doc", data));
            }
            return done();
        })
    }

    self.Init = function (done) {
        return done();
    }

    self.init = function () {
        if (!MSite.Me()) return;
        var cO = _.first(PermChecker.AvObj());
        var cY = Number(moment().format("YYYY"));
        var cM = '1' + (Number(moment().format("MM")) - 1);
        if (cM == "10") {
            cY = cY - 1;
            cM = "112";
        }
        if (!self.Year()) self.Year(cY);
        if (!self.CodeObj()) self.CodeObj(cO);
        if (!self.CodePeriod()) {
            self.CodePeriod(cM);
            self.MesPeriod(cM);
            if (self.RedirectRules[cM]) {
                self.KvartPeriod(self.RedirectRules[cM]);
            }
        }
        if (!self.CodeValuta()) {
            self.CodeValuta(self.defaultValuta());
        }
        if (!self.IsInput()) self.IsInput(false);
        if (!self.PageName()) {
            (self.IsInput()) ? self.PageName('input'): self.PageName('report');
        }
        if (!self.CodeReport()) self.CodeReport('default');
        if (!self.CodeGrp()) {
            try {
                var Grp = _.first(MFavorites.Agregates().grp).code;
                self.CodeGrp(Grp);
            } catch (e) {;
            }
        }
        if (!self.GroupType()) self.GroupType('CodeDiv');
        self.UpdateSubPeriods();
    }


    self.ChangeInitDocPath = function () {
        if (_.includes(window.location.href, 'docview')) {
            var avParams = ['CodeObj', 'CodePeriod', 'Year', 'CodeReport', 'ReportPeriod'];
            if (window.location.search) {
                var search = window.location.search.substring(1);

                function parseSearchString(search) {
                    var result = {};
                    search.split('&').forEach(function (pair) {
                        var p = pair.split('=');
                        result[p[0]] = p[1];
                    })
                    return result;
                }
                var pSearch = parseSearchString(search);
                avParams.forEach(function (param) {
                    if (pSearch[param]) {
                        if (param === 'CodePeriod') {
                            if (pSearch[param]) {
                                self.Override.CodePeriod(pSearch[param]);
                            }
                        } else if (param === 'ReportPeriod') {
                            self.CodePeriod(pSearch[param]);
                        } else {
                            self[param](pSearch[param]);
                        }
                    }
                });
            }
            var resSearchString = '?';
            avParams.forEach(function (param, index) {
                if (param === 'CodePeriod') {
                    if (!self.Override.CodePeriod()) {
                        self.Override.CodePeriod(self.CodePeriod());
                    }
                    resSearchString += (param + '=' + self.Override.CodePeriod());
                } else if (param === 'ReportPeriod') {
                    resSearchString += (param + '=' + self.CodePeriod());
                } else {
                    resSearchString += (param + '=' + self[param]());
                }
                if (index < avParams.length - 1) {
                    resSearchString += '&';
                }
            });

            pager.navigate(window.location.pathname);
            var state = window.location.origin + window.location.pathname + resSearchString;
            history.replaceState({}, '', state);
        }
    }

    self.ChangeDocPath = function () {
        if (_.includes(window.location.href, 'docview')) {
            var avParams = ['CodeObj', 'CodePeriod', 'Year', 'CodeReport', 'ReportPeriod'];
            var resSearchString = '?';
            avParams.forEach(function (param, index) {
                if (param === 'CodePeriod') {
                    if (!self.Override.CodePeriod()) {
                        self.Override.CodePeriod(self.CodePeriod());
                    }
                    resSearchString += (param + '=' + self.Override.CodePeriod());
                } else if (param === 'ReportPeriod') {
                    resSearchString += (param + '=' + self.CodePeriod());
                } else {
                    resSearchString += (param + '=' + self[param]());
                }
                if (index < avParams.length - 1) {
                    resSearchString += '&';
                }
            });
            var state = window.location.origin + window.location.pathname + resSearchString;
            history.replaceState({}, '', state);
        }
    }

    return self;
})

ModuleManager.Events.addListener("modulesinited", function () {
    console.log("<<<<< modulesloaded");
    SettingController.Events.on("paramschanged", CxCtrl.ParamsChanged)
    SettingController.Events.on("reportchanged", CxCtrl.ReportChanged)
    CxCtrl.init();
    MSite.Events.on("initialnavigate", CxCtrl.ChangeInitDocPath);
})



ModuleManager.Modules.CxCtrl = CxCtrl;