var CxCtrl = (new function() {

  var self = this;

  self.UseCache = ko.observable(true);
  self.IsKvart = ko.observable(false);
  self.IsShowMonthPlan = ko.observable(false, {
    persist: 'cxShowMonthPlan'
  });
  self.PageName = ko.observable(null, {
    persist: 'cxPage'
  });

  self.ToggleShowMonthPlan = function() {
    self.IsShowMonthPlan(!self.IsShowMonthPlan());
    self.UpdateSubPeriods();
  }

  self.Events = new EventEmitter();

  self.ToggleIsInput = function() {
    self.IsInput(!self.IsInput());
    Bus.Emit("context_isinput_change");
    self.Update('IsInput', self.IsInput());

  }

  self.Reloader = {};

  self.ChangeDivObj = function() {
    self.Override.SetDivObj(true);
    self.Update();
  }

  self.IsDivObj = ko.observable(false); // Склеенные объекты учета

  self.IsAgregate = ko.observable(false);
  self.AgregateObjs = ko.observable(false);

  self.ChangeAgregateMode = function() {
    self.IsAgregate(!self.IsAgregate());
    if (self.IsAgregate()) {
      if (self.Agregate()) {
        self.Update('Agregate', self.Agregate());
      }
    } else {
      self.Update('CodeObj', self.CodeObj());
    }
  }

  self.CxPermDoc = function() {
    return {
      CodeDoc: self.CodeDoc(),
      CodeObj: self.CodeObj(),
      Year: self.Year(),
      CodePeriod: self.CodePeriod()
    };
  }

  self.UpdateParams = function(){
      var Params = ParamManager.ActualParams();
      self.Override.Params(Params);
      self.Update('params');
  }

  self.UpdateReport = function(){
      var Params = ParamManager.ActualParams();
      self.Override.Params(null);
      self.CodeReport(ReportManager.CurrentReport());
      self.Update('report');
  }

  self.ParamsChanged = function() {
    var NewParams = SettingController.diffParams();
    if (NewParams.length) {
      var Override = SettingController.ActualParams();
      self.Override.Params(Override);
    } else {
      self.Override.Params(null);
    }
    self.Update('params');
  }

  self.ReportChanged = function() {
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

  self.AfterPageShow = function(CodeDoc) {
    if (CodeDoc != self.CodeDoc()) {
      self.CodeDoc(CodeDoc);
      self.AfterShowUpdate.document = CodeDoc;
    }
    if (self.ChangeTimer) clearTimeout(self.ChangeTimer);
    self.ChangeTimer = setTimeout(function() {
      self.UpdateViewShow();
      clearTimeout(self.ChangeTimer);
      self.ChangeTimer = null;
    }, 100);
  }

  self.AfterTypeShow = function(Type) {
    if (Type != self.PageName()) {
      self.AfterShowUpdate.type = Type;
    }
    if (self.ChangeTimer) clearTimeout(self.ChangeTimer);
    self.ChangeTimer = setTimeout(function() {
      self.UpdateViewShow();
      clearTimeout(self.ChangeTimer);
      self.ChangeTimer = null;
    }, 100);
  }

  self.Error = ko.observable(null);

  self.UpdateViewShow = function() {
    if (MBreadCrumbs.CheckPath('adminpage')) return;
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
        var possible = _.map(ModuleManager.DocTabs(),"id");
        if (
          PageName == 'olap' && !Doc.IsOlap ||
          PageName == 'input' && !Doc.IsInput ||
          PageName == 'chart' && !Doc.IsChart ||
          PageName == 'presentation' && !Doc.IsPresent ||
          !_.includes(possible,PageName)
        ) PageName = 'report';
        var C = MAggregate.GetCorrectCodeObj(Doc.CodeDoc, self.CodeObj());
        if (C != self.CodeObj()) {
          self.CodeObj(C);
        }
      } else {
        return self.Error("Документ " + CodeDoc + " не найден");
      }
    }
    if (PageName=="input") self.IsInput(true);
    if (PageName=="report") self.IsInput(false);

    var Doc = MFolders.FindDocument(CodeDoc);
    self.IsDivObj(Doc.IsDivObj);
    console.log("UpdateViewShow docview");
    pager.navigate(["/docview", CodeDoc, PageName].join('/'));
    var DocPlugins = ModuleManager.DocTabs();
    var Choosed = _.first(_.filter(DocPlugins, function(P) {
      return P.id == PageName;
    }));
    if (Choosed) {
      ToUpdate = "page", Value = PageName;
    }
    if (self.AfterShowUpdate.document != -1) {
      self.Override.Params(null);
    } else {
      self.Events.emit("pagechanged");
    }
    setTimeout(function() {
      if (self.AfterShowUpdate.document) {
        self.UpdateDocInfo();
      }
      self.AskForUpdate(ToUpdate, Value);
    }, 0);
    self.AfterShowUpdate = {
      document: -1,
      type: -1
    };
  }

  self.Update = function(type, value) {
    self.AskForUpdate(type, value);
  }

  self.AskForUpdateThrottle = null;
  self.AskForUpdate = function(ToUpdate, Value) {
    if (self.AskForUpdateThrottle) {
      clearTimeout(self.AskForUpdateThrottle);
      self.AskForUpdateThrottle = null;
    }
    self.AskForUpdateThrottle = setTimeout(function(ToUpdate, Value) {
      return function() {
        self.DoUpdate(ToUpdate, Value);
      }
    }(ToUpdate, Value), 200);
  }

  self.DoUpdate = function(type, value) {
    self.ChangeDocPath();
    if (self.AskForUpdateThrottle) {
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
        console.log("DoUpdate docview");
        pager.navigate('/docview/' + self.CodeDoc() + '/' + value);

        var DocPlugins = ModuleManager.DocTabs();
        var Choosed = _.first(_.filter(DocPlugins, function(P) {
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
        Bus.Emit("context_obj_change");
        break;
      case "childobj":
        self.ChildObj(value);
        Updater = ['Row'];
        Bus.Emit("context_obj_change");
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
        Bus.Emit("context_period_change");
        break;
      case "period":
        Updater = ['Col', 'Set'];
        self.SelectedPeriod(value);
        self.Override.CodePeriod(null);
        if (self.Override.Year()) {
          Updater.push('Row');
          self.Override.Year(null);
        }
        Bus.Emit("context_period_change");
        self.UpdateSubPeriods();
        break;
      case "year":
        self.Year(value);
        self.Override.Year(null);
        Updater = ['Row', 'Col'];
        Bus.Emit("context_year_change");
        break;
      case "valuta":
        self.CodeValuta(value);
        break;
      default:
        //console.log("Changing ... ", type, value);
    }
    if (Updater == -1) return;
    var DocPlugin = _.find(ModuleManager.DocTabs(), {
      id: self.PageName()
    });
    if (DocPlugin) {
      var P = ModuleManager.Modules[DocPlugin.class_name];
      if (P.ContextChange) {
        P.ContextChange();
      }
      self.Events.emit("contextchanged", type);
      self.ChangeDocPath();
    }
  }

  self.Context = function() {
    self.InitValues();
    var Test = _.last(window.location.pathname.split('/'));
    if (self.PageName() != Test) {
      self.PageName(Test);
    }
    var Result = {
      CodePeriod: self.CodePeriod(),
      Year: self.Year(),
      CodeValuta: self.CodeValuta(),
      IsInput: self.IsInput(),
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
        Result.IsAgregate = true;
        Result.AgregateObjs = self.AgregateObjs();

      /*try {
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
      }*/
    }
    for (var Key in self.Override) {
      if (self.Override[Key]() && self.Override[Key]() != Result[Key]) {
        Result[Key] = self.Override[Key]();
      }
    }
    Result.CodePeriod = self.CodePeriod();
    var RowsMod = CustomReport.RowsOverride();
    if (!_.isEmpty(RowsMod)){
        Result.RowFields = RowsMod; 
    }
    if (self.PageName()=='input'){
        ["RowFields","CodeReport","Params"].forEach(function(P){
          delete Result[P];
        })
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
  //self.CodePeriod = ko.observable(null, {
  //    persist: 'cxCodePeriod'
  //});
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

  self.ReportPeriod = self.Override.CodePeriod;
  self.RedirectPeriod = ko.observable(null);
  self.SelectedPeriod = ko.observable(null, {
    persist: 'cxCodePeriod'
  });
  self.CodePeriod = ko.computed(function() {
    if (self.RedirectPeriod()) {
      return self.RedirectPeriod();
    }
    if (self.ReportPeriod()) {
      return self.ReportPeriod();
    }
    return self.SelectedPeriod();
  })

  self.RedirectRules = {};
  self.SubPeriods = ko.observableArray();

  self.UpdateSubPeriods = function() {
    var Subs = [];
    if (MPeriods.Map()[self.SelectedPeriod()]) {
      Subs = MPeriods.Map()[self.SelectedPeriod()];
    }
    if (!self.IsShowMonthPlan()) {
      Subs = _.filter(Subs, function(p) {
        return !p.isoptional;
      });
    }
    self.SubPeriods(Subs);
  }

  self.defaultValuta = function() {
    var Valuta = "RUB";
    try {
      Valuta = _.find(MFavorites.Agregates().obj, {
        code: self.CodeObj()
      }).Valuta;
    } catch (e) {;
    }
    return Valuta;
  }

  self.Valutas = function() {
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
  self.KolEd = ko.observable(null);

  self.DocTitle = ko.computed(function() {
    var p = self.CodePeriod();
    var sp = self.CodePeriod();
    var y = self.Year();
    var sy = self.Override.Year();
    var n = self.PrintNameDoc();
    var sc = self.ChildObj();
    var ke = self.KolEd();
    if (n) {
      var s = "";
      if (sc && MFolders.FindDocument(self.CodeDoc()).IsDivObj) {
        s = '<span class="info"> / ' + Catalogue.GetHtml('obj', sc) + "</span>";
      }
      if (sp) p = sp;
      if (sy) y = sy;
      var r = "",
        k = "";
      if (!_.isEmpty(ke)) {
        k = ", " + (ke + '');
      }

      var r = "";

      try {
        var current = ReportManager.CurrentReport();
        if (current!='default'){
          r = _.find(ParamManager.List(),{CodeReport:ReportManager.CurrentReport()}).PrintNameReport
        }
        if (!_.isEmpty(r)){
          r = " ["+r+"]";
        }


      } catch(e){
        //console.log(e);
      }

      //var R = SettingController.ChoosedReport();
      //if (R && R.CodeReport != 'default') {
//        r = '<span class="info"> / ' + SettingController.ChoosedReport().NameReport + "</span>";
  //    }
      if (self.PrintNameDoc() && self.PrintNameDoc().length) {
        return self.PrintNameDoc() + ' за ' + Catalogue.GetHtml('period', p) + ' ' + y + s  + k + r;
      }
      MSite._breadcrumbsFromPages();
    } else {
      return '';
    }
  })

  self.TabName = function() {
    var Doc = CxCtrl.CodeDoc();
    var Info = MFolders.FindDocument(Doc);
    if (Info) {
      if (!_.isEmpty(Info.SNameDoc)) return Info.SNameDoc;
      if (Info.PrintNameDoc) return Info.PrintNameDoc;
      if (Info.NameDoc) return Info.NameDoc;
    }
    return "";
  }

  self.UpdateDocInfo = function(CodeDoc) {
    var Doc = MFolders.FindDocument(self.CodeDoc());
    var N = _.isEmpty(Doc.PrintNameDoc) ? Doc.NameDoc : Doc.PrintNameDoc;
    self.PrintNameDoc(N);
    self.PrintNumDoc(Doc.PrintNumDoc);
    if (!_.isEmpty(self.CodeDoc())) {
      setTimeout(function() {
        $.getJSON("/api/form/doc", CxCtrl.CxPermDoc(), function(data) {
          self.Doc(MModels.Create("doc", data));
          self.Events.emit("documentchanged");
        });
      }, 0);
    }
    if (!Doc.IsShowMeasure && Doc.CodeMeasure && !_.isEmpty(Doc.Measure)) {
      var V = Doc.Measure;
      if (V.indexOf("[") != -1) {
        try {
          V = V.replace(/\[.*?\]/g, " " + _.find(MValuta.Valutas(), {
            CodeValuta: CxCtrl.CodeValuta()
          }).SNameValuta);
        } catch (e) {;
        }
      }
      self.KolEd(V)
    } else {
      self.KolEd(null)
    };
  }

  self.InitValues = function(){
  		try{
	      if(_.isEmpty(self.Year())){
	      	self.Year(moment().format("YYYY"));
	      }
	      if(_.isEmpty(self.CodePeriod())){
	      	self.SelectedPeriod(_.first(_.keys(MPeriods.Map())));
	      }
	      if(_.isEmpty(self.CodeObj())){
	      	self.CodeObj(_.first(MAggregate.AllObjs()).CodeObj);
	      	self.CodeValuta(_.first(MAggregate.AllObjs()).CodeValuta);
	      }
	    } catch(e){
	    	console.log("init context failed",e);
	    }
  }

  self.SetAggregateSimple = function(){
    self.IsAgregate(false);
    self.AgregateObjs([]);
    self.AskForUpdate();
    console.log("SetAggregateSimple arguments",arguments);  
  }

  self.SetAggregateComplex = function(payload){
    self.IsAgregate(true);
    self.AgregateObjs(payload.objs);
    self.AskForUpdate();
    console.log("SetAggregateComplex arguments",arguments);
  }


  self.Init = function (done) {

      MSite.Events.on("initialnavigate", CxCtrl.ChangeInitDocPath);
      Bus.On("params_changed",self.UpdateParams);
      Bus.On("report_loaded",self.UpdateReport);
      Bus.On("aggregate_info_loaded",self.InitValues);

      Bus.On("aggregate_complex",self.SetAggregateComplex);
      Bus.On("aggregate_simple",self.SetAggregateSimple);


      MSite.Events.on("initialnavigate", function(){
      	  self.InitValues();
          self.UpdateDocInfo ();
          self.UpdateSubPeriods();
          self.Update ();

      });
      return done();
  }


  self.init = function() {
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
    if (!self.SelectedPeriod()) {
      self.SelectedPeriod(cM);
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



  self.ParamsToSet = ['SelectedPeriod', 'ReportPeriod', 'RedirectPeriod', 'CodeObj', 'Year', 'CodeReport', 'ChildObj'];

  self.ParamsFromUrl = function(InitialParams) {
    if (!_.isEmpty(InitialParams)) {
      self.ParamsToSet.forEach(function(param) {
        var PValue = InitialParams[param];
        if (!_.isEmpty(PValue)) {
          if (param != "RedirectPeriod") {
            self[param](PValue);
          }
        }
      });
      if (!_.isEmpty(self.CodeReport())){
          ReportManager.CurrentReport(self.CodeReport());
      }
    }
  }


  self.FixPeriodRedirects = function() {
    self.RedirectPeriod(null);
    var DocType = null,
      PeriodRedirects = MPeriods.Redirects(),
      DocTypeInc = {},
      DocTypeExc = {};
    try {
      DocType = MFolders.FindDocument(self.CodeDoc()).CodeDocType;
      if (PeriodRedirects.CodeDocType.Exclude[DocType]) {
        DocTypeExc = PeriodRedirects.CodeDocType.Exclude[DocType];
      }
      if (PeriodRedirects.CodeDocType.Include[DocType]) {
        DocTypeInc = PeriodRedirects.CodeDocType.Include[DocType];
      }
    } catch (e) {
      console.log(e);
    }
    if (!_.isEmpty(DocTypeExc)) {
      console.log("Checking Exclude ...", DocTypeExc);
    } else if (!_.isEmpty(DocTypeInc)) {
      if (DocTypeInc[self.SelectedPeriod()]) {
        //self.Restore = self.Override.CodePeriod();
        //self.Override.CodePeriod(DocTypeInc[self.CodePeriod()]);
        self.RedirectPeriod(DocTypeInc[self.SelectedPeriod()]);
      }
    }
  }

  self.FixChildObjs = function() {
    var Doc = MFolders.FindDocument(self.CodeDoc());
    if (Doc && Doc.HasChildObjs) {
      if (!Doc.SubObjs[self.CodeObj()]) {
        var NewSub = _.first(_.keys(Doc.SubObjs));
        self.CodeObj(NewSub);
        self.ChildObj(_.first(Doc.SubObjs[NewSub]));
        self.ChildObjs(Doc.SubObjs[NewSub]);
      } else {
        self.ChildObjs(Doc.SubObjs[self.CodeObj()]);
        if (!self.ChildObj() || self.ChildObjs().indexOf(self.ChildObj()) == -1) {
          self.ChildObj(_.first(self.ChildObjs()));
        }
      }
      if (Doc.HasChildObjs) {
        if (!self.ChildObj() && Doc.SubObjs && Doc.SubObjs[self.CodeObj()]) {
          self.ChildObj(_.first(Doc.SubObjs[self.CodeObj()]));
        }
        self.ChildObjs(Doc.SubObjs[self.CodeObj()]);
      }
    } else {
      self.ChildObj(null);
      self.ChildObjs([]);
    }
  }

  self.CorrectParams = function() {
    self.FixPeriodRedirects();
    self.FixChildObjs();
  }

  self.ParamsToUrl = function() {
    self.CorrectParams();
    var ParamsArr = [];
    self.ParamsToSet.forEach(function(param) {
      var V = null;
      switch (param) {
        /*case 'CodePeriod':
            V = self.Override.CodePeriod();
        break;*/
        /*case 'ReportPeriod':
            V = self.Override.CodePeriod();
        break;*/
        default: V = self[param]();
        break;
      }
      if (!_.isEmpty(V)) {
        ParamsArr.push(param + "=" + V);
      }
    });
    var Search = _.isEmpty(ParamsArr) ? "" : '?' + ParamsArr.join("&");
    pager.navigate(window.location.pathname);
    var state = window.location.origin + window.location.pathname + Search;
    history.replaceState({}, '', state);
  }


  self.ChangeInitDocPath = function(InitialParams) {
    if (_.includes(window.location.href, 'docview')) {
      self.ParamsFromUrl(InitialParams);
      self.ParamsToUrl();
    }
  }

  self.ChangeDocPath = function() {
    if (_.includes(window.location.href, 'docview')) {
      self.ParamsToUrl();
    }
  }

  return self;
})


ModuleManager.Modules.CxCtrl = CxCtrl;