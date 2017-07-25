var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require('./Base.js');



var ProdHelper = function(Context){
	
	Context = _.clone(Context); 
	Context.PluginName = "PROD";
	var self = this;
	Base.apply(self,Context);
	self.Context = Context;	

	self.get = function(done){
		self.loadFromCache(function(err,Result){
			if (Result && false) {
				return done(null,Result);	
			}			
			self.loadInfo(function(err,Result){
				self.saveToCache(Result,function(err){
					return done(err,Result);	
				});
			})
		})
	}

	self.loadRows = function(done){
		var Answer = {Bill:{},Prod:{},Alt:{}};
		self.query('row',{IsSum:false,IsFormula:false,CodeBill:{$exists:true}},'-_id CodeRow CodeBill CodeProd CodeAltOrg').exec(function(err,RowInfo){
			RowInfo.forEach(function(R){
				if (!Answer.Bill[R.CodeBill]) Answer.Bill[R.CodeBill] = [];
				if (!Answer.Prod[R.CodeProd]) Answer.Prod[R.CodeProd] = [];
				if (!Answer.Alt [R.CodeAltOrg]) Answer.Alt[R.CodeAltOrg] = [];
				Answer.Bill[R.CodeBill].push(R.CodeRow);
				Answer.Prod[R.CodeProd].push(R.CodeRow);
				Answer.Alt[R.CodeAltOrg].push(R.CodeRow);
			})
			return done(null,Answer);
		})		
	}

	self.loadProdTree = function(done){
		var Products = {};
		self.query('prod', {}, "-_id CodeProd CodeParentProd NameProd").exec(function(err,Ps){
			Ps.forEach(function(P){
				P.Children = [];
				Products[P.CodeProd] = P;
				Products[P.CodeProd].Children = _.map(_.filter(Ps,function(T){
					return T.CodeParentProd == P.CodeProd;
				}),'CodeProd');
			})	
			return done && done(null,Products);
		})
	}


	self.loadInfo = function(done){
		async.parallel({
			Rows:self.loadRows,
			ProdTree:self.loadProdTree,
		},done)	
	}	
	
	return self;
}



module.exports = ProdHelper;