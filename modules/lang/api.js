var _ = require('lodash');
var async = require('async');
var router   = require('express').Router();
var lib = require(__base+'/lib/helpers/lib.js');


var LangFilesCache = null;


router.get('/translates', function(req,res){
	if (LangFilesCache) return res.json(LangFilesCache);
  lib.enabledExtensions(function(err,List){
    var exec = require('child_process').exec,files = [], fs = require("fs");
    exec('find '+ __base+'modules/*/lang.json '+__base+'plugins/*/lang.json', function(err, stdout, stderr) {
        files = stdout.split('\n');
        var Result = {};
        async.each(_.compact(files),function(file,done){
          var module = _.last(_.first(file.trim().split("/lang.json")).split("/"));
          if (List.indexOf(module)==-1) return done();
          fs.readFile(file,function(err,content){
            Result[module] = JSON.parse(content.toString());
            return done();
          })
        },function(){
          LangFilesCache = Result;
          return res.json(LangFilesCache);
        })
    });
  })

})




module.exports = router;