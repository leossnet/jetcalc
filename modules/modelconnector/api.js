var mongoose = require('mongoose');
var router = require('express').Router();
var _ = require('lodash');
var async = require('async');
var moment = require('moment');
var LIB = require(__base + 'lib/helpers/lib.js');
var HP = LIB.Permits;


router.get('/connect', function (req, res, next) {
    var Answer = {
        MainModels: [],
        LinkModels: []
    };
    mongoose.model(req.body.source_model).find(req.body.get_query, req.body.get_fields).sort(req.body.get_sort).isactive().exec(function (err, Main) {
        Answer.MainModels = Main;
        var query = {}
        query[req.body.indexfieldname] = 1;
        mongoose.model(req.body.model).find({}).sort(query).lean().isactive().exec(function (err, Ps) {
            Answer.LinkModels = Ps;
            return res.json(Answer);
        })
    })
})

router.put('/connect', function (req, res, next) {
    var ModelSaver = require(__base + 'src/modeledit.js'),
        CodeUser = req.user.CodeUser;
    var Data = JSON.parse(req.body.JSON);
    if (_.isEmpty(Data)) return res.json({});
    var Tasks = [];
    for (var Code in Data.data) {
        Tasks.push(function (Code2, Links) {
            return function (cb) {
                var MS = new ModelSaver(CodeUser);
                var Q = {}
                Q[req.body.code_source_model] = Code2;
                MS.SetModel(req.body.source_model, Q, function () {
                    MS.SaveLinks(Data.target_model, Links, cb);
                })
            }
        }(Code, Data.data[Code]));
    }
    async.parallel(Tasks, function (err) {
        if (err) return next(err);
        return res.json({});
    })
})

module.exports = router;
