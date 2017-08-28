var mongoose   = require('mongoose');
var router     = require('express').Router();
var _          = require('lodash');
var async      = require('async');
var LIB        = require(__base+'lib/helpers/lib.js');
var HP = LIB.Permits;  
var BizHelper = require(__base+"modules/biztran/helper.js");







router.get('/biztraninfo',  HP.TaskAccess("IsBiztranTuner"), function(req,res,next){
	BizHelper.Load(req.query.CodeDoc,function(err,Result){
		Result.prod = _.map(Result.prod,function(P){
			return P.prod;
		})
		return res.json(Result);
	})	
})

router.get('/rows',  HP.TaskAccess("IsBiztranTuner"), function(req,res,next){
	var CodeDoc = req.query.CodeDoc, CodeObj = req.query.CodeObj; 
	mongoose.model("biztranrow").find({CodeDoc:CodeDoc,CodeObj:CodeObj}).isactive().sort({Index:1}).lean().exec(function(err,List){
		return res.json(List);
	})	
})


router.post('/modifyrows',  HP.TaskAccess("IsBiztranTuner"), function(req,res,next){
	var CodeDoc = req.body.Context.CodeDoc, CodeObj = req.body.Context.CodeObj, Rows = req.body.Rows, CodeUser = _.clone(req.user.CodeUser); 
	Rows.forEach(function(Row){
		Row.CodeDoc = CodeDoc;
		Row.CodeObj = CodeObj;
	})
	Rows = _.filter(Rows,function(R){
		return !_.isEmpty(R.CodeBill);
	})
	var Editor = require(__base+"src/modeledit.js");
	var Saver = new Editor(CodeUser);
	Saver.SyncLinks("biztranrow", {CodeDoc:CodeDoc,CodeObj:CodeObj}, Rows, function(err){
		return res.end();
	})
})



module.exports = router