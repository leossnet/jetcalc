var RowEditor = (new function() {

    var self = new Module("roweditor");

    self.Obj = ko.observable(null);
    self.ObjType = ko.observable(null);
    self.ObjClass = ko.observable(null);
    self.ObjGrps = ko.observableArray();

    self.UpdateObjInfo = function() {
        var Cx = CxCtrl.Context(),
            Base = Cx.CodeObj,
            Child = Cx.ChildObj,
            Info = _.find(MAggregate.AllObjs(), {
                CodeObj: Base
            });
        if (!Info) return;
        var Current = (_.isEmpty(Child) ? Base : Child);
        self.Obj(Current);
        var In = Info.Info[Current];
        if (!_.isEmpty(In)) {
            self.ObjType(In.CodeObjType);
            self.ObjClass(In.CodeObjClass);
            self.ObjGrps(In.Groups);
        }
    }

    self.Show = function() {
        if (!self.Mode()) return self.InitSetMode("Filter");
        self.UpdateObjInfo();
        self.LoadRows(function() {
            //self.RenderTable();
        })
    }

    self.RollBack = self.Show;

    self.SaveChanges = function() {
        var Changes = self.Changes();
        var Rows = self.AllRows;
        if (_.isEmpty(Changes)) return;
        var SendUpdate = {};
        for (var Key in Changes){
        	var Ar = Key.split("_");
        	var R = Rows[parseInt(Ar[0])];
        	if (_.isEmpty(SendUpdate[R.CodeRow])){
        		SendUpdate[R.CodeRow] = {};
        	}
        	SendUpdate[R.CodeRow][Ar.splice(1).join("_")] = Changes[Key].new;
        }
        self.rPut("rows",{Data:JSON.stringify(SendUpdate),Context:_.merge(CxCtrl.Context(),{ObjType:self.ObjType(),ObjClass:self.ObjClass()})},function(){
        	self.Show();
        })        
    }

    self.RowsChanged = ko.observable();

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
        if (self.Columns) {
            self.Columns.forEach(function(C) {
                if (C.data === prop && !C.readOnly) {
                    $(td).addClass('editableCell')
                }
            })
        }
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

    self.PopulateRowsFilter = function(Rows){
        Rows.forEach(function(d) {
            /*if (!_.isEmpty(d.Link_rowcoloption)) {
                console.log("AAAAAAAAAAAAAAA");
                d.Link_rowcoloption.forEach(function(link){
                    if (link.IsFixed) d.IsAlwaysFixed = true;
                    if (link.IsEditable) d.IsAlwaysEditable = true;
                })
            }
            */
            if (!_.isEmpty(d.Link_rowobj)) {
                var Links = _.filter(d.Link_rowobj,function(LL){
                    return _.isEmpty(LL.CodeGrp);
                });
                var GrpLinks = _.filter(d.Link_rowobj,function(L){
                    return !_.isEmpty(L.CodeGrp);
                })
                Links.forEach(function(L) {
                    if (L.CodeObjType == self.ObjType()) {
                        d.ForObjType = true;
                    }
                    if (L.CodeObjClass == self.ObjClass()) {
                        d.ForObjClass = true;
                    }
                    if (L.CodeObj == self.Obj()) {
                        d.ForObj = true;
                    }
                })
                if (!_.isEmpty(GrpLinks)){
                    d.Link_rowobjgrp = GrpLinks;
                }
            }
        })
        return Rows;
    }

    self.lastAutoFillStart = null;


    self.beforeAutofill = function(start, end, data){
        self.lastAutoFillStart = start;
    }

    self.delayedUpdate = function(){
        setTimeout(function(){
            self.Config.valueHasMutated();
        },100)
    }

    self.Table = ko.observable();

    self.updateAutoFill = function(to,direction,data){
        var toRow = function(index,data){
            var row = self.AllRows[index];
            console.log("Will Set ",row.CodeRow,index,data);
            if (!row){
                console.log("row not found");
            } else {

                self.AllRows[index].Link_rowsumgrp = _.map(data[0][0],function(link){
                    return {
                        CodeSumGrp:link.CodeSumGrp,
                        CodeRow:row.CodeRow
                    }
                })
                self.Table().Table.setDataAtCell(index,3,self.AllRows[index].Link_rowsumgrp);
            }
        }
        if (self.Mode()=='Summ' && self.lastAutoFillStart.col==3){
            var rowIndex = self.lastAutoFillStart.row;
            if (direction=='up'){
                rowIndex = rowIndex-to.row;
            } else {
                rowIndex = rowIndex+to.row;
            }
            toRow(rowIndex,data);            
        }
    }

    self.LoadRows = function(done) {
        self.rGet("rows", CxCtrl.Context(), function(Rows) {
            var AllRows = _.sortBy(Rows, 'lft');
            AllRows.forEach(function(R) {
                R.DoRemove = false;
                R.IsNew = false;
                R.ForObj = false;
                R.ForObjType = false;
                R.ForObjClass = false;
                R.IsAlwaysFixed = false;
                R.IsAlwaysEditable = false;
            })
            AllRows = self.PopulateRowsFilter(AllRows);
            self.AllRows = AllRows;
            var ColWidths = [],
                Columns = [];
            var RowCFG = {
                "CodeRow": ["middle_text", true, 100],
                "NameRow": ["middle_text", true, 400, {
                    renderer: HandsonTableRenders.TreeRender
                }]
            }
            switch (self.Mode()) {
                case "Summ":
                    RowCFG.IsSum = ["middle_checkbox", false, 100];
                    RowCFG.Link_rowsumgrp = ["middle_link", false, 200];
                    RowCFG.NoSum = ["middle_checkbox", false, 100];
                    RowCFG.IsMinus = ["middle_checkbox", false, 100];
                    RowCFG.IsCalcSum = ["middle_checkbox", false, 100];
                    RowCFG.NoDoSum = ["middle_checkbox", false, 100];
                    RowCFG.UseProdSumGrps = ["middle_checkbox", false, 100];
                    break;
                case "Filter":
                    RowCFG.HasFilteredChild = ["middle_checkbox", false, 100];
                    RowCFG.NoFiltered = ["middle_checkbox", false, 100];
                    RowCFG.ForObj = ["middle_checkbox", false, 100];
                    RowCFG.ForObjType = ["middle_checkbox", false, 100];
                    RowCFG.ForObjClass = ["middle_checkbox", false, 100];
                    RowCFG.NoOutput = ["middle_checkbox", false, 100];
                    RowCFG.NoInput = ["middle_checkbox", false, 100];
                    RowCFG.FromObsolete = ["middle_text", false, 100];
                    RowCFG.FromYear = ["middle_text", false, 100];
                    RowCFG.Link_rowobjgrp = ["middle_link", false, 200];
                    //RowCFG.IsRowEditFilter = ["middle_checkbox", false, 100];
                    //RowCFG.CodeGrpEditFilter = ["middle_select", false, 200];
                    break;
                case 'MainFields':
                    RowCFG.CodeMeasure = ["middle_select", false, 100];
                    RowCFG.CodeStyle = ["middle_select", false, 100];
                    RowCFG.CodeFormat = ["middle_select", false, 100];
                    RowCFG.CodeValuta = ["middle_select", false, 100];
                    RowCFG.IsAnalytic = ["middle_checkbox", false, 100];
                    RowCFG.IsControlPoint = ["middle_checkbox", false, 100];
                    //RowCFG.IsAlwaysFixed = ["middle_checkbox", false, 100];
                    //RowCFG.IsAlwaysEditable = ["middle_checkbox", false, 100];
                    RowCFG.Link_rowcoloption = ["middle_link", false, 200];
                    break;
                case 'Formula':
                    RowCFG.Link_rowtag = ["middle_link", false, 100];
                    RowCFG.IsFormula = ["middle_checkbox", false, 100];
                    RowCFG.Formula = ["middle_formula", false, 200];
                    RowCFG.FormulaFromYear = ["middle_text", false, 100];
                    RowCFG.FormulaFromObsolete = ["middle_text", false, 100];
                    RowCFG.IsAgFormula = ["middle_checkbox", false, 100];
                    RowCFG.AsAgFormula = ["middle_checkbox", false, 100];
                    RowCFG.AgFormula = ["middle_formula", false, 200];                    
                    RowCFG.IsAfFormula = ["middle_checkbox", false, 100];
                    RowCFG.AfFormula = ["middle_formula", false, 200];
                    RowCFG.IsVirtual = ["middle_checkbox", false, 100];
                break;
                case "Bistran":
                    RowCFG.CodeBill = ["middle_select", false, 100];
                    RowCFG.CodeProd = ["middle_select", false, 100];
                    RowCFG.CodeAltOrg = ["middle_select", false, 100];
                    RowCFG.CodeDogovor = ["middle_select", false, 100];
                    RowCFG.CodeFilteredAltGrp = ["middle_select", false, 100];
                    RowCFG.CodeDogovorArt = ["middle_select", false, 100];                    
                break;
            }
            for (var FieldName in RowCFG) {
                var inf = RowCFG[FieldName];
                Columns.push(_.merge({
                    type: inf[0],
                    data: FieldName,
                    title: Tr(FieldName),
                    readOnly: inf[1]
                }, _.isEmpty(inf[3]) ? {} : inf[3]));
                self.Columns = Columns;
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
                    beforeAutofill:self.beforeAutofill,
                    beforeAutofillInsidePopulate:self.updateAutoFill,
                    MainModel: {
                        Link_rowsumgrp: 'row',
                        Link_rowtag: 'row',
                        Link_rowobjgrp: 'row',
                        Link_rowcoloption: 'row',
                        CodeMeasure: 'row',
                        CodeStyle: 'row',
                        CodeFormat: 'row',
                        CodeValuta: 'row',
                        CodeBill: 'row',
                        CodeProd: 'row',
                        CodeAltOrg: 'row',
                        CodeDogovor: 'row',
                        CodeFilteredAltGrp: 'row',
                        CodeGrpEditFilter: 'row',
                        CodeDogovorArt: 'row'
                    },
                    universalRender: self.AddRenders,
                    tree: {
                        data: TreeArr,
                        icon: function() {},
                        colapsed: CxCtrl.Context().CodeDoc + 'roweditor'
                    }
                }
            }
            self.Config(Config);
        })
    }


    return self;

})

ModuleManager.Modules.RowEditor = RowEditor;
