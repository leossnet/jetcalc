var mongoose   = require('mongoose');
var router     = require('express').Router();
var _          = require('lodash');
var async      = require('async');
var lib        = require(__base+'lib/helpers/lib.js');

var RabbitManager = require(__base+'/src/rabbitmq.js');
var Calculator = require(__base+'/classes/calculator/AssoiCalculator.js');
var Structure = require(__base+"classes/calculator/helpers/Structure.js");



module.exports = router;