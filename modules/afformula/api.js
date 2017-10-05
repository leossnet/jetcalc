var router     = require('express').Router();
var _          = require('lodash');
var lib        = require(__base+'lib/helpers/lib.js');
var HP = lib.Permits; 

router.put('/save',  HP.TaskAccess("IsAFSaveAllow"), function(req,res,next){
	var AFHelper = require(__base+'classes/jetcalc/Helpers/AutoFill.js');
	var Cx = lib.ReqContext(req);
	Cx.CodeUser = req.user.CodeUser;
	AFHelper.Update(Cx,function(err,R){
		if (err) return next(err);
		return res.json({});
	})
})

router.get('/calculate', function(req,res,next){
	var AFHelper = require(__base+'classes/jetcalc/Helpers/AutoFill.js');
	var Cx = lib.ReqContext(req);
	AFHelper.HasAF(Cx,function(err,R){
		if (err) return next(err);
		if (!R) return res.json({});
		AFHelper.GetAF(Cx,function(err,Answ){
			return res.json(Answ);
		})
	})
})






module.exports = router