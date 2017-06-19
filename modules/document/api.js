var mongoose   = require('mongoose');
var router     = require('express').Router();
var _          = require('lodash');
var async      = require('async');
var moment      = require('moment');
var HP = require(__base+'lib/helpers/lib.js').Permits; 




router.get('/folders', function(req,res,next){
	mongoose.model("docfolder").find({},"NameDocFolder CodeDocFolder CodeParentDocFolder Icon").isactive().lean().sort({IndexDocFolder:1}).exec(function(err,List){
		return res.json(List);
	})
})  



module.exports = router;