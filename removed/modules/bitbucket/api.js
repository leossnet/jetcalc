var mongoose = require('mongoose');
var router   = require('express').Router();
var _        = require('lodash');
var async    = require('async');
var HP = require(__base+'lib/helpers/lib.js').Permits; 
var request = require("request");


var BitBucketHelper = (new function(){
	var self = this;

	var config = require(__base+"config.js");

	self.Comments = [];

	self.LastTry = null;

	self.Login = config.bitbucket.username;
	self.Password = config.bitbucket.password;
	self.Project = config.bitbucket.project;
	self.ProjectOwner = config.bitbucket.projectowner;


	self.Commits = function(done){
		if (self.LastTry && (Date.now()-self.LastTry)<1000*1*60) return done(null,self.Comments);
		self.LastTry = Date.now();
		var url = 'https://api.bitbucket.org/2.0/repositories/'+self.ProjectOwner+'/'+self.Project+'/commits';
		request.get(url, {
		  'auth': {
		    'user': self.Login,
		    'pass': self.Password,
		    'sendImmediately': true
		  }
		},function(err,data){
			var comments = [];
			try{
				var Data = JSON.parse(data.body);
				comments = _.filter(_.map(Data.values,function(D){
					var Data = _.pick(D,["hash","date","message"]);
					if (Data.message.trim()=="Merged production into master"){
						Data.message = "Обновление боевого сервера";
					}					
					return Data;
				}),function(A){
					return A.message.match(/[А-Яа-я]/);
				})
			} catch(e){
				return done(e);
			}
			self.Comments = comments;
			return done(null,comments);
		})
	}
	return self;
})

router.get('/pull', HP.TaskAccess("IsGitAdmin"), function(req,res,next){
	return res.json({status:false});
	console.log("updating server");
	
})

router.get('/status', function(req,res,next){
	BitBucketHelper.Commits(function(err,Data){
		return res.json(Data);
	})
})


module.exports = router;