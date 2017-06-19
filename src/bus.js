var mongoose = require('mongoose');
var _ = require("lodash");
var event = require('events').EventEmitter;


var Bus = (new function(){
	var self = this;

	self.Events = new event();

	self.on = self.Events.on;
	self.off = self.Events.off;

	self.emit = self.Events.off;


	return self;
})