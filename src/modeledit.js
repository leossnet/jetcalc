var  _ = require("lodash");
var  async    = require('async');
var  mongoose    = require('mongoose');




var ModelEdit = function(CodeUser,IsNew){

	var self = this;

	self.BaseModelCode = null;
	self.BaseModel = null;
	self.CodeUser = CodeUser;


	self.SaveModel = function(ModelName, Model, done){
		var M = mongoose.model(ModelName), CFG = M.cfg(), Q = {};
		Q[CFG.Code] = Model[CFG.Code]; self.BaseModelCode = CFG.Code;
		M.findOne(Q).isactive().exec(function(err,Found){
			if (!Found || IsNew) Found = new M(Model);
			var Fields = _.intersection(_.keys(Model),CFG.EditFields);
			Fields.forEach(function(F){
				Found[F] = Model[F];
			})
			Found.save(self.CodeUser,function(err){
				self.BaseModel = Found;
				return done(err);
			})			
		})
	}


	self.SetModel = function(ModelName, Query, done){
		mongoose.model(ModelName).findOne(Query).isactive().exec(function(err,Found){
			self.BaseModelCode = Found.cfg().Code
			if (!Found) return done("modelnotfound");
			self.BaseModel = Found;
			return done();
		})
	}

	self.Modify = function(ModelName, Query, NewArr, done){
		var M = mongoose.model(ModelName), CFG = M.cfg(), Code = CFG.Code, Fields = CFG.EditFields;
		M.find(Query).isactive().exec(function(err,OldModels){
			var OldIndexed = {}; OldModels.forEach(function(Z){
				OldIndexed[Z[Code]] = Z;
			}); OldCodes = _.keys(OldIndexed);
			var NewCodes = _.map(NewArr,Code);
			var ToSave = [], ToRemove = [];
			OldModels.forEach(function(OldModel){
				if (NewCodes.indexOf(OldModel[Code])==-1){
					ToRemove.push(OldModel);
				} else {
					var Q = {}; Q[Code] = OldModel[Code];
					var Data = _.pick(_.find(NewArr,Q),Fields);
					for (var K in Data) OldModel[K] = Data[K];
					ToSave.push(OldModel);
				}
			})
			NewArr.forEach(function(NewObj){
				if (OldCodes.indexOf(NewObj[Code])==-1){
					var NewM = new M(NewObj);
					ToSave.push(NewM);
				}
			});
			async.each(ToRemove,function(TR,cb1){
				TR.remove(self.CodeUser,function(err){
					cb1();
				});
			},function(err){
				async.each(ToSave,function(TR,cb2){
					TR.save(self.CodeUser,function(err){
						cb2();
					});
				},done);
			})

		})
	}


	self.SaveLinks = function(ModelName, Links, done){
		var ToSave = [], ToRemove = [];
		var M = mongoose.model(ModelName), Q = {}; 
		var CFG = M.cfg(), Fields = [];
		for (var CodeField in CFG.fields){
			var Info = CFG.fields[CodeField];
			if (Info.refmodel && CodeField.indexOf("Code")==0){
				Fields.push(CodeField);
			}
		}
		Fields = _.pull(CFG.EditFields,CFG.Code);
		Q[self.BaseModelCode] = self.BaseModel[self.BaseModelCode];
		M.find(Q).isactive().exec(function(err,Existed){
			Links && Links.forEach(function(Lk){
				var Ex = _.find(Existed,_.pick(Lk,Fields));
				if (Ex){
					Ex = _.merge(Ex,Lk);
				} else {
					Ex = new M(_.merge(Lk,Q));
				}
 				ToSave.push(Ex);				
			})
			Existed.forEach(function(Lk){
				if (!_.find(Links,_.pick(Lk,Fields))){
					ToRemove.push(Lk);
				}
			})

			async.each(ToRemove,function(TR,cb1){
				TR.remove(self.CodeUser,function(err){
					cb1();
				});
			},function(err){
				async.each(ToSave,function(TR,cb2){
					TR.save(self.CodeUser,function(err){
						cb2();
					});
				},done);
			})
		})
	}




	return self;
}




module.exports = ModelEdit;