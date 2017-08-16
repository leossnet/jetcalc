var mongoose = require('mongoose');
var router = require('express').Router();
var _ = require('lodash');
var moment = require('moment');
var async = require('async');
var LIB = require(__base+'lib/helpers/lib.js');
var HP = LIB.Permits; 
var Progress = require(__base+"src/progressbar.js");
var Compiller = require(__base+"modules/modules/compiller.js");
var Cron = require(__base+'src/agenda.js');


var ModulesHelper = (new function(){
    var self = this;

    self.MSSettings = function(done){
        var SetModel = mongoose.model("mssettings");
        SetModel.findOne().exec(function(err,Settings){
            if (!Settings){
                Settings = new SetModel();
                Settings.save(function(err){
                    return done(null,Settings);
                })
            } else {
                return done(null,Settings);
            }        
        })
    }

    self.Build = function(){
        self.MSSettings(function(err,Set){
            self.ReCompile(Set.DoBundle,function(){
                console.log("Build is done",Set.DoBundle)
            })
        })
    }

    self.ReCompile = function(doBundle,done){
        if (doBundle){
            Compiller.BuildBundle(done);
        } else {
            Compiller.Build(done);
        }        
    }

    self.ExecGit = function(moduleName,command,done){
        var cleared = _.last(moduleName.split("jetcalc_"));
        var exec = require("child_process").exec;
        mongoose.model("msmodule").findOne({ModuleName:moduleName}).exec(function(err,Mod){ 
            if (!Mod) return done("Модуль не найден");
            ModulesHelper.MSSettings(function(err,Set){
                console.log("./gitmanager.sh "+[command,cleared,Set.RepoOwner,Set.GitLogin,Set.Password].join(" "));
                exec("./gitmanager.sh "+[command, cleared,Set.RepoOwner,Set.GitLogin,Set.Password].join(" "),{cwd: __base+'modules/modules'},function(err,result,info){
                    console.log(err,result,info);
                    if (err) return done(err);
                    self.ReCompile(Set.DoBundle,function(err){
                        return done(err,Mod);
                    })
                })
            })
        })
    }

    return self;
})


