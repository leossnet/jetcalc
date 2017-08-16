var mongoose   = require('mongoose');
var router     = require('express').Router();
var _          = require('lodash');
var async      = require('async');
var moment      = require('moment');
var LIB = require(__base+'lib/helpers/lib.js');
var HP = LIB.Permits; 


var LinkGroupper = function(Links){
	var ReGroupped = {};
	Links.forEach(function(Link){
		var D = moment(Link.DateEdit).format("DD.MM.YYYY");
		if (!ReGroupped[D]) ReGroupped[D] = [];
		ReGroupped[D].push(Link);
	})
	return ReGroupped;
}



router.get('/searchlinks', LIB.Require(['Model','Link','Code']), HP.TaskAccess("IsBasketManager"), function(req,res,next){ 
	var Result = {};
	var M = req.query.Model, L = req.query.Link, Code = req.query.Code;
	if (!mongoose.models[M]) return next(M+": Модель не найдена");
	if (!mongoose.models[L]) return next(L+": Модель не найдена");
	var Main = mongoose.model(M), Link = mongoose.model(L), mCFG = Main.cfg(), mCode = mCFG.Code, lCFG =Link.cfg(), lEF = lCFG.EditFields,  Q = {};	Q[mCode] = Code;
	Main.findOne(Q).isactive().lean().exec(function(err,MainObj){
		if (!MainObj) return next("Объект не найден");
		Link.find(Q).isactive().lean().exec(function(err,Existed){
			Link.find(_.merge(_.clone(Q),{IsActive:false})).sort({DateEdit:-1}).exec(function(err,Removed){
				Result.Existed = Existed;
				Result.Removed = LinkGroupper(Removed);
				return res.json(Result);
			})
		})
	})
})


router.put('/searchlinks', LIB.Require(['Model','Link','Code','Date']), HP.TaskAccess("IsBasketManager"), function(req,res,next){ 
	var Result = {};
	var M = req.body.Model, L = req.body.Link, Code = req.body.Code, DateRestore = req.body.Date;
	if (!mongoose.models[M]) return next(M+": Модель не найдена");
	if (!mongoose.models[L]) return next(L+": Модель не найдена");
	var Main = mongoose.model(M), Link = mongoose.model(L), mCFG = Main.cfg(), mCode = mCFG.Code, lCFG =Link.cfg(), lEF = lCFG.EditFields,  Q = {};	Q[mCode] = Code;
	Main.findOne(Q).isactive().exec(function(err,MainObj){
		if (!MainObj) return next("Объект не найден");
		Link.find(Q).isactive().exec(function(err,Existed){
			Link.find(_.merge(_.clone(Q),{IsActive:false})).sort({DateEdit:-1}).exec(function(err,Removed){
				Result.Existed = Existed;
				Result.Removed = LinkGroupper(Removed);
				if (!Result.Removed[DateRestore]){
					return next("Не правильно указана дата восстановления");
				}
				var Reparsed = _.map(Result.Removed[DateRestore],function(Obj){
					return _.omit(_.pick(Obj,lEF),["_id",lCFG.Code]);
				})
				var ModelSaver = require(__base + "src/modeledit.js");
				var MS = new ModelSaver(req.user.CodeUser);
				MS.SyncLinks(L, Q, Reparsed, function(err){
					if (err) return next(err);
					return res.json({});
				})				
			})
		})
	})
})


  
module.exports = router;