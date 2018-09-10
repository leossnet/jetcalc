var mongoose = require('mongoose'),
config       = require('../config.js'),
_            = require('lodash'),
async        = require('async'),
moment       = require('moment');



var init = {


	checkState: function(done){
		var tasks = [init.initAdmin,init.initTask,init.initUserTask];
		async.eachSeries(tasks,function(task,next){
			task(next);
		},function(err){
			var LIB = require(__base+"lib/helpers/lib.js");
			LIB.SyncPriveleges(done);
		});
	},

	initAdmin: function(done){
		var User = mongoose.model('user');
		User.findOne({CodeUser: 'admin'}).exec(function(err,U){
			if (!U) {
				U = new User({
					CodeUser:	'admin',
					LoginUser:	'admin',
					NameUser:	'Администратор',
					CodeUser:	'admin',
					IsConfirmed:	true
				});
				U.password = 'admin';
				console.log("creating admin user",U);				
				U.save('admin',done);
			} else {
				return done(null);
			}
		})
	},
	initTask: function(done){
		var Task = mongoose.model('task');
		Task.findOne({CodeTask:'ADMIN'}).exec(function(err,T){
			if (!T) {
				T = new Task({
					CodeTask:	'ADMIN',
					NameTask:	'Администратор',
					SNameTask:	'Администратор'
				});
				console.log("creating task ",T);				
				T.save('admin',done);
			} else {
				return done(null);
			}
		});
	},
	initUserTask: function(done){
		var UserTask = mongoose.model('usertask');

		UserTask.findOne({CodeUserTask: 'admin_ADMIN'}).exec(function(err,UT){
			if (!UT) {
				UT = new UserTask({
					CodeUserTask:'admin_ADMIN',
					CodeUser:'admin',
					CodeTask:'ADMIN',
				});
				console.log("creating user task ",UT);
				UT.save('admin',done);
			} else {

				return done(null);
			}
		})

	},

}

module.exports = init;