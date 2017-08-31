var _ = require('lodash');
var async = require('async');
var router   = require('express').Router();
var mongoose   = require('mongoose');
var LIB        = require(__base+'lib/helpers/lib.js');
var HP = LIB.Permits; 
var Data = require(__base+"modules/predict/lib.js");

router.get('/ask', LIB.Require(["Year","Period"]),function(req,res){
	Data.do(function(err,Answer){
		return res.json(Answer);
	})
})




module.exports = router;