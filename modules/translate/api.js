var mongoose = require("mongoose");
var async = require("async");
var _ = require("lodash");
var SocketManager = require(__base + "src/socket.js");
var router = require("express").Router();
var LIB = require(__base + 'lib/helpers/lib.js');
var HP = LIB.Permits;

var XSSHelper = (new function(){
    var self = this;
  
    var xss = require('xss');
    
    self.filterJSON = function(json){
        _.keys(json).forEach(function(k){
            if(typeof json[k] === "object"){
                json[k] = self.filterJSON(json[k]);
            }
            else{
                json[k] = xss(json[k]);
            }
        })
        return json;
    }
    
    return self;
})

var FileName = __base + "/static/custom/translate.json";

router.get('/clientsettings', function (req, res, next) {
    res.sendFile(FileName);
})

router.post('/clientsettings', HP.TaskAccess("IsLangEditor"), function (req, res, next) {
    var Config = require(FileName);
    var Update = req.body;
    Update = XSSHelper.filterJSON(Update);
    var fs = require("fs");
    fs.writeFile(FileName, JSON.stringify(_.merge(Config, Update), null, "\t"), function (err) {
        if (err) return next(err);
        return res.json({});
    });
})

module.exports = router;
