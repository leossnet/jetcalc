var mongoose = require("mongoose");
var async = require("async");
var _ = require("lodash");
var SocketManager = require(__base + "src/socket.js");
var router = require("express").Router();

router.get('/clientsettings', function (req, res, next) {
    res.sendFile(__dirname + "/settings.json");
})

router.post('/clientsettings', function (req, res, next) {
    var Config = require(__dirname + "/settings.json");
    var Update = req.body;
    var fs = require("fs");
    fs.writeFile(__dirname + "/settings.json", JSON.stringify(_.merge(Config, Update), null, "\t"), function (err) {
        if (err) return next(err);
        return res.json({});
    });
})

module.exports = router;
