var _ = require('lodash');
var async = require('async');
var fs  = require('fs');
var lib = require(__base+'/lib/helpers/lib.js');
var mongoose    = require('mongoose');
var init = require(__base+'/src/init.js');
var config = require(__base+'config.js');

var RouteIniter = (new function(){
    var self = this;

    self.Router = function(done){
        var exportRouter = require('express').Router();
        var path = __base+"modules";
        lib.listConfigs (path,function(err,list){  
            var addRouter = require('express').Router();
            addRouter.get("/", function(req, res, next) {
                var path = __base+"modules";
                lib.listConfigs (path,function(err,list){  
                    return res.json(list);
                })
            })
            list.forEach(function(L){
                var id = L.config.id;
                addRouter.use('/'+id, require(path+'/'+id+'/api.js'));
            })    
            exportRouter.use("/api/modules", addRouter)
            return done(null,exportRouter);
        })
    }




    return self;
})





init.checkState(function(err){
    if (err) console.log(err);
/*    var path = __base+"modules";
    lib.listConfigs (path,function(err,list){  
        var addRouter = require('express').Router();
        addRouter.get("/", function(req, res, next) {
            var path = __base+"modules";
            lib.listConfigs (path,function(err,list){  
                return res.json(list);
            })
        })
        list.forEach(function(L){
            var id = L.config.id;
            addRouter.use('/'+id, require(path+'/'+id+'/api.js'));
        })    
        exportRouter.use("/api/modules", addRouter)
    })
*/
})




module.exports = RouteIniter;
