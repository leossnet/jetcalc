var router = require('express').Router();
var mongoose = require('mongoose');
var _ = require('lodash');




router.get("/list",function(req,res,next){
	mongoose.model("style").find({},"-_id CodeStyle CSS IsForm IsReport").isactive().lean().exec(function(err,List){
		var CSS = _.map(List,function(L){
			var Rules = _.map(L.CSS.split(","),function(LL){
				return LL.trim();
			}), Result = [];
			Rules.forEach(function(R){
				if (!_.isEmpty(R)) Result.push("td."+L.CodeStyle+":"+R);
			})
			return Result.join("\n");
		}).join("\n")+"\n";
		return res.json({
			Styles:List,
			CSS:CSS
		});
	})
})







module.exports = router;