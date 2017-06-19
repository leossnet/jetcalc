var router     = require('express').Router();
var _          = require('lodash');
var lib        = require(__base+'lib/helpers/lib.js');
var HP = lib.Permits; 

var AFHelper = require(__base+'src/afill.js');




router.get('/save',  HP.TaskAccess("IsAFSaveAllow"), function(req,res,next){
	var Context = lib.ReqContext(req);
	Context.LoginUser = req.user.LoginUser;
	var AF = new AFHelper();
	AF.UpdateAll(Context,function(err){
		if (err) return next(err);
		return res.json({});
	})
})

router.get('/calculate', HP.TaskAccess("IsAFSaveAllow"),  function(req,res,next){
	var Context = lib.ReqContext(req);
	var AF = new AFHelper();
	AF.HasAF(Context,function(err,R){
		if (err) return next(err);
		if (!R) return res.json({});
		AF.GetAF(Context,function(err,Answ){
			return res.json(Answ);
		})
	})
})






module.exports = router