var GitHub  = (new function(){
	var self = this;

    self.user = "";
    self.pass = "";
    self.repo = "";
	self.base = "https://api.github.com";
    self.auth = {user:"",pass:"",sendImmediately:true};
    self.lastsync = null;

    var _isInited = false;

    self.init = function(done){
        if (_isInited) return done();
        ModulesHelper.MSSettings(function(err,Settings){
            self.user = Settings.GitLogin;
            self.repo = Settings.RepoOwner;
            self.pass = Settings.Password;
            if (Settings.LastSync){
                self.lastsync = new Date(moment(Settings.LastSync).subtract(1, 'days'));
            }
            self.auth.user = self.user;
            self.auth.pass = self.pass;
            _isInited = true;
            return done();
        })
    }

	self.request = require("request");

	self.ask = function(url,type,body,done){
        var askUrl = self.base+decodeURIComponent(url);
        var headers = {'User-Agent': self.user};
        if (!_.isEmpty(body)){
            headers["Content-Type"] = "application/json";
        }
        self.request({
            method: type,
            uri:askUrl,
            auth:self.auth,
            json: body,
            headers: headers
        },function(error, response, body){
            if (error) return done(error);
            return done(null,body);
        })
    }    

    self.repos = function(done){
    	self.ask("/users/"+self.repo+"/repos","get",{},done);
    }


    self.LoadModulesFromGit = function(done){
        self.repos(function(err,list){
            done(err,_.filter(list,function(r){
                return r.name.indexOf("jetcalc")===0 || r.name.indexOf("jcmodel")===0;
            }))
        })
    }

    self.LoadModelsFromGit = function(done){
        self.repos(function(err,list){
            done(err,_.filter(list,function(r){
                return r.name.indexOf("jcmodel")===0;
            }))
        })
    }

    self._syncVersions = function(module){
        return function(done){
            self.ask("/repos/"+self.repo+"/"+module.name+"/releases","get",{},function(err,data){
                var Ver = "1.0";
                if (!_.isEmpty(data)){
                    Ver = _.first(data).tag_name;
                }
                self._update(module,{Version:Ver},done);
            })
        }
    }    

    self._syncIcon = function(module){
        return function(done){
            self.ask("/repos/"+self.repo+"/"+module.name+"/contents/icon.svg","get",{},function(err,data){
                var Icon = data.content;
                self._update(module,{Icon:Icon},done);
            })
        }
    }

    self._syncContent = function(module){
        return function(done){
            if (module.Model.Type=="module") return done();
            self.ask("/repos/"+self.repo+"/"+module.name+"/contents/Model.json","get",{},function(err,data){
                var Model = data.content;
                self._update(module,{Model:Model},done);
            })
        }
    }

    self._toHTML = function(text,done){
        self.ask("/markdown","POST",{text:text,mode:"markdown"},done);
    }

    self._syncReadMe = function(module){
        return function(done){
            self.ask("/repos/"+self.repo+"/"+module.name+"/contents/README.md","get",{},function(err,data){
                self._toHTML(new Buffer(data.content, 'base64')+'',function(err,HTML){
                    self._update(module,{ReadMe:HTML},done);
                })

            })
        }
    }

    self.DefaultLabels = {
        "Вопрос по коду":"1d76db",
        "Вопрос по функционалу":"5319e7",
        "Дубликат":"FAFAFA",
        "Не ошибка":"FAFAFA",
        "Ошибка":"ee0701",
        "Новая функциональность":"0e8a16"
    }


    self._syncLabels = function(module){
        return function(final){
            self.ask("/repos/"+self.repo+"/"+module.name+"/labels","get",{},function(err,data){
                var ToAdd = [], ToRemove = [], Existed = {};
                data.forEach(function(Label){
                    if (!self.DefaultLabels[Label.name]){
                        ToRemove.push(Label);
                    }
                    Existed[Label.name] = Label.color;
                })
                for (var Name in self.DefaultLabels){
                    if (!Existed[Name]){
                        ToAdd.push({name:Name,color:self.DefaultLabels[Name]});
                    }
                }
                var _addLabels = function(A,ModuleName,done){
                    if (_.isEmpty(A)) return done();
                    async.each(A,function(Ad,cb){
                        self.ask("/repos/"+self.repo+"/"+ModuleName+"/labels","POST",{name:Ad.name,color:Ad.color},cb);
                    },done);
                }
                var _removeLabels = function(R,ModuleName,done){
                    if (_.isEmpty(R)) return done();
                    async.each(R,function(Re,cb){
                        self.ask("/repos/"+self.repo+"/"+ModuleName+"/labels/"+Re.name,"DELETE",{},cb);
                    },done);
                }
                _addLabels(ToAdd,module.name,function(err){
                    _removeLabels(ToRemove,module.name,function(err){
                        return  final();
                    })
                })
            })
        }
    }


    self._syncIssues = function(module){
        return function(done){
            var byTime = self.lastsync ? "&since="+self.lastsync.toISOString() :"";
            self.ask("/repos/"+self.repo+"/"+module.name+"/issues?state=all"+byTime,"get",{},function(err,data){
                if (_.isEmpty(data)) return done();
                async.each(data,function(Mod,cb){
                    var Model = mongoose.model("msissue");
                    Model.findOne({gitid:Mod.id}).exec(function(err,Bug){
                        if (!Bug) Bug = new Model();
                        Bug.gitid = Mod.id;
                        Bug.DateAdded = new Date(Mod.created_at);
                        Bug.Title = Mod.title;
                        Bug.Title = Mod.title;
                        Bug.State = Mod.state;
                        Bug.BodyMarkDown = Mod.body;
                        Bug.UserName = Mod.user.login;
                        Bug.UserAvatar = Mod.user.avatar_url;
                        Bug.Module = module.name;
                        Bug.Url = Mod.html_url;
                        Bug.Labels = _.isEmpty(Mod.labels) ? [] : _.map(Mod.labels,"name");
                        Bug.Number = Mod.number;
                        self._toHTML(Bug.BodyMarkDown,function(err,HTML){
                            Bug.Body = HTML;
                            Bug.save(function(err){
                                if (!Mod.comments) return cb();
                                console.log(Mod.comments_url);
                                self.ask(_.last(Mod.comments_url.split(self.base)),"get",{},function(err,data){
                                    Bug.Comments = _.map(data,function(c){
                                        return {Text:c.body,Date:c.created_at,UserName:c.user.login,UserAvatar:c.user.avatar_url};
                                    });
                                    if (Bug.Comments.length){
                                        var ReComments = []
                                        async.eachSeries(Bug.Comments,function(B,cb2){
                                            self._toHTML(B.Text,function(err,Html){
                                                B.Text = Html;
                                                ReComments.push(B);
                                                cb2();
                                            })
                                        },function(err){
                                            Bug.Comments = ReComments;
                                            Bug.save(cb);
                                        })
                                    } else {
                                        Bug.save(cb);    
                                    }
                                    
                                })
                            });
                        })
                    })
                },done);
            })            
        }
    }

    self._update = function(module,Update,done){
        mongoose.model("msmodule").findOneAndUpdate({gitid:module.id},Update,done);
    }


    self.SyncModule = function(module,final){
        var Model = mongoose.model("msmodule");
        Model.findOne({gitid:module.id}).exec(function(err,Existed){
            if (!Existed) {
                Existed = new Model ();
            }
            Existed.gitid = module.id;
            Existed.Description = module.description;
            Existed.ModuleName = module.name;
            if (module.name.indexOf("jetcalc_")==0 || module.name.indexOf("jetcalc")==0){
                Existed.ShortName =  _.last(module.name.split("jetcalc_"));
                Existed.Type =  "module";
            } else {
                Existed.ShortName =  _.last(module.name.split("jcmodel_"));
                Existed.Type =  "model";
            }
            module.Model = Existed;
            Existed.save(function(err){
                async.parallel([
                    self._syncIcon(module),
                    self._syncReadMe(module),
                    self._syncVersions(module),
                    self._syncLabels(module),
                    self._syncContent(module),
                    self._syncIssues(module)
                ],function(){
                    ModulesHelper.MSSettings(function(err,Set){
                        Set.LastSync = new Date();
                        Set.save(final);
                    })
                })
            })
        })
    }


    self.SyncModules = function(flush,done){
        self.init(function(err){
            if (flush) self.lastsync = null;
            self.LoadModulesFromGit(function(err,List){
                async.each(List,self.SyncModule,done);
            })
        })
    }



    
	return self;
})



