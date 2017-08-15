var MChart = (new function () {

    var self = this;

    self.IsLoading = ko.observable(false);

    self.IsAvailable = function () {
        var Doc = null;
        if (CxCtrl.CodeDoc()) {
            Doc = MFolders.FindDocument(CxCtrl.CodeDoc());
        }
        return Doc && Doc.IsChart;
    }

    self.Error = ko.observable(null);

    self.LoadChartSettings = function (done) {
        $.getJSON("/api/modules/chart/chartbydoc/" + CxCtrl.CodeDoc(), CxCtrl.Context(), function (data) {
            data = data.Chart;
            if (data) {
                self.ShowGridX(data.UseShowGridX);
                self.ShowGridY(data.UseShowGridY);
                if (data.UseSizeWidth > 0) {
                    self.Width(data.UseSizeWidth);
                }
                if (data.UseSizeHeight > 0) {
                    self.Height(data.UseSizeHeight);
                }
                self.Interaction(data.UseInteraction);
                self.ShowValues(data.UseShowValues);
                self.DrawNull(data.DrawNull);
                self.AreaSpline(data.AreaSpline);
                if (data.UseLegentPositionBottom) {
                    self.LegendPosition('bottom');
                    self.RuLegendPosition('снизу');
                }
                if (data.UseLegentPositionRight) {
                    self.LegendPosition('right');
                    self.RuLegendPosition('справа');
                }
                if (data.UseLegentPositionInset) {
                    self.LegendPosition('inset');
                    self.RuLegendPosition('внутри');
                }
                self.Type(data.CodeChartType);
                var ColColors = {};
                data.RadarColors.split('&').forEach(function (c) {
                    try {
                        var NCC = ko.observable('#' + c.split('#')[1]);
                        NCC.subscribe(function () {
                            self.Create();
                        })
                        ColColors[c.split('#')[0]] = NCC;
                    } catch (e) {}
                })
                self.ColColors(ColColors);
            }
            $.getJSON('api/modules/chart/rowchartlines/' + CxCtrl.CodeDoc(), CxCtrl.Context(), function (data) {
                data = data.RowChartLines;
                if (data.length) {
                    var Colors = {};
                    var RowTypes = {};
                    var Dotted = {};
                    var SBIndexes = {};
                    var AxisIndexes = {};
                    self.table.getData().forEach(function (R) {
                        Colors[R[1]] = ko.observable("#CFCFCF");
                        RowTypes[R[1]] = ko.observable('столбец');
                        Dotted[R[1]] = ko.observable(false);
                        SBIndexes[R[1]] = ko.observable(1);
                        AxisIndexes[R[1]] = ko.observable(1);
                    });
                    self.Colors(Colors);
                    self.RowTypes(RowTypes);
                    self.Dotted(Dotted);
                    self.SBIndexes(SBIndexes);
                    self.AxisIndexes(AxisIndexes);
                    data.forEach(function (D) {
                        var NC = ko.observable(D.CodeChartColor);
                        var NT = ko.observable(self.LangPossibleRowTypes(D.RowType));
                        var ND = ko.observable(D.Dotted);
                        var NI = ko.observable(D.SBIndex);
                        var NA = ko.observable(D.AxisIndex);
                        NC.subscribe(function () {
                            self.Create();
                        })
                        NT.subscribe(function () {
                            self.Create();
                        })
                        ND.subscribe(function () {
                            self.Create();
                        })
                        NI.subscribe(function () {
                            self.Create();
                        })
                        NA.subscribe(function () {
                            self.Create();
                        })
                        self.Colors()[self.table.getData()[Object.values(self.Structure.Tree).findIndex(function (e) {
                            return e.CodeRow == D.CodeRow
                        })][1]] = NC;
                        self.RowTypes()[self.table.getData()[Object.values(self.Structure.Tree).findIndex(function (e) {
                            return e.CodeRow == D.CodeRow
                        })][1]] = NT;
                        self.Dotted()[self.table.getData()[Object.values(self.Structure.Tree).findIndex(function (e) {
                            return e.CodeRow == D.CodeRow
                        })][1]] = ND;
                        self.SBIndexes()[self.table.getData()[Object.values(self.Structure.Tree).findIndex(function (e) {
                            return e.CodeRow == D.CodeRow
                        })][1]] = NI;
                        self.AxisIndexes()[self.table.getData()[Object.values(self.Structure.Tree).findIndex(function (e) {
                            return e.CodeRow == D.CodeRow
                        })][1]] = NA;
                    })
                }
                return done();
            })
        })
    }

    self.SaveChanges = function () {
        var data = {
            NameChart: CxCtrl.CodeDoc() + "_chart",
            SNameChart: CxCtrl.CodeDoc() + "_chart",
            UseLegend: (self.RuLegendPosition() != 'не показывать'),
            UseGrid: self.ShowGridX() || self.ShowGridY(),
            UseSizeWidth: self.Width(),
            UseSizeHeight: self.Height(),
            UseInteraction: self.Interaction(),
            UseShowGridX: self.ShowGridX(),
            UseShowGridY: self.ShowGridY(),
            UseLegentPositionRight: (self.LegendPosition() === "right"),
            UseLegentPositionBottom: (self.LegendPosition() === "bottom"),
            UseLegentPositionInset: (self.LegendPosition() === "inset"),
            UseShowValues: self.ShowValues() ? 1 : 0,
            DrawNull: self.DrawNull(),
            AreaSpline: self.AreaSpline(),
            CodeDoc: CxCtrl.CodeDoc(),
            CodeChartType: self.Type(),
            CodeChart: CxCtrl.CodeDoc() + '_chart',
            RadarColors: function () {
                var ret = '';
                _.keys(self.ColColors()).forEach(function (k) {
                    ret += k + self.ColColors()[k]() + '&';
                })
                return ret.substring(0, ret.length - 1);
            }(),
            RowChartLines: []
        }
        var rowchartlines = [];
        self.BarsGroups().forEach(function (N, index) {
            rowchartlines.push({
                ColorCorrection: 0, //???
                CodeDoc: CxCtrl.CodeDoc(),
                CodeRow: self.Structure.Tree[index].CodeRow,
                CodeChartColor: self.Colors()[N](),
                RowType: self.LangRuPossibleRowTypes(self.RowTypes()[N]()),
                Dotted: self.Dotted()[N](),
                SBIndex: self.SBIndexes()[N](),
                AxisIndex: self.AxisIndexes()[N](),
                CodeRowChartLine: CxCtrl.CodeDoc() + "_" + self.Structure.Tree[index].CodeRow
            })
        });
        data.RowChartLines = rowchartlines;
        self.Error(null);
        $.ajax({
            url: 'api/modules/chart/chart',
            method: 'put',
            data: {
                'chart': JSON.stringify(data)
            },
            success: function (data) {
                if (data.err) {
                    return self.Error(data.err);
                }
                swal("изменения сохранены", "Изменения графика успешно сохранены на сервере", "success");
            }
        })
    }

    self._ifIntersect = function (s1, s2) {
        s1 = s1.getBoundingClientRect();
        s2 = s2.getBoundingClientRect();
        return !(s2.left > s1.right ||
            s2.right < s1.left ||
            s2.top > s1.bottom ||
            s2.bottom < s1.top);
    }

    self._getTextOf = function (el) {
        var sPref = "c3-shapes-";
        var snPref = "c3-shape-";
        var name = Array.from(el.parentElement.classList).find(function (c) {
            return c.indexOf(sPref) === 0
        }).substring(sPref.length);
        var n = Array.from(el.classList).find(function (c) {
            return c.indexOf(snPref) === 0
        }).substring(snPref.length);
        var tPref = "c3-texts-";
        var tnPref = "c3-text-";
        return d3.select('g.' + tPref + name + ' text.' + tnPref + n);
    }

    self._humanizeText = function (t) {
        if (!self.ShowValues()) {
            return ""
        }
        var pref = "";
        if (t.substring(0, 1) == "-") {
            pref = "-";
            t = t.slice(1)
        }
        return pref + t.split(/(?=(?:...)*$)/).join(" ")
    }

    self.IndexedCells = {};

    self.RenderStructureAfterLoad = function (done) {
        var Header = self.Structure.Header;
        var TableData = self.Structure.Cells;
        var RealData = [];
        self.IndexedCells = {};
        TableData.forEach(function (Row, x) {
            var NewRow = [];
            self.IndexedCells[x] = {};
            Row.forEach(function (Cell, y) {
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
        var HandsonRenders = new HandsonTableRenders.RenderController();
        HandsonRenders.RegisterRender("Code", [/[0-9]*?,0$/], HandsonTableRenders.ReadOnlyText);
        HandsonRenders.RegisterRender("Tree", [/[0-9]*?,1$/], HandsonTableRenders.TreeRender);
        HandsonRenders.RegisterRender("Cell", [/[0-9]*?,(?![0,1]$)[0-9]*/], HandsonTableRenders.CellRender);

        HandsonConfig = _.merge(_.clone(self.baseConfig), {
            data: RealData,
            cells: HandsonRenders.UniversalRender,
            fixedColumnsLeft: FixedLeft,
            headers: [
                Header
            ],
            tree: {
                data: TreeArr,
                icon: function () {},
                colapsed: self.Context.CodeDoc + '_chart'
            }
        })
        self.CreateTable('.handsontable.single.chart', HandsonConfig, function () {
            new HandsonTableHelper.HeaderGenerator(self.table);
            new HandsonTableHelper.WidthFix(self.table, 100, 200, FixedColsWidths);
            new HandsonTableHelper.DiscretScroll(self.table);
            new HandsonTableHelper.TreeView(self.table);
            new HandsonTableHelper.RegisterKeys(self.table);
            var Metas = self.table.getCellsMeta();
            Metas.forEach(function (Me) {
                if (Me && self.IndexedCells[Me.row][Me.col]) {
                    Me = _.merge(Me, self.IndexedCells[Me.row][Me.col]);
                }
            })
            self.table.render();
            return self.LoadChartSettings(done);
        })

    }

    self.Mode = ko.observable(false);
    self.LegendPosition = ko.observable('inset');
    self.LegendPosition.subscribe(function () {
        self.Create()
    })
    self.ShowGridX = ko.observable(true);
    self.ShowGridX.subscribe(function () {
        self.Create()
    })
    self.ShowGridY = ko.observable(true);
    self.ShowGridY.subscribe(function () {
        self.Create()
    })

    self.RuLegendPosition = ko.observable('внутри');
    self.RuLegendPosition.subscribe(function () {
        self.LegendPosition(_.findKey(self.LangLegendPosition, function (o) {
            return o == self.RuLegendPosition()
        }))
    })
    self.PossibleLegendPositions = ['снизу', 'справа', 'внутри', 'не показывать'];
    self.LangLegendPosition = {
        bottom: 'снизу',
        right: 'справа',
        inset: 'внутри',
        none: 'не показывать'
    }

    self.BarsData = ko.observableArray();
    self.BarsGroups = ko.observableArray();

    self.Step = ko.observable(100);
    self.Width = ko.observable(720);
    self.Height = ko.observable(540);

    self.AxMax = ko.observable(100);
    self.AxMin = ko.observable(-100);
    self.Interaction = ko.observable(true);
    self.Interaction.subscribe(function () {
        self.Create()
    })

    self.DrawNull = ko.observable(true);
    self.DrawNull.subscribe(function () {
        self.Create()
    })

    self.AreaSpline = ko.observable(false);
    self.AreaSpline.subscribe(function () {
        self.Create();
    })

    self.ShowValues = ko.observable(true);
    self.ShowValues.subscribe(function () {
        self.Create()
    })

    self.EditMode = ko.observable();
    self.MinValue = ko.observable();

    self.Type = ko.observable('area');
    self.SetType = function (Type) {
        self.Type(Type);
        self.Create();
    }

    self.Tiks = ko.observableArray();

    self.Colors = ko.observable();
    self.ColColors = ko.observable();
    self.RowTypes = ko.observable();
    self.Dotted = ko.observable();
    self.SBIndexes = ko.observable();
    self.AxisIndexes = ko.observable();

    self.PossibleColors = ['#DA4453', '#EB5367', '#FC6E51', '#E9573F', '#48CFAD', '#37BC9B', '#4FC1E9', '#3BAFDA', '#EC87C0', '#D770AD', '#AC92EC', '#967ADC', '#FFCE54', '#F6BB42', '#A0D468', '#8CC152', '#5D9CEC', '#4A89DC', '#656D78', '#434A54'];
    self.PossibleRowTypes = ['bar', 'line', 'spline'];
    self.RuPossibleRowTypes = ['столбец', 'линия', 'сглаженная линия']

    self.LangPossibleRowTypes = function (t) {
        return {
            bar: 'столбец',
            line: 'линия',
            spline: 'сглаженная линия',
        }[t] || "";
    }

    self.LangRuPossibleRowTypes = function (t) {
        return {
            'столбец': 'bar',
            'линия': 'line',
            'сглаженная линия': 'spline',
        }[t] || "";
    }


    self.Icon = function (type) {
        return {
            'bar': 'fa-bar-chart',
            'stacked-bar': 'fa-stack-exchange',
            'area-spline': 'fa-area-chart',
            'area': 'fa-area-chart',
            'line': 'fa-line-chart',
            'spline': 'fa-line-chart',
            'pie': 'fa-pie-chart',
            'radar': 'fa-pie-chart'
        }[type] || "";
    }

    self.LegendIcon = function (type) {
        return {
            'bottom': 'fa-hand-o-down',
            'right': 'fa-hand-o-right',
            'inset': 'fa-hand-o-left',
        }[type] || '';
    }

    self.Create = function () {
        self.PrepareData();
        requirejs(["d3", "c3"], function (d3, c3) {
            self.BuildGraph(d3, c3);
        })
    }

    self.PrepareData = function () {
        var Data = MChart.table.getData();
        var Cols = [];
        var JSONdata = [];
        Data.forEach(function (D, index) {
            Data[index] = D.splice(1);
            Cols.push(Data[index][0]);
        })
        MChart.Structure.Header.slice(2).forEach(function (N, Index) {
            var P = {}
            P.name = N;
            Data.forEach(function (V, j) {
                P[V[0]] = V[Index + 1];
            })
            //Format cells
            _.keys(P).forEach(function (k) {
                if (k != 'name') {
                    P[k] = P[k].toString();
                    if (P[k].indexOf(',') != -1 || P[k].indexOf('%') != -1) {
                        P[k] = P[k].replace(',', '');
                        P[k] = P[k].replace('%', '')
                    } else {
                        var t = parseInt(P[k]);
                        if (!isNaN(t)) {
                            P[k] = t;
                        }
                    }
                }
            })
            JSONdata.push(P);
        })
        var MaxValue = null,
            MinValue = null;
        Data.forEach(function (D) {
            var WithoutName = _.clone(D).splice(1); // Убираем название
            var V, M;
            if (self.Type() == 'stacked-bar') {
                V = _.sum(WithoutName);
                M = V;
            } else {
                V = _.max(WithoutName);
                M = _.min(WithoutName);
            }
            MaxValue = Math.max(MaxValue, V);
            MinValue = Math.min(MinValue, M);
        })
        self.AxMax(Math.round(MaxValue * 1.2))
        self.AxMin(Math.round(MinValue))
        var Dis = Math.pow(10, (Math.abs(MinValue) + '').length - 1);
        var MinValue = Math.ceil(MinValue / Dis) * Dis;
        var step = Math.pow(10, (MaxValue + '').length - 1);
        self.Step(step);
        var Tiks = new Array(100).fill(0).map(function (v, i) {
            return MinValue + i * self.Step()
        });
        self.Tiks(Tiks);
        self.BarsGroups(_.clone(Cols));
        self.BarsData(JSONdata);
        var ColColors = {};
        self.BarsData().forEach(function (bd, i) {
            if (self.ColColors() && self.ColColors()[bd.name]) {
                ColColors[bd.name] = self.ColColors()[bd.name];
            } else {
                var Color = "#CFCFCF";
                if (self.PossibleColors[i % self.PossibleColors.length]) {
                    Color = self.PossibleColors[i % self.PossibleColors.length];
                }
                var NCC = ko.observable(Color);
                NCC.subscribe(function () {
                    self.Create()
                })
                ColColors[bd.name] = NCC;
            }
        })
        self.ColColors(ColColors);
        setTimeout(function () {
            var Places = _.clone(Cols);
            if (_.difference(Places, _.keys(self.Colors())).length) {
                var Colors = {};
                Places.forEach(function (P, i) {
                    var Color = "#CFCFCF";
                    if (self.PossibleColors[i % self.PossibleColors.length]) Color = self.PossibleColors[i % self.PossibleColors.length];
                    var NC = ko.observable(Color);
                    NC.subscribe(function () {
                        self.Create()
                    })
                    Colors[P] = NC;
                })
                self.Colors(Colors);
            }
            if (_.difference(Places, _.keys(self.RowTypes())).length) {
                var RowTypes = {};
                Places.forEach(function (P, i) {
                    var RowType = 'столбец';
                    var NT = ko.observable(RowType);
                    NT.subscribe(function () {
                        self.Create()
                    })
                    RowTypes[P] = NT;
                })
                self.RowTypes(RowTypes);
            }
            if (_.difference(Places, _.keys(self.Dotted())).length) {
                var Dotted = {};
                Places.forEach(function (P, i) {
                    var Dottede = false;
                    var ND = ko.observable(Dottede);
                    ND.subscribe(function () {
                        self.Create()
                    })
                    Dotted[P] = ND;
                })
                self.Dotted(Dotted);
            }
            if (_.difference(Places, _.keys(self.SBIndexes())).length) {
                var SBIndexes = {};
                Places.forEach(function (P, i) {
                    var SBIndex = 1;
                    var NI = ko.observable(SBIndex);
                    NI.subscribe(function () {
                        self.Create()
                    })
                    SBIndexes[P] = NI;
                })
                self.SBIndexes(SBIndexes);
            }
            if (_.difference(Places, _.keys(self.AxisIndexes())).length) {
                var AxisIndexes = {};
                Places.forEach(function (P, i) {
                    var AxisIndex = 1;
                    var NA = ko.observable(AxisIndex);
                    NA.subscribe(function () {
                        self.Create()
                    })
                    AxisIndexes[P] = NA;
                })
                self.AxisIndexes(AxisIndexes);
            }
        }, 1000);
    }

    self.BuildGraph = function (d3, c3) {
        var groups = [];
        var type = self.Type();
        if (type == 'area' && self.AreaSpline()) {
            type = 'area-spline';
        }
        $('#graphPreviewContainer').html('');
        if (self.BarsData().length == 0) {
            document.getElementById('graphPreviewContainer').innerHTML = '<div class="no-data-container"><h1 class="no-data-notify">Нет данных</h1></div>';
            return;
        }
        if (self.Type() === 'radar') {
            var RadarCfg = {
                maxValue: Math.max(self.AxMax(), 0),
                LegendPosition: self.LegendPosition(),
                minValue: Math.min(self.AxMin(), 0),
                interaction: self.Interaction(),
                color: function (i) {
                    var ret = 'blue';
                    _.keys(self.ColColors()).forEach(function (k, j) {
                        if (i == j) {
                            ret = self.ColColors()[k]();
                        }
                    })
                    return ret;
                },
                showValues: self.ShowValues(),
                levels: self.ShowGridY() ? 10 : 0,
                drawNull: self.DrawNull(),
            }
            requirejs(['/modules/chart/chart-builders/radar-chart.js'], function (RadarChart) {
                RadarChart.draw("#graphPreviewContainer", self.BarsData(), RadarCfg);
            })
        } else {
            if (type == 'bar-line') {
                var maxi = 0;
                _.keys(self.SBIndexes()).forEach(function (k) {
                    if (self.SBIndexes()[k]() > maxi) {
                        maxi = self.SBIndexes()[k]();
                    }
                })
                for (var i = 0; i < maxi; i++) {
                    groups.push([]);
                }
                self.BarsGroups().forEach(function (a) {
                    groups[self.SBIndexes()[a]() - 1].push(a);
                })
                var getColumns = function (data) {
                    var ret = []
                    data.forEach(function (d, j) {
                        if (j == 0) {
                            _.keys(d).forEach(function (k) {
                                if (k != 'name') {
                                    ret.push([k]);
                                }
                            })
                        }
                        _.keys(d).forEach(function (k, i) {
                            if (k != 'name') {
                                ret[i - 1].push(d[k])
                            }
                        })
                    })
                    return ret;
                }
                var getTypes = function (types) {
                    ret = {};
                    _.keys(types).forEach(function (k) {
                        if (self.LangRuPossibleRowTypes(types[k]()) != 'bar') {
                            ret[k] = self.LangRuPossibleRowTypes(types[k]());
                        }
                    })
                    return ret;
                }
                var getAxes = function (axes) {
                    ret = {};
                    _.keys(axes).forEach(function (k) {
                        if (axes[k]() == 1) {
                            ret[k] = 'y';
                        } else {
                            ret[k] = 'y2';
                        }
                    })
                    return ret;
                }
                var getGroups = function (types) {
                    ret = [];
                    _.keys(types).forEach(function (k) {
                        if (self.LangRuPossibleRowTypes(types[k]()) == 'bar') {
                            ret.push(k);
                        }
                    })
                    return [ret];
                }

                var data = {
                    columns: getColumns(self.BarsData()),
                    type: 'bar',
                    types: getTypes(self.RowTypes()),
                    groups: groups,
                    colors: ko.toJS(self.Colors),
                    labels: {
                        centered: true
                    },
                    axes: getAxes(self.AxisIndexes()),
                }
            } else {
                var data = {
                    json: self.BarsData(),
                    groups: groups,
                    labels: {
                        centered: true
                    },
                    keys: {
                        x: 'name',
                        value: self.BarsGroups(),
                    },
                    type: type,
                    colors: ko.toJS(self.Colors)
                }
            }
            var chart = c3.generate({
                bindto: '#graphPreviewContainer',
                size: {
                    width: self.Width(),
                    height: self.Height()
                },
                interaction: {
                    enabled: self.Interaction() // показывать всплывашки по ховеру
                },
                data: data,
                axis: {
                    x: {
                        type: 'category'
                    },
                    y: {},
                    y2: {
                        show: _.keys(data.axes).some(function (x) {
                            return data.axes[x] == 'y2'
                        }),
                    }
                },
                grid: {
                    x: {
                        show: self.ShowGridY()
                    },
                    y: {
                        show: self.ShowGridX()
                    }
                },
                legend: {
                    show: self.LegendPosition() != "none",
                    position: self.LegendPosition() // bottom || right || inset
                },
                onrendered: function () {
                    var dotted = self.BarsGroups().filter(function (n) {
                        try {
                            return self.Dotted()[n]() && (self.RowTypes()[n]() != 'столбец');
                        } catch (e) {
                            return false
                        }
                    });
                    var type = self.Type();
                    var config = {
                        data_groups: [],
                        data_labels: {
                            centered: true
                        }
                    };
                    d3.selectAll('.c3-texts text').style({
                        fill: 'black',
                        stroke: 'white',
                        'stroke-width': 1,
                        'stroke-linecap': 'round',
                        'stroke-opacity': 0.65,
                        'font-size': '1.5em',
                        'font-weight': 'bold',
                        "stroke-linejoin": "bevel"
                    });
                    switch (type) {
                        case 'area':
                        case 'bar-line':
                            d3.selectAll('g.c3-bars path').each(function () {
                                var box = this.getBBox();
                                var text = self._getTextOf(this).style('opacity', config.data_groups.length ? (box.height > 24 ? 1 : 0) : 1);
                                text[0][0].innerHTML = self._humanizeText(text[0][0].innerHTML);
                                if (config.data_labels && config.data_labels.centered && (box.height > 24 || config.data_groups.length)) {
                                    text.attr('y', box.y + box.height / 2 + 6);
                                }
                            });
                            d3.selectAll('circle.c3-circle').each(function () {
                                var text = self._getTextOf(this).each(function () {
                                    var that = this;
                                    d3.selectAll('text.c3-text').each(function () {
                                        if (this != that && self._ifIntersect(this, that) && that.compareDocumentPosition(this) == 4) {
                                            that.style.opacity = 0;
                                        }
                                    });
                                });
                                text[0][0].innerHTML = self._humanizeText(text[0][0].innerHTML);
                            });
                            break;
                        case 'pie':
                            d3.selectAll('.c3-chart-arc text').each(function () {
                                this.innerHTML = self._humanizeText(this.innerHTML);
                            });
                            break;
                        default:
                            break;
                    }
                    dotted.forEach(function (t) {
                        d3.selectAll('.c3-target-' + t.replaceAll(' ', '-'))
                            .style("stroke-dasharray", "15 10")
                    })
                }
            });
        }
    }
    self = _.merge(new BaseDocPlugin(), self);

    return self;
})

MChart.Events.addListener("rendercells", function () {
    MChart.Create();
})


ModuleManager.Modules.Chart = MChart;


ko.bindingHandlers.colorpicker_custom = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        setTimeout(function () {
            $(element).ace_colorpicker();
        }, 0)
    }
};
requirejs.config({
    paths: {
        "d3": "lib/charts/d3/d3.min",
        "c3": "lib/charts/c3/c3.min"
    }
});
