var mongoose = require('mongoose');
var sessions = require('express-session');
var _ = require("lodash");
var event = require('events').EventEmitter;

var SocketManager = (new function(){

	var self = this;

	self.socket = null;

	self.Events = new event();

	self.Listners = {};

	self.RegisterListner = function(name,cb){
		self.Listners[name] = cb;
	}


	self.emitEventAll = function(eventName,data){
		self.socket.sockets && self.socket.sockets.emit(eventName,data);
	}

	self.IsSocketAlive = function(socketId){
		return self.socket.sockets.sockets[socketId].connected;
	}

	self.emitTo = function(CodeUser,EventName,data){
		var sockets = self.userSockets(CodeUser);
		if (sockets.length){
			sockets.forEach(function(socketId){
				self.socket.to(socketId).emit(EventName,data);
			})
			console.log("Emit ",CodeUser,sockets,EventName,data);
		}
	}

	self.init = function(cookies, server){
		var sock = require('socket.io');
		self.socket = sock(server);
		var sessionMiddleware = sessions(cookies);
		var userMiddlware = function(req,res,next){
		  if (req.session && req.session.passport && req.session.passport['user']){
		      mongoose.model('user').findOne({_id:req.session.passport['user']},'NameUser CodeObj CodeUser UserPhoto').lean().exec(function(err,U){
		          req.session.user = U;
		          next();
		      })
		  } else {
		      req.session.user = null;
		      next();
		  }
		}
		self.socket.use((socket, next) => sessionMiddleware(socket.request, socket.request.res, next));
		self.socket.use((socket, next) => userMiddlware(socket.request, socket.request.res, next));
		self.socket.sockets.on("connection", function(socket) {
			if (socket.request.session.user && socket.request.session.user.CodeUser){
				for (var Ev in self.Listners){
					socket.on(Ev,self.Listners[Ev].bind(socket));
				}
				self.Events.emit("userconnected",socket);
			}
			socket.on('disconnect', function () {
				self.Events.emit("userdisconnected",this);
			})
		})
	}

	self.userSockets = function(CodeUser){
		var Result = [];
		if (!self.socket.sockets || !self.socket.sockets.sockets) return Result;
		var sockets = self.socket.sockets.sockets;
        for(var socket in sockets) {
        	var session = sockets[socket].request.session
        	if (session.user && session.user.CodeUser==CodeUser){
        		Result.push(socket);
        	}
        }
        return Result;
	}

	self.userSocketObjs = function(CodeUser){
		var Result = [];
		if (!self.socket.sockets || !self.socket.sockets.sockets) return Result;
		var sockets = self.socket.sockets.sockets;
        for(var socket in sockets) {
        	var session = sockets[socket].request.session
        	if (session.user && session.user.CodeUser==CodeUser){
        		Result.push(sockets[socket]);
        	}
        }
        return Result;
	}

	
	return self;
})

module.exports = SocketManager;
