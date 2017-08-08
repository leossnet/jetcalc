var mongoose = require("mongoose");
var async = require("async");
var _ = require("lodash");
var SocketManager = require(__base + "src/socket.js");
var router = require("express").Router();
var LIB = require(__base + 'lib/helpers/lib.js');
var HP = LIB.Permits;


var ExtractorHelper = (new function () {
    var self = this;

    self.extractedModel = [];

    self.used_ids = {};

    self.getObjByQuery = function (model, query, done) {
        try {
            var Query = mongoose.model(model).findOne(query);
        } catch (e) {
            return done('error')
        }
        Query.exec(function (err, obj) {
            if (!obj) {
                return done('объект не найден')
            } else {
                return done(null, obj);
            }
        })
    };

    self.extractModel = function (model, query) {
        var fs = require("fs");
        fs.writeFile(__dirname + "/settings.json", JSON.stringify(self.extractedModel, null, "\t"), function (err) {});
        self.used_ids = [];
        self.extractedModel = [];
        self._extractModel({
            model: model,
            query: query,
            depth: 1,
            done: function () {}
        })
    }

    self._extractModel = function (el) {
        if (el.depth > 20) {
            return;
        }
        if (!self.used_ids[el.model.toLowerCase()]) {
            self.used_ids[el.model.toLowerCase()] = [];
        }
        self.getObjByQuery(el.model, el.query, function (err, obj) {
            if (!obj || obj.err) {
                return;
            }
            if (self.used_ids[el.model.toLowerCase()].indexOf(obj._id.toString()) != -1) {
                return;
            }
            self.used_ids[el.model.toLowerCase()].push(obj._id.toString());
            var objects_for_extract = [];
            _.keys(obj._doc).forEach(function (k) {
                if (k.startsWith("Code")) {
                    var model = k.substr(4).toLowerCase();
                    var query = {};
                    query[k] = obj[k];
                    objects_for_extract.push({
                        model: model,
                        query: query,
                        done: function () {},
                        depth: el.depth + 1,
                    })
                }
                if (k.startsWith("Link_")) {
                    if (obj[k]) {
                        obj[k].forEach(function (lk) {
                            var model = k.substr(5).toLowerCase();
                            var query = {
                                _id: lk
                            };
                            objects_for_extract.push({
                                model: model,
                                query: query,
                                done: function () {},
                                depth: el.depth + 1,
                            })
                        })
                    }
                }
            })
            var extracted = {};
            extracted[el.model] = obj;
            self.extractedModel.push(extracted);
            console.log('Extracted objects: ', self.extractedModel.length)
            async.each(objects_for_extract, self._extractModel, el.done)
        })
    }

    return self;
});

router.post('/search', function (req, res, next) {
    var model = req.body['model'];
    var query = req.body['query'];
    return ExtractorHelper.getObjByQuery(model, query,
        function (err, ret) {
            if (!err) {
                return res.json(ret);
            }
            next(err);
        });
});

router.get('/extract', function (req, res, next) {
    model = req.query.model;
    query = req.query.query;
    return ExtractorHelper.extractModel(model, query);
    return res.json({});
})

module.exports = router;
