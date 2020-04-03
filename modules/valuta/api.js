var mongoose = require('mongoose');
var router = require('express').Router();
var _ = require('lodash');
var async = require('async');
var moment = require('moment');
var LIB = require(__base + 'lib/helpers/lib.js');
var HP = LIB.Permits;


var ValutaRateFormulaEvaluator = (new function () {
    var self = this;

    self.regexp = /.P([0-9])+/g;

    self._evaluateValue = function (periods, formula, field, CodeValuta, Year, done) {
        var replaceToValue = function (codePeriod, period, done) {
            mongoose.model("period")
                .findOne({
                    CodePeriod: codePeriod
                })
                .isactive()
                .lean()
                .exec(function (e, p) {
                    if (!p.IsReportPeriod) {
                        formula = formula.replace(period, '0');
                        done();
                    } else {
                        mongoose.model("valutarate")
                            .findOne({
                                CodeValuta: CodeValuta,
                                Year: Year,
                                CodePeriod: codePeriod
                            })
                            .isactive()
                            .lean()
                            .exec(function (e, vr) {
                                if (vr) {
                                    var value = vr[field];
                                    formula = formula.replace(period, (1 / value).toString());
                                } else {
                                    formula = formula.replace(period, '0');
                                }
                                done();
                            });
                    }
                });
        }
        var works = periods.length;
        async.each(periods, function (period) {
            var codePeriod = period.substr(2);
            replaceToValue(codePeriod, period, function () {
                works -= 1;
                if (works == 0) {
                    try {
                        var value = eval(formula);
                        if (value != 0) {
                            value = 1 / value;
                        }
                    } catch (e) {
                        var value = 0;
                    }
                    done(value);
                }
            });
        })
    }

    self.evaluate = function (formula, CodeValuta, Year, force, done) {
        if (!force) {
            return done(0, 0);
        }
        if (!formula) {
            return done(0, 0);
        }
        var periods = formula.match(self.regexp);
        var val1_calculated = false;
        var val1 = 0;
        self._evaluateValue(periods, formula, 'Value1', CodeValuta, Year, function (res) {
            val1_calculated = true;
            val1 = res;
        });
        var val2_calculated = false;
        var val2 = 0;
        self._evaluateValue(periods, formula, 'Value2', CodeValuta, Year, function (res) {
            val2_calculated = true;
            val2 = res;
        });
        var checkEnd = function () {;
            if (val1_calculated && val2_calculated) {
                done(val1, val2);
            } else {
                setTimeout(checkEnd, 200);
            }
        }
        setTimeout(checkEnd, 200);
    }

    return self;
});

