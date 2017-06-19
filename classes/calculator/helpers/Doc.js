var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require('./Base.js');
var Obj = require('./Div.js');

var DocHelper = function(Context){

	Context = _.clone(Context);
	Context.PluginName = "DOC";
	var self = this;
	Context.CacheFields = ['CodeObj', 'CodeDoc'];
	Base.apply(self,Context);
	self.Context = Context;

	self.get = function(done){
		self.loadFromCache(function(err,Result){
			if (Result) {
				return done(null,Result);
			}
			var Answer = {};
			self.loadInfo(function(err,Result){
				self.saveToCache(Result,function(err){
					return done(err,Result);
				});
			})
		})
	}

	self.loadInfo = function(done){
		self.query("doc",{CodeDoc:self.Context.CodeDoc},'-_id CodeDoc IsBiztranDoc NameDoc PrintNameDoc PrintNumDoc IsShowMeasure IsShowRoots IsActiveCondition IsPrimary IsAnalytic IsOlap IsInput IsChart IsPresent IsDivObj IsObjToRow IsShowParentObj CodeModel CodeGrp CodeRole CodeDocType HasChildObjs Link_docobjtype Link_docbill').populate('Link_docobjtype','-_id CodeObjClass CodeObjType').populate('Link_docbill','-_id CodeBill').isactive().exec(function(err,Docs){
			if (err) return done(err);
			self.Doc = _.first(Docs);
			if (!self.Doc) return done("Документ "+self.Context.CodeDoc+" не найден");
			async.parallel({
				Children:self.LoadChildObjs,
				Labels:self.LoadLabels,
			},function(err,Result){
				self.Doc.Labels = Result.Labels;
				if (Result.Children){
					self.Doc.ChildObjs = Result.Children[self.Context.CodeObj] || [];
					self.Doc.AllChildObjs = Result.Children;
				}
				self.Doc = _.omit(self.Doc,'Link_docobjtype');
				return done(err,self.Doc);
			})
		})
	}	

	self.LoadChildObjs = function(done){
		if (!self.Doc.HasChildObjs){
			return done(null,null);
		}
		var ObjHelper = new Obj(self.Context);
		ObjHelper.get(function(err,D){
			var Indexer = {};
			for (var CodeObj in D){
				if (D[CodeObj].Children.length>1){
					var subR = [];
					D[CodeObj].Children.forEach(function(sOCode){
						var Children = D[sOCode];
						self.Doc.Link_docobjtype.forEach(function(Q){
							if ((!Q.CodeObjType || Children.CodeObjType==Q.CodeObjType) 
							&&  (!Q.CodeObjClass || Children.CodeObjClass==Q.CodeObjClass)){
								subR.push(sOCode);
							}
						})
					})
					if (subR.length){
						Indexer[CodeObj] = subR;
					}
				}
			}
			return done(null,Indexer);
		})
	}

	self.LoadLabels = function(done){
		self.query('doclabel',{CodeDoc:self.Context.CodeDoc},"-_id CodeLabel IsSignature IsApproval CodePeriodGrp").exec(function(err,DLS){
			var Indexed = {}; DLS.forEach(function(DL){
				Indexed[DL.CodeLabel] = DL;
			})
			self.query('label',{CodeLabel:{$in:_.uniq(_.map(DLS,"CodeLabel"))}},"-_id CodeLabel NameLabel Idx Link_labeluser").populate({
				path:"Link_labeluser",
				match: {CodeObj:self.Context.CodeObj},
				select:'-_id CodeUser CodeObj'
			}).exec(function(err,Lbls){
                var Users2Load = [];
				Lbls.forEach(function(Lb){
					Lb.Users = {};
					Lb.Link_labeluser.forEach(function(LU){
						if (!Lb.Users[LU.CodeObj]) Lb.Users[LU.CodeObj] = {};
						Lb.Users[LU.CodeObj][LU.CodeUser] = {CodeUser:LU.CodeUser};
						Users2Load.push(LU.CodeUser);
					})
					Lb = _.omit(Lb,"Link_labeluser");
					Indexed[Lb.CodeLabel] = _.merge(Indexed[Lb.CodeLabel],Lb);
				})
				Users2Load = _.uniq(Users2Load);
				if (!Users2Load.length){
					var Result = _.sortBy(_.values(Indexed),"Idx");
					return done(null,Result);
				} else {
					self.query('user',{CodeUser:{$in:Users2Load}},'-_id CodeUser NameUser CodeOrg JobTitle').exec(function(err,Users){
						var S = {}; Users.forEach(function(C){
							S[C.CodeUser] = C;
						})
						for (var CodeLabel in Indexed){
							var Users = Indexed[CodeLabel].Users;
							for (var CodeObj in Indexed[CodeLabel].Users){
								for (var CodeUser in Indexed[CodeLabel].Users[CodeObj]){
									Indexed[CodeLabel].Users[CodeObj][CodeUser] = S[CodeUser];
								}
							}
						}
						var Result = _.sortBy(_.values(Indexed),"Idx");
						return done(null,Result);
					})
				}
			})
		})
	}


	

	return self;
}



module.exports = DocHelper;