Cron.Events.on('ready', function() {
    ModulesHelper.MSSettings(function(err,Set){
        if (Set.usecron){
            Cron.EnsureTaskRunning('git_sync',function(job, done){
                GitHub.Sync(false,done);
            });
        }
    })
})



var ModelCompiller = function(Choosed){
    var self = this;
    
    self.Main = Choosed;

    self.BaseLoad = ["periodgrp", "period", "valuta", "col", "colset", "header", "role", "permit", "doc"];

    self.Result = {

    };

    self.Result = function(done){
        self.LoadMainModels(function(err){
            console.log(self.Result);
            self.LoadAddModels(function(err){

            })
        })
    }

    self._loadTask = function(modelName,Query){
        return function(done){
            var Mod = mongoose.model(modelName), CFG = Mod.cfg(), Code = CFG.Code, Fields = CFG.EditFields;
            Mod.find(Query,Fields.join(" ")).isactive().lean().exec(function(err,Collection){
                if (!self.Result[modelName]) self.Result[modelName] = {};
                var ReInd = {};
                Collection.forEach(function(C){
                    ReInd[C[Code]] = _.pick(C,Fields);
                })
                self.Result[modelName] = _.merge(self.Result[modelName],ReInd);
                return done();
            })
        }
    }

    self.LoadMainModels = function(done){
        var Tasks = [];
        for (var ModelName in self.Main){
            var Mod = mongoose.model(modelName), CFG = Mod.cfg(), Code = CFG.Code, Query = {};
            Query[Code] = {$in:self.Main[ModelName]};
            Tasks.push(self._loadTask(modelName,Query));
        }
        async.parallel(Tasks,done);
    }

    self.LoadAddModels = function(done){
        //  "row", "sumgrp", "style", "docfolder"
    }


    self.LoadLinks = function(done){
        return done();
    }



    return self;
}





