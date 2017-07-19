var MPeriods = (new function() {
   
    var self = new Module("periods");

 
    self.BeforeHide = function(){
        self.UnSubscribe();
    }
    self.BeforeShow = function(){
        self.Subscribe();
        self.Show();
    }        



    // Period map editor
    self.LinkPeriods = ko.observable();
    self.MainPeriods   = ko.observableArray();

    self.RemoveLinkPeriod = function(CodePeriod){
        self.LinkPeriods()[CodePeriod].remove(this);
    }

    self.AddLinkPeriod = function(CodePeriod){
        self.LinkPeriods()[CodePeriod].push(MModels.Create("reportperiods",{CodePeriod:CodePeriod,IndexReportPeriod:(self.LinkPeriods()[CodePeriod]().length+1)}));
    }

    self.EditPeriodMap = ko.observable(null);

    self.SetEditMapPeriod = function(data){
        if (self.IsCurrentEditMapPeriod(data)){
            self.EditPeriodMap(null);
        } else {
            self.EditPeriodMap(data);    
        }        
    }

    self.IsCurrentEditMapPeriod = function(data){
        return self.EditPeriodMap()==data;
    }

    self.LoadPeriodMap = function(){
        self.rGet("periodmap",{},function(data){
            console.log(data);
            self.MainPeriods(_.map(data.MainPeriods,function(MP){
                return MModels.Create("period",MP);
            }));
            var Str = {};
            data.MainPeriods.forEach(function(MP){
                Str[MP.CodePeriod] = ko.observableArray();
            })
            data.LinkPeriods.forEach(function(LP){
                if (Str[LP.CodePeriod]) {
                    Str[LP.CodePeriod].push(MModels.Create("reportperiods",LP));
                }
            })
            self.LinkPeriods(Str);
        })
    }

    self.SaveChangesPMap = function(){
        var FieldsToPass = MModels.Create("reportperiods").EditFields.concat(["_id"]);
        var Data = ko.toJS(self.LinkPeriods), Reparsed = {};
        for (var Key in Data){
            Reparsed[Key] = _.filter(_.map(Data[Key],function(M){
                return _.pick(M,FieldsToPass);
            }),function(D){
                return !_.isEmpty(D.CodeReportPeriod);
            })
        }
        self.rPut("periodmap", {JSON:JSON.stringify(Reparsed)}, function(data){
            self.Init();
            self.LoadPeriodMap();            
        })
    } 


    // Period Autofill
    self.LinkPeriodsAF = ko.observable();
    self.MainPeriodsAF   = ko.observableArray();

    self.RemoveLinkPeriodAF = function(CodePeriod){
        self.LinkPeriodsAF()[CodePeriod].remove(this);
    }

    self.AddLinkPeriodAF = function(CodePeriod){
        self.LinkPeriodsAF()[CodePeriod].push(MModels.Create("periodautofill",{CodeSourcePeriod:CodePeriod,Idx:(self.LinkPeriods()[CodePeriod]().length+1)}));
    }

    self.EditPeriodAF = ko.observable(null);

    self.SetEditPeriodAF = function(data){
        if (self.IsCurrentEditPeriodAF(data)){
            self.EditPeriodAF(null);
        } else {
            self.EditPeriodAF(data);    
        }        
    }

    self.IsCurrentEditPeriodAF = function(data){
        return self.EditPeriodAF()==data;
    }

    self.LoadPeriodAF = function(){
        self.rGet("periodaf",{},function(data){
            self.MainPeriodsAF(_.map(data.MainPeriods,function(MP){
                return MModels.Create("period",MP);
            }));
            var Str = {};
            data.MainPeriods.forEach(function(MP){
                Str[MP.CodePeriod] = ko.observableArray();
            })
            data.LinkPeriods.forEach(function(LP){
                if (Str[LP.CodeSourcePeriod]) {
                    Str[LP.CodeSourcePeriod].push(MModels.Create("reportperiods",LP));
                }
            })
            self.LinkPeriodsAF(Str);
        })
    }

    self.SaveChangesPAF = function(){
        var FieldsToPass = MModels.Create("reportperiods").EditFields.concat(["_id"]);
        var Data = ko.toJS(self.LinkPeriods), Reparsed = {};
        for (var Key in Data){
            Reparsed[Key] = _.filter(_.map(Data[Key],function(M){
                return _.pick(M,FieldsToPass);
            }),function(D){
                return !_.isEmpty(D.CodeReportPeriod);
            })
        }
        self.rPut("periodmap", {JSON:JSON.stringify(Reparsed)}, function(data){
            self.Init();
            self.LoadPeriodMap();            
        })
    } 



    self.ModelIsCreated = function(){}
    self.ModelIsLoaded = function(){
    }
    self.ModelIsSaved = function(){}

    self.IsAvailable = function(){
        return PermChecker.CheckPrivelegeAny(["IsPeriodEditTunner","IsPeriodMapTunner","IsPeriodGrpsTunner","IsPeriodTunner"]);
    }

    self.IsLoaded = ko.observable(false); 

    self.Map = ko.observable();
    self.DefaultPeriods = ko.observable();
    self.Opened = ko.observable();

    self.Init = function(done){
        self.rGet("init",{},function(data){
            if (data.err) return self.Error(data.err);
            self.IsLoaded(true);
            var periods = {};
            for (var group in data.Map){
                periods[group] = _.keys(data.Map[group]);
            }
            self.DefaultPeriods(periods);
            var prepared = {};
            for (var group in data.Map){
                for (var CodePeriod in data.Map[group]){
                    var arr = [];
                    data.Map[group][CodePeriod].forEach(function(I){
                        var year = 0, notNowYear = false;
                        if (I.year){
                            notNowYear = true;
                            year = Number((I.year+'').replace("Y",""));
                        }
                        arr.push({
                            period      :Catalogue.Get('period',I.period),
                            code        :I.period+'',
                            year        :year,
                            isoptional  :I.isoptional,
                            anotherYear :notNowYear,
                        })
                    })
                    prepared[CodePeriod] = arr;
                }
            }
            self.Map(prepared);
            self.Opened(data.Opened);
            MSite.Events.off("save",self.SaveChanges);
            MSite.Events.on("save",self.SaveChanges);
            return done && done();
        })
    }

     self.SaveChanges = function(){
        if (self.Mode()=="PeriodEdit"){
            self.SaveChangesPEdit();
        } 
        if (self.Mode()=="PeriodMap"){
            self.SaveChangesPMap();  
        }
        if (self.Mode()=="PeriodAutoFill"){
            self.SaveChangesPAF();
        }
    }

    self.IsModelEdit = ko.computed(function(){
        return ["Periods","PeriodGrps"].indexOf(self.Mode())!=-1;
    })

    self.Show = function(done){
        if (!self.Mode()) return self.InitSetMode("Periods");
        switch (self.Mode()){
            case "Periods":
                ModelTableEdit.InitModel("period",{IsFormula:-1,MCount:1,BeginDate:1});
                ModelTableEdit.IsExtendEditor(true);
            break;
            case "PeriodGrps":
                ModelTableEdit.InitModel("periodgrp");
            break;
            case "PeriodAutoFill":
                self.LoadPeriodAF();
            break;
            case "PeriodEdit":
                self.UpdateYear();
            break;
            case "PeriodMap":
                self.LoadPeriodMap();
            break;
        }
        return done && done()
    }
        
    // PeriodEdit
    self.Table = ko.observable();
    self.Year = ko.observable();

    self.SaveChangesPEdit = function(){
        var NewV = [];
        var T = self.Table();
        for (var PG in T){
            for (var P in T[PG]){
                for (var R in T[PG][P]){
                    if (T[PG][P][R]){
                        NewV.push({
                            CodePeriod:P,
                            CodeRole:R
                        });
                    }
                }
            }
        }
        self.rPut("update",{Year:self.Year(),Value:NewV},function(data){
            self.LoadTable();
            self.Init();
        })
    }
    
    self.Roles = function(){
        var Roles = [];
        try{
            var K1 = _.first(_.keys(self.Table()));
            var K2 = _.first(_.keys(self.Table()[K1]));
            Roles = _.sortBy(_.keys(self.Table()[K1][K2]));
        } catch(e){
            console.log(e);
        }
        return Roles;
    }

    self.UpdateYear = function(Year){
        self.Year(Year);
        self.LoadTable();
    }

    self.LoadTable = function(){
        if (!self.Year()) self.Year(CxCtrl.Year());
        self.rGet('table',{Year:self.Year()},function(data){
            self.Table(data);
        })
    }
    
    return self;
})





