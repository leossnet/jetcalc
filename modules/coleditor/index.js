var MColEditor = (new function() {

    var self = new Module("coleditor");


    self.Show = function() {
        if (!self.Mode()) return self.InitSetMode("Filter");
        self.LoadCols(function() {
            //self.RenderTable();
        })
    }

    self.RollBack = self.Show;

    self.SaveChanges = function() {
        var Changes = MColEditor.Changes();
        if (_.isEmpty(Changes)) return;
        var ToSave = {
            colsetcol: {},
            col: {}
        };
        var FieldTranslate = {
            InitialFormula: "Formula",
            InitialName: "NameColsetCol"
        }
        for (var Key in Changes) {
            var K = Key.split("_"),
                F = _.last(K),
                Ind = parseInt(_.first(K)),
                T = _.includes(["Link_coltag", "IsFormula", "InitialFormula", "Formula", "Tags",
                    "IsAfFormula", "IsAgFormula", "AfFormula", "AgFormula", "AsAgFormula"
                ], F) ? "col" : "colsetcol",
                FV = _.isEmpty(FieldTranslate[F]) ? F : FieldTranslate[F];
            var Col = self.AllRows[Ind];
            if (T == "colsetcol") {
                if (_.isEmpty(ToSave[T][Col.CodeColsetCol])) ToSave[T][Col.CodeColsetCol] = {};
                ToSave[T][Col.CodeColsetCol][FV] = Col[F];
            }
            if (T == "col") {
                if (_.isEmpty(ToSave[T][Col.CodeCol])) ToSave[T][Col.CodeCol] = {};
                ToSave[T][Col.CodeCol][FV] = Col[F];
            }
        }
        console.log(ToSave);
        self.rPut("savechanges", {
            Context: CxCtrl.Context(),
            Changes: ToSave
        }, function() {
            self.Show();
        })
    }


    self.Subscriptions = {
        save: self.SaveChanges,
        refresh: self.RollBack,
        context: {
            isinput: self.Show,
            period: self.Show,
            year: self.Show,
            obj: self.Show
        }
    }

    self.BeforeShow = function() {
        self.Subscribe(self.Subscriptions);
        self.Show();
    }

    self.BeforeHide = function() {
        self.UnSubscribe(self.Subscriptions);
    }

    self.Config = ko.observable();
    self.Result = ko.observable();
    self.Changes = ko.observable();
    self.ChangesCount = ko.observable(0);

    self.AllRows = []; // Remove

    self.AddRender = function(instance, td, row, col, prop, value, CellInfo) {
        if (self.Mode() == 'Filter') {
            var R = self.AllRows[row];
            if (R && R.IsRemoved) {
                $(td).addClass("removed_by_filter");
                if (_.includes(R.RemoveComment, prop)) {
                    $(td).addClass("guilty_cell");
                }
            }
        }
    }

    self.AddRenders = [self.AddRender];

    self.LoadCols = function(done) {
        self.rGet("cols", CxCtrl.Context(), function(Rows) {
            var AllRows = _.sortBy(Rows, 'lft');
            AllRows = _.filter(AllRows, function(Branch) {
                return Branch.Type != "colsetcol";
            })
            AllRows.forEach(function(Branch) {
                if (Branch.Type == 'col') {
                    Branch.Type = "colsetcol";
                    Branch.level--;
                }
            })
            self.AllRows = AllRows;
            var ColWidths = [],
                Columns = [];
            var ColCFG = {
                "CodeCol": ["middle_text", true, 100],
                "ShowName": ["middle_text", true, 400, {
                    renderer: HandsonTableRenders.TreeRender
                }]
            }
            switch (self.Mode()) {
                case "Filter":
                    ColCFG.Condition = ["condition", false, 100];
                    ColCFG.CodePeriodGrp = ["middle_select", true, 100];
                    ColCFG.IsInput = ["middle_checkbox", true, 100];
                    ColCFG.Link_colsetcolgrp = ["middle_link", false, 200];
                    ColCFG.Link_colsetcolperiodgrp = ["middle_link", false, 200];
                    break;
                case 'MainFields':
                    ColCFG.InitialName = ["middle_text", false, 400];
                    ColCFG.CodeStyle = ["middle_select", false, 100];
                    ColCFG.CodeFormat = ["middle_select", false, 100];
                    ColCFG.IsFixed = ["middle_checkbox", false, 100];
                    ColCFG.IsControlPoint = ["middle_checkbox", false, 100];
                    break;
                case 'Formula':
                    ColCFG.Link_coltag = ["middle_link", false, 100];
                    ColCFG.IsFormula = ["middle_checkbox", false, 100];
                    ColCFG.InitialFormula = ["middle_formula", false, 200];
                    ColCFG.IsAfFormula = ["middle_checkbox", false, 100];
                    ColCFG.AfFormula = ["middle_formula", false, 200];
                    ColCFG.IsAgFormula = ["middle_checkbox", false, 100];
                    ColCFG.AsAgFormula = ["middle_checkbox", false, 100];
                    ColCFG.AgFormula = ["middle_formula", false, 200];
                    break;
            }
            for (var FieldName in ColCFG) {
                var inf = ColCFG[FieldName];
                Columns.push(_.merge({
                    type: inf[0],
                    data: FieldName,
                    title: Tr(FieldName),
                    readOnly: inf[1]
                }, _.isEmpty(inf[3]) ? {} : inf[3]));
                ColWidths.push(inf[2]);
            }
            var TreeArr = _.map(AllRows, function(R) {
                return _.pick(R, ['lft', 'rgt', 'level']);
            });

            var Config = {
                Columns: Columns,
                Rows: self.AllRows,
                CFG: {
                    colWidths: ColWidths,
                    colHeaders: true,
                    Plugins: ["Tree"],
                    fixedColumnsLeft: 2,
                    afterCopy: Handsontable.overrideCopy,
                    beforePaste: Handsontable.overridePaste,
                    MainModel: {
                        Link_coltag: 'col',
                        Link_colsetcolgrp: 'colsetcol',
                        Link_colsetcolperiodgrp: 'colsetcol',
                        CodeStyle: 'colsetcol',
                        CodeFormat: 'colsetcol',
                        CodePeriodGrp: 'docheader'
                    },
                    universalRender: self.AddRenders,
                    tree: {
                        data: TreeArr,
                        icon: function() {},
                        colapsed: CxCtrl.Context().CodeDoc + 'coleditor'
                    }
                }
            }
            self.Config(Config);
        })
    }


    return self;

})

ModuleManager.Modules.ColEditor = MColEditor;
