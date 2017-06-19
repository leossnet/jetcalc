var _ = require('lodash');
var async = require('async');
var router   = require('express').Router();
var mongoose   = require('mongoose');
var lib = require(__base+'/lib/helpers/lib.js');


router.get('/needinstall', function(req,res){
  mongoose.model("user").count().isactive().exec(function(err,C){
      var NeedInstall = false;
      if (!C) NeedInstall = true;
      return res.json({needinstall:NeedInstall});
  })
})




module.exports = router;