var amqp = require("amqplib/callback_api")
var async = require("async")
var config = require(__base + "config")
var mongoose = require('mongoose')
var rabbitPrefix = config.rabbitPrefix;
var _ = require("lodash");


var RabbitMQWorker = function(params) {
    var self = this;
    self.queue_id = params.queue_id;
    self.worker = params.worker;
   
    self.channel = null;

    self.connect = function(done) {
       amqp.connect(config.rabbitmq, function(err, conn) {
          if (err) console.log(err);
          conn.on("error", function(e) { console.log(e); setInterval(restart, 5000); })
          conn.createChannel(function(err, ch) {
            console.log("[*] Ожидаю задачу "+self.queue_id);
            self.channel = ch;
            self.channel.assertQueue(self.queue_id, {durable: false}, function(err, q) {
                self.channel.prefetch(1);
                self.channel.consume(self.queue_id, function (msg) {
                  var MS = JSON.parse(msg.content.toString());
                  console.log("[+] Делаю задачу "+self.queue_id);
                  self.worker(MS, function(err, result) {
                      var Answer = new Buffer(JSON.stringify({ err: err, result: result }));
                      console.log("[+] Сделал задачу отсылаю в :"+msg.properties.replyTo);
                      ch.sendToQueue(msg.properties.replyTo,Answer,{correlationId: msg.properties.correlationId});
                      ch.ack(msg);
                  })
                });
            });
          });
        });
    }

    return self;
}

var generateUUID = function() {
    return mongoose.Types.ObjectId()+'';
}

var myId = _.first(_.last((_.last(process.argv)).split("/")).split("."));

var RabbitMQClient = function (params){
    var self = this;
    self.queue_id = params.queue_id;
    self.result_queue_id = self.queue_id+'_result'+"_"+myId;
    self.channel = null;

    self.callbacks = {};

    self.sendBack = function(err,result,cor,cb){
        cb(err,result);
        delete self.callbacks[cor];
    }

    self.connect = function(done) {
        amqp.connect(config.rabbitmq, function(err, conn) {
          conn.createChannel(function(err, ch) {
              self.channel = ch;
              self.channel.assertQueue(self.result_queue_id, {exclusive :true}, function(err, q) {
                  self.channel.consume(self.result_queue_id, function(msg) {
                        var checker = msg.properties.correlationId;
                        if (self.callbacks[checker]){
                            var answer = JSON.parse(msg.content.toString());
                            return self.sendBack(answer.err,answer.result,checker,self.callbacks[checker]);
                        } else {
                            console.log("STRANGE!",self.callbacks);
                            return;
                        }
                  }, {noAck: true});
              })
              return done(err);
          });
        });
    }

    self.sendMessage = function(message, done) {
        var corr = generateUUID();
        self.callbacks[corr] = done;
        console.log(">>> SEND TO ",self.queue_id,corr);
        self.channel.sendToQueue(self.queue_id,(new Buffer(JSON.stringify(message))),{ correlationId: corr, replyTo: self.result_queue_id });
    }

    return self;
}

module.exports = {
    worker:RabbitMQWorker,
    client:RabbitMQClient
}
//rabbitmqadmin --username=jet --password=jetparole12j -f tsv -q list queues name | while read queue; do rabbitmqadmin --username=jet --password=jetparole12j -q delete queue name=${queue}; done
