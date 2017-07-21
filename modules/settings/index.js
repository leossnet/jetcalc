var SettingController = (new function(){

    var self = this;

    self.Events = new EventEmitter();

    self.IsAvailable = function(){
        return ["olap","report","chart"].indexOf(CxCtrl.PageName())!=-1
    }

    self.LoadReport = function(data){
        self.SelectReport(data);
    }
	
    self.IsShow = ko.observable(false);
    self.IsInited = ko.observable(false);
    self.IsShowList = ko.observable(true);

    self.Toggle = function(){
        self.IsShow(!self.IsShow());
       	self.Events.emit("settingstoggle");
       	if (self.IsShow()){
       		self.Init();
            RightMenu.IsMenuToggled(false);
       	} else {
            RightMenu.IsMenuToggled(true);    
        }
        
    }

    self.LoadDefault = function(NoCache,done){
         var Params = {};
         if (NoCache) Params.UseCache = false;
    	 $.ajax({
            url:"/api/form/set",
            data:_.merge(CxCtrl.Context(),Params),
            success:function(defaultData){
            	for (var Key in self.rawData){
            		self.rawData[Key] = defaultData[Key] || []
            	}
                self.IsInited(false);
                done && done();
            }
		})
    }

	self.rawData =  {tabs:[], grps:[], params:[], List:[]};
    self.choosedTab = ko.observable(null);
    self.choosedGrp = ko.observable(null);
 	
 	self.Init = function(){
        if (self.IsInited()) return;
        self.IsInited(true);
        self.oldDiff = null;
        self.Reports(self.rawData.List);
        if (!self.ChoosedReport()){
            self.ChoosedReport(_.first(self.Reports()));
        }
        var params = self.rawData.params;
        var result = {};
        params.forEach(function(p){
            result[p.CodeParam] = ko.observable(p.DefaultParamSet);
        });
        self.defaultParams = ko.mapping.toJS(result);
        self.resParams(result);
        var sParams = [];
        params.forEach(function(P){
            if (_.keys(P.ParamSets).length>2){
                P.type = "select";
            } else {
                var test = _.keys(P.ParamSets);
                if (test[0].replace('NOT_','')==test[1].replace('NOT_','')){
                    P.type = "checkbox";
                } else {
                    P.type = "select";
                }
            }
            sParams.push(P);
        });
        self.servedParams(sParams);
        self.ResetTabGrp();
    }
    
    self.ResetTabGrp = function(){
        self.choosedTab(_.first(_.keys(self.rawData.tabs)));
        self.choosedGrp(_.first(_.keys(self.rawData.grps)));
    }



    self.resParams         = ko.observable([]);
    self.servedParams      = ko.observable();
    self.defaultParams     = {};
    self.ChoosedReport     = ko.observable(null);
    self.Reports           = ko.observableArray();
    self.IgnoreParamsUpdate = false;

    self.SelectReport = function(data){
        self.IgnoreParamsUpdate = true;
        self.ChoosedReport(data);
        var CodeReport = data.CodeReport;
        var Params = data.Params;
        for (var CodeParam in Params){
            var ParamSet = Params[CodeParam];
            self.resParams()[CodeParam](ParamSet);
        }
        self.defaultParams = Params;
        self.Events.emit('reportchanged');    
        setTimeout(function(){
            self.IgnoreParamsUpdate = false;    
        },1000);        
    }

    self.ActualParams = function(){
		var R = {};    	
        for (var Key in self.resParams()){
	        R[Key] = self.resParams()[Key](); 
        }
        var All = self.servedParams();
        var Keys = {};
        All.forEach(function(A){
            try{
                Keys = _.merge(Keys,A.ParamSets[R[A.CodeParam]].ParamKeys);    
            } catch(e){
                console.log("Error in params config ",A.CodeParam,R[A.CodeParam],A.ParamSets);
            }
        	
        })
        return Keys;
    }
   


    self.SaveComment = ko.observable();
    self.SaveError = ko.observable(null);

    self.StartUpdate  = function(){
        self.SaveComment('');
        $('#settingsDefaultModal').modal('show');
    }

    self.Update = function(){
        self.SaveError(null);
        var AllParams = ko.toJS(self.resParams());
        var Diff = self.diffParams();
        var Update = {Params:{}};
        Diff.forEach(function(D){
            Update.Params[D] = AllParams[D];
        })
        Update.CodePeriod = self.CodePeriod();
        Update.IsInput = self.IsInput;
        Update.Comment = (self.SaveComment()+'').trim();
        Update.CodeDoc = self.CodeDoc();
        if (!Update.Comment.length) return self.SaveError('Напишите комментарий к изменениям');
        $.ajax({
            url:'/api/designer/settings/updatedefault',
            method:'put',
            data:Update,
            success:function(data){
                $('#settingsDefaultModal').modal('hide');
                self.Update('settingschange');
            },
            error:function(err){
                self.SaveError("Ошибка сохранения на сервере");
            }
        })
    }


    self.EditReport = ko.observable(null);

    self.NewReport = function(){
        self.EditReport(MModels.Create("report",{}));
        $('#settingsReportModal').modal('show');
    }

    self.ReportForm = function(){
        self.EditReport(MModels.Create("report",self.ChoosedReport()));
        $('#settingsReportModal').modal('show');
    }

    self.SaveReport = function(){
        var Update = {Report:self.EditReport().toJS(),Params:ko.toJS(self.resParams())};
        Update.CodePeriod = self.CodePeriod();
        Update.IsInput = self.IsInput();
        Update.CodeDoc = self.CodeDoc();
        if (!(Update.Report.CodeReport+'').trim().length){
            return self.SaveError("Задайте код для отчета");
        }
        $.ajax({
            url:'/api/designer/settings/createreport',
            method:'post',
            data:Update,
            success:function(data){
                $('#settingsReportModal').modal('hide');
                self.Update('settingschange');
            },
            error:function(err){
                self.SaveError("Ошибка сохранения на сервере");
            }
        })
    }

    self.Delete = function(){
        swal('DELETE?');
    }

    self.getTabs = function(){
        var tabs = [];
        var raw = self.rawData;
        if (raw && raw.tabs) {
            tabs = _.keys(raw.tabs);
        }
        if (self.IsShowList()) tabs.push("reports");
        return tabs;
    }

    self.TabName = function(tab){
    	if (tab=='undefined') return "Параметры";
    	if (tab=='reports') return "Отчеты";

    }

    self.getGroupsByTab = function(tab){
        var data = self.rawData;
        var groups = [];
        _.keys(data.grps).forEach(function(grp){
            var params = _.intersection(data.grps[grp],data.tabs[tab]);
            if (params.length) groups.push(grp);
        });
        return groups;
    }

    self.oldDiff = null;

    self.diffParams = ko.computed(function(){
        var resParams     = self.resParams();
        var defaultParams = self.defaultParams;
        var diff = [];
        _.forIn(defaultParams,function(value,key){
            if (resParams[key]()!=value) {
                diff.push(key);
            }
        });
        if (!self.oldDiff) {
            self.oldDiff = diff;
            return;   
        }
        if (!self.IgnoreParamsUpdate) self.Events.emit('paramschanged');    
        return diff;
    }).extend({ throttle: 500 })

    return self;
})

MSite.Events.on("initialnavigate",function(){
    SettingController.IsShow(false);
});


MSite.Events.addListener("navigate",function(){
	if (SettingController.IsShow()) SettingController.IsShow(false);
})

CxCtrl.Events.addListener("documentchanged",function(){
	SettingController.LoadDefault();
})


ModuleManager.Modules.SettingController = SettingController;



ko.bindingHandlers.checkBox = {
  init: function(element, valueAccessor, allBindingsAccessor) {
    var value     = valueAccessor();
    var unwrValue = ko.unwrap(valueAccessor());
    $(element).click(function(){
      if (_.startsWith(value(),'NOT_')) {
        value((value()+'').substring(4,value().length));
      } else {
        value('NOT_' + value());
      }
    });
  },
  update: function(element, valueAccessor, allBindingsAccessor) {
    var value = ko.unwrap(valueAccessor());
    if (_.startsWith(value,'NOT_')){
      $(element).prop('checked',false);
    } else {
      $(element).prop('checked',true);
    }
  }
}

