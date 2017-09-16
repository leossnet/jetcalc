var _ = require("lodash");
var async = require("async");
var fs = require("fs");
var lib = require(__base+'lib/helpers/lib.js');
var mongoose = require("mongoose");


var FunctionsManager = (new function(){
    var self = this;

    self.CheckPriveleges = {};

    self.Register = function(PluginName, Path, Permissions){
        var L = require(Path+'/'+PluginName+'/lang.json');
        Permissions.forEach(function(P){
            self.CheckPriveleges[P] = {
                CodePrivelege:P,
                NamePrivelege:L[P] || P,
                ModuleName:L[PluginName] || PluginName,
                ModuleSName:PluginName
            }
        })
    }

    self.Sync = function(done){
        var PrivModel = mongoose.model("privelege");
        var TPrivelege = mongoose.model('taskprivelege');
        PrivModel.find().isactive().exec(function(err,Current){
            var CurrentIndexed = {};
            Current.forEach(function(C){
                CurrentIndexed[C.CodePrivelege] = C;
            })
            var NoUpdate = []
            for (var CodePrivelege in self.CheckPriveleges){
                var Up = self.CheckPriveleges[CodePrivelege];
                if (!CurrentIndexed[CodePrivelege]) {
                    CurrentIndexed[CodePrivelege] = new PrivModel(Up);
                } else {
                    var IsUpdated = false;
                    for (var F in Up) {
                        if (CurrentIndexed[CodePrivelege][F]!=Up[F]){
                            CurrentIndexed[CodePrivelege][F] = Up[F];   
                            IsUpdated = true;    
                        }
                    }
                    if (!IsUpdated) NoUpdate.push(CodePrivelege);
                }
            }
            async.each(_.keys(CurrentIndexed),function(Code,cb){
                if (NoUpdate.indexOf(Code)!=-1) return cb();
                var O = CurrentIndexed[Code];
                O.save("",cb);
            },function(err){
                if (err) console.log(err);
                var LinkCode = 'ADMIN';
                TPrivelege.find({CodeTask:LinkCode}).isactive().exec(function(err,Current){
                    var Indexed = {};
                    Current.forEach(function(C){
                        Indexed[C.CodePrivelege] = C;
                    })
                    var doRemove = function(ToRemove,final){
                        if (_.isEmpty(ToRemove)) return final();
                        async.each(ToRemove,function(Code,cb){
                            Indexed[Code].remove("",cb);
                        },final)
                    }
                    var ToRemove = _.difference(_.keys(Indexed),_.keys(self.CheckPriveleges));
                    doRemove(ToRemove,function(err){
                        if (err) console.log(err);
                        var ToAdd = _.difference(_.keys(self.CheckPriveleges),_.keys(Indexed));
                        if (!ToAdd.length) return done();
                        async.each(ToAdd, function(Code,cb){
                            var M = new TPrivelege({CodePrivelege:Code,CodeTask:LinkCode});
                            M.save("",cb);
                        },done)
                    })
                })
            })
        })
    }


    self.RegisterAll = function(PluginName, Path, Permissions, done){
        var Lang = require(Path+"/"+PluginName+"/lang.json");
        var ToModify = []; 
        var ToRemove = [];
        var PrivModel = mongoose.model("privelege");
        var TPrivelege = mongoose.model('taskprivelege');

        PrivModel.find({ModuleName:PluginName}).isactive().exec(function(err,Result){

            var CodesToRemove = _.difference(_.map(Result,'CodePrivelege'),Permissions);
            if (CodesToRemove.length){
                CodesToRemove.forEach(function(Code){
                    ToRemove.push(_.find(Result,{CodePrivelege:Code}));
                })
            }

            Permissions.forEach(function(P){

                var Existed = _.find(Result,{CodePrivelege:P});
                var IsMod = false;
                if (!Existed) {
                    Existed = new PrivModel({CodePrivelege:P});
                    IsMod = true;
                }
                var Tr = Lang[P] || P;
                if (Existed.ModuleName!=PluginName || Existed.NamePrivelege!=Tr) IsMod = true;
                Existed.ModuleName = PluginName;
                Existed.NamePrivelege = Tr;
                if (IsMod) ToModify.push(Existed);
            });

            async.series([
                function(callback){
                    async.each(ToRemove,function(R,cb1){
                        R.remove("",function(err){
                            return cb1();
                        });
                    },callback);
                },
                function(callback){
                    async.each(ToModify,function(M,cb2){
                        M.save("",function(err){
                            return cb2();
                        });
                    },callback)
                }
            ],function(err){
                self.setAdminPriveleges(function(){
                    return done && done();
                });
            });
        });
    }

    self.setAdminPriveleges = function(done){
        var PrivModel = mongoose.model("privelege");
        var TPrivelege = mongoose.model('taskprivelege');
        PrivModel.find({},"CodePrivelege").exec(function(err,CPS){
            TPrivelege.find({CodeTask:'ADMIN'}).isactive().exec(function(err,TS){
                var Existed = _.map(TS,"CodePrivelege");
                var All = _.map(CPS,"CodePrivelege");
                var ToAdd    = _.difference(All,Existed);
                var ToRemove = _.difference(Existed,All);
                if (ToAdd.length){
                    async.each(ToAdd,function(CodePr,cb){
                        var N = new TPrivelege({CodeTask:'ADMIN',CodePrivelege:CodePr});
                        N.save("",cb);
                    },done) 
                } else {
                    return done();
                }
            });
        });
    }



    return self;
})


module.exports = FunctionsManager;