router.put('/modelcontent', HP.TaskAccess("IsModelsAdmin"), function (req, res, next) {
    var Module = req.body.Model, Data = req.body.Data;
    mongoose.model("msmodule").findOne({ModuleName:Module}).lean().exec(function(err,Model){
        var MC = new ModelCompiller(BigData);
        MC.Result(Data,function(){

        })
    })
})


router.get('/modelcontent', HP.TaskAccess("IsModelsAdmin"), function (req, res, next) {
    var Module = req.query.Model;
    mongoose.model("msmodule").findOne({ModuleName:Module}).lean().exec(function(err,Model){
        var CurrentContent = new Buffer(Model.Model.trim(), 'base64')+'';
        var Js = {};
        try{
            Js = JSON.parse(CurrentContent);
        } catch(e){;}
        var Answer = {}, LoadModels = ModelCompiller.BaseLoad;
        async.each(LoadModels,function(LM,cb){
            var M = mongoose.model(LM), CFG = M.cfg();
            M.find({},["-_id", CFG.Code,CFG.Name].join(" ")).isactive().lean().exec(function(err,List){
                if (!_.isEmpty(List)){
                    Answer[LM] = _.map(List,function(L){
                        return _.merge({Choosed:(Js[LM] && Js[LM][CFG.Code])?true:false},_.pick(L,[CFG.Code,CFG.Name]));
                    });
                }
                return cb();
            })
        },function(err){
            return res.json(Answer);
        })
    })
})


router.get('/installgit', LIB.Require(['module']), HP.TaskAccess("IsModulesAdmin"), function (req, res, next) {
    mongoose.model("msmodule").findOne({ModuleName:req.query.module}).exec(function(err,M){
        if (M.Type=='module'){
            ModulesHelper.ExecGit(req.query.module,"install",function(err,Mod){
                if (err) return next(err);
                Mod.InstalledVersion = Mod.Version;
                Mod.IsInstalled = true;
                Mod.save(function(){
                    return res.json({});
                })
            })
        } else {
            console.log("Установка модели ",req.query.module);
        }
    })
})

router.get('/updategit', LIB.Require(['module']), HP.TaskAccess("IsModulesAdmin"), function (req, res, next) {
    mongoose.model("msmodule").findOne({ModuleName:req.query.module}).exec(function(err,M){
        if (M.Type=='module'){
            ModulesHelper.ExecGit(req.query.module,"update",function(err,Mod){
                if (err) return next(info);
                Mod.InstalledVersion = Mod.Version;
                Mod.save(function(){
                    return res.json({});
                })
            })
        } else {
            console.log("Обновление модели ",req.query.module);
        }
    })
})

router.delete('/uninstallgit', LIB.Require(['module']), HP.TaskAccess("IsModulesAdmin"), function (req, res, next) {
    mongoose.model("msmodule").findOne({ModuleName:req.query.module}).exec(function(err,M){
        if (M.Type=='module'){
            ModulesHelper.ExecGit(req.body.module,"remove",function(err,Mod){
                if (err) return next(info);
                Mod.IsInstalled = false;
                Mod.save(function(){
                    return res.json({});
                })
            })
        } else {
            console.log("Удаление модели ",req.query.module);
        }
    })
})

router.get('/gitmodule', HP.TaskAccess("IsModulesAdmin"), function (req, res, next) {
    var T = req.query.Type || "module";
    mongoose.model("msmodule").find({ModuleName:{$ne:'jetcalc'},Type:T}).lean().exec(function(err,List){
        return res.json(List);
    })
})

