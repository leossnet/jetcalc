var router = require("express").Router();
var mongoose = require("mongoose");
var _ = require("lodash");
var UserActivity = require(__base + "src/audit");
var SocketManager = require(__base + "src/socket");
var HP = require(__base+'lib/helpers/lib.js').Permits;  

var OnlineAnnounce = (new function(){
    var self = this;

    self.OnlineUsers = {};

    self.Announcer = null;

    self.UserConnected = function(socket){
        var User = socket.request.session.user, Perms = socket.request.session.permissions, Browser = socket.request.session.UserInfo;
        if (!self.OnlineUsers[User.CodeUser]) {
            self.OnlineUsers[User.CodeUser] = {User:{},Sessions:{}};
        }
        self.OnlineUsers[User.CodeUser].User = _.pick(User,["CodeObj","UserPhoto","CodeUser","NameUser"])
        self.OnlineUsers[User.CodeUser].Sessions[socket.id] = {IP:Browser.ip,Browser:Browser.browser};
        self.Check();
        self.CountChange();           
    }

    self.CountChange = function(){
        if (self.Announcer) clearTimeout(self.Announcer);
        self.Announcer = setTimeout(function(){
            self.Announce();
            clearTimeout(self.Announcer);
        },2*1000);
    }

    self.Announce = function(){
        console.log("Announce");
        SocketManager.emitEventAll("onlineusers_count");
    }

    self.Check = function(){
        for (var CodeUser in self.OnlineUsers){
            for (var socketId in self.OnlineUsers[CodeUser].Sessions){
                if (!SocketManager.IsSocketAlive(socketId)){
                    self.RemoveSocket(CodeUser,socketId);
                }
            }
        }
    }

    self.RemoveSocket = function(CodeUser,socketid){
        try{
            delete self.OnlineUsers[CodeUser].Sessions[socketid];
            if (_.isEmpty(self.OnlineUsers[CodeUser].Sessions)){
                delete self.OnlineUsers[CodeUser];
            }
        } catch(e){
            console.log(e);
        }
    }

    self.UserDisconnected = function(socket){
        var User = socket.request.session.user, CodeUser = User.CodeUser;
        self.RemoveSocket(CodeUser,socket.id);
        self.Check();
        self.CountChange();            
    }

    SocketManager.Events.on("userconnected",self.UserConnected);
    SocketManager.Events.on("userdisconnected",self.UserDisconnected);

    return self;
})


router.get("/count", function(req, res) {
    return res.json(_.keys(OnlineAnnounce.OnlineUsers).length);
})

router.get("/info", HP.TaskAccess("IsUserActivityViewer"), function(req, res) {
    return  res.json(OnlineAnnounce.OnlineUsers);
})


module.exports = router;
