var mongoose = require('mongoose');
var dbsync      = require('../../lib/dbsync.js');
var router   = require('express').Router();
var _        = require('lodash');
var moment   = require('moment');
var api      = require('../../lib/helper.js');


router.get ('/api/resyncmssql',  api.forceCheckRole(['IsAdmin']), function(req,res){
	dbsync.resync(req,function(pId){
		return res.json({progressbar:pId});
	});
});

module.exports.router = router;

