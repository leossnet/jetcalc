var MPeriods = (new function () {

    var self = new Module("periods");


    self.BeforeHide = function () {
        self.UnSubscribe();
    }
    self.BeforeShow = function () {
        self.Subscribe();
        self.Show();
    }

    self.ModelIsCreated = function () {}
    self.ModelIsLoaded = function () {}
    self.ModelIsSaved = function () {}

    self.IsAvailable = function () {
        return PermChecker.CheckPrivelegeAny(["IsPeriodEditTunner", "IsPeriodMapTunner", "IsPeriodGrpsTunner", "IsPeriodTunner"]);
    }

    self.IsLoaded = ko.observable(false);

    self.Map = ko.observable();
    self.DefaultPeriods = ko.observable();
    self.Opened = ko.observable();
    self.Redirects = ko.observable();

    self.Init = function (done) {
        self.rGet("init", {}, function (data) {
            if (data.err) return self.Error(data.err);
            self.IsLoaded(true);
            var periods = {};
            for (var group in data.Map) {
                periods[group] = _.keys(data.Map[group]);
            }
            self.DefaultPeriods(periods);
            var prepared = {};
            for (var group in data.Map) {
                for (var CodePeriod in data.Map[group]) {
                    var arr = [];
                    data.Map[group][CodePeriod].forEach(function (I) {
                        var year = 0,
                            notNowYear = false;
                        if (I.year) {
                            notNowYear = true;
                            year = Number((I.year + '').replace("Y", ""));
                        }
                        arr.push({
                            period: Catalogue.Get('period', I.period),
                            code: I.period + '',
                            year: year,
                            isoptional: I.isoptional,
                            anotherYear: notNowYear,
                        })
                    })
                    prepared[CodePeriod] = arr;
                }
            }
            self.Map(prepared);
            self.Opened(data.Opened);
            self.Redirects(data.Redirect);
            MSite.Events.off("save", self.SaveChanges);
            MSite.Events.on("save", self.SaveChanges);
            return done && done();
        })
    }

    self.SaveChanges = function () {
        if (self.Mode() == "PeriodEdit") {
            self.SaveChangesPEdit();
        }
    }

    self.IsModelEdit = ko.computed(function () {
        return ["Periods", "PeriodGrps", "PeriodRedirect", "Calendar"].indexOf(self.Mode()) != -1;
    })

    self.Show = function (done) {
        if (!self.Mode()) return self.InitSetMode("Periods");
        switch (self.Mode()) {
            case "Periods":
                ModelTableEdit.InitModel("period", {
                    IsFormula: -1,
                    MCount: 1,
                    BeginDate: 1
                });
                ModelTableEdit.IsExtendEditor(true);
                break;
            case "Calendar":
                ModelTableEdit.InitModel("statecalendar", {
                    CodePeriod: 1
                });
                break;
            case "PeriodRedirect":
                ModelTableEdit.InitModel("periodredirect", {
                    CodePeriod: 1
                });
                break;
            case "PeriodGrps":
                ModelTableEdit.InitModel("periodgrp");
                break;
            case "PeriodAutoFill":
                ModelConnectorEdit.Init({
                    source_model: 'period',
                    target_model: 'periodautofill',
                    source_index_field_name: 'Idx',
                    source_model_field_name: 'CodeSourcePeriod',
                    get_sort: {MCount:1,BeginDate:1},
                    get_query: {IsReportPeriod:true},
                    use_sync_links: true,
                });
                ModuleManager.IsLoading(false);
                break;
            case "PeriodEdit":
                self.UpdateYear();
                break;
            case "PeriodMap":
                ModelConnectorEdit.Init({
                    source_model: 'period',
                    target_model: 'reportperiods',
                    source_index_field_name: 'IndexReportPeriod',
                    get_sort: {MCount:1,BeginDate:1},
                    get_query: {IsReportPeriod:true},
                });
                ModuleManager.IsLoading(false);
                break;
        }
        return done && done()
    }

    // PeriodEdit
    self.Table = ko.observable();
    self.Year = ko.observable();

    self.SaveChangesPEdit = function () {
        var NewV = [];
        var T = self.Table();
        for (var PG in T) {
            for (var P in T[PG]) {
                for (var R in T[PG][P]) {
                    if (T[PG][P][R]) {
                        NewV.push({
                            CodePeriod: P,
                            CodeRole: R
                        });
                    }
                }
            }
        }
        self.rPut("update", {
            Year: self.Year(),
            Value: NewV
        }, function (data) {
            self.LoadTable();
            self.Init();
        })
    }

    self.Roles = function () {
        var Roles = [];
        try {
            var K1 = _.first(_.keys(self.Table()));
            var K2 = _.first(_.keys(self.Table()[K1]));
            Roles = _.sortBy(_.keys(self.Table()[K1][K2]));
        } catch (e) {
            console.warn(e);
        }
        return Roles;
    }

    self.UpdateYear = function (Year) {
        self.Year(Year);
        self.LoadTable();
    }

    self.LoadTable = function () {
        if (!self.Year()) self.Year(CxCtrl.Year());
        self.rGet('table', {
            Year: self.Year()
        }, function (data) {
            self.Table(data);
        })
    }

    return self;
})

