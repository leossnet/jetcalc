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
    mongoose.model(req.query.source_model).find(req.query.get_query, req.query.get_fields).sort(req.query.get_sort).isactive().exec(function (err, Main) {
        Answer.MainModels = Main;
        var query = {}
        if (req.query.indexfieldname) {
            query[req.query.indexfieldname] = 1;
        }
        mongoose.model(req.query.target_model).find({}).sort(query).lean().isactive().exec(function (err, Ps) {
            Answer.LinkModels = Ps;
            return res.json(Answer);
        })
    })
})

router.put('/connect', function (req, res, next) {
    var ModelSaver = require(__base + 'src/modeledit.js'),
        CodeUser = req.user.CodeUser;
    var Data = req.body.JSON;
    Data.data = JSON.parse(Data.data);
    if (_.isEmpty(Data)) return res.json({});
    var Tasks = [];
    for (var Code in Data.data) {
        Tasks.push(function (Code2, Links) {
            return function (cb) {
                var MS = new ModelSaver(CodeUser);
                var Q = {}
                Q[Data.code_source_model] = Code2;
                MS.SetModel(Data.source_model, Q, function () {
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
