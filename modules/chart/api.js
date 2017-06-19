var mongoose = require('mongoose');
var router = require('express').Router();
var _ = require('lodash');
var async = require('async');
var socket = require(__base + '/src/socket.js');
var api = require(__base + '/lib/helper.js');
var PhantomJSHelper = require(__base + 'modules/presentation/phantom/phantom-helper.js');
var fs = require('fs');


module.exports = router;

var ChartDBHelper = (new function () {
    var self = this;

    self.getRowChartLine = function (CodeRowChartLine, done) {
        var Query = mongoose.model('rowchartline').findOne({
            CodeRowChartLine: CodeRowChartLine
        });
        Query.exec(function (err, RowChartLine) {
            if (!RowChartLine) {
                return done('Настройка графика ' + CodeRowChartLine + ' не найдена!');
            } else {
                return done(null, RowChartLine);
            }
        });
    };

    self.getRowChartLines = function (CodeDoc, done) {
        var Query = mongoose.model('rowchartline').find({
            CodeDoc: CodeDoc
        });
        Query.exec(function (err, RowChartLines) {
            if (!RowChartLines) {
                return done('Настройки графика документа ' + CodeDoc + ' не найдены!');
            } else {
                return done(null, RowChartLines);
            }
        });
    };

    self.getChart = function (CodeChart, done) {
        var Query = mongoose.model('chart').findOne({
            CodeChart: CodeChart
        });
        Query.exec(function (err, Chart) {
            if (!Chart) {
                return done('График ' + CodeChart + ' не найден!')
            } else {
                return done(null, Chart);
            }
        })
    };

    self.getChartByDoc = function (CodeDoc, done) {
        var Query = mongoose.model('chart').findOne({
            CodeDoc: CodeDoc
        });
        Query.exec(function (err, Chart) {
            if (!Chart) {
                return done('График документа ' + CodeDoc + ' не найден!')
            } else {
                return done(null, Chart);
            }
        })
    };

    self.setChart = function (Chart, CodeUser, done) {
        function getFlatStructure() {
            var rstruct = [];
            Chart.RowChartLines.forEach(function (RCL) {
                rstruct.push({
                    model: 'rowchartline',
                    data: RCL,
                    query: {
                        CodeDoc: RCL.CodeDoc,
                        CodeRow: RCL.CodeRow
                    }
                });
            })
            delete Chart.RowChartLines;
            rstruct.push({
                model: 'chart',
                data: Chart,
                query: {
                    CodeChart: Chart.CodeChart
                }
            })
            return rstruct;
        }
        fstruct = getFlatStructure(Chart);
        var saveFlatStructure = function (i) {
            if (i == fstruct.length) {
                done();
                return;
            }
            var obj2save = fstruct[i];
            var Q = mongoose.model(obj2save.model).findOne(obj2save.query);
            Q.exec(function (err, U) {
                if (!U) {
                    var M = mongoose.model(obj2save.model);
                    var Obj = new M(obj2save.data);
                    Obj.save(CodeUser, function () {
                        saveFlatStructure(i + 1)
                    });
                } else {
                    U.cfg().EditFields.forEach(function (field) {
                        if (U[field] != obj2save.data[field]) {
                            U[field] = obj2save.data[field];
                        }
                    })
                    U.save(CodeUser, function () {
                        saveFlatStructure(i + 1)
                    });
                }
            })
        }
        saveFlatStructure(0);
    };

    return self;
});

router.get('/chartbydoc/:CodeDoc', function (req, res, next) {
    return ChartDBHelper.getChartByDoc(req.params.CodeDoc, function (err, Chart) {
        if (err) {
            return next(err);
        } else {
            return res.json({
                Chart: Chart
            });
        }
    });
});

router.get('/chart/:CodeChart', function (req, res, next) {
    return ChartDBHelper.getChart(req.params.CodeChart, function (err, Chart) {
        if (err) {
            return next(err);
        } else {
            return res.json({
                Chart: Chart
            });
        }
    });
});

router.get('/rowchartlines/:CodeDoc', function (req, res, next) {
    return ChartDBHelper.getRowChartLines(req.params.CodeDoc, function (err, RowChartLines) {
        if (err) {
            return next(err);
        } else {
            return res.json({
                RowChartLines: RowChartLines
            });
        }
    });
});

router.get('/rowchartline/:CodeRowChartLine', function (req, res, next) {
    return ChartDBHelper.getRowChartLine(req.params.CodeRowChartLine, function (err, RowChartLine) {
        if (err) {
            return next(err);
        } else {
            return res.json({
                RowChartLine: RowChartLine
            });
        }
    });
});

router.put('/chart', function (req, res, next) {
    return ChartDBHelper.setChart(JSON.parse(req.body['chart']), req.user.CodeUser,
        function (err, ret) {
            return res.json({});
        });
});

router.get('/chartsvg', function (req, res, next) {
    var params = _.merge(req.query, {
        CodeUser: req.user.CodeUser
    })
    return PhantomJSHelper.buildSVG(params, function (err, svg) {
        if (err) {
            return next(err);
        } else {
            return res.json({
                svg: svg
            });
        }
    })
});

router.get('/chartpng', function (req, res, next) {
    var params = _.merge(req.query, {
        CodeUser: req.user.CodeUser
    })
    params.CodePresent = params.CodePresent.split('?')[0];
    return PhantomJSHelper.buildPNG(params, function (err, filename, rstream) {
        if (err) {
            return next(err);
        } else {
            res.setHeader('Content-disposition', 'inline; filename=' + filename);
            if (!rstream) {
                var fsrs = fs.createReadStream(/tmp/ + filename);
            } else {
                var fsrs = rstream;
            }
            fsrs.pipe(res);
            fsrs.on("close", function () {
                if (!rstream) {
                    fs.unlink('/tmp/' + filename);
                }
            })
        }
    })
});
