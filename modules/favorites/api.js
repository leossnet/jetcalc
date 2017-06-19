var mongoose = require('mongoose');
var _ = require('lodash');
var router   = require('express').Router();
var HP = require(__base+'lib/helpers/lib.js').Permits;


var FavHelper = (new function(){
	var self = this;

	self.PossibleTypes = ["CodeDoc","CodeObj","CodeDiv","CodeOtrasl","CodeRegion","CodeGrp"];

	self.PermFilter = function(req,Unfiltered,done){		 
		var AvDocs = HP.AvDoc(req.session.permissions);
		Unfiltered.CodeDoc = _.intersection(Unfiltered.CodeDoc,AvDocs);
		return done(null,Unfiltered);	
	}

	self.GetFavorites = function(req,done){
		var CodeUser = req.user.CodeUser;
		var Result = {};
		mongoose.model("userfavorite").find({CodeUser:CodeUser}).isactive().exec(function(err,Current){
			Current.forEach(function(Fav){
				self.PossibleTypes.forEach(function(PF){
					if (!Result[PF]) Result[PF] = [];
					if (Fav[PF]) Result[PF].push(Fav[PF]);
				})
			})
			self.PermFilter(req, Result, done);
		})
	}



	return self;
})


router.get('/', function(req,res,next){
	FavHelper.GetFavorites(req,function(err,Result){
		if (err) return next (err);
		return res.json(Result);
	})
})

router.put('/', function(req,res,next){
	var Type = req.body.type;
	var Code = req.body.code;
	var Query = {CodeUser:req.user.CodeUser}; Query[Type] = Code;
	var Fav = mongoose.model('userfavorite');
	Fav.findOne(Query).isactive().exec(function(err,Current){
		if (Current) return next('already_existed');
		var New = new Fav(Query);
		New.save(req.user.CodeUser,function(err){
			if (err) return next(err);
			return res.json({status:'ok'});
		})
	})
})

router.delete('/', function(req,res,next){
	var Type = req.body.type;
	var Code = req.body.code;
	var Query = {CodeUser:req.user.CodeUser}; Query[Type] = Code;
	var Fav = mongoose.model('userfavorite');
	Fav.findOne(Query).isactive().exec(function(err,Current){
		if (!Current) return next('not_found');
		Current.remove(req.user.CodeUser,function(err){
			next(err);
			return res.json({status:'ok'});
		})
	})
})

module.exports = router;