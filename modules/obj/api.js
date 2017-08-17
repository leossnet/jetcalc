var mongoose   = require('mongoose');
var router     = require('express').Router();
var _          = require('lodash');
var async      = require('async');
var moment      = require('moment');
var HP = require(__base+'lib/helpers/lib.js').Permits; 
var Bus = require(__base + 'src/bus.js');


router.get('/refresh', function(req, res, next){
	Bus.Emit("DIVCHANGE");
	return res.end();
})

router.get('/orgs', function(req, res, next){
	return res.json([]);
})  




module.exports = router;