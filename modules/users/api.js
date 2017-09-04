var mongoose = require('mongoose');
var _ = require('lodash');
var async = require('async');
var router = require('express').Router();
var api = require(__base+'/lib/helper.js');
var ModelSaver = require(__base + 'src/modeledit.js');
var LIB = require(__base+'lib/helpers/lib.js');
var HP = LIB.Permits; 
var config   =  require(__base+'config.js');

var SignupHelper = require(__base+'src/signupflow.js');


router.get('/regworkflow', HP.TaskAccess("IsRequestApprover"), function(req,res,next){
	var Result = {
		RequestApprover:[],
		UserAcceptors:{

		}
	};
	//SignupHelper.UserAcceptors
	//SignupHelper.RequestApproveUsers

})


// Registration
router.get('/regcounts',function(req,res,next){
	var R = {Requests:0,NewUsers:0};
	mongoose.model("request").count({IsActive:true,IsAccept:false,IsVerified:true}).exec(function(err,Requests){
		R.Requests = Requests; 
		var Objs = HP.AvPrivelegeObj("IsUserAcceptor",req.session.permissions);
		if (!Objs.length) return res.json(R);
		mongoose.model("user").count({IsActive:true,IsConfirmed:false,CodeObj:{$in:Objs}}).exec(function(err,NewUsers){
			R.NewUsers = NewUsers;
			return res.json(R);
		})
	})
})

router.post('/requestaccept', LIB.Require(['CodeObj']), HP.TaskAccess("IsRequestApprover"), function(req,res,next){
	var D = req.body, Link = mongoose.model('userrequest'), User = mongoose.model("user");
	mongoose.model("request").findOne({CodeRequest:D.CodeRequest}).isactive().exec(function(err,Request){
		if (!Request) return next("Запрос не найден");
		["NameUser","TabNum","JobTitle","Mail","MobilePhone","WorkPhone","Birthday","NameObjs","Comments","CodeObj"].forEach(function(Field){
			Request[Field] = D[Field];
		})
		Request.IsAccept = true;
		Request.save(req.user.CodeUser,function(err){ // 1. Update Request
			mongoose.model('obj').findOne({CodeObj: Request.CodeObj}).isactive().lean().exec(function(err,Obj){
				var NewUser = new User(_.pick(D,["NameUser","TabNum","JobTitle","Mail","MobilePhone","WorkPhone","Birthday"]));
				NewUser.LoginUser = "";
				NewUser.CodeObj = Obj.CodeObj;
				NewUser.save(req.user.CodeUser,function(err){ // 2. Create User
					var nUserRequest = new Link({CodeUser:NewUser.CodeUser,CodeRequest:Request.CodeRequest});
					nUserRequest.save(req.user.CodeUser,function(err){ // 3. Create UserRequest
						if (err) return next(err);
						// 4. Send Mails
						SignupHelper.AcceptRequest(Request.CodeRequest,function(){
							console.log("AcceptRequest All Is Ok");
						})
						return res.end();
					});
				})
			})
		});
	})
});

router.get('/sendrequizites', LIB.Require(['CodeUser']), HP.TaskAccess("IsUserAcceptor"), function(req,res,next){
	var Mailer   =  require(__base+'src/mailer.js'), CodeUser = req.query.CodeUser;
	mongoose.model("user").findOne({CodeUser:CodeUser}).isactive().exec(function(err,User){
		if (!User) return next("usernotfound");
		if (!User.IsConfirmed) return next("usernotconfirmed");
		if (_.isEmpty(User.LoginUser)) return next("nologinuser");
		Mailer.CreateMail("ivite",{
			BaseUrl:'/api/modules/login/byemail/?code=',
			UseMailCode:true,
			LoginUser:User.LoginUser,
			CodeUser:User.CodeUser
		},function(){
			console.log("invite email is sent");
		})	
		return res.json({status:'emailwassend'});	
	})
});

router.post('/useraccept', HP.TaskAccess("IsUserAcceptor"), function(req,res,next){
	var D = req.body.User2Approve, User = mongoose.model("user");
	User.findOne({CodeUser:D.CodeUser}).isactive().exec(function(err,User2Approve){
		if (!User2Approve) return next("Пользователь не найден");
		["NameUser","TabNum","JobTitle","Mail","MobilePhone","WorkPhone","Birthday","NameObjs","CodeObj","LoginUser"].forEach(function(Field){
			User2Approve[Field] = D[Field];
		})
		User2Approve.IsConfirmed = true;
		User2Approve.save(req.user.CodeUser,function(err){
			if (err) return next(err);
			SignupHelper.ConfirmUser(User2Approve.CodeUser,function(){
				console.log("ConfirmUser All Is Ok");
			})
			return res.end();
		})
	})
});


