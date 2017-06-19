var event          = require('events').EventEmitter;
var mongoose       = require('mongoose');
var passport        = require('./passport.js');
var _ = require ('lodash');

var UserActivity = (new function(){
    var self = this;

    self.Events = new event();

    self.Log = function(req) {
        if (!req.user) return;
        req.base = req.originalUrl.split("?")[0];
        if (!req.session.UserInfo) {
          var UAParser = require('ua-parser-js');
          var parser = new UAParser();
          var ua = req.headers['user-agent'];
          var Data = {
            id: req.sessionID,
            user_id: req.user.id,
            ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'],
            browser : {
                Name:parser.setUA(ua).getBrowser().name,
                Version:parser.setUA(ua).getBrowser().version.split(".",1).toString(),
            }
          }
          console.log(Data);
          req.session.UserInfo = Data;
          req.session.save();
        }
        var Answer = _.clone(req.session.UserInfo);
        Answer.url = req.base;
        Answer.params = (req.method === "GET") ? req.query : req.body;
        self.Events.emit('useraskurl',Answer);
    }

    return self;
})

var Audit = (new function(){
    var self = this;

    self.Events = new event();

    var LOGINFAILSLIMIT = 3;
    var CHECKLOGINSUCCESSINTERVAL = 1000 * 30;

    var loginFailsCount = {}

    var writeDangerousLog = function(message, data){
        var Log = mongoose.model('dangerouslog');
        var record = new Log({message: message,
                             data: JSON.stringify(data)});
        record.save();
    }

    var bindAuthHandler = function(){
        passport.Events.on('localauth',function(data){
            if(data.status === 'error'){
                if(loginFailsCount[data.username]){
                    loginFailsCount[data.username] += 1;
                }
                else{
                    loginFailsCount[data.username] = 1;
                    setTimeout(function(){
                        if(loginFailsCount[data.username]){
                            delete loginFailsCount[data.username];
                            writeDangerousLog('login fail', data);
                            self.Events.emit('dangerousaction', data);
                        }
                    }, CHECKLOGINSUCCESSINTERVAL);
                }
            }
            else{
                delete loginFailsCount[data.username];
            }
            if(loginFailsCount[data.username] >= LOGINFAILSLIMIT){
                writeDangerousLog('login bruteforce', data);
                self.Events.emit('dangerousaction', data);
            }
        });
    }

    var bindHandlers = function(){
        bindAuthHandler();
    }

    var createModel = function(){
        var dangerouseSchema = new mongoose.Schema({message: 'string',
                                                    data: 'string'},
                                                  {timestamps: true});
        var dangerousLog = mongoose.model('dangerouslog', dangerouseSchema);
    }

    self.init = function(){
        createModel();
        bindHandlers();
    }

    return self;
}
)

Audit.init();
//Audit.Events.on('dangerousaction', function(){console.log('DANGER')});

module.exports = UserActivity;
