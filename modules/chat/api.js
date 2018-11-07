var mongoose = require("mongoose");
var async = require("async");
var _ = require("lodash");
var SocketManager = require(__base+"src/socket.js");
var router = require("express").Router();


var ChatHelper = (new function(){
    var self = this;

    self.AnnounceChange = function(room,done){
        SocketManager.socket.to(room).emit("updateroom");
        return done && done();
    }

    self.AnnounceMessageAdd = function(room){
        SocketManager.emitEventAll('newmessage',{});
    }

    self.UpdateChatLog = function(type,CodeUser,RoomId){
        var Model = mongoose.model("chatlog"), Q = {CodeUser:CodeUser,RoomId:RoomId}; 
        Model.findOne(Q).exec(function(err,C){
            if (!C) C = new Model(Q);
            C.DateLeave = (type=="joinroom")  ? null:new Date();
            C.save();
        })
    }

    self.JoinRoom = function(RoomId){
        var socket = this;
        self.UpdateChatLog("joinroom",socket.client.request.session.user.CodeUser,RoomId);
        socket.join(RoomId);
    }

    self.LeaveRoom = function(RoomId){
        var socket = this;
        self.UpdateChatLog("leaveroom",socket.client.request.session.user.CodeUser,RoomId);
        socket.leave(RoomId);
    }

    self.AddMessage = function(data, done){
        var socket = this;
        var UserInfo = socket.request.session.user;
        var ChatMessage = mongoose.model('chatmessage');
        var M = new ChatMessage({
            Body     : data.body,
            Room     : data.room,
            Ups      : [],
            Downs    : [],
            UserCode : UserInfo.CodeUser,
            UserName : UserInfo.NameUser,
            UserPhoto: (UserInfo.UserPhoto)? '/api/gfs/'+UserInfo.UserPhoto:null,
            CodeObj  : UserInfo.CodeObj,
            Parent   : data.parent
        })
        M.save(function(err){
            self.AnnounceChange(data.room,done);
            self.AnnounceMessageAdd();
        });
    }

    self.UpdateMessage = function(data,done){
        mongoose.model('chatmessage').findByIdAndUpdate(data.id,{Body:data.body,Modified:Date.now()}).exec(function(err){
           self.AnnounceChange(data.room,done); 
        });
    }

    self.Vote = function(data,done){
        var socket = this;
        var UserInfo = socket.request.session.user;
        var Vote = data.vote;
        mongoose.model('chatmessage').findOne({_id:data._id}).exec(function(err,M){
            var downEx = M.Downs.indexOf(UserInfo.CodeUser);
            var upEx   = M.Ups.indexOf(UserInfo.CodeUser);
            if (downEx!=-1 && data.vote=='down')  M.Downs.splice(downEx,1);
            else if (upEx!=-1 && data.vote=='up') M.Ups.splice(upEx,1);
            else {
                if (downEx!=-1) M.Downs.splice(downEx,1);
                if (upEx!=-1) M.Ups.splice(upEx,1);
                if (data.vote=='up') M.Ups.push(UserInfo.CodeUser)
                if (data.vote=='down') M.Downs.push(UserInfo.CodeUser)
            }
            mongoose.model('chatmessage').findByIdAndUpdate(data._id,{Ups:M.Ups,Downs:M.Downs}).exec(function(err){
                self.AnnounceChange(data.room,done);
            })
        })
    }

    return self;
})

SocketManager.RegisterListner("chat_message",ChatHelper.AddMessage);
SocketManager.RegisterListner("chat_updatecomment",ChatHelper.UpdateMessage);
SocketManager.RegisterListner("chat_vote",ChatHelper.Vote);
SocketManager.RegisterListner("chat_join_room",ChatHelper.JoinRoom);
SocketManager.RegisterListner("chat_leave_room",ChatHelper.LeaveRoom);


router.get('/load',function(req,res,next){
    var roomId = req.query.room;
    mongoose.model('chatmessage').find({Room:roomId}).sort({Created:-1}).limit(100).lean().exec(function(err,Cs){
        return res.json(Cs);
    })
})


router.get('/counts',function(req,res,next){
    var Rooms = req.query.Rooms,CodeUser = req.user.CodeUser;
    mongoose.model("chatlog").find({CodeUser:CodeUser,RoomId:{$in:Rooms},DateLeave:{$ne:null}}).exec(function(err,Channels){
        var Counts = {All:0}; Rooms.forEach(function(RoomId){
            Counts[RoomId] = 0;
        })
        if (_.isEmpty(Channels)) return res.json(Counts);
        async.each(Channels,function(Ch,cb){
            mongoose.model("chatmessage").count({Room:Ch.RoomId,Created:{$gte:Ch.DateLeave}}).exec(function(err,C){
                Counts[Ch.RoomId] = C; Counts.All+=C;
                return cb();
            })
        },function(){
            return res.json(Counts);
        })
    })
})





module.exports = router;