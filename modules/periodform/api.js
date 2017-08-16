var mongoose = require('mongoose');
var router = require('express').Router();
var _ = require('lodash');
var async = require('async');
var moment = require('moment');
var LIB = require(__base + 'lib/helpers/lib.js');
var HP = LIB.Permits;


router.get('/periodconnect', function (req, res, next) {
    var Answer = {
        MainPeriods: [],
        LinkPeriods: []
    };
    mongoose.model("period").find({
        IsReportPeriod: true
    }, "-_id CodePeriod NamePeriod").sort({
        MCount: 1,
        BeginDate: 1
    }).isactive().exec(function (err, Main) {
        Answer.MainPeriods = Main;
        var query = {}
        query[req.body.indexfieldname] = 1;
        mongoose.model(req.body.model).find({}).sort(query).lean().isactive().exec(function (err, Ps) {
            Answer.LinkPeriods = Ps;
            return res.json(Answer);
        })
    })
})

router.put('/periodconnect', function (req, res, next) {
    var ModelSaver = require(__base + 'src/modeledit.js'),
        CodeUser = req.user.CodeUser;
    var Data = JSON.parse(req.body.JSON);
    if (_.isEmpty(Data)) return res.json({});
    var Tasks = [];
    for (var CodePeriod in Data.data) {
        Tasks.push(function (Code, Links) {
            return function (cb) {
                var MS = new ModelSaver(CodeUser);
                MS.SetModel("period", {
                    CodePeriod: Code
                }, function () {
                    MS.SaveLinks(Data.model, Links, cb);
                })
            }
        }(CodePeriod, Data.data[CodePeriod]));
    }
    async.parallel(Tasks, function (err) {
        if (err) return next(err);
        MapPeriods.Result = null;
        return res.json({});
    })
})

module.exports = router;
