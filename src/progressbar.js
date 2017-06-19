var event          = require('events').EventEmitter;
var mongoose       = require('mongoose');
var _ = require ('lodash');
var async = require ('async');
var SocketManager = require(__base+'/src/socket.js');

module.exports = function(CodeUser){
    var self = this;
    self.id = mongoose.Types.ObjectId()+'';

    self.Lines = 0;
    self.Line = 0;
    self.Steps = 0;
    self.LineMessage = "";
    self.CurrentStep = 0;
    self.Message = '';
    self.CodeUser = CodeUser;

    self.AnnounceTimer = 1000;

    self.Init = function(Lines,Message){
    	self.Lines = Lines;
    	self.Message = Message;
    	self.Announce();
    }

    self.Announcer = null;

    self.Announce = function(){
    	if (self.Announcer) return;
    	self.Announcer = setTimeout(function(){
    		self.doAnnounce();
    		clearTimeout(self.Announcer);
            self.Announcer = null;
    	},self.AnnounceTimer);		
    }


    self.doAnnounce = function(){
    	SocketManager.emitTo (self.CodeUser,"progress",{
    		id:self.id,
    		status:"progress",
    		body:{
    			Lines:self.Lines,
    			Line:self.Line,
				Message:self.LineMessage+": "+self.Message,
				Progress:(self.Steps==0) ? 0: Math.round(self.CurrentStep/self.Steps*100)
    		}
    	});
    }

    self.StartLine = function(Steps,Message){
        self.Line++;
        self.LineMessage = Message;
    	self.Message = Message;
        self.Steps = Steps;
    	self.CurrentStep = 0;
    	self.Announce();
    }

    self.Complete = function(){
    	SocketManager.emitTo (self.CodeUser,"progress",{
    		id:self.id,
    		status:"complete",
    		body:{}
    	});
    }

    self.Step = function(Message){
    	self.CurrentStep++;
    	self.Message = Message;
    	self.Announce();
    }


    return self;
};