var ValutaHelper = (new function () {
    var self = this;

    self.Periods = function (done) {
        mongoose.model("period")
            .find({
                IsFormula: false
            })
            .isactive()
            .sort({
                IsFormula: -1,
                MCount: 1,
                BeginDate: 1
            })
            .lean()
            .exec(done);
    }

    self.ValutaRates = function (CodeValuta, Year, done) {
        mongoose.model("valutarate")
            .find({
                CodeValuta: CodeValuta,
                Year: Year
            })
            .isactive()
            .lean()
            .exec(done);
    }

    self.Valutas = function (done) {
        mongoose.model("valuta")
            .find({
                $or: [{
                    IsReportValuta: 1
                }, {
                    IsReportValuta1: 1
                }, {
                    IsReportValuta2: 1
                }]
            })
            .isactive()
            .lean()
            .exec(done);
    }

    self.BuildTable = function (CodeValuta, Year, mode, force, done) {
        var Table = [];
        self.Periods(function (err, Periods) {
            self.ValutaRates(CodeValuta, Year, function (err, Rates) {
                var Indexed = {};
                Rates.forEach(function (R) {
                    Indexed[R.CodePeriod] = R;
                })
                self.Valutas(function (err, Valutas) {
                    var Rv1 = _.find(Valutas, {
                        IsReportValuta: true
                    }).CodeValuta;
                    var Rv2 = _.find(Valutas, {
                        IsReportValuta1: true
                    }).CodeValuta;
                    var Rv3 = _.find(Valutas, {
                        IsReportValuta2: true
                    }).CodeValuta;
                    var works = Periods.length;
                    async.each(
                        Periods,
                        function (Period) {
                            var CodePeriod = Period.CodePeriod;
                            var exist = (typeof Indexed[CodePeriod] != 'undefined');
                            ValutaRateFormulaEvaluator.evaluate(Period.ValutaRateFormula, CodeValuta, Year, (!exist || force), function (val1, val2) {
                                var Current = {
                                    Value: 1,
                                    Value1: val1 == 0 ? (Indexed[CodePeriod] ? Indexed[CodePeriod].Value1 : 0) : val1,
                                    Value2: val2 == 0 ? (Indexed[CodePeriod] ? Indexed[CodePeriod].Value2 : 0) : val2,
                                };
                                if ((mode == 'ValutaRates' && Period.IsReportPeriod) || (mode == 'ValutaRatesFormulas' && !Period.IsReportPeriod && (Current.Value1 != 0 || Current.Value2 != 0))) {
                                    Table.push({
                                        CodeValutaRate: [CodeValuta, Rv1, Rv2, Rv3, Year, CodePeriod].join("_"),
                                        CodeReportValuta: Rv1,
                                        CodeReportValuta1: Rv2,
                                        CodeReportValuta2: Rv3,
                                        CodeValuta: CodeValuta,
                                        CodePeriod: CodePeriod,
                                        Value: Current.Value,
                                        Value1: Current.Value1,
                                        Value2: Current.Value2,
                                        Year: Year,
                                    })
                                }
                                works -= 1;
                            })
                        }
                    )
                    var checkEnd = function () {
                        if (works == 0) {
                            return done(null, Table);
                        } else {
                            setTimeout(checkEnd, 200);
                        }
                    }
                    checkEnd();
                })
            })
        })
    }

    self.Update = function (CodeUser, CodeValuta, Year, Rates, done) {
        var Model = mongoose.model("valutarate");
        self.Valutas(function (err, Valutas) {
            var Rv1 = _.find(Valutas, {
                IsReportValuta: true
            }).CodeValuta;
            var Rv2 = _.find(Valutas, {
                IsReportValuta1: true
            }).CodeValuta;
            var Rv3 = _.find(Valutas, {
                IsReportValuta2: true
            }).CodeValuta;
            Model.find({
                CodeValutaRate: {
                    $in: _.map(Rates, "CodeValutaRate")
                }
            }).isactive().exec(function (err, Existed) {
                var Indexed = {};
                Existed.forEach(function (E) {
                    Indexed[E.CodeValutaRate] = E;
                });
                var ToSave = [];
                Rates.forEach(function (R) {
                    var ObjectToSave = Indexed[R.CodeValutaRate] || new Model(R);
                    ObjectToSave.CodeValuta = CodeValuta;
                    ObjectToSave.Year = Year;
                    ObjectToSave.CodeReportValuta = Rv1;
                    ObjectToSave.CodeReportValuta1 = Rv2;
                    ObjectToSave.CodeReportValuta2 = Rv3;
                    ObjectToSave.Value = R.Value;
                    ObjectToSave.Value1 = R.Value1;
                    ObjectToSave.Value2 = R.Value2;
                    ObjectToSave.CodePeriod = R.CodePeriod;
                    if (ObjectToSave.isModified()) ToSave.push(ObjectToSave);
                })
                if (_.isEmpty(ToSave)) return done();
                self._update(ToSave, CodeUser, done);
            })
        })
    }

    self._update = function (Arr, CodeUser, done) {
        async.each(Arr, function (T, cb) {
            T.userSave(CodeUser, cb);
        }, function (err) {
            if (err) return done(err);
            self._toDb(Arr, CodeUser, done);
        });
    }

    self._toDb = function (Arr, CodeUser, done) {
        var sql = require(__base + "sql/db.js");
        sql.SetValutaRates(_.map(Arr, function (El) {
            return _.merge(_.pick(El, ["CodeValutaRate", "CodeValuta", "CodeReportValuta", "CodeReportValuta1", "CodeReportValuta2", "Year", "CodePeriod", "Value", "Value1", "Value2"]), {
                CodeUser: CodeUser
            });
        }), done)
    }


    return self;
})


