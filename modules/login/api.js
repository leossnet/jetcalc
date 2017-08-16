var _ = require('lodash');
var async = require('async');
var router   = require('express').Router();
var passport = require(__base+'src/passport.js');
var mongoose = require("mongoose");
var config = require(__base+"config.js");
var LIB = require(__base+'lib/helpers/lib.js');
var Mailer   =  require(__base+'src/mailer.js');
var SocketManager =  require(__base+'src/socket.js');


var AlienDeviceGuard = (new function(){
	var self = this;

	self.DisconnectTimeouts = {};

	self.UserConnected = function(socket){
		var CodeUser = socket.request.session.user.CodeUser;
		if (self.DisconnectTimeouts[CodeUser]){
			clearTimeout(self.DisconnectTimeouts[CodeUser]);
		}
	}

	self.UserDisconnected = function(socket){
		var CodeUser = socket.request.session.user.CodeUser;
		if (socket.request.session.alienDevice){
			if (socket.request.session && socket.request.session.user && !_.isEmpty(CodeUser)){
				self.DisconnectTimeouts[CodeUser] = setTimeout(function(req){
					return function(){
						console.log("User with alien device was forced disconnect",req.session.user.CodeUser);
						req.logout();
						req.session.destroy();
					}
				}(socket.request),5000);
			}		
		}
	}

	SocketManager.Events.on("userconnected",self.UserConnected);
	SocketManager.Events.on("userdisconnected",self.UserDisconnected);

	return self;
})






var ConfirmErr = {
	Module:"Login", 
	Redirect:"/login"
}
var SignupHelper = require(__base+'src/signupflow.js');

router.post('/signup',  LIB.Require(['Mail','NameUser']), function(req, res, next) {
	var Request = mongoose.model("request");
	var Info = _.pick(req.body,["NameUser","TabNum","JobTitle","Mail","MobilePhone","WorkPhone","Birthday","NameObjs","Comments"]);
	Request.findOne({Mail: Info.Mail,IsAccept:false}).isactive().exec(function(err,C){
		if (C) return next("requestexist");
		mongoose.model('user').findOne({Mail: Info.Mail}).isactive().exec(function(err,U){
			if (U) return next('requestuserexist')
			var R = new Request(Info);
			R.CodeRequest = mongoose.Types.ObjectId();
			R.DateRequest = Date.now();
			R.MailCode = mongoose.Types.ObjectId();
			R.IsVerified = false;
			R.save("",function(err){
				if (err) return next(err);
				Mailer.CreateSimpleMail("request_approve",{
					MailCode:'/api/modules/login/requestconfirm/?code='+R.MailCode,
					NameUser:R.NameUser,
					Mail:R.Mail,
				},function(){
					console.log("signup email is sent");
				})	
				return res.end();
			})
		})
	})
});

router.get('/requestconfirm',function(req,res,next){
	var MailCode = '';
	if (req.query && req.query.code)  MailCode = req.query.code;
	if (MailCode) {
		mongoose.model('request').findOne({MailCode: MailCode}).exec(function(err,Request){
			if (Request) {
				Request.IsVerified = true;
				Request.MailCode = '';
				Request.save("",function(err){
					SignupHelper.ConfirmRequest(Request.CodeRequest,function(err){
						if (err) console.log(err);
						return next(_.merge(ConfirmErr,{Mode:"RequestMailIsConfirmed"}));;	
					});					
				})
			} else return next(_.merge(ConfirmErr,{Mode:"WrongRequestConfirmCode"}));
		});
	} else return next(_.merge(ConfirmErr,{Mode:"WrongRequestConfirmCode"}));
});

router.get('/byemail', function(req, res, next) {
	var MailCode = '';
	if (req.query && req.query.code) MailCode = req.query.code;
	if (MailCode) {
		mongoose.model('user').findOne({MailCode:MailCode}).isactive().exec(function(err,U){
			if (U){
				req.logIn(U, function(err) {
					mongoose.model('user').findByIdAndUpdate(U._id,{MailCode:'',DoResetPass:true},function(err){
						res.redirect('/');
					});
				});
			} else return next(_.merge(ConfirmErr,{Mode:"WrongResetConfirmCode"}));
		});
	} else return next(_.merge(ConfirmErr,{Mode:"WrongResetConfirmCode"}));
});

router.post('/bypassword', function(req, res, next) {
	passport.authenticate('local', function(err, user, info) {
		if (info && info.message) {
			return res.json({err:info.message})
		} else {
			if (!user)  return next('usernotfound');
			if (req.body && req.body.alienDevice=='true') {
				req.session.alienDevice = true;
			} else {
				req.session.alienDevice = false;
			}
			req.logIn(user, function(err) {
				return res.json({status:'ok'});
			});
		}
	})(req, res, next);
});

router.post('/setpassword',   function(req, res, next) {
	if (!req.body.password) return next('passwordisempty');
	mongoose.model('user').findOne({_id: req.user._id}).isactive().exec(function (err,U){
		if (!U) return next("usernotfound")
		U.password = req.body.password;
		U.DoResetPass = false;
		U.save(req.user.CodeUser,function(err){
			if (err) return next(err);
			return res.end();
		})
	});
});

router.post('/byemail', function(req, res, next) {
	var email = (req.body['username']+'').toLowerCase().trim();
	mongoose.model("user").find({Mail:email}).isactive().exec(function(err,Users){
		if (!Users.length) return next("usernotfound");
		if (Users.length>1) return next("toomanyusers");
		var User = _.first(Users);
		if (!User.IsConfirmed) return next("usernotconfirmed");
		var  Mailer   =  require(__base+'src/mailer.js');
		Mailer.CreateMail("reset",{
			BaseUrl:'/api/modules/login/byemail/?code=',
			UseMailCode:true,
			CodeUser:User.CodeUser
		},function(){
			console.log("recover email is sent");
		})	
		return res.json({status:'emailwassend'});	
	})
});  


router.get('/logout',function(req,res){
	req.session.destroy();
	return res.end();
});


router.get('/me',  function(req,res){
	var Emulate = null;
	if (req.session.MainUser){
		Emulate = req.session.MainUser;
	}
	res.json({me:req.user,emulate:Emulate});
});

router.put('/profile',function(req,res,next){
	mongoose.model("user").findOne({CodeUser:req.user.CodeUser}).isactive().exec(function(err,U){
		if (!U) return next("Пользователь не найден");
		var Fields = ['UserPhoto','NameUser','MobilePhone','WorkPhone','Mail','Comment'];
		var Data   = req.body;
		Fields.forEach(function(F){
			U[F] = Data[F];
		})
		U.save(req.user.CodeUser,function(err){
			if (err) return next(err);
			return res.json({});
		})
	})
});





module.exports = router;