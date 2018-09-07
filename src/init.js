var mongoose = require('mongoose'),
config       = require('../config.js'),
_            = require('lodash'),
async        = require('async'),
moment       = require('moment');



var init = {
	checkInitState: function(done){
		var collectionsToCheck = [
			'user',
			'task',
			'usertask'
		];
		async.map(collectionsToCheck,function(model,callback){
			mongoose.model(model).count({},callback);
		},function(err,results){
			if (err) return done(err);
			else {
				var res = !Boolean(_.max(results))
				return done(null,res);
			}
		});
	},

	checkState: function(done){
		init.checkInitState(function(err,initState){
			if (initState) {
				var tasks = [init.initAdmin,init.initTask,init.initUserTask];
				async.series(tasks,function(err){
					var LIB = require(__base+"lib/helpers/lib.js");
					LIB.SyncPriveleges(done);
				});
			} else {
				return done(err);
			}
		})

	},

	initAdmin: function(done){
		var User = mongoose.model('user');

		User.findOne({CodeUser: 'admin'}).exec(function(err,U){
			if (!U) {
				U = User();
				U.CodeUser = 'admin';
				U.LoginUser = 'admin';
				U.NameUser = 'admin';
				U.password = 'admin';
				U.IsConfirmed = true;
				U.save(null,done);
			} else {
				return done(null);
			}
		})
	},
	initTask: function(done){
		var Task = mongoose.model('task');
		var UserTask = mongoose.model('usertask');
		Task.findOne({CodeTask:'ADMIN'}).exec(function(err,T){
			if (!T) {
				T = Task();

				T.CodeTask = 'ADMIN';
				T.NameTask = 'Администратор';
				T.SNameTask = 'Администратор';

				T.save(null,done);
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

				UT.save(null,done);
			} else {
				return done(null);
			}
		})

	},

}

module.exports = init;