if (!Array.prototype.find) {
    Array.prototype.find = function (predicate) {
        if (this === null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}

var ExportSVGWorker = (new function () {
    var self = this;

    self.Chart = {};
    self.RowChartLines = {};
    self.Structure = {};
    self.Cells = {};

    self.Width = 400;
    self.Height = 300;

    self.PossibleColors = ['#DA4453', '#EB5367', '#FC6E51', '#E9573F', '#48CFAD', '#37BC9B', '#4FC1E9', '#3BAFDA', '#EC87C0', '#D770AD', '#AC92EC', '#967ADC', '#FFCE54', '#F6BB42', '#A0D468', '#8CC152', '#5D9CEC', '#4A89DC', '#656D78', '#434A54'];

    self.LoadJSON = function (filename, callback) {
        $.getJSON('/tmp/' + filename + '.json', function (json) {
            try {
                self.Chart.Chart = json.Chart;
                self.RowChartLines.RowChartLines = json.RowChartLines;
                self.Structure = json.Structure;
                self.Cells = json.Cells;
                return callback();
            } catch (e) {}
        });
    }

    self.GetData = function () {
        var retData = [];
        self.Structure.Cells.forEach(function (row, i) {
            retData.push([]);
            retData[i].push(row[0]);
            retData[i].push(row[1]);
            row.slice(2).forEach(function (cell, j) {
                retData[i].push(self.Cells.Cells[cell.Cell].Value)
            })
        })
        return retData;
    }

    self.GetLegendPosition = function () {
        if (self.Chart.Chart.UseLegentPositionRight) {
            return "right"
        }
        if (self.Chart.Chart.UseLegentPositionBottom) {
            return "bottom"
        }
        if (self.Chart.Chart.UseLegentPositionInset) {
            return "inset"
        }
        return "inset"
    }

    self.GetColor = function (CR) {
        return self.RowChartLines.RowChartLines.find(function (o) {
            return o.CodeRow == CR
        }).CodeChartColor
    }

    self.GetSBIndex = function (CR) {
        return self.RowChartLines.RowChartLines.find(function (o) {
            return o.CodeRow == CR
        }).SBIndex;
    }

    self.GetAxisIndex = function (CR) {
        return self.RowChartLines.RowChartLines.find(function (o) {
            return o.CodeRow == CR
        }).AxisIndex;
    }

    self.GetDotted = function (CR) {
        return self.RowChartLines.RowChartLines.find(function (o) {
            return o.CodeRow == CR
        }).Dotted
    }

    self.GetRowType = function (CR) {
        return self.RowChartLines.RowChartLines.find(function (o) {
            return o.CodeRow == CR
        }).RowType
    }

    self.IfIntersect = function (s1, s2) {
        s1 = s1.getBoundingClientRect();
        s2 = s2.getBoundingClientRect();
        return !(s2.left > s1.right ||
            s2.right < s1.left ||
            s2.top > s1.bottom ||
            s2.bottom < s1.top);
    }

    self.GetTextOf = function (el) {
        var sPref = "c3-shapes-";
        var snPref = "c3-shape-";
        var AF = function (a) {
            r = [];
            if (!a) {
                return r;
            }
            for (var i = 0; i < a.length; i++) {
                r.push(a[i])
            }
            return r;
        }
        var name = AF(el.parentElement.classList).find(function (c) {
            return c.indexOf(sPref) === 0
        }).substring(sPref.length);
        var n = AF(el.classList).find(function (c) {
            return c.indexOf(snPref) === 0
        }).substring(snPref.length);
        var tPref = "c3-texts-";
        var tnPref = "c3-text-";
        return d3.select('g.' + tPref + name + ' text.' + tnPref + n);
    }

    self.HumanizeText = function (t) {
        t = t.toString()
        if (!self.Chart.Chart.UseShowValues) {
            return ""
        }
        var pref = "";
        if (t.substring(0, 1) == "-") {
            pref = "-";
            t = t.slice(1)
        }
        return pref + t.split(/(?=(?:...)*$)/).join(" ")
    }

    self.PrepareData = function () {
        self.Chart.Chart.Colors = {};
        self.Chart.Chart.SBIndexes = {};
        self.Chart.Chart.AxisIndexes = {};
        self.Chart.Chart.Dotted = {};
        self.Chart.Chart.RowTypes = {};
        self.Chart.Chart.ColColors = {};
        self.Chart.Chart.Width = self.Width;
        self.Chart.Chart.Height = self.Height;
        var Data = self.GetData();
        var Cols = [];
        var JSONdata = [];
        Data.forEach(function (D, index) {
            Data[index] = D.splice(1);
            Cols.push(Data[index][0]);
            self.Chart.Chart.Colors[Data[index][0]] = self.GetColor(self.Structure.Tree[index.toString()].CodeRow);
            self.Chart.Chart.SBIndexes[Data[index][0]] = self.GetSBIndex(self.Structure.Tree[index.toString()].CodeRow);
            self.Chart.Chart.AxisIndexes[Data[index][0]] = self.GetAxisIndex(self.Structure.Tree[index.toString()].CodeRow);
            self.Chart.Chart.Dotted[Data[index][0]] = self.GetDotted(self.Structure.Tree[index.toString()].CodeRow);
            self.Chart.Chart.RowTypes[Data[index][0]] = self.GetRowType(self.Structure.Tree[index.toString()].CodeRow);
        })
        self.Structure.Header.slice(2).forEach(function (N, Index) {
            var P = {}
            P.name = N;
            Data.forEach(function (V, j) {
                P[V[0]] = V[Index + 1];
            })
            JSONdata.push(P);
        })
        var MaxValue = null,
            MinValue = null;
        Data.forEach(function (D) {
            var WithoutName = _.clone(D).splice(1);
            var V, M;
            if (self.Chart.Chart.CodeChartType == 'stacked-bar') {
                V = _.sum(WithoutName);
                M = V;
            } else {
                V = _.max(WithoutName);
                M = _.min(WithoutName);
            }
            MaxValue = Math.max(MaxValue, V);
            MinValue = Math.min(MinValue, M);
        })
        self.Chart.Chart.AxMax = Math.round(MaxValue * 1.2)
        self.Chart.Chart.AxMin = Math.round(MinValue)
        var Dis = Math.pow(10, (Math.abs(MinValue) + '').length - 1);
        var MinValue = Math.ceil(MinValue / Dis) * Dis;
        var step = Math.pow(10, (MaxValue + '').length - 1);
        self.Chart.Chart.Step = step;
        var Tiks = new Array(100) //.fill(0).map(function(v,i){ return MinValue+i*Chart.Chart.Step});
        for (var i = 0; i < 100; i++) {
            Tiks[i] = 0
        }
        Tiks = Tiks.map(function (v, i) {
            return MinValue + i * self.Chart.Chart.Step
        });
        self.Chart.Chart.Tiks = Tiks;
        self.Chart.Chart.BarsGroups = _.clone(Cols);
        self.Chart.Chart.BarsData = JSONdata;
        var ColColors = {};
        self.Chart.Chart.RadarColors.split('&').forEach(function (c) {
            try {
                ColColors[c.split('#')[0]] = '#' + c.split('#')[1];
            } catch (e) {}
        })
        self.Chart.Chart.ColColors = ColColors;
    }

    self.RepairAspectRatio = function () {
        var aspectRatio = self.Chart.Chart.BarsData.length / 2;
        if (self.Chart.Chart.Height * aspectRatio > self.Chart.Chart.Width) {
            self.Chart.Chart.Height = self.Chart.Chart.Width / aspectRatio;
        } else {
            self.Chart.Chart.Width = self.Chart.Chart.Height * aspectRatio;
        }
    }

    self.BuildGraph = function () {
        //self.RepairAspectRatio()
        var groups = [];
        var type = self.Chart.Chart.CodeChartType;
        if (type == 'area' && self.Chart.Chart.AreaSpline) {
            type = 'area-spline';
        }
        $('#graphPreviewContainer').html('');
        if (self.Chart.Chart.BarsData.length == 0) {
            document.getElementById('graphPreviewContainer').innerHTML = '<div class="no-data-container"><h1 class="no-data-notify">Нет данных</h1></div>';
            return;
        }
        if (self.Chart.Chart.CodeChartType === 'radar') {
            var RadarCfg = {
                w: 500,
                h: 500,
                ExtraWidthX: 300,
                ExtraWidthY: 100,
                maxValue: Math.max(self.Chart.Chart.AxMax, 0),
                minValue: Math.min(self.Chart.Chart.AxMin, 0),
                LegendPosition: self.GetLegendPosition(),
                interaction: self.Chart.Chart.UseInteraction,
                color: function (i) {
                    var ret = 'blue';
                    _.keys(self.Chart.Chart.ColColors).forEach(function (k, j) {
                        if (i == j) {
                            ret = self.Chart.Chart.ColColors[k];
                        }
                    })
                    return ret;
                },
                showValues: self.Chart.Chart.UseShowValues,
                levels: self.Chart.Chart.UseShowGridY ? 10 : 0,
                drawNull: self.Chart.Chart.DrawNull,
            }
            RadarChart.draw("#graphPreviewContainer", self.Chart.Chart.BarsData, RadarCfg);

        } else {
            if (type == 'bar-line') {
                var maxi = 0;
                _.keys(self.Chart.Chart.SBIndexes).forEach(function (k) {
                    if (self.Chart.Chart.SBIndexes[k] > maxi) {
                        maxi = self.Chart.Chart.SBIndexes[k];
                    }
                })
                for (var i = 0; i < maxi; i++) {
                    groups.push([]);
                }
                self.Chart.Chart.BarsGroups.forEach(function (a) {
                    groups[self.Chart.Chart.SBIndexes[a] - 1].push(a);
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
                        if (types[k] != 'bar') {
                            ret[k] = types[k];
                        }
                    })
                    return ret;
                }
                var getAxes = function (axes) {
                    ret = {};
                    _.keys(axes).forEach(function (k) {
                        if (axes[k] == 1) {
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
                        if (types[k] == 'bar') {
                            ret.push(k);
                        }
                    })
                    return [ret];
                }
                var data = {
                    columns: getColumns(self.Chart.Chart.BarsData),
                    type: 'bar',
                    types: getTypes(self.Chart.Chart.RowTypes),
                    groups: groups,
                    colors: self.Chart.Chart.Colors,
                    labels: {
                        centered: true
                    },
                    axes: getAxes(self.Chart.Chart.AxisIndexes),
                }
            } else {
                var data = {
                    json: self.Chart.Chart.BarsData,
                    groups: groups,
                    labels: {
                        centered: true
                    },
                    keys: {
                        x: 'name',
                        value: self.Chart.Chart.BarsGroups,
                    },
                    type: type,
                    colors: self.Chart.Chart.Colors
                }
            }
            var chart = c3.generate({
                bindto: '#graphPreviewContainer',
                size: {
                    width: self.Chart.Chart.Width,
                    height: self.Chart.Chart.Height
                },
                interaction: {
                    enabled: self.Chart.Chart.UseInteraction
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
                        show: self.Chart.Chart.UseShowGridY
                    },
                    y: {
                        show: self.Chart.Chart.UseShowGridX
                    }
                },
                legend: {
                    show: self.Chart.Chart.UseLegend,
                    position: self.GetLegendPosition()
                },
                onrendered: function () {
                    var dotted = self.Chart.Chart.BarsGroups.filter(function (n) {
                        try {
                            return self.Chart.Chart.Dotted[n] && (self.Chart.Chart.RowTypes[n] != 'bar');
                        } catch (e) {
                            return false
                        }
                    });
                    var type = self.Chart.Chart.CodeChartType;
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
                        case 'bar-line':
                        case 'stacked-bar':
                            d3.selectAll('g.c3-bars path').each(function () {
                                var box = this.getBBox();
                                var text = self.GetTextOf(this).style('opacity', config.data_groups.length ? (box.height > 24 ? 1 : 0) : 1);
                                text[0][0].textContent = self.HumanizeText(text[0][0].__data__.value);
                                if (config.data_labels && config.data_labels.centered && (box.height > 24 || config.data_groups.length)) {
                                    text.attr('y', box.y + box.height / 2 + 6);
                                }
                            });
                            break;
                        case 'area':
                        case 'bar-line':
                            d3.selectAll('circle.c3-circle').each(function () {
                                var text = self.GetTextOf(this).each(function () {
                                    var that = this;
                                    d3.selectAll('text.c3-text').each(function () {
                                        if (this != that && self.IfIntersect(this, that) && that.compareDocumentPosition(this) == 4) {
                                            that.style.opacity = 0;
                                        }
                                    });
                                });
                                var text = self.GetTextOf(this);
                                text[0][0].textContent = self.HumanizeText(text[0][0].__data__.value);
                            });
                            break;
                        default:
                            break;
                    };
                    dotted.forEach(function (t) {
                        while (t.indexOf(' ') != -1) {
                            t = t.replace(' ', '-');
                        }
                        d3.selectAll('.c3-target-' + t)
                            .style("stroke-dasharray", "15 10")
                    })
                }
            });
        }
    }

    self.Create = function () {
        self.PrepareData();
        self.BuildGraph();
    }

    self.Build = function () {
        var args = window.location.search.split('?')[1];
        var filename = args.split('&')[0].split('=')[1];
        self.Width = parseInt(args.split('&')[1].split('=')[1]);
        self.Height = parseInt(args.split('&')[2].split('=')[1]);
        self.LoadJSON(filename, function () {
            self.Create();
        });
    }

    return self;
});
