var RadarChart = {
    draw: function (id, d, options) {
        var cfg = {
            radius: 5,
            w: 500,
            h: 500,
            factor: 1,
            factorLegend: .85,
            levels: 0,
            maxValue: 0,
            minValue: 0,
            radians: 2 * Math.PI,
            opacityArea: 0.2,
            ToRight: 5,
            TranslateX: 80,
            TranslateY: 30,
            ExtraWidthX: 300,
            ExtraWidthY: 100,
            interaction: true,
            color: function (i) {
                return "red"
            },
            showValues: false,
            drawNull: true,
            LegendPosition: 'none',
            LegendOptions: [],
        };
        if ('undefined' !== typeof options) {
            for (var i in options) {
                if ('undefined' !== typeof options[i]) {
                    cfg[i] = options[i];
                }
            }
        }
        d = this.prepareData(d, cfg);
        cfg.maxValue = Math.max(cfg.maxValue - cfg.minValue, d3.max(d, function (i) {
            return d3.max(i.map(function (o) {
                return o.value - cfg.minValue;
            }))
        }));
        var allAxis = (d[0].map(function (i, j) {
            return i.axis
        }));
        var total = allAxis.length;
        var radius = cfg.factor * Math.min(cfg.w / 2, cfg.h / 2);
        var Format = d3.format('.0f');
        d3.select(id).select("svg").remove();

        var g = d3.select(id)
            .append("svg")
            .attr("width", cfg.w + cfg.ExtraWidthX)
            .attr("height", cfg.h + cfg.ExtraWidthY)
            .append("g")
            .attr("transform", "translate(" + cfg.TranslateX + "," + cfg.TranslateY + ")");

        for (var j = 0; j < cfg.levels - 1; j++) {
            var levelFactor = cfg.factor * radius * ((j + 1) / cfg.levels);
            g.selectAll(".levels")
                .data(allAxis)
                .enter()
                .append("svg:line")
                .attr("x1", function (d, i) {
                    return levelFactor * (1 - cfg.factor * Math.sin(i * cfg.radians / total));
                })
                .attr("y1", function (d, i) {
                    return levelFactor * (1 - cfg.factor * Math.cos(i * cfg.radians / total));
                })
                .attr("x2", function (d, i) {
                    return levelFactor * (1 - cfg.factor * Math.sin((i + 1) * cfg.radians / total));
                })
                .attr("y2", function (d, i) {
                    return levelFactor * (1 - cfg.factor * Math.cos((i + 1) * cfg.radians / total));
                })
                .attr("class", "line")
                .style("stroke", "grey")
                .style("stroke-width", "0.3px")
                .style("stroke-dasharray", "5")
                .attr("transform", "translate(" + (cfg.w / 2 - levelFactor) + ", " + (cfg.h / 2 - levelFactor) + ")");
        }

        for (var j = 0; j < cfg.levels; j++) {
            var levelFactor = cfg.factor * radius * ((j + 1) / cfg.levels);
            g.selectAll(".levels")
                .data([1])
                .enter()
                .append("svg:text")
                .attr("x", function (d) {
                    return levelFactor * (1 - cfg.factor * Math.sin(0));
                })
                .attr("y", function (d) {
                    return levelFactor * (1 - cfg.factor * Math.cos(0));
                })
                .attr("class", "legend")
                .style("font-size", "10px")
                .attr("transform", "translate(" + (cfg.w / 2 - levelFactor + cfg.ToRight) + ", " + (cfg.h / 2 - levelFactor) + ")")
                .attr("fill", "#737373")
                .text(Format((j + 1) * (cfg.maxValue) / cfg.levels + cfg.minValue));
        }

        series = 0;

        var axis = g.selectAll(".axis")
            .data(allAxis)
            .enter()
            .append("g")
            .attr("class", "axis");

        axis.append("line")
            .attr("x1", cfg.w / 2)
            .attr("y1", cfg.h / 2)
            .attr("x2", function (d, i) {
                return cfg.w / 2 * (1 - cfg.factor * Math.sin(i * cfg.radians / total));
            })
            .attr("y2", function (d, i) {
                return cfg.h / 2 * (1 - cfg.factor * Math.cos(i * cfg.radians / total));
            })
            .attr("class", "line")
            .style("stroke", "grey")
            .style("stroke-width", "1px");

        axis.append("text")
            .attr("class", "legend")
            .text(function (d) {
                return d
            })
            .style("font-family", "sans-serif")
            .style('font-weight', 'bold')
            .style('font-size', '14px')
            .attr("text-anchor", "middle")
            .attr("dy", "1.5em")
            .attr("transform", function (d, i) {
                return "translate(0, -10)"
            })
            .attr("x", function (d, i) {
                return cfg.w / 2 * (1 - cfg.factorLegend * Math.sin(i * cfg.radians / total)) - 60 * Math.sin(i * cfg.radians / total);
            })
            .attr("y", function (d, i) {
                return cfg.h / 2 * (1 - Math.cos(i * cfg.radians / total)) - 20 * Math.cos(i * cfg.radians / total);
            });

        if (cfg.drawNull) {
            this.drawNull(d, cfg, g, total);
        }


        d.forEach(function (y, x) {
            dataValues = [];
            g.selectAll(".nodes")
                .data(y, function (j, i) {
                    dataValues.push([
			             cfg.w / 2 * (1 - (parseFloat(Math.max(j.value - cfg.minValue, 0)) / ((cfg.maxValue) == 0 ? 0.01 : cfg.maxValue)) * cfg.factor * Math.sin(i * cfg.radians / total)),
			             cfg.h / 2 * (1 - (parseFloat(Math.max(j.value - cfg.minValue, 0)) / ((cfg.maxValue) == 0 ? 0.01 : cfg.maxValue)) * cfg.factor * Math.cos(i * cfg.radians / total))
		              ]);
                });
            dataValues.push(dataValues[0]);
            g.selectAll(".area")
                .data([dataValues])
                .enter()
                .append("polygon")
                .attr("class", "radar-chart-serie" + series)
                .style("stroke-width", "2px")
                .style("stroke", cfg.color(series))
                .attr("points", function (d) {
                    var str = "";
                    for (var pti = 0; pti < d.length; pti++) {
                        str = str + d[pti][0] + "," + d[pti][1] + " ";
                    }
                    return str;
                })
                .style("fill", function (j, i) {
                    return cfg.color(series)
                })
                .style("fill-opacity", cfg.opacityArea)
                .on('mouseover', function (d) {
                    if (cfg.interaction) {
                        z = "polygon." + d3.select(this).attr("class");
                        g.selectAll("polygon")
                            .transition(200)
                            .style("fill-opacity", 0.1);
                        g.selectAll(z)
                            .transition(200)
                            .style("fill-opacity", .7);
                    }
                })
                .on('mouseout', function () {
                    if (cfg.interaction) {
                        g.selectAll("polygon")
                            .transition(200)
                            .style("fill-opacity", cfg.opacityArea);
                    }
                });
            series++;
        });
        series = 0;


        d.forEach(function (y, x) {
            g.selectAll(".nodes")
                .data(y).enter()
                .append("svg:circle")
                .attr("class", "radar-chart-serie" + series)
                .attr('r', cfg.radius)
                .attr("alt", function (j) {
                    return Math.max(j.value - cfg.minValue, 0)
                })
                .attr("cx", function (j, i) {
                    dataValues.push([
			             cfg.w / 2 * (1 - (parseFloat(Math.max(j.value - cfg.minValue, 0)) / cfg.maxValue) * cfg.factor * Math.sin(i * cfg.radians / total)),
			             cfg.h / 2 * (1 - (parseFloat(Math.max(j.value - cfg.minValue, 0)) / cfg.maxValue) * cfg.factor * Math.cos(i * cfg.radians / total))
		              ]);
                    var cx = cfg.w / 2 * (1 - (Math.max(j.value - cfg.minValue, 0) / cfg.maxValue) * cfg.factor * Math.sin(i * cfg.radians / total));
                    if (isNaN(cx)) {
                        return 1;
                    }
                    return cx;
                })
                .attr("cy", function (j, i) {
                    var cy = cfg.h / 2 * (1 - (Math.max(j.value - cfg.minValue, 0) / cfg.maxValue) * cfg.factor * Math.cos(i * cfg.radians / total));
                    if (isNaN(cy)) {
                        return 1;
                    }
                    return cy
                })
                .attr("data-id", function (j) {
                    return j.axis
                })
                .style("fill", cfg.color(series)).style("fill-opacity", .9)
                .on('mouseover', function (d) {
                    if (cfg.interaction) {
                        z = "polygon." + d3.select(this).attr("class");
                        g.selectAll("polygon")
                            .transition(200)
                            .style("fill-opacity", 0.1);
                        g.selectAll(z)
                            .transition(200)
                            .style("fill-opacity", .7);
                    }
                })
                .on('mouseout', function () {
                    if (cfg.interaction) {
                        g.selectAll("polygon")
                            .transition(200)
                            .style("fill-opacity", cfg.opacityArea);
                    }
                });
            if (cfg.showValues) {
                var checkIntersection = function (x1, y1, x2, y2) {
                    var top1 = y1;
                    var top2 = y2;
                    var bottom1 = y1 + 12;
                    var bottom2 = y2 + 12;
                    var left1 = x1;
                    var left2 = x2;
                    var right1 = x1 + 30;
                    var right2 = x2 + 30;
                    return !(left2 > right1 ||
                        right2 < left1 ||
                        top2 > bottom1 ||
                        bottom2 < top1);
                }
                var textsCorrection = function (x, y) {
                    textsa = g.selectAll('.value')
                    textsa.forEach(function (texts) {
                        texts.forEach(function (text) {
                            tx = $(text).attr('x');
                            ty = $(text).attr('y');
                            if (checkIntersection(x, y, tx, ty)) {
                                if (y >= ty) {
                                    y += 15;
                                } else {
                                    y -= 15;
                                }
                            }
                        })
                    })
                    return y;
                }
                g.selectAll(".nodes")
                    .data(y).enter()
                    .append('text')
                    .attr('x', function (j, i) {
                        dataValues.push([
                            cfg.w / 2 * (1 - (parseFloat(Math.max(j.value - cfg.minValue, 0)) / ((cfg.maxValue) == 0 ? 0.01 : cfg.maxValue)) * cfg.factor * Math.sin(i * cfg.radians / total)),
			                 cfg.h / 2 * (1 - (parseFloat(Math.max(j.value - cfg.minValue, 0)) / ((cfg.maxValue) == 0 ? 0.01 : cfg.maxValue)) * cfg.factor * Math.cos(i * cfg.radians / total))
                        ]);
                        var x = cfg.w / 2 * (1 - (Math.max(j.value - cfg.minValue, 0) / cfg.maxValue) * cfg.factor * Math.sin(i * cfg.radians / total));
                        return x;
                    })
                    .attr('y', function (j, i) {
                        var y = cfg.h / 2 * (1 - (Math.max(j.value - cfg.minValue, 0) / cfg.maxValue) * cfg.factor * Math.cos(i * cfg.radians / total)) + 5;
                        dataValues.push([
                            cfg.w / 2 * (1 - (parseFloat(Math.max(j.value - cfg.minValue, 0)) / ((cfg.maxValue) == 0 ? 0.01 : cfg.maxValue)) * cfg.factor * Math.sin(i * cfg.radians / total)),
			                 cfg.h / 2 * (1 - (parseFloat(Math.max(j.value - cfg.minValue, 0)) / ((cfg.maxValue) == 0 ? 0.01 : cfg.maxValue)) * cfg.factor * Math.cos(i * cfg.radians / total))
                        ]);
                        var x = cfg.w / 2 * (1 - (Math.max(j.value - cfg.minValue, 0) / cfg.maxValue) * cfg.factor * Math.sin(i * cfg.radians / total));
                        y = textsCorrection(x, y)
                        return y;
                    })
                    .attr('class', 'value')
                    .text(function (j) {
                        return j.value
                    })
                    .style('font-weight', 'bold')
                    .style('font-size', '14px')
            }

            series++;
        });
        this.drawLegend(id, cfg);
    },
    drawNull: function (d, cfg, g, total) {
        zerod = [];
        d[0].forEach(function (x) {
            zerod.push({
                axis: x.axis,
                value: 0
            })
        })
        zerod = [zerod];
        zerod.forEach(function (y, x) {
            dataValues = [];
            g.selectAll(".nodes")
                .data(y, function (j, i) {
                    dataValues.push([
                        cfg.w / 2 * (1 - (parseFloat(Math.max(j.value - cfg.minValue, 0)) / ((cfg.maxValue) == 0 ? 0.01 : cfg.maxValue)) * cfg.factor * Math.sin(i * cfg.radians / total)),
                        cfg.h / 2 * (1 - (parseFloat(Math.max(j.value - cfg.minValue, 0)) / ((cfg.maxValue) == 0 ? 0.01 : cfg.maxValue)) * cfg.factor * Math.cos(i * cfg.radians / total))
                    ]);
                });
            dataValues.push(dataValues[0]);
            g.selectAll(".area")
                .data([dataValues])
                .enter()
                .append("polygon")
                .attr("class", "radar-chart-serie1")
                .style("stroke-width", "2px")
                .style("stroke", "orange")
                .attr("points", function (d) {
                    var str = "";
                    for (var pti = 0; pti < d.length; pti++) {
                        str = str + d[pti][0] + "," + d[pti][1] + " ";
                    }
                    return str;
                })
                .style("fill", "white")
                .style("fill-opacity", 0)
        })
    },
    drawLegend: function (id, cfg) {
        if (cfg.LegendPosition != 'none' && cfg.LegendOptions.length != 0) {
            var maxOption = d3.max(cfg.LegendOptions.map(function (e) {
                return e.length
            })) * 10;

            var calcX = function (d, i) {
                return 0
            };
            var calcY = function (d, i) {
                return 0
            };
            if (cfg.LegendPosition == 'inset') {
                calcX = function (d, i) {
                    return 5
                };
                calcY = function (d, i) {
                    return i * 20 + 5
                };
            }
            if (cfg.LegendPosition == 'right') {
                calcX = function (d, i) {
                    return cfg.w + 50;
                };
                calcY = function (d, i) {
                    return i * 20 + 100;
                };
            }
            if (cfg.LegendPosition == 'bottom') {
                calcX = function (d, i) {
                    return (i * (maxOption + 5) + 10) % (cfg.w - 50);
                };
                calcY = function (d, i) {
                    return 50 + cfg.h + 20 * parseInt(i / Math.floor(cfg.w / (maxOption + 5)));
                };
            }
            var svg = d3.select(id)
                .selectAll('svg')
                .append('svg')
                .attr("width", cfg.w + cfg.ExtraWidthX)
                .attr("height", cfg.h + cfg.ExtraWidthY)
            var legend = svg.append("g")
                .attr("class", "legend")
                .attr('transform', 'translate(90,20)')
            legend.selectAll('rect')
                .data(cfg.LegendOptions)
                .enter()
                .append("rect")
                .attr("x", function (d, i) {
                    return calcX(d, i)
                })
                .attr("y", function (d, i) {
                    return calcY(d, i)
                })
                .attr("width", 10)
                .attr("height", 10)
                .style("fill", function (d, i) {
                    return cfg.color(i)
                })
            if (cfg.LegendPosition == 'inset') {
                legend.append('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', maxOption + 15)
                    .attr('height', cfg.LegendOptions.length * 20)
                    .style('fill', 'transparent')
                    .style('stroke', '#d3d3d3')
                    .style('stroke-width', '1px')
            }
            legend.selectAll('text')
                .data(cfg.LegendOptions)
                .enter()
                .append("text")
                .attr("x", function (d, i) {
                    return calcX(d, i) + 20
                })
                .attr("y", function (d, i) {
                    return calcY(d, i) + 10
                })
                .attr("fill", "#737373")
                .style("font-size", "12px")
                .text(function (d) {
                    return d;
                })
        }
    },
    prepareData: function (BarsData, cfg) {
        var RadarData = [];
        var LegendOptions = [];
        BarsData.forEach(function (o, i) {
            var data = [];
            Object.keys(o).forEach(function (k) {
                if (k != 'name') {
                    data.push({
                        axis: k,
                        value: o[k],
                    })
                } else {
                    LegendOptions.push(o[k]);
                }
            })
            RadarData.push(data);
        })
        cfg.LegendOptions = LegendOptions;
        return RadarData;
    }
}
try {
    define(RadarChart)
} catch (e) {}
