var _      = require('lodash');
var api    = require('./helper.js');
var config = require('../config.js');
var router  = require('express').Router();

var avCommands = ['status','pull'];
var gitDir       = config.dir;


function checkStatus(done) {
	var exec = require('child_process').exec;

	exec("git fetch https://ASSOI_USER:derparole12j@bitbucket.org/zubra12/ugmk.git",function(error, stdout, stderr) {
		if (!error) {
			console.log('here');
			var exec = require('child_process').exec;
			exec('./lib/gitSh/gitCheck.sh', function(error, stdout) {
				stdout = stdout.replace('\n','')
				return done(error,stdout);
			});
		}
	});
}

function pull(done) {
	// checkStatus(function(err,status) {
		// if (err) {
		// 	console.log(err);
		// 	return done(err);
		// }
		// if (status == "Up-to-date") {
		if (true || status == "Need to pull" || status == "Diverged") {
			var exec = require('child_process').exec;
			var cmd = "git pull https://ASSOI_USER:derparole12j@bitbucket.org/zubra12/ugmk.git";
			exec(cmd, function(error, stdout, stderr) {
				if (error) console.log(error);
				checkStatus(function(err,status){
					if (err) console.log(err);
					// return done(err,status);
					return done(err,"Up-to-date");
				})
			});
		} else {
			return done(err,"Up-to-date");
		}
	// })
}

function reload(done) {
	var exec = require('child_process').exec;

	exec('pm2 reload ugmk.json', function(error, stdout) {
		return done(error,stdout);
	});
}

router.get('/api/git/status',api.forceCheckRole(['IsAdmin']),function(req,res) {
	checkStatus(function(err,status){
		if (err) res.json({err: err});
		if (status == "Need to pull" || status == "Diverged") {
			res.json({'updAvailable': true});
		} else {
			res.json({'updAvailable': false});
		}
	});
});

router.get('/api/git/pull',api.forceCheckRole(['IsAdmin']),function(req,res){
	console.log('here')
	pull(function(err,status) {
		console.log('here2')
		if (err) res.json({err: err});
		res.json({status: status});
		setTimeout(function(){
			reload(function(err,stdout){
			});
		},2000);
	});
});
module.exports.router = router;