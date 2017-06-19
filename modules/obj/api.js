var mongoose   = require('mongoose');
var router     = require('express').Router();
var _          = require('lodash');
var async      = require('async');
var moment      = require('moment');
var HP = require(__base+'lib/helpers/lib.js').Permits; 



router.get('/orgs', function(req, res, next){
	return res.json([]);
})  




module.exports = router;