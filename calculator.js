var config = require('./config.js');
var InitMongoose = require('./classes/InitModels.js');
var Calculator = null;
var amqp = require('amqplib/callback_api');
var mongoose = require('mongoose');

var rabbitPrefix = config.rabbitPrefix;

process.on('uncaughtException', function (err,info) {  
	try{
		LastCh.ack(LastMs);
	} catch(e){
		console.log("Не могу завершить последнюю обработку!",e);
	}
	console.log("Ошибка в калькуляторе",err,info);
});


var LastCh = null;
var LastMs = null;
var LastCx = null;
var LogsChannel = null;


mongoose.Promise = global.Promise;
mongoose.connect(config.mongoUrl,{safe:false});
mongoose.connection.on('connected', function(){
	InitMongoose(function(){
		Calculator = require('./classes/calculator/AssoiCalculator.js');
		Calculator.events.on('inited',function(){
			console.log("Cache Loaded");
			amqp.connect(config.rabbitmq, function(err, conn) {
				if (err) console.log(err);		
				conn.createChannel(function(err, log_ch) { // В этом канале публикуем информацию о состоянии расчетчика (BUSY/READY)
					LogsChannel = log_ch;
				    var ex = rabbitPrefix+'log';
				    log_ch.assertExchange(ex, 'fanout', {durable: false}); 
				});
		        conn.createChannel(function(err, ch) {
		        	if (err) console.log(err);
		        	console.log("[*] Ожидаю задачу на расчет");
		            var q = rabbitPrefix+'calculate';
		            ch.assertQueue(q, {durable: false,maxPriority: 11}, function(err, ok) {//,
		            	if (err) console.log(err);
			            ch.prefetch(1);
			            ch.consume(q, function reply(msg) {
			            	LastCh = ch;
			            	LastMs = msg;
			            	LogsChannel.publish(rabbitPrefix+'log', '', (new Buffer(JSON.stringify({Status:"BUSY",Consumer:msg.fields.consumerTag}))));
			            	var Context = JSON.parse(msg.content.toString());
			            	LastCx = Context;
							Calculator.CalculateDocument(Context,function(err,Result){
								if (!Result) err = 'Пустой документ';
								if (err) {
									if (global.gc) global.gc();
									LastCh.ack(LastMs);
									LogsChannel.publish(rabbitPrefix+'log', '', (new Buffer(JSON.stringify({Status:"READY",Consumer:msg.fields.consumerTag}))));
								} else {
									Result.Consumer = msg.fields.consumerTag;
									ch.sendToQueue(msg.properties.replyTo, new Buffer(JSON.stringify(Result)),{correlationId: msg.properties.correlationId, persistent: false });
								}
							}, function(){
			            		console.log("[*] Кэш сохранен, ожидаю новую задачу");
			            		LastCh.ack(LastMs);
			            		LogsChannel.publish(rabbitPrefix+'log', '', (new Buffer(JSON.stringify({Status:"READY",Consumer:msg.fields.consumerTag}))));
			            	});
			            });	
		            });            
		        });
		    });
		})
	})
})

