var mongoose = require('mongoose');
var _ = require('lodash');
var router   = require('express').Router();
var HP = require(__base+'lib/helpers/lib.js').Permits; 


router.get('/list',function(req,res){
 	var Objs = HP.AvObj(req.session.permissions);
 	var Div = require(__base+'classes/jetcalc/Helpers/Div.js');
 	Div.get(function(err,R){
 		if (!_.isEmpty(Objs)){
	 		var AllObjs = _.filter(R,function(O){
	 			return Objs.indexOf(O.CodeObj)!=-1;
	 		})
 		} else {
 			AllObjs = _.values(R);
 		}
 		AllObjs.forEach(function(AO){
 			var ObjTypeInfo = {};
 			AO.AllChildren.forEach(function(Child){
 				ObjTypeInfo[Child] = _.pick(R[Child],["Groups","CodeObjClass","CodeObjType"])
 			})
 			AO.Info = ObjTypeInfo;
 		})
 		return res.json(AllObjs);
 	})	
})






module.exports = router;