ModuleManager.Modules.Periods = MPeriods;


ko.components.register('period-formula-editor', {
    viewModel: function (params) {
        var self = this,
            result = [];
        var value = params.field() + '';
        self.ParsedArray = ko.observableArray();
        var Base = {
                From: 0,
                To: 0,
                Header: 0,
                Year: 0
            },
            Keys = _.keys(Base);
        if (value.indexOf("=") != -1) {
            var parts = value.split(",");
            parts.forEach(function (P) {
                var Ob = ko.mapping.fromJS(_.clone(Base)),
                    YP = P.split(/[=!:]/g);
                Keys.forEach(function (F, i) {
                    if (YP[i]) Ob[F] = YP[i];
                })
                result.push(Ob);
            })
        }

        self.ParsedArray(result);

        self.AddFormula = function () {
            var Obj = ko.mapping.fromJS(_.clone(Base));
            self.ParsedArray.push(Obj);
        }
        self.RemoveFormula = function (data) {
            self.ParsedArray.remove(data);
        }
        ko.computed(function () {
            return ko.toJSON(self.ParsedArray);
        }).subscribe(function () {
            var V = self.ParsedArray();
            var StrArr = [];
            V.forEach(function (sVo) {
                var sV = ko.mapping.toJS(sVo)
                var A = "";
                if (sV.From && sV.To) {
                    A = sV.From + "=" + sV.To;
                    if (sV.Header) A += "!" + sV.Header;
                    if (sV.Year) A += ":" + sV.Year;
                    StrArr.push(A);
                }
            })
            params.field(StrArr.join(","));
        });
    },
    template: '<table data-bind="if:ParsedArray().length" class="table table-striped table-bordered table-hover dataTable no-footer small-paddings" style="width: initial;"><theader><tr><td >Исх.Период</td><td >Цел.Период</td><td >Згл.Период</td><td >Смещ.Год</td><td ></td></tr></theader><tbody data-bind="foreach:ParsedArray()"><tr><td><input data-bind="value:$data.From" style="width: 50px;"></input></td><td><input data-bind="value:$data.To" style="width: 50px;"></input></td><td><input data-bind="value:$data.Header" style="width: 50px;"></input></td><td><input data-bind="value:$data.Year" style="width: 50px;"></input></td><td><a data-bind="click:$parent.RemoveFormula"><i class="fa fa-icon fa-times"></i></a></td></tr></tbody></table><a class="addLinkModel" data-bind="click:AddFormula">Добавить</a>',
});

ko.bindingHandlers.mask = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (value) {
            $(element).mask(value);
        }
    },
};
