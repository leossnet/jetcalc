var mongoose = require('mongoose');
var router = require('express').Router();
var _ = require('lodash');
var async = require('async');
var lib = require(__base + 'lib/helpers/lib.js');

var RabbitManager = require(__base + '/src/rabbitmq.js');
var Calculator = require(__base + '/classes/calculator/AssoiCalculator.js');
var Structure = require(__base + "classes/calculator/helpers/Structure.js");

var PhantomJSHelper = require(__base + 'modules/presentation/phantom/phantom-helper.js');

router.get('/reporthtml', function (req, res, next) {
    var params = _.merge(req.query, {
        CodeUser: req.user.CodeUser
    })
    return PhantomJSHelper.buildTable(params, function (err, data, rstream) {
        if (err) {
            return next(err);
        } else {
            if (!rstream) {
                return res.json({
                    html: data
                });
            } else {
                var fsrs = rstream;
                var content = '';
                fsrs.on('data', function (chunk) {
                    content += chunk.toString();
                })
                fsrs.on('end', function () {
                    return res.json({
                        html: content
                    });
                })
            }
        }
    })
});

module.exports = router;