// Users
router.post('/userpermit', HP.TaskAccess("IsDocPermissionAssigner"), function(req,res,next){
	var Data = req.body.userpermit, M = mongoose.model("userpermit"), CFG = M.cfg();
	LIB.FindOrCreate("userpermit",Data.CodeUserPermit,function(err,Mod){
		var NewValue = _.merge(_.pick(Mod,CFG.EditFields),_.pick(Data,CFG.EditFields));
		for (var K in NewValue) Mod[K] = NewValue[K];
		Mod.save(req.user.CodeUser,function(err){
			if (err) return next(err);
			return res.json({});
		})
	})
})

router.post('/usertask', HP.TaskAccess("IsFunctionAssigner"), function(req,res,next){
	var Data = req.body.usertask, M = mongoose.model("usertask"), CFG = M.cfg();
	LIB.FindOrCreate("usertask",Data.CodeUserTask,function(err,Mod){
		var NewValue = _.merge(_.pick(Mod,CFG.EditFields),_.pick(Data,CFG.EditFields));
		for (var K in NewValue) Mod[K] = NewValue[K];
		Mod.save(req.user.CodeUser,function(err){
			if (err) return next(err);
			return res.json({});
		})
	})
})

router.delete('/usertask', HP.TaskAccess("IsFunctionAssigner"),  function(req,res,next){
	var CodeUserTask = req.body.CodeUserTask;
	mongoose.model("usertask").findOne({CodeUserTask:CodeUserTask})
	.isactive()
	.exec(function(err,CP){
		if (!CP) return next("Роль не найдена");
		CP.remove(req.user.CodeUser,function(err){
			res.json({});
		})

	})
})

router.delete('/userpermit', HP.TaskAccess("IsDocPermissionAssigner"), function(req,res,next){
	var CodeUserPermit = req.body.CodeUserPermit;
	mongoose.model("userpermit")
	.findOne({CodeUserPermit:CodeUserPermit})
	.isactive()
	.exec(function(err,CP){
		if (!CP) return next("Пропуск не найден");
		CP.remove(req.user.CodeUser,function(err){
			res.json({});
		})

	})
})

// Tasks (Roles)
router.get('/priveleges',  function(req,res,next){
	mongoose.model("privelege").find({},"CodePrivelege NamePrivelege ModuleName").isactive().lean().sort({ModuleName:1}).exec(function(err,Roles){
		var Answer = {}
		Roles.forEach(function(R){
			if (!Answer[R.ModuleName]) Answer[R.ModuleName] = [];
			Answer[R.ModuleName].push(R);
		})
		return res.json(Answer);
	})
})
router.get('/task/:code',  function(req,res,next){
	mongoose.model("task").findOne({CodeTask:req.params.code},"CodeTask Link_taskprivelege").populate("Link_taskprivelege").isactive().exec(function(err,Task){
		if (!Task) return next ("Роль не найдена");
		return res.json(Task);
	})
})

router.put('/task', HP.TaskAccess("IsFunctionEditor"),  function(req,res,next){
	var CodeTask = req.body.CodeTask;
	var Priveleges  = _.map(req.body.Priveleges,function(P){
		return {CodePrivelege:P,CodeTask:CodeTask};
	});
	var M = new ModelSaver(req.user.CodeUser);
	M.SaveModel("task",{CodeTask:CodeTask},function(err){
		if (err) return next(err);
		M.SaveLinks("taskprivelege",Priveleges,function(err){
			if (err) return next(err);
			return res.json({});
		})
	})
})

router.get('/permits',  function(req,res,next){
	var Answer = {Roles:[],AddRoles:[],PeriodGrps:[]};
	var RoleModel = mongoose.model("role"), PGroupModel = mongoose.model("periodgrp");
	RoleModel.find({},"CodeRole NameRole IsExtended").isactive().lean().sort({NameRole:1}).exec(function(err,Roles){
		Roles.forEach(function(Role){
			(Role.IsExtended)? Answer.AddRoles.push(Role) : Answer.Roles.push(Role);
		})
		PGroupModel.find({ForPermits:true},"CodePeriodGrp NamePeriodGrp").isactive().lean().exec(function(err,Grs){
			Answer.PeriodGrps = Grs;
			return res.json(Answer);
		})
	})
})

