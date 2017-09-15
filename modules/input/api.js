var mongoose   = require('mongoose');
var router     = require('express').Router();
var _          = require('lodash');
var async      = require('async');
var lib        = require(__base+'lib/helpers/lib.js');

var RabbitManager = require(__base+'/src/rabbitmq.js');
var Calculator = require(__base+'/classes/calculator/Calculator.js');




module.exports = router;