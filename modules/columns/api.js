var mongoose = require('mongoose');
var router = require('express').Router();
var _ = require('lodash');
var async = require('async');
var moment = require('moment');
var LIB = require(__base + 'lib/helpers/lib.js');
var HP = LIB.Permits;



var HeadersLoader = (new function() {
    var self = this;

    self.Load = function(done) {
        var HeadersTree = {};
        var Header = mongoose.model("header");
        Header.find().isactive().lean().sort({
            IndexHeader: 1
        }).exec(function(err, Headers) {
            var IndStr = {},
                Map = {};
            Headers.forEach(function(H) {
                IndStr[H.CodeHeader] = H.CodeParentHeader;
                Map[H.CodeHeader] = H;
            })
            var _children = function(CodeHeader) {
                var Res = [];
                for (var K in IndStr) {
                    if (IndStr[K] == CodeHeader) {
                        Res.push(K);
                    }
                }
                return Res;
            }
            var _build = function(CodeParentHeader, Link) {
                var chil = _children(CodeParentHeader);
                if (!chil.length) return;
                chil.forEach(function(Code) {
                    Link[Code] = {
                        model: "header",
                        code: Code,
                        text: Map[Code].NameHeader + "." + Code,
                        type: (_.isEmpty(_children(Code))) ? 'item' : 'folder',
                        additionalParameters: {
                            children: {}
                        }
                    }
                    _build(Code, Link[Code].additionalParameters.children);
                })
            }
            var roots = _.filter(Headers, {
                CodeParentHeader: ""
            });
            roots.forEach(function(r) {
                HeadersTree[r.CodeHeader] = {
                    model: "header",
                    code: r.CodeHeader,
                    text: Map[r.CodeHeader].NameHeader + "." + r.CodeHeader,
                    type: (_.isEmpty(_children(r.CodeHeader))) ? 'item' : 'folder',
                    additionalParameters: {
                        children: {}
                    }
                }
                _build(r.CodeHeader, HeadersTree[r.CodeHeader].additionalParameters.children);
            })
            return done(null, HeadersTree);
        })
    }


    return self;
})

router.get('/colsetcol', LIB.Require(['CodeColset']), HP.TaskAccess("IsColsetEditor"), function(req, res, next) {
    var CodeColset = req.query.CodeColset;
    mongoose.model("colsetcol").find({
        CodeColset: CodeColset
    }).sort({
        IndexColsetCol: 1
    }).isactive().lean().exec(function(err, CP) {
        return res.json(CP);
    })
})


router.put('/colsetcol', HP.TaskAccess("IsColsetEditor"), function(req, res, next) {
    var ModelSaver = require(__base + "src/modeledit.js");
    var M = new ModelSaver(req.user.CodeUser);
    M.SetModel("colset", {
        CodeColset: req.body.CodeColset
    }, function(err) {
        M.SaveLinks("colsetcol", req.body.Cols, function(err) {
            return res.json({});
        })
    })
})

router.get('/headers', HP.TaskAccess("IsHeaderEditor"), function(req, res, next) {
    var CodeHeader = req.query.CodeHeader;
    mongoose.model("header").find({
        CodeParentHeader: CodeHeader
    }).sort({
        IndexHeader: 1
    }).isactive().exec(function(err, CP) {
        return res.json(CP);
    })
})

router.get('/headerstree', HP.TaskAccess("IsHeaderEditor"), function(req, res, next) {
    HeadersLoader.Load(function(err, R) {
        return res.json(R);
    })
})


router.put('/headers', HP.TaskAccess("IsHeaderEditor"), function(req, res, next) {
    var ModelSaver = require(__base + "src/modeledit.js");
    var M = new ModelSaver(req.user.CodeUser);
    var Headers = req.body.Headers;
    M.Modify("header", {
        CodeParentHeader: req.body.CodeHeader
    }, Headers, function(err) {
        return res.json({});
    });
})






module.exports = router;
