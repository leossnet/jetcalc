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

		console.log("Will save ",ModelName,Model," === Will Save");

		M.findOne(Q).isactive().exec(function(err,Found){
			if (err) return done(err);
			if (!Found || IsNew) Found = new M(Model);
			var Fields = _.intersection(_.keys(Model),CFG.EditFields);
			Fields.forEach(function(F){
				Found[F] = Model[F];
			})
			Found.save(self.CodeUser,function(err){
				if (err) return done(err);
				self.BaseModel = Found;
				return done(err);
			})			
		})
	}


	self.SetModel = function(ModelName, Query, done){
		mongoose.model(ModelName).findOne(Query).isactive().exec(function(err,Found){
			if (!Found) return done("modelnotfound");
            self.BaseModelCode = Found.cfg().Code
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


	self.SyncLinks = function(ModelName, Query, Links, done){
		var M = mongoose.model(ModelName), CFG = M.cfg(), EditFields = CFG.EditFields, ToSave = [], ToRemove = [];
		Links = Links || [];
		console.log("Existed search ",Query);
		M.find(Query).isactive().exec(function(err,Existed){
			if (err) return done(err);
			var IndexedOld = {};
			Existed.forEach(function(Ex){
				IndexedOld[Ex._id+""] = Ex;
			})
			Links.forEach(function(NL){
				if (!_.isEmpty(NL._id)){
					if (IndexedOld[NL._id+'']){
						_.keys(NL).forEach(function(NK){
							IndexedOld[NL._id+''][NK] = NL[NK];
						})
					}
					if (IndexedOld[NL._id+""] && IndexedOld[NL._id+""].isModified()){
						ToSave.push(IndexedOld[NL._id+""]);
					}
					delete IndexedOld[NL._id+""];
				} else {
					var ToAdd = new M(NL);
					ToSave.push(ToAdd);
				}				
			})
			for (var Key in IndexedOld){
				ToRemove.push(IndexedOld[Key]);
			}
			async.each(ToRemove,function(TR,cb1){
				TR.remove(self.CodeUser,function(err){
					cb1(err);
				});
			},function(err){
				if (err) return done(err);
				async.eachSeries(ToSave,function(TR,cb2){
					TR.save(self.CodeUser,function(err){
						if (err) {
							console.log("Save error ",err);
							return done(err);
						}
						cb2(err);
					});
				},function(err){
					if (err) console.log("Final err",err);
					return done(err);

				});
			})
		})
	}

	self.SaveLinks = function(ModelName, Links, done){
		var Q = {};
		Q[self.BaseModelCode] = self.BaseModel[self.BaseModelCode];
		self.SyncLinks(ModelName, Q, Links, done);
	}




	return self;
}




module.exports = ModelEdit;