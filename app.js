var  config      = require('./config.js')
, express        = require('express')
, app            = express()
, request        = require('request')
, mongoose       = require('mongoose')
, sessions       = require('express-session')
, MongoStore     = require('connect-mongo')(sessions)
, sessionStore   = new MongoStore(config.mongoSessionsDB)
, async          = require('async')
, E_PORT         = process.env.PORT || config.port
, debugRequests  = config.debugRequests
, errorCatch     = config.errorCatch
, _              = require('lodash')
, api            = require('./lib/helper.js')
, bodyParser     = require('body-parser')
, cookieParser   = require('cookie-parser')
, methodOverride = require('method-override')
, debug          = require('./lib/debug.js')
//, git            = require('./lib/gitControl.js')
, socket         = require('./src/socket.js')
, UserActivity   = require('./src/audit.js')
, timeToLive     = 24*60*60*1000
, PermitLoad     = require('./src/permloader.js')
, QueryString = require('querystring')
, Bus = require('./src/bus.js');



mongoose.Promise = global.Promise;

api.connection = mongoose.connect(config.mongoUrl,{safe:false});


setTimeout(function(){  

if (false){

    var FolderModel = require(__base+"modules/modules/folder.js");
    async.eachSeries(["fin","inv","cost","trade"],function(Packet,cb){
        var F = new FolderModel(Packet);    
        F.DumpCurrent(function(err,Data){
            F.UpdateModels(Data,function(err){
                console.log(Packet+": CONTENT UPDATED");
                cb();
            });
        })
    },function(err){
        console.log("ALL MODELS ARE UPLOADED TO GIT");
    })

}


if (true){
    //var ListModel = require(__base+"modules/modules/list.js");
    //ListModel.Install(function(err){
    //    console.log("INSTALL DONE");
    //})

   /* var ListModel = require(__base+"modules/modules/list.js");
    ListModel.DumpCurrent(function(err,Data){
        ListModel.UpdateModels(Data,function(err){
            console.log("GIT PUSH DONE");
        })
    })
*/
    /*
    ListModel.Models(function(err,Data){
       console.log("INSTALL DONE",Data);
    })
    */

}

},1000)

/*
setTimeout(function(){  

if (false){
    var ListModel = require(__base+"modules/modules/list.js");

    ListModel.DumpCurrent(function(err,Data){
        ListModel.UpdateModels(Data,function(err){
            console.log("CONTENT UPDATED");
        });
    })

}


if (false){
    var FolderModel = require(__base+"modules/modules/folder.js");
    var Finres = new FolderModel("cost");
    console.log(Finres.MInfo["param"].Dependant)
    Finres.DumpCurrent(function(err,Data){
        Finres.UpdateModels(Data,function(err){
            console.log("CONTENT UPDATED");
        });
        for (var ModelName in Data){
            console.log(ModelName,":",_.keys(Data[ModelName]).length);
        }
        console.log("SKIPPED:",Finres.Skipped,Finres.MaxRecursions)
    })
}


},1000)
*/

mongoose.connection.on('connected', function(){
    var ModelInit = require('./classes/InitModels.js');
    ModelInit(function(){

        app.set('port',E_PORT);
        var CookieConfig = config.cookieConfig;
        CookieConfig.store = sessionStore;

        app.use(cookieParser(config.sessionSecret));
        app.use(sessions(CookieConfig));

        // Модуль авторизации
        var passport = require('./src/passport.js');
        app.use(passport.initialize());
        app.use(passport.session());
        passport.Events.on('localauth',function(data){
            console.log("auth_event",data);
        })
        // Связь с расчетчиками

        var RabbitManager = require('./src/rabbitmq.js');
        RabbitManager.init();
         
        app.use(methodOverride());

        app.use(bodyParser.json({limit: '500mb',parameterLimit: 10000}));

        app.use(bodyParser.urlencoded({extended: true,limit: '500mb',parameterLimit: 10000}));
        


        app.use(function(req, res, next) {
            var User = mongoose.model('user');
            UserActivity.Log(req);
            if (req.session.passport && req.session.passport.user && req.user){
                var toSet = [];
                function setPermissions(callback){
                    if(req.session.permissions){
                       return callback(); 
                    }
                    var P = new PermitLoad(req.user.CodeUser);
                    P.Load(function(err,Perms){
                        req.session.permissions = Perms;
                        req.session.save(function(err){
                            if (err) console.log("Failed to save permissions to session");
                            callback(err);                            
                        });
                    })
                }
                function setSandBox(callback){
                    if (!req.session.sandbox) {
                      req.session.sandbox = {CodeUser:req.user.CodeUser,On:false};
                       callback();
                    } else {
                      if (req.session.sandbox.ToSave===0){
                        req.session.sandbox.On = false;
                      }
                      callback();
                    }
                }
                toSet.push(setPermissions);
                toSet.push(setSandBox);
                async.parallel(toSet,function(err){
                    next(err);
                });
            } else {
                req.user = null;
                next();
            }
        });


        var GFS = require(__base+'/src/gfs.js');
        app.use(GFS.router);


        var CalcApi = require(__base+'classes/calculator/CalculatorApi.js');
        app.use(CalcApi.router);


        var plugins = require(__base+'/src/plugins.js');
        
        plugins.Router(function(err,ModulesRouter){
            app.use(ModulesRouter);
            app.use(function (err, req, res, next) {
                if (_.isObject(err) && err.Module){
                    return res.redirect("/error?"+QueryString.stringify(err));
                }
                return res.json({err:err+''});
            });            
        })
        

        var environment = process.env.NODE_ENV || "development";
        var options = {};
        var server = null;


        var http = require("http");
        server = http.createServer(app);


        server.on('clientError', function(err) {
            console.log('CLIENT ERROR', err);
        });

        debug.debugRecord();

        //app.use(git.router);

        if (errorCatch) process.on('uncaughtException', function (err,info) {  console.log(err,info); });
        if (debugRequests)  console.log("Starting " + environment + " server on "+E_PORT);
        api.sessionStore = sessionStore;

        socket.init(CookieConfig, server);

        if (server) server.listen(E_PORT);

       
           


    });
})

