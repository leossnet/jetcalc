var mongoose = require('mongoose');
var router   = require('express').Router();
var _        = require('lodash');
var RabbitManager = require('../../src/rabbitmq.js');
var lib        = require(__base+'lib/helpers/lib.js');
var Structure = require(__base+"classes/jetcalc/Helpers/Structure.js");

var config = require(__base+"config.js");
var rabbitPrefix = config.rabbitPrefix;



router.get('/structure', function(req,res,next){
	var Context = lib.ReqContext(req);
	Worker.get(Context,function(err,Ans){
		if (err) return next(err);
		return res.json(Ans);
	})
})

router.get('/cells', function(req,res,next){
	RabbitManager.CountConsumers(function(ConsumersCount){
		if (!ConsumersCount){
			return next('Проблема с сервером. Ни одного расчетчика не запущено');		
		}
		var Context = lib.ReqContext(req);
		Context.Priority = 9;
		RabbitManager.CalculateDocument(Context,function(err,Result){
			if (err) return next(err);
			return res.json(Result);
		})
	})
})

module.exports = router;