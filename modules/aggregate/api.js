var mongoose = require('mongoose');
var _ = require('lodash');
var Div = require(__base+'/classes/calculator/helpers/Div.js');
var router   = require('express').Router();
var HP = require(__base+'lib/helpers/lib.js').Permits; 


router.get('/list',function(req,res){
 	var Objs = HP.AvObj(req.session.permissions);
 	var DHelper = new Div({UseCache:true});
 	DHelper.get(function(err,R){
 		if (!_.isEmpty(Objs)){
	 		var AllObjs = _.filter(R,function(O){
	 			return Objs.indexOf(O.CodeObj)!=-1;
	 		})
 		} else {
 			AllObjs = _.values(R);
 		}
 		return res.json(AllObjs);
 	})	
})






module.exports = router;