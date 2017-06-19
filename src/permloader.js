var mongoose = require("mongoose");
var _ = require('lodash');
var async = require('async');
var L = require(__base+"lib/helpers/lib.js");


module.exports = function(CodeUser){
    var self = this;
    self.CodeUser = CodeUser;

    self.Pass = [];
    self.Task = [];
    self.Codes = {ObjGrps:[],DocRoles:[],PeriodGrps:[]};

    self.Translate = {
        ObjGrps:{},
        UsrObjs:{},
        DocRoles:{},
        PeriodGrps:{}
    };


    self.LoadTranslates = function(done){
        var all = function(F1,F2){
            return _.compact(_.uniq(_.map(self.Pass,F1).concat(_.map(self.Task,F2||F1))));
        }
        self.Codes.ObjGrps = all("CodeGrp","CodeObjGrp");
        self.Codes.DocRoles = all("CodeRole");
        self.Codes.PeriodGrps = all("CodePeriodGrp");
        async.parallel([
            self.LoadTrObjGrps,
            self.UsrObjGrps,
            self.LoadTrDocRoles,
            self.LoadTrPeriodGrps            
        ],done);
    }

    self.Catalogue = {};
    self.LoadCatalogue = function(done){
         self.Catalogue = {};
         L.enabledExtensionsCfgs(function(err,modules){
            modules.forEach(function(m){
                if (m.config.permissionsModels){
                    for (var PrivName in m.config.permissionsModels){
                        var Modules = m.config.permissionsModels[PrivName];
                        Modules.forEach(function(M){
                            if (!self.Catalogue[M]) self.Catalogue[M] = [];
                            self.Catalogue[M].push(PrivName);
                        })
                        
                    }                    
                }
            })
            return done();
         })
    }

    self.UsrObjGrps = function(done){
        mongoose.model("user").find({},"-_id CodeUser CodeObj").isactive().lean().exec(function(err,UGs){
            UGs.forEach(function(G){
                if (!self.Translate.UsrObjs[G.CodeObj]) self.Translate.UsrObjs[G.CodeObj] = [];
                self.Translate.UsrObjs[G.CodeObj].push(G.CodeUser);
            })
            mongoose.model("objgrp").find({CodeObj:{$in:_.uniq(_.map(UGs,"CodeObj"))}},"-_id CodeObj CodeGrp").isactive().lean().exec(function(err,UGs){
                UGs.forEach(function(G){
                    if (!self.Translate.ObjGrps[G.CodeGrp]) self.Translate.ObjGrps[G.CodeGrp] = [];
                    self.Translate.ObjGrps[G.CodeGrp].push(G.CodeObj);
                })
                return done();
            });            
        })
    }

    self.LoadTrObjGrps = function(done){
        if (!self.Codes.ObjGrps.length) return done();
        mongoose.model("objgrp").find({CodeGrp:{$in:self.Codes.ObjGrps}},"-_id CodeObj CodeGrp").isactive().lean().exec(function(err,Gs){
            Gs.forEach(function(G){
                if (!self.Translate.ObjGrps[G.CodeGrp]) self.Translate.ObjGrps[G.CodeGrp] = [];
                self.Translate.ObjGrps[G.CodeGrp].push(G.CodeObj);
            })
            return done();
        })
    }

    self.LoadTrDocRoles = function(done){
        if (!self.Codes.DocRoles.length) return done();
        mongoose.model("doc").find({CodeRole:{$in:self.Codes.DocRoles}},"-_id CodeDoc CodeRole").isactive().lean().exec(function(err,Gs){
            Gs.forEach(function(G){
                if (!self.Translate.DocRoles[G.CodeRole]) self.Translate.DocRoles[G.CodeRole] = [];
                self.Translate.DocRoles[G.CodeRole].push(G.CodeDoc);
            })
            return done();
        })
    }

    self.LoadTrPeriodGrps = function(done){
        if (!self.Codes.PeriodGrps.length) return done();
        mongoose.model("periodgrpref").find({CodePeriodGrp:{$in:self.Codes.PeriodGrps}},"-_id CodePeriod CodePeriodGrp").isactive().lean().exec(function(err,Gs){
            Gs.forEach(function(G){
                if (!self.Translate.PeriodGrps[G.CodePeriodGrp]) self.Translate.PeriodGrps[G.CodePeriodGrp] = [];
                self.Translate.PeriodGrps[G.CodePeriodGrp].push(G.CodePeriod);
            })
            return done();
        })
    }

    

    self.Load = function(done){
        console.log("Loading permissions");
        async.parallel([
            self.LoadPass,
            self.LoadTask,
            self.LoadCatalogue
        ],function(err){
           self.LoadTranslates(function(err){
               return done(err,{
                    Pass:self.Pass,
                    Task:self.Task,
                    Tr:self.Translate,
                    Catalogue:self.Catalogue,
               })
           }) 
        })
    }

    self.LoadPass = function(done){
        var Result = [];
        mongoose.model("userpermit").find({CodeUser:self.CodeUser},"-_id CodeObj CodeGrp CodePermit").isactive().lean().exec(function(err,Permits){
            mongoose.model("permit").find({CodePermit:{$in:_.map(Permits,"CodePermit")}},"-_id CodePermit Link_permitrole")
            .populate("Link_permitrole","-_id CodeRole CodePeriodGrp CodePermit DoBlock DoWrite DoRead")
            .isactive().lean().exec(function(err,PermitRoles){
                Permits.forEach(function(P){
                    var Pu = _.pick(P,["CodeObj","CodeGrp"]);
                    var Ad = _.find(PermitRoles,{CodePermit:P.CodePermit});
                    Ad && Ad.Link_permitrole.forEach(function(R){
                        Result.push(_.merge(_.clone(Pu),_.pick(R,["CodeRole","CodePeriodGrp","DoBlock","DoWrite","DoRead"])));    
                    })
                })
                self.Pass = Result;
                return done();
            })
        })
    }

    self.LoadTask = function(done){
        var Result = [];
        mongoose.model("usertask").find({CodeUser:self.CodeUser},"-_id CodeTask CodePeriodGrp CodePeriod CodeRole CodeDoc CodeObj CodeObjGrp")
        .isactive().lean().exec(function(err,UserTasks){
            mongoose.model("task").find({CodeTask:{$in:_.map(UserTasks,"CodeTask")}},"-_id CodeTask Link_taskprivelege")
            .populate("Link_taskprivelege","-_id CodeTask CodePrivelege")
            .isactive().lean().exec(function(err,Tasks){
                UserTasks.forEach(function(P){
                    var Pu = _.pick(P,[,"CodePeriodGrp","CodePeriod","CodeRole","CodeDoc","CodeObj","CodeObjGrp"]);
                    var Ad = _.find(Tasks,{CodeTask:P.CodeTask});
                    Ad && Ad.Link_taskprivelege.forEach(function(R){
                        Result.push(_.merge(_.clone(Pu),_.pick(R,["CodePrivelege"])));     
                    })
                })
                self.Task = Result;
                return done();
            })
        })
    }

    return self;
}

