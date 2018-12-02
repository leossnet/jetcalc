var MInput = (new function() {

    var self = this;

    self.IsAvailable = function() {
        var Doc = MFolders.FindDocument(CxCtrl.CodeDoc());
        return Doc && Doc.IsInput;
    }

    self.BeforeHide = function() {
        MBreadCrumbs.RemoveLabels("Input", "Post");
    }


    self.MetaChange = function(row, col, type, value) {
        if (type == 'comment') {
            self.RegisterChange("Comment", row, col, value);
            self.table.render();
        }
    }

    self.ValueChange = function(changes, source) {
        switch (source) {
            case 'Autofill.fill':
            case 'CopyPaste.paste':
            case 'edit':
            case 'KeyDel':
                console.log(changes);
                changes.forEach(function(change) {
                    var row = change[0],
                        col = change[1];
                    if (change[2] != change[3]) {
                        self.RegisterChange("Value", row, col, change[3]);
                    }
                })
                self.table.render();
                break;
            case "Eradicate":
                break;
            default:
            console.log(source);
        }
    }

    self.Changes = ko.observableArray();

    self._isChanged = function(CellName, Type, Value) {
        var SameCells = _.filter(self.Changes(), {
            Cell: CellName
        });
        if (!SameCells.length) return true;
        var Initial = _.first(SameCells);
        var IsChanged = true;
        if (Type == 'Comment' && Initial.OldComment == Value) IsChanged = false;
        if (Type == 'Value' && Initial.OldValue == Value) IsChanged = false;
        return IsChanged;
    }

    self.RegisterChange = function(Type, row, col, Value) {
        var Cell = self.table.getCellMeta(row, col);
        if (Cell.IsEditablePrimary && !Cell.IsLocked) {
            var CellParams = {
                Cell: Cell.Cell
            }
            if (Type == 'Comment') {
                OldValue = Cell.Comment || "";
                var Comment = Value.value || "";
                if (_.isEqual(OldValue,Comment)){
                    return;
                }
                Cell.Comment = Comment;
                CellParams.Value = Cell.Value;
                CellParams.OldValue = Cell.Value;
                CellParams.Comment = Comment;
                CellParams.OldComment = OldValue;
            } else {
                OldValue = Cell.Value;
                Cell.Value = Value;
                CellParams.Value = Cell.Value;
                CellParams.OldValue = OldValue;
                CellParams.Comment = Cell.Comment;
                CellParams.OldComment = Cell.Comment;
            }
            Cell.IsChanged = self._isChanged(Cell.Cell, Type, Value);
            self.Changes.push(CellParams);
        }
    }

    self.SaveChanges = function() {
        self.IsLoading(true);
        var Cells2Save = self.Changes();
        var RealChange = [];
        Cells2Save.forEach(function(Cell) {
            var Changes = _.filter(Cells2Save, {
                Cell: Cell.Cell
            });
            if (Changes.length > 1) {
                var Initial = _.first(Changes);
                var Last = _.last(Changes);
                if (Last.Comment != Initial.OldComment || Last.Value != Initial.LastValue) {
                    RealChange.push(Last);
                }
            } else {
                RealChange.push(_.first(Changes));
            }
        })
        var ToSave = {};
        RealChange.forEach(function(Cell) {
            ToSave[Cell.Cell] = {
                Value: Cell.Value,
                Comment: (Cell.Comment) ? Cell.Comment : ''
            }
        })
        self.Error(null);
        $.ajax({
            url: '/api/cells',
            type: 'put',
            data: {
                Context: CxCtrl.Context(),
                Cells: ToSave
            },
            success: function(data) {
                self.IsLoading(false);
                if (data.err) {
                    return self.Error(data.err);
                } else {
                    var Backup = _.cloneDeep(self.Calculate);
                    self.Changes([]);
                    self.LoadCells(function() {
                        var NewResult = self.Calculate;
                        var Diff = [];
                        for (var CellName in NewResult) {
                            if (NewResult[CellName] && Backup[CellName] && NewResult[CellName].Value != Backup[CellName].Value) {
                                Diff.push(CellName);
                            }
                        }
                        self.RenderCells(function() {
                            var Metas = self.table.getCellsMeta();
                            Metas.forEach(function(Me) {
                                if (Me && Me.Cell && Diff.indexOf(Me.Cell) != -1) {
                                    Me.IsChangedBySave = true;
                                    if (Me.IsChanged) Me.IsChanged = false;
                                }
                                Me.IsChanged = false;
                            })
                        })
                    })

                }
            }
        })


    }

    self.Undo = function() {

    }


    // История заполнения ячейки
    self.PasteValue = function(Value) {
        self.table.setDataAtCell(BlankDocument.LastCoords[0], BlankDocument.LastCoords[1], Value, "paste");
        $('#historyModal').modal('hide');
    }
    self.HistoryData = ko.observableArray();
    self.HistoryRow = ko.observable();
    self.HistoryCol = ko.observable();
    self.HistoryCell = ko.observable();
    self.IsHistoryAvailable = function() {
        var Cell = self.CurrentCell();
        if (Cell && Cell.IsPrimary) {
            return true;
        } else {
            return false;
        }
    }
    self.ShowHistory = function() {
        var Cell = self.CurrentCell();
        self.HistoryCol(null);
        self.HistoryRow(null);
        self.HistoryData([]);
        if (self.IsHistoryAvailable()) {
            $.ajax({
                url: '/api/cell/history',
                type: 'post',
                data: {
                    Context: CxCtrl.Context(),
                    Cell: Cell.Cell
                },
                success: function(data) {
                    self.HistoryData(data.History);
                    self.HistoryRow(data.Row);
                    self.HistoryCol(data.Col);
                    $('#historyModal').modal('show');
                    $('#historyModal').unbind('hide.bs.modal');
                    $('#historyModal').on('hide.bs.modal', function(e) {
                        BlankDocument.table.selectCell(BlankDocument.LastCoords[0], BlankDocument.LastCoords[1]);
                    });
                }
            })
        }
    }

    self.baseConfig = {
        rowHeaders: true,
        colHeaders: true,
        autoRowSize: true,
        minSpareRows: 0,
        minSpareCols: 0,
        minRowsNumber: 100,
        manualColumnResize: true,
        currentColClassName: 'currentCol',
        currentRowClassName: 'currentRow',
        fixedRowsTop: 0,
        comments: true
    };

    self.InitComment = function() {
        var selection = self.table.getSelected();
        var Cell = self.table.getCellMeta(selection[0], selection[1]);
        if (Cell.IsEditablePrimary && !Cell.IsLocked) {
            var commentsPlugin = self.table.getPlugin('comments');
            if (!Cell.Comment) {
                commentsPlugin.editor.setValue("");
                commentsPlugin.setCommentAtCell(selection[0], selection[1]);
            }
            commentsPlugin.showAtCell(selection[0], selection[1]);
            self.table.selection.deselect();
            commentsPlugin.editor.focus();
        }
    }

    self.ExtendContextMenu = function() {
        return {
            addcomment: {
                name: 'Добавить комментарий',
                disabled: function() {
                    var c = self.table.getSelected();
                    var m = self.table.getCellMeta(c[0], c[1]);
                    return !m.IsEditablePrimary;
                },
                action: self.InitComment
            },
            hsep10: "---------",
            history: {
                name: 'История изменений',
                disabled: function() {
                    return !self.IsHistoryAvailable();
                },
                action: self.ShowHistory
            }
        }
    }


    self.AllowInput = function() {
        var Class2Add = null,
            Labels = [];
        if (!self.CheckValuta()) {
            Class2Add = "WrongValuta";
            Labels.push({
                Icon: "fa-exclamation-triangle",
                CSS: "label-warning",
                Text: "Валюта",
                Title: "Выбрана альтернативная валюта"
            });
        }
        if (!self.CheckPeriodIsOpened()) {
            Class2Add = "PeriodClosed";
            Labels.push({
                Icon: "fa-exclamation-triangle",
                CSS: "label-warning",
                Text: "Период",
                Title: "Период закрыт"
            });
        }
        if (MAggregate.IsAggregateMode()) {
            Class2Add = "IsAgregate";
            Labels.push({
                Icon: "fa-exclamation-triangle",
                CSS: "label-warning",
                Text: "Агрегирование",
                Title: "Включен режим агрегирования"
            });
        }
        if (!self.CheckFormIsOpened()) Class2Add = "Block";
        var Primaries = _.filter(self.table.getCellsMeta(), {
            IsEditablePrimary: true
        });
        var setter = Class2Add ? true : false;
        Primaries.forEach(function(P) {
            self.table.setCellMeta(P.row, P.col, "IsLocked", setter);
        })
        MBreadCrumbs.RemoveLabels("Input", "Post");
        Labels.forEach(function(Label) {
            MBreadCrumbs.AddLabel("Input", "Post", Label);
        })
        self.table.render();
    }

    self.CheckValuta = function() {
        var O = MAggregate.FindObj(CxCtrl.CodeObj());
        return (O && O.CodeValuta == CxCtrl.CodeValuta())
    }

    self.CheckPeriodIsOpened = function() {
        return _.filter(MPeriods.Opened(), {
            CodePeriod: CxCtrl.CodePeriod(),
            CodeRole: MFolders.FindDocument(CxCtrl.CodeDoc()).CodeRole,
            Year: Number(CxCtrl.Year())
        }).length != 0;
    }

    self.CheckFormIsOpened = function() {
        return !Workflow.CurrentState() || Workflow.StatesTranslate['Opened'] == Workflow.CurrentState();
    }

    self.IndexedCells = {};

    self.HandsonRenders = null;

    self.RenderStructureAfterLoad = function(done) {
        var Header = self.Structure.Header;
        var TableData = self.Structure.Cells;
        var RealData = [];
        self.IndexedCells = {};
        TableData.forEach(function(Row, x) {
            var NewRow = [];
            self.IndexedCells[x] = {};
            Row.forEach(function(Cell, y) {
                if (_.isObject(Cell)) {
                    self.IndexedCells[x][y] = Cell;
                    NewRow.push("");
                } else {
                    self.IndexedCells[x][y] = null;
                    NewRow.push(Cell);
                }
            })
            RealData.push(NewRow);
        })
        var TreeArr = self.Structure.Tree;
        var FixedLeft = 2;
        FixedColsWidths = [50, 400];
        var Doc = MFolders.FindDocument(CxCtrl.CodeDoc()) || {};
        if (self.HandsonRenders) delete self.HandsonRenders;
        self.HandsonRenders = new HandsonTableRenders.RenderController();
        if (Doc.IsObjToRow) {
            FixedLeft = 1;
            FixedColsWidths = [400];
            self.HandsonRenders.RegisterRender("Tree", [/[0-9]*?,0$/], HandsonTableRenders.TreeRender);
            self.HandsonRenders.RegisterRender("Cell", [/[0-9]*?,(?![0]$)[0-9]*/], HandsonTableRenders.CellRender);
        } else {
            self.HandsonRenders.RegisterRender("Code", [/[0-9]*?,0$/], HandsonTableRenders.ReadOnlyText);
            self.HandsonRenders.RegisterRender("Tree", [/[0-9]*?,1$/], HandsonTableRenders.TreeRender);
            self.HandsonRenders.RegisterRender("Cell", [/[0-9]*?,(?![0,1]$)[0-9]*/], HandsonTableRenders.CellRender);
        }
        if (Doc.IsShowMeasure) {
            FixedLeft++;
            FixedColsWidths.push(80);
        }
        HandsonConfig = _.merge(_.clone(self.baseConfig), {
            data: RealData,
            cells: self.HandsonRenders.UniversalRender,
            fixedColumnsLeft: FixedLeft,
            headers: [
                Header
            ],
            tree: {
                data: TreeArr,
                icon: function() {},
                colapsed: self.Context.CodeDoc + '_input'
            },
            beforePaste: function(data, coords) {
                retdata = [];
                data.forEach(function(d) {
                    rd = [];
                    d.forEach(function(elem) {
                        rd.push(elem.replace(/\s+/g, ''));
                    })
                    retdata.push(rd);
                })
                return [true, retdata];
            }
        })
        self.CreateTable('.handsontable.single.input', HandsonConfig, function() {
            self.Changes([]);
            new HandsonTableHelper.HeaderGenerator(self.table);
            new HandsonTableHelper.WidthFix(self.table, 100, 200, FixedColsWidths);
            new HandsonTableHelper.DiscretScroll(self.table);
            new HandsonTableHelper.TreeView(self.table);
            new HandsonTableHelper.RegisterKeys(self.table);
            var Metas = self.table.getCellsMeta();
            Metas.forEach(function(Me, Index) {
                if (Me && self.IndexedCells[Me.row][Me.col]) {
                    self.table.setCellMetaObject(Me.row, Me.col, self.IndexedCells[Me.row][Me.col]);
                }
            })
            self.table.updateSettings({
                afterSetCellMeta: self.MetaChange,
                afterChange: self.ValueChange,
            })
            self.table.render();
            return done();
        })
    }

    self = _.merge(new BaseDocPlugin(), self);
    return self;
})



ModuleManager.Events.on("modulesinited", function() {
    Workflow.Events.addListener("statuschange", function() {
        if (CxCtrl.PageName() == "input") {
            setTimeout(MInput.AllowInput, 0);
        }
    })
    MInput.Events.addListener("rendercells", function() {
        if (CxCtrl.PageName() == "input") {
            setTimeout(MInput.AllowInput, 0);
        }
    })
    BlankDocument.Events.addListener("key", function(e) {
        var isControlPressed = (e.ctrlKey || e.metaKey);
        if (e.keyCode == 113) { //Ctrl + F2
            if (isControlPressed) {
                MInput.InitComment();
            }
        }
        if (isControlPressed && e.keyCode == 'S'.charCodeAt(0)) {
            MInput.SaveChanges();
        }
    })
})

ModuleManager.Modules.Input = MInput;
