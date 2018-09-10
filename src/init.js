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
			console.log("found user",U);
			if (!U) {
				U = User();
				U.CodeUser = 'admin';
				U.LoginUser = 'admin';
				U.NameUser = 'admin';
				U.password = 'admin';
				U.IsConfirmed = true;
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
				T = Task();

				T.CodeTask = 'ADMIN';
				T.NameTask = 'Администратор';
				T.SNameTask = 'Администратор';
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
				UT = UserTask();

				// UT.CodeUserTask = 'admin_ADMIN';
				UT.CodeUser = 'admin';
				UT.CodeTask = 'ADMIN';
				console.log("creating user task ",UT);
				UT.save('admin',done);
			} else {

				return done(null);
			}
		})

	},

}

module.exports = init;