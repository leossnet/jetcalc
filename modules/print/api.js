var mongoose   = require('mongoose');
var router     = require('express').Router();
var _          = require('lodash');
var async      = require('async');
var socket     = require(__base+'/src/socket.js');
var moment     = require('moment');
var RabbitMQClient = require(__base + "src/rabbitmq_wc.js").client;

var config = require(__base+"config.js");
var rabbitPrefix = config.rabbitPrefix;

var PDFGenerate = new RabbitMQClient({
    queue_id: rabbitPrefix+"pdf_generator"
})

PDFGenerate.connect(function(err) {
    if (err) console.log(err);
})

router.post("/html2pdf", function(req, res) {
    PDFGenerate.sendMessage(
        req.body,
        function(err, result) {
            if(err) {
                return res.json({ err: err });
            }
            var file_path = result.file_path;
            res.setHeader("Content-Type", "application/octet-stream");
            res.setHeader("Content-Disposition", 'attachment; filename="report.pdf"');
            res.sendFile(file_path);
        }
    )
})


module.exports = router