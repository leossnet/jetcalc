var mongoose   = require('mongoose');
var router     = require('express').Router();
var _          = require('lodash');
var async      = require('async');
var socket     = require(__base+'/src/socket.js');
var api        = require(__base+'/lib/helper.js');

var ColEditorHelper = (new function(){
	var self = this;

	self.get = function(Context,SandBox,done){
		var Col = require(__base+'/classes/calculator/helpers/Col.js');
		if (SandBox.On) Context.SandBox = SandBox.CodeUser;
		var ColHelper = new Col(Context);
		ColHelper.get(done);
	}
	return self;
})

router.get('/cols', function(req,res,next){
	var ContextFields = ['Year', 'CodePeriod','IsInput','CodeDoc','CodeObj','ChildObj'];
	var Context = {IsDebug:true};
	ContextFields.forEach(function(F){
		Context[F] = req.query[F];
	})
	Context.IsInput = api.parseBoolean(Context.IsInput);
	if (!req.query.UseCache)	{
		Context.UseCache = true;	
	} else {
		Context.UseCache = api.parseBoolean(req.query.UseCache);	
	}
	Context.Year = parseInt(Context.Year);
	ColEditorHelper.get(Context,req.session.sandbox,function(err, Cols){
		if (err) return next (err);
		return res.json(Cols);
	})
})







module.exports = router