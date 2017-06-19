var mongoose = require('mongoose');
var router   = require('express').Router();
var _        = require('lodash');
var async    = require('async');
var HP = require(__base+'lib/helpers/lib.js').Permits; 
var config = require(__base+"config.js");



router.put ('/requisites',   HP.TaskAccess("IsSystemSettingsEditor"),  function(req,res){
  var Settings = mongoose.model("settings");
  Settings.findOne().exec(function(err,S){
      if (!S) S = new Settings();
      var Fields = S.cfg().EditFields;
      Fields.forEach(function(F){
        S[F] = req.body[F];
      })
      S.save(function(err){
          return res.json(S);
      })
  })
})

router.get ('/requisites',   function(req,res){
  var Settings = mongoose.model("settings");
  Settings.findOne().lean().exec(function(err,S){
      if (!S){
          S = new Settings({TechMail:config.adminmail,TechPhone:config.adminphone,Logo:""});
          S.save(function(err){
              return res.json(S);
          })
      } else {
          return res.json(S);
      }
  })
})

module.exports = router
