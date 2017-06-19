var _      = require('lodash');
var api    = require('./helper.js');
var config = require('../config.js');
var async  = require('async');
var f      = require('./functions.js');
var fs     = require('fs');
var moment = require('moment');

var debugDir       = config.dir+'/static/debugProd';
var workingLogPath = debugDir + '/log.txt';
var periodsNum     = config.debugPeriodsNum || 7;

var getMemoryUsage = function(done){
	return done(null,_.values(process.memoryUsage()));
}

var getCalcRunning = function(done){
	var exec = require('child_process').exec;
	var cmd = 'ps ax |grep calc-process.js';
	exec(cmd, function(error, stdout, stderr) {
	  return done(null,stdout.split('\n').length-3);
	});
}

var getLoad = function(done){
	var exec = require('child_process').exec;
	var cmd = "uptime | awk -F'[a-z]:' '{ print $2 }'";
	exec(cmd, function(error, stdout, stderr) {
		stdout = stdout.replace(/, /g,' ').replace(/,/g,'.');
		return done(null,_.trim(stdout.replace('\n','')));
	});	
}

var getRAM = function(done){
	var exec = require('child_process').exec;
	var cmd = "free | awk 'FNR == 3 {print $3/($3+$4)*100}'";
	exec(cmd, function(error, stdout, stderr) {
		return done(error,Math.round(parseFloat(stdout.replace('\n',''))*100)/100);
	});	
}

var getUsersOnline = function(done){
	f.m('user').count({lastonline:{$gte:moment().subtract(2,'hours')._d}}).exec(function(err,cC){
		return done(null,cC);
	})
}

function getCPUinfo(done) {
	var exec = require('child_process').exec;
	var cmd = "cat /proc/cpuinfo | grep -i -e 'processor' -e 'model name' -e 'vendor_id' -e 'cpu MHz' -e 'cache size'";
	exec(cmd, function(error, stdout, stderr) {
	  return done(error,stdout);
	});	
}

function getRAMinfo(done) {
	var exec = require('child_process').exec;
	var cmd = "cat /proc/meminfo | grep -i -e 'MemTotal' -e 'MemFree' -e 'MemAvailable' -e 'SwapTotal' -e 'SwapFree'";
	exec(cmd, function(error, stdout, stderr) {
	  return done(error,stdout);
	});	
}

function writeTick (fileName){
	async.parallel([
		getUsersOnline,
		getCalcRunning,
		getMemoryUsage,
		getLoad,
		getRAM],
		function (err, results){
			if (err) console.log('err',err);
			fs.mkdir(debugDir, null, function(err) {
				if (err) {
					if (err.code != 'EEXIST') console.log(err);
				}

				var rToWrite = [
					'-/-',
					moment().toISOString()
				];

				rToWrite = _.flatten(rToWrite.concat(results));
				fs.appendFile(fileName,rToWrite.join(" ")+'\n\r',function(err){
					if (err) console.log(err);
				});
			});
		}
	);
}


function writeStaticInfo(fileName){
	async.parallel([
		getCPUinfo,
		getRAMinfo],
		function(err,results){
			var CPUinfo = results[0];
			var RAMinfo = results[1];
			fs.mkdir(debugDir, null, function(err) {
	    		if (err) {
	        		if (err.code != 'EEXIST') console.log(err);
	    		} 
	    		var rToWrite = [
	    			'------------------- Station Info -------------------------',
	    			'*                       CPU:                              *',
	    			'' + CPUinfo,
	    			'*                      Memory:                            *',
	    			'' + RAMinfo,
	    		];
	    		fs.appendFileSync(fileName,rToWrite.join("\n"));
			});
		}
	);
}



function checkRecentFiles(done){
	var filesCount = periodsNum + 1; //periodsNum archive files + now recording file

	var crTimes = [];

	fs.exists(debugDir,function(res){
		if (!res) return done && done(true);

		var logs = fs.readdirSync(debugDir); 

		if (!logs.length) return done && done(true);

		logs.forEach(function (logName, index){
			if (logName!='log.txt') {

				logName = _.trimStart(logName, 'log_'  );
				logName = _.trimEnd(logName,'.txt\n');

				if (moment(logName).isValid())
					crTimes.push(moment(logName));
			}
		});


		deleteOldFiles(crTimes,function (){
			renameLastFile(crTimes,function(flag){
				return done && done(flag);
			});
		});

		function renameLastFile(crTimes,done) {
			var lastFileDate = moment.max(crTimes);
			
			if ((moment().diff(lastFileDate,'days') > 1)||(!crTimes.length)) {
				var newFileName = debugDir + '/log_' + moment().subtract(1,'days').toISOString() + '.txt';
				fs.rename(workingLogPath, newFileName, function(err) {
					if (err) console.log(err);
					console.log('logfile renamed')
					return done && done(true);
				});
			} else {
				return done && done(false);
			}
		}

		function deleteOldFiles(crTimes, done) {

			if (crTimes.length > periodsNum) {

				var countFilesToDelete = crTimes.length - periodsNum;
				var filesToDelete = [];
				
				for (var i=0; i<countFilesToDelete; i++) {
					var fileNameToDelete = debugDir + '/log_' + moment.min(crTimes).toISOString() + '.txt';
					filesToDelete.push(fileNameToDelete);
				}

				if (filesToDelete.length) {
					filesToDelete.forEach(function(fileName) {
						fs.unlink(fileName,function(){
							console.log('logfile deleted')
							return done && done();
						});
					});
				}
			} else {
				return done && done();
			}
		}

	});
	

}


function debugRecording() {
	if (config.debugRecording){
		// setTimeout(function(){
		// 	setInterval(function(){
		// 		checkRecentFiles(function(isNewFile){
		// 			if (isNewFile) writeStaticInfo(workingLogPath);
		// 			writeTick(workingLogPath);
		// 		});
		// 	},5000);
		// },5000);
	}	
}

module.exports.debugRecord = debugRecording;
