var router = require("express").Router();
var mongoose = require("mongoose");
var _ = require("lodash");
var moment = require("moment");
var async = require("async");
var LIB = require(__base+'lib/helpers/lib.js');
var HP = LIB.Permits; 
var SocketManager = require(__base+"src/socket.js");



router.get('/list',function(req,res,next){
	var FeedModel = mongoose.model("lfmessage"), limit = 20, skip = parseInt(req.query.skip) || 0;
	FeedModel.find({UsersToShow:req.user.CodeUser,NeedConfirm:true,UsersConfirmed:{$ne:req.user.CodeUser}}).sort({DateAdded:-1}).lean().exec(function(err,Urgent){
		var ignore = _.map(Urgent,"_id"), query = {UsersToShow:req.user.CodeUser};
		if (!_.isEmpty(ignore))  query["_id"] = {$nin:ignore};
		var Result = {
			urgent:Urgent
		}
		FeedModel.count(query).exec(function(err,Total){
			FeedModel.find(query).sort({DateAdded:-1}).skip(skip).limit(limit).lean().exec(function(err,List){
				List.forEach(function(L){
					var D = moment(L.DateAdded).calendar(null,{
					    sameDay: '[Today]',
					    nextDay: '[Tomorrow]',
					    lastDay: '[Yesterday]',
					    lastWeek: 'DD.MM',
					    nextWeek: 'DD.MM',
					    sameElse: 'DD.MM'
					});
					if (!Result[D]) Result[D] = [];
					Result[D].push(L);			
				})			
				return res.json({feeds:Result,total:Total});
			})
		})
	})
})

router.delete("/feed/:id", HP.TaskAccess("IsFeedWriter"), function(req,res,next){
	var FeedModel = mongoose.model("lfmessage"), id = req.params.id;
	FeedModel.remove({_id:id}).exec(function(err){
		SocketManager.emitEventAll("livefeedupdate",{id:id,type:'delete'});
		return res.json({});
	})
})


router.put("/confirm/:id", function(req,res,next){
	var FeedModel = mongoose.model("lfmessage"), id = req.params.id;
	FeedModel.findOne({_id:id}).exec(function(err,FM){
		if (!FM) return next("Сообщение не найдено");
		FM.UsersConfirmed = _.uniq(FM.UsersConfirmed.concat([req.user.CodeUser]));
		FM.save(function(err){
			SocketManager.emitEventAll("livefeedupdate",{id:id,type:'update',feed:FM});
			return res.json({});
		})		
	})	
})

router.post("/feed", HP.TaskAccess("IsFeedWriter"), function(req,res,next){
	var Data = _.merge(req.body.feed,{CodeUser:req.user.CodeUser});
	Data.Correct = _.map(Data.Correct,function(V){
		return LIB.parseBoolean(V);
	})
	var PossibleEmpty = ["CodeRole","CodeGrp","CodeManualPage","CodeAttach"];
	PossibleEmpty.forEach(function(Field){
		if (!Data[Field]) Data[Field] = [];
	})
	var announce = (_.isEmpty(Data._id)) ? {type:'added'}:{type:'update',id:Data._id};
	var _feed = function(Data,done){
		var FeedModel = mongoose.model("lfmessage");
		var _new  = function(Data){
			return new FeedModel(_.merge(Data,{DateAdded:new Date()}));
		}
		if (Data._id){
			FeedModel.findOne({_id:Data._id}).exec(function(err,Existed){
				if (!Existed) return done(null,_new(Data));
				for (var F in Data) Existed[F] = Data[F];
				return done(null,Existed);
			})
		} else {
			return done(null,_new(Data));
		}
	}
	_feed(Data,function(err,Feed){
		Feed.users(function(err,List){
			if (_.isEmpty(List)){
				return next("Сообщение никому не предназначено");
			}
			Feed.UsersToShow = List.concat([Feed.CodeUser]);
			Feed.UsersConfirmed = _.uniq(Feed.UsersConfirmed.concat([Feed.CodeUser]));
			Feed.save(function(err){
				SocketManager.emitEventAll("livefeedupdate",_.merge(announce,{feed:Feed}));
				return res.json({});
			})
		})
	})
})



module.exports = router
