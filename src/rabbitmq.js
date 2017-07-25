var config = require('../config.js');
var amqp = require('amqplib/callback_api');
var _ = require('lodash');
var event = require('events').EventEmitter;
var request = require('request');
var mongoose = require('mongoose');
var moment = require('moment');
var rabbitPrefix = config.rabbitPrefix;

var RabbitManager =  function(){

	var self = this;

	self.Consumers = {};
	self.queueLength = 0;

	self.Events = new event();
	self.RabbitChannel = null;
	self.CalcLog = {};
	self.CalcLogContext = {};
	self.CalculateCallBacks = {};

	self.CountConsumers = function(done){
		var Count = _.keys(self.Consumers).length;
		if (Count) return done(Count);
		self.update(function(){
			var Count = _.keys(self.Consumers).length;
			if (Count) return done(Count);
		})
	}

	self.init = function(){
  		amqp.connect(config.rabbitmq, function(err, conn) {
	   		if (err) console.log(err);
	   		conn.createChannel(function(err, log_ch){
	   			var ex = rabbitPrefix+'log';
	   		 	log_ch.assertExchange(ex, 'fanout', {durable: false});
	  		 	log_ch.assertQueue('', {exclusive: true}, function(err, q) {
      				log_ch.bindQueue(q.queue, ex, '');
				    log_ch.consume(q.queue, function(msg) {
				    	var Info = JSON.parse(msg.content.toString());
				    	if (Info.Status=='READY'){
				    		self.SetReady(Info.Consumer);
				    	} else {
				    		self.SetBusy(Info.Consumer);
				    	}
      				}, {noAck: true});
    			});
	   		})
	        conn.createChannel(function(err, ch){
	          self.RabbitChannel = ch;
	          self.RabbitChannel.assertQueue(rabbitPrefix+'calculate_result', {durable: false,exclusive:true}, function(err, q){
	            self.RabbitChannel.consume(q.queue, function(msg){
	            	var Answer = JSON.parse(msg.content.toString());
	            	self.ModLen(-1);
	                if (self.CalculateCallBacks && self.CalculateCallBacks[msg.properties.correlationId]){
	                    self.RabbitChannel.ack(msg);
	                    self.CalculateCallBacks[msg.properties.correlationId](err,Answer);
	                    self.CalculateCallBacks = _.omit(self.CalculateCallBacks,msg.properties.correlationId);
	                    self.CalcLog[msg.properties.correlationId] = _.merge(self.CalcLogContext[msg.properties.correlationId],{date:moment().format('DD.MM HH:mm:ss'),time:Answer.Time,cache:Answer.CacheUsed});
	                    self.CalcLogContext=_.omit(self.CalcLogContext,msg.properties.correlationId);
	                	if (_.keys(self.CalcLog).length>10){
	                		self.CalcLog = _.omit(self.CalcLog,_.keys(self.CalcLog).slice(0,_.keys(self.CalcLog).length-10));
	                	}
	                	self.Inform();
	                    return;
	                } else {
	                    self.RabbitChannel.ack(msg);
	                    self.CalculateCallBacks = _.omit(self.CalculateCallBacks,msg.properties.correlationId);
	                }
	             }, {noAck: false});
	          });
	        })
	  	})
	}

	self.doInform = function(){
		self.update(function(){
			var Info = {
				Queues   : self.queueLength,
				Log      : _.values(self.CalcLog),
				Channels : _.values(self.Consumers)
			};
			self.Events.emit('calcsInfo',Info);
		})
	}

	self._informTimer = null;

	self.Inform = function(){
		if (self._informTimer) return;
		self._informTimer = setTimeout(function(){
			self.doInform();
			clearTimeout(self._informTimer);
			self._informTimer  = null;
		},2000);
	}

	self.CalculateDocument = function(Context,done){
    	Context.UniqueId = mongoose.Types.ObjectId()+'';
    	self.CalculateCallBacks[Context.UniqueId] = done;
    	self.CalcLogContext[Context.UniqueId] = {CodeDoc:Context.CodeDoc,IsInput:Context.IsInput,Year:Context.Year,CodePeriod:Context.CodePeriod,CodeObj:Context.CodeObj,User:Context.CodeUser,date:'00:00',time:'0,00',cache:false};
    	self.RabbitChannel.sendToQueue(rabbitPrefix+'calculate', (new Buffer(JSON.stringify(Context))), { correlationId: Context.UniqueId, replyTo: rabbitPrefix+'calculate_result', persistent: false,priority:Context.Priority });
    	self.ModLen(1);
	}

	self.SetReady = function(id){
		self._setState(id,"Ready");
	}

	self.SetBusy = function(id){
		self._setState(id,"Busy");
	}

	self.ModLen = function(N){
		self.queueLength += N;
		self.queueLength = Math.max(self.queueLength,0);
		self.Inform();
	}

	self._setState = function(id,state){
		if (!self.Consumers[id]) {
			self.Consumers[id] = {};
		}
		self.Consumers[id].State = state;
		self.Inform();
	}

	self.rabbitCmd = function(command,done){
		var url = config.rabbitmq.replace('amqp:',"http://")+':'+config.rabbitmqPort+'/api/'+command;
	    request({ url : url },
	      function(error, response, body){
	      	  if (error || response.statusCode !== 200) return done(error)
	      	  return done(null,JSON.parse(body));
	      }
	    );
	}

	self.update = function(done){
		self.rabbitCmd('queues/%2F/'+rabbitPrefix+'calculate',function(err,result){
			var Consumers = {};
      		result && result.consumer_details.forEach(function(C){
      			Consumers[C.consumer_tag] = {
      				Host:C.channel_details.peer_host,
      				State:"Ready"
      			}
      		})
      		var LostConsumers = _.difference(_.keys(self.Consumers),_.keys(Consumers));
      		self.Consumers = _.omit(self.Consumers,LostConsumers);
      		self.Consumers = _.merge(Consumers,self.Consumers);
        	return done && done();
   		});
	}
}
var Manager = new RabbitManager();
module.exports = Manager;