var SyncHelper = (new function () {
    var self = this;

    self.baseUrl = "http://www.cbr.ru/scripts/XML_daily.asp?date_req=";
    self.request = require("request");
    self.parserXml = require('xml2js').parseString;

    self.round = function (V) {
    	var dig = 10, r = Math.pow(dig,dig);
        return Math.round(V * r) / r;
    }

    self.Calculate = function (Date, Valuta, R, R1, R2) {
        var Map = {};
        [Valuta, R, R1, R2].forEach(function (V) {
            if (V.CBRCode) Map[V.CBRCode] = V.CodeValuta;
        })
        return function (done) {
            self.request.get(self.baseUrl + Date, function (err, data) {
                var Data = {},
                    Result = {},
                    ReturnResult = {};
                self.parserXml(data.body, function (err, js) {
                    Result[R.CodeValuta] = 1;
                    var Mult = 0;
                    var badRes = false;
                    try {
                        badRes = parseInt(js.ValCurs["$"].Date.split('.')[1]) != parseInt(Date.split('/')[1]);
                    } catch (e) {}
                    if (badRes) {
                        Result[R1.CodeValuta] = 0;
                        Result[R2.CodeValuta] = 0;
                        if (R.CodeValuta == Valuta.CodeValuta) Mult = 1;
                    } else if (!js.ValCurs.Valute) {
                        Result[R1.CodeValuta] = 0;
                        Result[R2.CodeValuta] = 0;
                        if (R.CodeValuta == Valuta.CodeValuta) Mult = 1;
                    } else {
                        try {
                            _.map(js.ValCurs.Valute, function (V) {
                                Data[V["$"].ID] = Number(_.first(V.Value).replace(",", ".")) / Number(_.first(V.Nominal));
                            })
                        } catch (e) {}
                        _.keys(Map).forEach(function (ID) {
                            Result[Map[ID]] = self.round(1 / Data[ID]);
                        })
                        Mult = (1 / Result[Valuta.CodeValuta]);
                    }
                    var ReturnResult = {
                        Value: self.round(Result[R.CodeValuta] * Mult),
                        Value1: self.round(Result[R1.CodeValuta] * Mult),
                        Value2: self.round(Result[R2.CodeValuta] * Mult)
                    }
                    return done(null, ReturnResult);
                });
            })
        }
    }

    self.Load = function (Year, Valuta, done) {
        ValutaHelper.Periods(function (err, Periods) {
            var Dates = _.map(Periods, function (P) {
                return {
                    CodePeriod: P.CodePeriod,
                    Date: (P.EndDateText + '-' + Year).replace(/-/g, "/")
                };
            });
            ValutaHelper.Valutas(function (err, ReportValutas) {
                var RV = _.find(ReportValutas, {
                    IsReportValuta: true
                });
                var RV1 = _.find(ReportValutas, {
                    IsReportValuta1: true
                });
                var RV2 = _.find(ReportValutas, {
                    IsReportValuta2: true
                });
                var Tasks = {};
                Dates.forEach(function (Date) {
                    Tasks[Date.CodePeriod] = self.Calculate(Date.Date, Valuta, RV, RV1, RV2);
                })
                async.parallel(Tasks, done);
            })
        })
    }

    self.Get = function (Year, CodeValuta, done) {
        mongoose.model("valuta").findOne({
            CodeValuta: CodeValuta
        }).isactive().lean().exec(function (err, V) {
            self.Load(Year, V, done);
        })
    }


    return self;
})



router.get('/valutarates', LIB.Require(['Year', 'CodeValuta']), HP.TaskAccess("IsValutaRateOperator"), function (req, res, next) {
    ValutaHelper.BuildTable(req.query.CodeValuta, parseInt(req.query.Year), req.query.Mode, req.query.force, function (err, Table) {
        return res.json(Table);
    });
})

router.put('/valutarates', LIB.Require(['Year', 'CodeValuta']), HP.TaskAccess("IsValutaRateOperator"), function (req, res, next) {
    ValutaHelper.Update(req.user.CodeUser, req.body.CodeValuta, parseInt(req.body.Year), req.body.Rates, function (err) {
        return res.json({});
    });
})

router.get('/valuta', function (req, res, next) {
    mongoose.model("valuta").find({
        IsNone: false
    }).isactive().lean().exec(function (err, List) {
        return res.json(List);
    });
})

router.post('/synccbrf', LIB.Require(['Year', 'CodeValuta']), HP.TaskAccess("IsValutaRateOperator"), function (req, res, next) {
    SyncHelper.Get(req.body.Year, req.body.CodeValuta, function (err, data) {
        if (err) return next(err);
        return res.json(data);
    });
})

module.exports = router;