router.get('/permit', function(req,res,next){
	var CodePermit = req.query.CodePermit;
	mongoose.model("permitrole").find({CodePermit:CodePermit},"CodePermitRole CodePermit CodePeriodGrp CodeRole DoBlock DoWrite DoRead").isactive().lean().exec(function(err,cRoles){
		if (err) return next(err);
		return res.json(cRoles);
	})
})

router.put('/permit', HP.TaskAccess(["IsDocPermissionAssigner","IsExtendedDocPermissionEditor"]),function(req,res,next){
	var CodePermit = req.body.CodePermit;
	var M = new ModelSaver(req.user.CodeUser);
	M.SaveModel("permit", {CodePermit:CodePermit},function(err){
		if (err) return next(err);
		M.SaveLinks("permitrole",req.body.Roles,function(err){
			if (err) return next(err);
			return res.json({});
		})
	})
})

// Fix
router.get('/user/:code', function(req,res,next){
	var Answer = {
		User:null,
	}
	var CU = req.params.code;
	mongoose.model("user").findOne({CodeUser:CU},"CodeUser LoginUser NameUser JobTitle Mail WorkPhone MobilePhone UserPhoto CodeObj Link_usertask Link_userpermit")
	.populate("Link_usertask","CodeUserTask CodeUser CodeTask CodeObj CodeObjGrp CodeDoc CodeRole")
	.populate("Link_userpermit","CodeUserPermit CodeUser CodePermit CodeObj CodeGrp")
	.populate("Link_userrequest","CodeRequest")
	.lean().isactive().exec(function(err,User){
		Answer.User = User;
		async.parallel({
			Permits: function(callback){
				var CodePermits = _.map(User.Link_userpermit,"CodePermit");
				if (!CodePermits){
					return callback(null,[]);
				}
				mongoose.model("permit").find({CodePermit:{$in:CodePermits}},"CodePermit NamePermit SNamePermit IsPublic IsPersonal Link_permitrole Link_userpermit")
				.populate("Link_permitrole")
				.populate({
					path:"Link_userpermit",
					match:{CodeUser:CU}
				})
				.isactive()
				.sort({IsPublic:-1,NamePermit:1}).lean().isactive().exec(callback);
			},
			Request: function(callback){
				var CodeRequests = _.map(User.Link_userrequest,"CodeRequest");
				if (!CodeRequests){
					return callback(null,null);
				}
				
				mongoose.model("request").findOne({CodeRequest: _.first(CodeRequests)}).isactive().lean().exec(callback);
			}
		},function(err,results){

			if (err) next(err);

			Answer.Permits = results.Permits;
			Answer.Request = results.Request;

			return res.json(Answer);
		});
	})
});




var ForceLoginUser = function(CodeUser, MainUser, req, done){
	var PL =  require(__base+'/src/permloader.js');
	mongoose.model("user").findOne({CodeUser:CodeUser}).isactive().exec(function(err,U){
		if (!U) return done("Пользователь не найден");
		var P = new PL(CodeUser);
		req.logIn(U, function(err) {
		    P.Load(function(err,Perms){
		        req.session.permissions = Perms;
		        req.session.MainUser = MainUser;
		        req.session.save(function(err){
		      		return done();
		        });
		    })
		}); 
	})
}


router.get('/loginas', LIB.Require(['CodeUser']), HP.UserTaskAccess("IsLoginAsTester"), function(req,res,next){
	ForceLoginUser(req.query.CodeUser, req.user.CodeUser, req, function(err){
		if (err) return next(err);
		res.json({});
	})
});

router.get('/loginasback', function(req,res,next){
	if (!req.session.MainUser) return next("Нет аккаунта для возврата");
	ForceLoginUser(req.session.MainUser, null, req, function(err){
		if (err) return next(err);
		res.json({});
	})
});


router.get('/avatar/:CodeUser', function(req,res,next){
	var CodeUser = req.params.CodeUser;
	var config = require(__base+"config.js");
	mongoose.model('user').findOne({CodeUser:CodeUser},'NameUser UserPhoto').isactive().lean().exec(function(err,U){
		if (!U) return next("User not found");
		if (_.isEmpty(U.UserPhoto)){
			var f = config.staticDir+'/media/fempty.png', m = config.staticDir+'/media/mempty.png', result = m;
			try{
				if (_.last(U.NameUser)=='а') result = f;
			} catch(e){
				;
			}
			res.sendFile(result);
		} else {
			var Gfs = require(__base+"src/gfs.js");
			Gfs.PipeFileStreamToRes(U.UserPhoto,res,next);
		}				
	})
})


module.exports = router;