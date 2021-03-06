var BlankDocument = (new function() {
    var self = this;

    self.table = null;
    self.TableInterface = ko.observable(null);

    self.Refresh = function() {
        if (self.TableInterface()) {
            self.TableInterface().Init();
        }
    }

    self.ModeRound = ko.observable(true);

    self.ChangeModeRound = function() {
        self.ModeRound(!self.ModeRound());
        if (!self.ModeRound()) {
            self.table.updateSettings({
                comments: false
            });
        } else {
            self.table.updateSettings({
                comments: true
            });
        }
        self.table.render();
    }

    self.Events = new EventEmitter();

    self.ModeExpandRow = ko.observable(false);

    self.ChangeModeExpandRow = function() {
        self.ModeExpandRow(!self.ModeExpandRow());
        if (MPrint.IsPrint()) {
            MPrint.PrintInterface().reDraw();
        }
        self.table.render();
    }

    self.DebugLabels = ko.observableArray();

    self.LastCell = ko.observable(null).extend({
        throttle: 100
    });
    self.LastCoords = [];
    self.LastCellType = ko.observable(null).extend({
        throttle: 100
    });
    self.LastCellDoc = ko.observable(null).extend({
        throttle: 100
    });
    self.LastCellFormula = ko.observable(null).extend({
        throttle: 100
    });

    self.SimplifyFormula = function(Cell, Formula) {
        var Parts = Cell.match(/\$(.*?)\@(.*?)\.P(.*?)\.Y(.*?)\#(.*?)\?/).splice(1);
        var C = {
            CodeRow: Parts[0],
            CodeCol: Parts[1],
            CodePeriod: Parts[2],
            Year: Parts[3],
            CodeObj: Parts[4]
        };
        Formula = (Formula + '')
            .replaceAll('$' + C.CodeRow + '@', '@')
            .replaceAll('@' + C.CodeCol + '.P', '.P')
            .replaceAll('.P' + C.CodePeriod + '.Y', '.Y')
            .replaceAll('.Y' + C.Year + '#', '#')
            .replaceAll('#' + C.CodeObj + '?', '?');
        Formula = Formula.replaceAll("undefined", "");
        if (Formula.length) Formula = " = " + Formula;
        else Formula = " = 0";
        return Formula;
    }

    self.UpdateLastCell = function() {
        try {
            var Coords = self.table.getSelected();
            self.LastCoords = [Coords[0], Coords[1]];
            var Info = self.table.getCellMeta(Coords[0], Coords[1]);
            if (Info.Cell) {
                self.LastCell(Info.Cell);
                self.LastCellDoc(Info.CodeDoc);
                self.LastCellType(Info.Type);
                if (Info.Type == "PRM") {
                    if (Info.CalcValue) Info.FRM = Info.Value + " = "+Info.CalcValue.replace("=", "");
                    else Info.FRM = Info.Value;
                }
                var Formula = self.SimplifyFormula(Info.Cell, Info.FRM);
                if (!Info.IsPrimary && Info.Value){
                    Formula = Formula + " = "+Info.Value;
                }
                self.LastCellFormula(Formula);
                self.Events.emit("LastCellUpdate");
            }
        } catch (e) {
            //console.log(e);
        }
    }

    self.ClearLastCell = function() {
        self.LastCell(null);
        self.LastCellType(null);
        self.LastCellDoc(null);
        self.LastCellFormula(null);
    }

    self.Init = function(done) {
        return done();
    }

    return self;
})


var DocumentTimer = function() {
    var self = this;

    self.stages = {
        'stage1': "Получение информации о структуре документа ",
        'stage2': "Отображение структуры",
        'stage3': "Расчет документа",
        'stage4': "Отображение расчитанных ячеек",
        'stage5': "Полный цикл"
    };

    self.Results = function() {
        var TextArr = [];
        for (var Label in self.stages) {
            TextArr.push(self.stages[Label] + ' ' + self.Result[Label]);
        }
        return TextArr;
    };

    self.hrtime = function(previousTimestamp) {
        var clocktime = performance.now.call(performance) * 1e-3
        var seconds = Math.floor(clocktime)
        var nanoseconds = Math.floor((clocktime % 1) * 1e9)
        if (previousTimestamp) {
            seconds = seconds - previousTimestamp[0]
            nanoseconds = nanoseconds - previousTimestamp[1]
            if (nanoseconds < 0) {
                seconds--
                nanoseconds += 1e9
            }
        }
        return [seconds, nanoseconds]
    }

    self._times = {};

    self.Result = {};

    self.Init = function() {
        self._times = {};
        self.Result = {};
    };

    self.Start = function(label) {
        self._times[label] = self.hrtime();
    };

    self.End = function(label) {
        try {
            var precision = 3;
            var elapsed = self.hrtime(self._times[label]);
            var result = (elapsed[0] * 1e9 + elapsed[1]) / 1000000000;
            self.Result[label] = numeral(result).format("#.##");
        } catch (e) {;
        }
    };

    return self;
}




var BaseDocPlugin = function() {

    var self = this;

    self.table = null;

    self.Timer = new DocumentTimer();

    self.base = "/api/calculator";

    self.IsLoading = ko.observable(false);
    self.Error = ko.observable(null);

    self.Structure = {};
    self.Calculate = {};


    self.plannedRender = null;
    self.callForRender = function(func){
    	if (!self.table) return;
    	if (self.plannedRender) clearTimeout(self.plannedRender);
    	self.plannedRender = setTimeout(function(){
    		console.log("... render");
    		func();
    	},100);
    }

    self.CacheIsUsed = ko.observable(false);

    self.CurrentCell = function() {
        var R = null;
        try {
            var sel = self.table.getSelected();
            if (sel) {
                R = self.table.getCellMeta(sel[0], sel[1]);
            }
        } catch (e) {;
        }
        return R;
    }

    self.ExtendContextMenu = function() {
        return {};
    }

    self.ContextMenu = function() {
        var Add = self.ExtendContextMenu();
        var Base = {
            debug: {
                name: 'Отладка',
                disabled: function() {
                    return !MDebugFormula.IsDebugAvailable(); // Завязка на наличие плагина отладки - переделать
                },
                action: MDebugFormula.DebugCell
            }
        }
        if (_.keys(Add).length) {
            Base = _.merge({
                hsep0: "---------"
            }, Base);
            Base = _.merge(Add, Base);
        }
        return {
            callback: function(key, options) {
                if (Base[key] && Base[key].action) {
                    setTimeout(Base[key].action, 0);
                } else {
                    console.log(key, options);
                }
            },
            items: Base
        }
    }


    self.Subscription = null;

    self.Init = function(done) {
        if (MPrint.IsPrint()) return;
        MSite.Events.off("refresh", self.Reset);
        MSite.Events.on("refresh", self.Reset);
        self.Error(null);
        BlankDocument.ClearLastCell();
        self.Events.emit("start");
        self.Timer.Init();
        BlankDocument.DebugLabels([]);
        self.IsLoading(true);
        self.Timer.Start("stage5");
        self.Render(function(err) {
            Bus.Emit("documentisrendered");
            self.IsLoading(false);
            if (err) self.Error(err);
            self.Timer.End("stage5");
            BlankDocument.DebugLabels(BlankDocument.DebugLabels().concat(self.Timer.Results()));
            self.Time(self.Timer.Result["stage5"]);
            return done && typeof done == 'function' && done();
        })
    }

    /*
                  case 120: // Ctrl + F9 или F9
                    e.preventDefault();
                    if (isControlPressed){
                        CxCtrl.UseCache(false);
                        _.delay(CxCtrl.UseCache.bind(null,true),500);
                    } else {
                        CxCtrl.UseCache(true);
                    }
                    CxCtrl.Update("cells");
                    e.stopImmediatePropagation();
                  break;

     */




    self.TimerRetry = 0;

    self.CreateTable = function(place, HandsonConfig, done) {
        var DomEl = $(place)[0];
        if (self.TimerRetry > 100) {
            self.TimerRetry = 0;
            return;
        }
        if (!DomEl) {
            self.TimerRetry++;
            setTimeout(function() {
                self.CreateTable(place, HandsonConfig, done);
            }, 0);
            return;
        }
        self.TimerRetry = 0;
        try {
            self.table.destroy();
            self.table = null;
        } catch (e) {
            //console.log(e);
        }
        HandsonConfig = _.merge(HandsonConfig, {
            contextMenu: self.ContextMenu()
        });
        self.table = new Handsontable(DomEl, HandsonConfig);
        var oldRender = self.table.render;
        self.table.render = function(){
        	console.log("... delayed render");
        	self.callForRender(oldRender);
        }
        BlankDocument.table = self.table;
        BlankDocument.TableInterface(self);
        return done();
    }

    self.SL = 0;
    self.ST = 0;
    self.ScrollSelector = ".handsoncontainer .wtHolder:first";
    self.RememberScroll = function() {
        try {
            var Container = $(self.ScrollSelector);
            self.SL = Container.scrollLeft();
            self.ST = Container.scrollTop();
        } catch (e) {
            console.error(e);
        }
    }

    self.RestoreScroll = function() {
        try {
            var Container = $(self.ScrollSelector);
            Container.scrollLeft(self.SL);
            Container.scrollTop(self.ST);
            self.SL = 0;
            self.ST = 0;
        } catch (e) {
            console.error(e);
        }
    }

    self.Reset = function(NoCache) {
        self.RememberScroll();
        if (typeof NoCache == 'boolean') CxCtrl.UseCache(!NoCache);
        self.Init(function() {
            if (!_.isEmpty(BlankDocument.LastCoords) && BlankDocument.LastCoords.length == 2) {
                BlankDocument.table.selectCell(BlankDocument.LastCoords[0], BlankDocument.LastCoords[1]);
                setTimeout(self.RestoreScroll, 0);
            };
            CxCtrl.UseCache(true);
        })
    }

    self.ContextChange = function() {
        self.Reset();
    }

    self.Columns = ko.observableArray();
    self.FL = 0;

    self.oldCodes = ko.observableArray();
    self.collapsed = ko.observableArray();


    self.updateCollapsed = function(tree){
        var codes = _.values(_.map(tree,"CodeRow")).concat([CxCtrl.CodeDoc()]);
        if (!_.isEqual(self.oldCodes(),codes)){
            self.collapsed([]);
            self.oldCodes(codes);
        } else {
            if (self.table && _.isEmpty(self.collapsed()) && !_.isEmpty(self.table.collapsedRows())){
                self.collapsed(self.table.collapsedRows());
            } 
        }
    }

    self.doUpdateCollapsed = function(){
        if (!_.isEmpty(self.collapsed())){
            self.table.collapsedRows(self.collapsed());
        }
    }

    self.planUpdateCollapsed = function(){
    	Bus.Off("documentisrendered",self.doUpdateCollapsed);
    	Bus.On("documentisrendered",self.doUpdateCollapsed);
    }



    self.RenderStructure = function(done) {
        self.SetContext();
        self.Timer.Start("stage1");
        $.ajax({
            url: self.base + "/structure",
            data: {
                context: self.Context
            },
            method: 'get',
            success: function(Info) {
                self.updateCollapsed(Info.Tree);                
                self.Timer.End("stage1");
                self.Timer.Start("stage2");
                if (Info.err) return done(Info.err);
                if (!Info.Header || !Info.Header.length) return done(Tr("nowheaderchoosed"));
                if (!Info.Cells || !Info.Cells.length) return done(Tr("nowcells"));
                var ColInfo = [];
                if (_.isArray(_.first(Info.Header))) {
                    var Run = _.first(Info.Header);
                    Run.forEach(function(R) {
                        ColInfo.push(R.label);
                    })
                } else {
                    ColInfo = Info.Header;
                }
                var FirstRow = _.first(Info.Cells)
                var Cols = [];
                FirstRow.forEach(function(R, I) {
                    if (R && R.Cell && ColInfo[I]) {
                        Cols.push({
                            NameColsetCol: ColInfo[I]
                        });
                    }
                })
                self.FL = ColInfo.length - Cols.length;
                self.Columns(Cols);
                self.Structure = Info;
                self.RenderStructureAfterLoad(function() {
                    self.Timer.End("stage2");
                    self.Events.emit("renderstructure");
                    self.planUpdateCollapsed();
                    return done();
                });
            }
        })
    }


    self.LoadCells = function(done) {
        self.Timer.Start("stage3");
        $.ajax({
            url: self.base + "/cells",
            data: {
                context: self.Context
            },
            method: 'get',
            success: function(Info) {
                if (Info.err) return done(Info.err);
                self.Calculate = Info.Cells;
                self.CacheIsUsed(Info.CacheUsed);
                self.Timer.End("stage3");
                for (var k in Info.TimeLabels) {
                    BlankDocument.DebugLabels.push(k + " " + Info.TimeLabels[k]);
                }
                self.Events.emit("loadcells");
                return done();
            }
        })
    }

    self.RenderCells = function(done) {
        self.Timer.Start("stage4");
        var Metas = self.table.getCellsMeta();
        var Data = self.table.getData();
        Metas.forEach(function(Me) {
            if (Me && Me.Cell) {
                Me = _.merge(Me, self.Calculate[Me.Cell]);
                if (Data[Me.row] && self.Calculate[Me.Cell]) {
                    Data[Me.row][Me.col] = self.Calculate[Me.Cell].Value || 0;
                }
            }
        })
        self.table.updateSettings({
            data: Data
        });
        Metas.forEach(function(Me) {
            if (Me && Me.Cell) {
                self.table.setCellMetaObject(Me.row, Me.col, Me);
                if (Me.IsEditablePrimary) Me.readonly = false;
            }
        })
        self.table.render();
        self.Timer.End("stage4");
        self.Events.emit("rendercells");
        return done();
    }


    self.Render = function(done) {
        self.Structure = {};
        self.Calculate = {};
        async.parallel([
            self.RenderStructure,
            self.LoadCells,
        ], function(err) {
            self.IsLoading(false);
            if (err) {
                try {
                    self.table.destroy();
                    self.table = null;
                } catch (e) {
                    //console.log(e);
                }
                return self.Error(err);
            }
            self.RenderCells(done);
            Bus.Emit("documentloaded");
        });
    }


    self.Events = new EventEmitter();

    self.DebugTime = function() {
        $('#debugModal').modal('show');
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
        fixedRowsTop: 0
    };

    self.CollapseAllRows = function() {
        var Info = self.table.getSettings().tree;
        var RowCodes = [];
        for (var Index in Info.data) {
            var R = Info.data[Index];
            if ((R.rgt - R.lft) > 1) {
                RowCodes.push(parseInt(Index));
            }
        }
        self.table.collapsedRows(RowCodes);
    }

    self.ExpandAllRows = function() {
        self.table.collapsedRows([]);
    }

    self.Time = ko.observable(0);

    self.TimeLabel = ko.pureComputed(function() {
        var time = self.Time();

        function getDecimal(num) {
            return Math.abs(num) - Math.floor(num);
        }
        if (time) {
            var symbol;
            if (Math.floor(time) == Math.round(time)) {
                if (getDecimal(time) >= 0.5) {
                    symbol = '+ ';
                    return Math.round(time + 1) + symbol;
                } else {
                    symbol = '+ ';
                    return Math.round(time) + symbol;
                }
            } else {
                if (getDecimal(time) >= 0.5) {
                    symbol = '- ';
                    return Math.round(time) + symbol;
                } else {
                    symbol = '+ ';
                    return Math.round(time + 1) + symbol;
                }
            }
        } else {
            return '';
        }
    });

    self.Context = {};

    self.SetContext = function() {
        self.Context = CxCtrl.Context();
    }

    self.IsAvailable = function() {
        return false;
    }

    return self;
}




ModuleManager.Modules.BlankDocument = BlankDocument;
