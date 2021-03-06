var MPeriods = (new function() {

    var self = new Module("periods");

    self.IsUseOrg = ko.observable(false);

    self.RollBack = function() {
        self.Show();
    }

    self.BeforeHide = function() {
        self.UnSubscribe({
            save: self.SaveChanges,
            refresh: self.RollBack
        });
    }

    self.BeforeShow = function() {
        self.Subscribe({
            save: self.SaveChanges,
            refresh: self.RollBack
        });
        self.Show();
    }

    self.ModelIsCreated = function() {}
    self.ModelIsLoaded = function() {}
    self.ModelIsSaved = function() {}

    self.IsAvailable = function() {
        return PermChecker.CheckPrivelegeAny(["IsPeriodEditTunner", "IsPeriodMapTunner", "IsPeriodGrpsTunner", "IsPeriodTunner"]);
    }

    self.IsLoaded = ko.observable(false);

    self.Map = ko.observable();
    self.DefaultPeriods = ko.observable();
    self.Opened = ko.observable();
    self.Redirects = ko.observable();
    self.MapSortOrder = ko.observable();

    self.Init = function(done) {
        self.rGet("init", {}, function(data) {
            console.log(data);
            if (data.err) return self.Error(data.err);
            self.IsLoaded(true);
            var periods = {};
            for (var group in data.Map) {
                if (group != "SortOrder") {
                    periods[group] = _.keys(data.Map[group]);
                }
            }
            self.DefaultPeriods(periods);
            var prepared = {};
            if (!_.isEmpty(data.Map.SortOrder)) {
                self.MapSortOrder(data.Map.SortOrder);
            }
            for (var group in data.Map) {
                if (group != "SortOrder") {
                    for (var CodePeriod in data.Map[group]) {
                        var arr = [];
                        data.Map[group][CodePeriod].forEach(function(I) {
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
            }
            self.Map(prepared);
            self.Opened(data.Opened);
            self.Redirects(data.Redirect);
            return done && done();
        })
    }

    self.sortPeriods = function(periods){
        var toSort = [], sortOrder = self.MapSortOrder();
        periods.forEach(function(codePeriod){
            toSort.push({CodePeriod:codePeriod,sort:sortOrder[codePeriod]||-1});
        })
        return _.map(_.sortBy(toSort,function(obj){
            return obj.sort?obj.sort:Infinity;
        }),"CodePeriod");
    }

    self.SaveChanges = function() {
        if (self.Mode() == "PeriodEdit") {
            self.SaveChangesPEdit();
        } else if (self.Mode() == 'PeriodAutoFill' || self.Mode() == 'PeriodMap') {
            ModelConnectorEdit.SaveChanges();
        }
    }

    self.IsModelEdit = ko.computed(function() {
        return ["Periods", "PeriodGrps", "PeriodRedirect", "Calendar"].indexOf(self.Mode()) != -1;
    })

    self.Show = function(done) {
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
                    get_fields: ["-_id", "CodePeriod", "NamePeriod"].join(" "),
                    code_source_model: 'CodePeriod',
                    get_sort: {
                        MCount: 1,
                        BeginDate: 1
                    },
                    get_query: {
                        IsReportPeriod: true
                    },
                    use_sync_links: true,
                });
                ModuleManager.IsLoading(false);
                break;
            case "PeriodEdit":
                self.LoadTable();
                break;
            case "PeriodMap":
                ModelConnectorEdit.Init({
                    source_model: 'period',
                    target_model: 'reportperiods',
                    source_index_field_name: 'IndexReportPeriod',
                    source_model_field_name: 'CodePeriod',
                    get_fields: ["-_id", "CodePeriod", "NamePeriod"].join(" "),
                    get_sort: {
                        MCount: 1,
                        BeginDate: 1
                    },
                    get_query: {
                        IsReportPeriod: true
                    },
                });
                ModuleManager.IsLoading(false);
                break;
        }
        return done && done()
    }



    // PeriodEdit
    self.Table = ko.observable();
    self.Year = ko.observable();
    self.UpdateYear = function(Year) {
        self.Year(Year);
        self.LoadTable();
    }
    self.PeriodEditConfig = ko.observable();
    self.PeriodEditResult = ko.observableArray();
    self.PeriodEditChangesCount = ko.observable(0);
    self.PeriodEditChanges = ko.observable();

    self.LoadTable = function() {
        if (!self.Year()) self.Year(CxCtrl.Year());
        self.rGet('table', {
            Year: self.Year()
        }, function(data) {
            var ColWidths = [200];
            var ToTranslate = {}
            var Header = [
                    [{
                        label: 'Группа документов',
                        colspan: 1
                    }],
                    [{
                        label: '',
                        colspan: 1
                    }]
                ],
                Rows = {},
                Columns = [{
                    data: "Name",
                    renderer: "text",
                    readOnly: true
                }];
            var Trs = {
                periodgrp: [],
                period: [],
                role: []
            };
            for (var CodePeriodGrp in data) {
                Trs.periodgrp.push(CodePeriodGrp);
                for (var CodePeriod in data[CodePeriodGrp]) {
                    Trs.period.push(CodePeriod);
                    for (var CodeRole in data[CodePeriodGrp][CodePeriod]) {
                        Trs.role.push(CodeRole);
                    }
                }
            }
            for (var K in Trs) Trs[K] = _.uniq(Trs[K]);
            Catalogue.ForceLoad(Trs, function() {
                for (var CodePeriodGrp in data) {
                    var PeriodsInfo = data[CodePeriodGrp];
                    Header[0].push({
                        label: Catalogue.References["periodgrp"][CodePeriodGrp],
                        colspan: _.keys(PeriodsInfo).length
                    });
                    for (var CodePeriod in PeriodsInfo) {
                        Header[1].push({
                            label: Catalogue.References["period"][CodePeriod],
                            colspan: 1
                        });
                        Columns.push({
                            type: "checkbox",
                            data: CodePeriod
                        })
                        ColWidths.push(70);
                        var DataOpened = PeriodsInfo[CodePeriod];
                        for (var CodeRole in DataOpened) {
                            if (!Rows[CodeRole]) Rows[CodeRole] = {
                                CodeRole: CodeRole,
                                Name: Catalogue.References["role"][CodeRole]
                            };
                            Rows[CodeRole][CodePeriod] = DataOpened[CodeRole];
                        }
                    }
                }
                var Config = {
                    Header: Header,
                    Columns: Columns,
                    Rows: Rows,
                    Plugins: ["Header"],
                    GetData: self.PeriodEditResult,
                    CFG: {
                        colWidths: ColWidths
                    }
                }
                self.PeriodEditConfig(Config);
            })
        })
    }

    self.SaveChangesPEdit = function() {
        self.rPut("update", {
            Year: self.Year(),
            Value: _.flatten(_.map(self.PeriodEditResult(), function(Row) {
                var CodeRole = Row.CodeRole;
                var Enabled = [];
                for (var CodePeriod in Row) {
                    if (Row[CodePeriod] === true) {
                        Enabled.push({
                            CodeRole: CodeRole,
                            CodePeriod: CodePeriod
                        });
                    }
                }
                return Enabled;
            }))
        }, function(data) {
            self.LoadTable();
            self.Init();
        })
    }

    return self;
})

ModuleManager.Modules.Periods = MPeriods;


ko.components.register('period-formula-editor', {
    viewModel: function(params) {
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
            parts.forEach(function(P) {
                var Ob = ko.mapping.fromJS(_.clone(Base)),
                    YP = P.split(/[=!:]/g);
                Keys.forEach(function(F, i) {
                    if (YP[i]) Ob[F] = YP[i];
                })
                result.push(Ob);
            })
        }
        self.ParsedArray(result);

        self.AddLastCellListener = function() {
            $(".formula-editor-year").last().keydown(function(e) {
                if (e.keyCode == 9) {
                    self.AddFormula()
                    return false;
                }
            })
        }

        setTimeout(self.AddLastCellListener, 500)

        self.AddFormula = function() {
            $(".formula-editor-year").last().off();
            var Obj = ko.mapping.fromJS(_.clone(Base));
            self.ParsedArray.push(Obj);
            setTimeout(self.AddLastCellListener, 200);

        }
        self.RemoveFormula = function(data) {
            $(".formula-editor-year").last().off();
            self.ParsedArray.remove(data);
            setTimeout(self.AddLastCellListener, 200);
        }

        self.reCalc = function(){
            var V = self.ParsedArray();
            var StrArr = [];
            V.forEach(function(sVo) {
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
        }
    },
    template: '<table data-bind="if:ParsedArray().length" class="table table-striped table-bordered table-hover dataTable no-footer small-paddings" style="width: initial;"><theader><tr><td >Исх.Период</td><td >Цел.Период</td><td >Згл.Период</td><td >Смещ.Год</td><td ></td></tr></theader><tbody data-bind="foreach:ParsedArray()"><tr><td><input data-bind="value:$data.From,valueUpdate:\'keyup\',event: { keyup: $parent.reCalc}" style="width: 50px;"></input></td><td><input data-bind="value:$data.To,valueUpdate:\'keyup\',event: { keyup: $parent.reCalc}" style="width: 50px;"></input></td><td><input data-bind="value:$data.Header,valueUpdate:\'keyup\',event: { keyup: $parent.reCalc}" style="width: 50px;"></input></td><td><input class="formula-editor-year" data-bind="value:$data.Year,valueUpdate:\'keyup\',event: { keyup: $parent.reCalc}" style="width: 50px;"></input></td><td><a data-bind="click:$parent.RemoveFormula"><i class="fa fa-icon fa-times"></i></a></td></tr></tbody></table><a class="addLinkModel" data-bind="click:AddFormula">Добавить</a>',
});