ModuleManager.Modules.Periods = MPeriods;

    
   
ko.components.register('period-formula-editor', {
    viewModel: function(params) {
        var self = this, result = [];
        var value = params.field()+'';
        self.ParsedArray = ko.observableArray();
        var Base = {From:0, To:0, Header:0, Year:0}, Keys = _.keys(Base);
        if (value.indexOf("=")!=-1){            
            var parts = value.split(",");
            parts.forEach(function(P){
                var Ob = ko.mapping.fromJS(_.clone(Base)), YP = P.split(/[=!:]/g);
                Keys.forEach(function(F,i){
                    if (YP[i]) Ob[F] = YP[i];
                })
                result.push(Ob);
            })
        }

        self.ParsedArray(result);

        self.AddFormula = function(){
            var Obj = ko.mapping.fromJS(_.clone(Base));
            self.ParsedArray.push(Obj);
        }
        self.RemoveFormula = function(data){
            self.ParsedArray.remove(data);
        }
        ko.computed(function() {
            return ko.toJSON(self.ParsedArray);
        }).subscribe(function() {
            var V = self.ParsedArray();
            var StrArr = [];
            V.forEach(function(sVo){
                var sV = ko.mapping.toJS(sVo)
                var A = "";
                if (sV.From && sV.To){
                    A = sV.From+"="+sV.To;
                    if (sV.Header) A+= "!"+sV.Header;
                    if (sV.Year) A+= ":"+sV.Year;
                    StrArr.push(A);
                }
            })
            params.field(StrArr.join(","));
        });
    },
    template: '<table data-bind="if:ParsedArray().length" class="table table-striped table-bordered table-hover dataTable no-footer small-paddings" style="width: initial;"><theader><tr><td >Исх.Период</td><td >Цел.Период</td><td >Згл.Период</td><td >Смещ.Год</td><td ></td></tr></theader><tbody data-bind="foreach:ParsedArray()"><tr><td><input data-bind="value:$data.From" style="width: 50px;"></input></td><td><input data-bind="value:$data.To" style="width: 50px;"></input></td><td><input data-bind="value:$data.Header" style="width: 50px;"></input></td><td><input data-bind="value:$data.Year" style="width: 50px;"></input></td><td><a data-bind="click:$parent.RemoveFormula"><i class="fa fa-icon fa-times"></i></a></td></tr></tbody></table><a class="addLinkModel" data-bind="click:AddFormula">Добавить</a>',
});

ko.bindingHandlers.mask = {
    init: function(element, valueAccessor, allBindingsAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (value){
            $(element).mask(value);
        }
    }, 
};
