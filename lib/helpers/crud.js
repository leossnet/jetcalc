var 
	mongoose  = require('mongoose')
	, _       = require('lodash')
	, f       = require('../functions.js')
;

module.exports =  {
	self: function(model){
		return function(req, res, next){
			var q = {};
			if (f.m(model).idquery && typeof f.m(model).idquery == 'function'){
				q = f.m(model).idquery(req.params.id);
			} else {
				q = {_id:req.params.id};
			}
			var S = req.session.sandbox;
			f.m(model).findOne(q).sandbox(S.CodeUser,S.On).exec(function(err,M){
				req[model] = M;
				next();
			});
		}
	},	
	addObject:function(model){
		return function(req, res, next){
			var M = f.m(model);
			var fields = M.editFields();
			var newObject = M();
			fields.forEach(function(field){
				newObject[field] = req.body[field];
			});
			newObject.save(req.user.CodeUser,function(err){
				if (err) return next(err);
				res.json('ok');
			});
		}		
	},
	modifyObject:function(model){
		return function(req, res, next){
			var fields = req.body.fields || f.m(model).editFields();
			fields.forEach(function(field){
				if (req.body[field] || (f.m(model).schema.path(field) && f.m(model).schema.path(field).instance=='ObjectID')) {
					req[model][field] = req.body[field];
				} else if (req.body[field]=='') {
					req[model][field] = [];
				}
			})
			req[model].save(req.user.CodeUser,function(err){
				if (err) return next(err);
				res.json('ok');
			});
		}		
	},
	getObject:function(model){
		return function(req, res, next){
			res.json(req[model]);
		}		
	},
	getDetailedObject:function(model){
		return function(req, res, next){
			if (!req.session.sandbox) req.session.sandbox = {On:false,CodeUser:req.user.CodeUser};
			f.m(model).detailed(req.params.id,req.session.sandbox.CodeUser,req.session.sandbox.On,function(o){
				res.json(o);
			})
		}		
	},
	deleteObject:function(model){
		return function(req, res, next){
			req[model].remove(req.user.CodeUser, function(err){
				if (err) return next(err);
				res.json({status:'ok'});
			})
		}		
	}
}