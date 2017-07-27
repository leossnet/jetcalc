var mongoose   = require('mongoose');
var router     = require('express').Router();
var _          = require('lodash');
var async      = require('async');
var socket     = require(__base+'/src/socket.js');


router.get('/document/:CodeDoc', function(req,res,next){
	var Links = req.query.Links, Fields = req.query.Fields;
	var LinkFields = _.map(Links,function(L){
		return "Link_"+L;
	});
	var Q = mongoose.model("doc").findOne({CodeDoc:req.params.CodeDoc},["-_id"].concat(Fields).concat(LinkFields).join(" "));
	LinkFields.forEach(function(L){
		if (L=='Link_docheader'){
			Q.populate({path:L,options: { sort: { 'IndexDocHeader': 1 } }});
		} else {
			Q.populate(L);	
		}
		
	});
	Q.isactive().lean().exec(function(err,D){
		if (!D) return next("documentnotfound");
		return res.json({Doc:D});
	});
})

router.put('/document/:CodeDoc',  function(req,res,next){
	var Info = req.body.Info;
	var Changes = JSON.parse(req.body.Changes);
	var ModelSaver = require(__base + "src/modeledit.js");
	var M = new ModelSaver(req.user.CodeUser);
	M.SaveModel("doc",_.pick(Changes,Info.Fields),function(err){
		async.eachSeries(Info.Links,function(L,cb){
			M.SaveLinks(L,Changes["Link_"+L],cb);
		},function(err){
			return res.json({});
		})
	})
})




module.exports = router