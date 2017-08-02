var mongoose = require("mongoose");
var async = require("async");
var _ = require("lodash");
var SocketManager = require(__base + "src/socket.js");
var router = require("express").Router();
var LIB = require(__base + 'lib/helpers/lib.js');
var HP = LIB.Permits;

var ExtractorDBHelper = (new function () {
    var self = this;

    self.getObjByQuery = function (model, query, done) {
        var Query = mongoose.model(model).findOne(query);
        Query.exec(function (err, obj) {
            if (!obj) {
                return done('объект не найден')
            } else {
                return done(null, obj);
            }
        })
    };

    return self;
})

router.post('/search', function (req, res, next) {
    var model = req.body['model'];
    var query = req.body['query'];
    return ExtractorDBHelper.getObjByQuery(model, query,
        function (err, ret) {
            if (!err) {
                return res.json(ret);
            }
            next(err);
        });
});

module.exports = router;
