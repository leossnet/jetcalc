var mongoose = require('mongoose');
var _ = require("lodash");
var event = require('events').EventEmitter;


var Bus = (new function(){
	var self = this;

	self.Events = new event();

	self.On = self.Events.on;
	self.Off = self.Events.off;

	self.Emit = self.Events.emit;

	return self;
})