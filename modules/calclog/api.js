var mongoose = require('mongoose');
var router   = require('express').Router();
var _        = require('lodash');
var async    = require('async');
var HP = require(__base+'lib/helpers/lib.js').Permits; 
var SocketManager = require(__base + "src/socket");
var config  = require(__base+'config.js');


var RabbitManager = require(__base+'/src/rabbitmq.js');

RabbitManager.Events.on('calcsInfo',function(data){
	SocketManager.emitEventAll('calcsInfo',data);
})


router.get('/clearcache',  function(req,res,next){
  var redis = require("redis");
  var client = redis.createClient(config.redis);
  client.flushdb(function(){
      return res.json({});
  });		
})  

router.get('/info', HP.TaskAccess("IsCalcLogWatcher"), function(req,res,next){
	return res.json({
		Queues   : RabbitManager.queueLength,
		Log      : _.values(RabbitManager.CalcLog),
		Channels : _.values(RabbitManager.Consumers)
	});
})  

module.exports = router;