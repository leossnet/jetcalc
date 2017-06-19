var router = require('express').Router();
var os     = require('os');
var _      = require('lodash');
var api    = require(__base + 'lib/helper.js');
var config = require(__base + 'config.js');
var async  = require('async');

function doProfiling(count,done){
	var org='1054',doc='nalog',period='3',year='2014',currency="rub",IsInput=false;
	var Reparser = require(__base + 'lib/calc/reparser.js');
	var testsCount = count, tasks = [];
	var staticInfo = {};
	var testFunc = function(useMultiThread,cpus){
		return function(done){
			if (!staticInfo[useMultiThread]) staticInfo[useMultiThread] = {};
			if (!staticInfo[useMultiThread][cpus]) staticInfo[useMultiThread][cpus] = {};
			var r = new Reparser (doc,org,period,year,currency,IsInput);
			if (useMultiThread) r.useMultiThread = true; else r.useMultiThread = false;
			r.cpus = cpus;
			r.calculate(function(){
				var result = r._rawtimes;
				r = null;
				console.log(useMultiThread,cpus,"Done!");
				for (var i in result){
					if (!staticInfo[useMultiThread][cpus][i])	staticInfo[useMultiThread][cpus][i] = 0;
					staticInfo[useMultiThread][cpus][i] += parseFloat(result[i]);
				}
				return done && done ();
			})
		}
	}
	for (var i = 0; i<testsCount; i++){
		for (var j=0; j<=config.cpus; j++){
			var b = true; if (!j) b = false;
			tasks.push(testFunc(b,j));
		}
	}
	tasks.push(function(callback){
		for (var useM in staticInfo){
			for (var procC in staticInfo[useM]){
				for (var inf in staticInfo[useM][procC]){
					staticInfo[useM][procC][inf] = Math.round(1000*(staticInfo[useM][procC][inf]/testsCount))/1000;
				}
			}
		}
		return done(staticInfo);
	})
	async.series(tasks);
}

function setSockets(req) {
	var socket      = api.io.sockets.connected[req.session.socket];
	if (!socket) return;
	var loopLoad    = null;
	var loopFreemem = null;

	delete socket._events.sysmonitor_leave;
	delete socket._events.sysmonitor_start;

	socket.on('sysmonitor_leave', function(){
		clearInterval(loopLoad);
		clearInterval(loopFreemem);
	});

	socket.on('sysmonitor_start', function(){
		socket.emit('sysmonitor_load', os.loadavg());
		loopLoad = setInterval(function() {
			socket.emit('sysmonitor_load', os.loadavg());
		},5000);
		loopFreemem = setInterval(function(){
			socket.emit('sysmonitor_freemem', os.freemem())
		},1000);
	});
}

router.get('/api/profiler', function(req,res) {
	var count = 10;
	doProfiling(count,function(result){
		var useMR = false,procCR=0,lowest=null,key='Вычисление развернутых формул';
		for (var useM in result){
			for (var procC in result[useM]){
				for (var inf in result[useM][procC]){
					if (inf.indexOf(key)>=0 && (!lowest || lowest>result[useM][procC][inf])){
						lowest = result[useM][procC][inf];
						useMR = useM; procCR = procC;
					}
				}
			}
		}
		var answer = {
			recommend:{
				useMultiThread:useMR,
				cpus:procCR,
				'Тест запускался':count
			},
			data:result
		}
		return res.json(answer);
	})
});

var staticInfo = {};

router.get('/api/sysmonitor', function(req,res) {
	staticInfo = {};
	staticInfo.hostname = os.hostname();
	staticInfo.arch     = os.arch();
	staticInfo.platform = os.platform();
	staticInfo.type     = os.type();
	staticInfo.release  = os.release();
	staticInfo.totalmem = os.totalmem();
	staticInfo.cpuModel = _.first(_.map(os.cpus(),'model'));

	setSockets(req);
	return res.json(staticInfo);
});

module.exports.router = router;
