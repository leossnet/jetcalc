module.exports = (new function(){
	var self = this;
	
	var agenda = require("agenda");
	var config = require(__base+"config.js");

	var event = require('events').EventEmitter;

	self.Events = new event();


	self.Agenda = new agenda({db: {address: config.agendaConnect}});

	self.Agenda.on('ready', function() {
		self.Events.emit("ready");
	})

	self.EnsureTaskRunning = function(jobname,job){
		self.Agenda.define(jobname, job);
		self.Agenda.stop();
		self.Agenda.start();
	}

	self.AddTask = function(jobname,job,interval){
		self.Agenda.define(jobname, job);
		self.Agenda.every(interval, jobname);
		self.Agenda.stop();
		self.Agenda.start();
	}

	self.RemoveTask = function(jobname){
		self.Agenda.cancel({name: jobname}, function(err, numRemoved) {
		});
		self.Agenda.stop();
		self.Agenda.start();
	}

	return self;
})