router.get('/issues', HP.TaskAccess("IsModulesAdmin"), function (req, res, next) {
    var Q = req.query.State=='all' ? {}: {State:req.query.State};
    mongoose.model("msmodule").find({IsInstalled:true},"-_id ModuleName").lean().exec(function(err,Modules){
        Q.Module = {$in:_.map(Modules,"ModuleName").concat(["jetcalc"])};
        mongoose.model("msissue").find(Q).sort({DateAdded:-1}).limit(50).lean().exec(function(err,List){
            return res.json(List);
        })
    })
})

router.get('/syncgitmodules', HP.TaskAccess("IsModulesAdmin"), function (req, res, next) {
    GitHub.SyncModules(false,function(){
        return res.json({});
    })    
})


router.get('/syncpriveleges', HP.TaskAccess("IsModulesAdmin"), function (req, res, next) {
    LIB.SyncPriveleges(function(err){
        if (err) return next(err);
        return res.json({});
    })
})

router.get('/settings', HP.TaskAccess("IsModulesAdmin"), function (req, res, next) {
    ModulesHelper.MSSettings(function(err,Settings){
        return res.json(Settings);
    })    
})


router.put('/settings', HP.TaskAccess("IsModulesAdmin"), function (req, res, next) {
    var SettingsPassed = req.body.settings;
    var RequizitesPassed = req.body.requisites;
    var UpdateSettings = function(Update){
        return function(done){
            ModulesHelper.MSSettings(function(err,Settings){
                for (var K in Update) Settings[K] = Update[K];
                Settings.save(function(err){
                    if (Settings.usecron){
                        Cron.AddTask('git_sync',function(job, done){
                            GitHub.SyncModules(false,done);
                        },"1 day");
                    } else {
                        Cron.RemoveTask('git_sync');
                    }   
                    ModulesHelper.ReCompile(Settings.DoBundle,done);
                })
            })    
        }
    }
    var UpdateRequiztes = function(Update){
        return function(done){
            var Settings = mongoose.model("settings");
            Settings.findOne().exec(function(err,S){
                  if (!S) S = new Settings();
                  var Fields = S.cfg().EditFields;
                  Fields.forEach(function(F){
                    S[F] = Update[F];
                  })
                  S.save(done);
            })             
        }
    }
    async.parallel([UpdateSettings(SettingsPassed),UpdateRequiztes(RequizitesPassed)],function(err){
        if (err) return next(err);
        return res.json({});
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


router.get ('/favicon.ico',   function(req,res,next){
  var Settings = mongoose.model("settings");
  Settings.findOne().lean().exec(function(err,S){
      if (S && !_.isEmpty(S.Icon) && false){
        var gfs = require(__base+'src/gfs.js');
        return gfs.PipeFileStreamToRes(S.Icon, res, next);
      } else {
        return res.sendFile(__base+"modules/modules/favicon.ico");
      }
  })
})

router.get ('/logo.png',   function(req,res,next){
  var Settings = mongoose.model("settings");
  Settings.findOne().lean().exec(function(err,S){
      if (S && !_.isEmpty(S.Logo) && false){
        var gfs = require(__base+'src/gfs.js');
        return gfs.PipeFileStreamToRes(S.Logo, res, next);
      } else {
        return res.sendFile(__base+"modules/modules/logo.png");
      }
  })
})


setTimeout(function(){
    ModulesHelper.Build(function(err){
        console.log("Build")    
    },2000);
})

/*



setTimeout(function(){
  var path = __base+"modules";
    var Functions = require(__base+"modules/modules/functions.js");
    LIB.listConfigs (path,function(err,list){  
        list.forEach(function(L){
            if (L.config.permissions){
                Functions.Register(L.config.id,path,L.config.permissions);
            }
        })    
        if (mongoose.models["privelege"]){
            Functions.Sync(function(){
                return res.json({})
            });
        }
    })
},2000)
setTimeout(function(){
    GitHub.SyncModules(true,function(){

    });
},2000)
*/

module.exports = router;