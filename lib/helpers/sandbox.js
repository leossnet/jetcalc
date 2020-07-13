var 
	mongoose  = require('mongoose')
	, _       = require('lodash')
;


mongoose.Query.prototype.sandbox = function(CodeUser,IsEnabled) {
	var query = this;
	var updateActive = function(Condition,CodeUser,IsEnabled){
		Condition = Condition || {};
		if (!Condition['$and']) Condition['$and'] = [];
		var q = {};
		if (!IsEnabled){
			q = {'IsActive':true,$or:[{SandboxOnly:{$exists:false}},{SandboxOnly:null}]}
		} else {
			var keyActive = 'Sandbox.'+CodeUser+'.IsActive';
			var kaE = {}, kaNe = {}, kaTrue = {};
			kaE[keyActive] = {$exists:true};  kaNe[keyActive] = {$exists:false}; kaTrue[keyActive] = true;
			var or1  = {$or:[{SandboxOnly:{$exists:false}},{SandboxOnly:{$in:[CodeUser,null]}}]};
			var or2  = {$or:[{$and:[kaE,kaTrue]},{$and:[kaNe,{'IsActive':true}]}]};
			q = {$and:[or1,or2]};
		}
		Condition['$and'].push(q);
		return Condition;
	}
	query._conditions = updateActive(query._conditions,CodeUser,IsEnabled);
	if (IsEnabled){
		query._sandbox = CodeUser;
	}
	if (query._mongooseOptions.populate){
		for (var field in query._mongooseOptions.populate){
			if (IsEnabled){
				if (!query._mongooseOptions.populate[field].options) query._mongooseOptions.populate[field].options = {};
				query._mongooseOptions.populate[field].options['_sandbox'] = CodeUser;
			}
			query._mongooseOptions.populate[field].match = updateActive(query._mongooseOptions.populate[field].match,CodeUser,IsEnabled);
		}
	}	
	return query;
};




module.exports = 
function(schema, options) {
	
	schema.add({ IsActive:  {type : Boolean, default : true, index:true}});
	schema.add({ Sandbox    :  {type : mongoose.Schema.Types.Mixed  , default : {}, select:true} });
	schema.add({ SandboxOnly:  {type : String, default : "", index:true, select:false}});
	
	var config = schema.statics.cfg();
	var ModelName = config.ModelName;
	var EditFields = config.EditFields;

	var addSandboxField = function(next) {
		var sandbox = this._sandbox||this._mongooseOptions._sandbox;
		if (sandbox){
			var OldConditions = this._conditions;
			var NewConditions = {};
			NewConditions['$and'] = OldConditions['$and']||[];
			for (var field in OldConditions){
				if (field!='$and'){
					var keyField = 'Sandbox.'+sandbox+'.'+field;
					var kEx = {}, kNEx = {}, kEq = {}, fEq = {};
					kEx[keyField] = {$exists:true}; kNEx[keyField] = {$exists:false}; kEq[keyField] = OldConditions[field]; fEq[field] = OldConditions[field];
					NewConditions['$and'].push({$or:[{$and:[kEx,kEq]},{$and:[kNEx,fEq]}]});					
				}
			}	
			this._conditions = 	NewConditions;		
		}		
		next();
	}
	schema.pre('find', addSandboxField);
	schema.pre('findOne', addSandboxField);
	schema.post('find', function(results, next) {
		var CodeUser = this._mongooseOptions._sandbox || this._sandbox;
		if (CodeUser){
			var answRFields = _.keys(_.first(results));
			results.forEach(function(R,i){
				var Sandbox = {};
				if (R.Sandbox && R.Sandbox[CodeUser]) {
					Sandbox = _.omit(R.Sandbox[CodeUser],_.difference(answRFields,_.keys(R.Sandbox[CodeUser])));	
				}
				results[i] = _.omit(_.merge(R,Sandbox),"Sandbox");
			})

		}
		next();
	})
	schema.post('findOne', function(R, next) {
		var CodeUser = this._mongooseOptions._sandbox || this._sandbox;		
		if (CodeUser){
			var Sandbox = {};
			if (R && R.Sandbox && R.Sandbox[CodeUser]) Sandbox = R.Sandbox[CodeUser];
			console.log(Sandbox,"FIND",">>>>");
			R = _.omit(_.merge(R,Sandbox),"Sandbox");
		}
		next();
	})

	schema.pre('remove',function(next, CodeUser, done){
		if (typeof CodeUser!=='string') return done("Первый аргумент должен быть CodeUser");
		var self = this, updater = {};
console.log("Pre Remove",{_id:self._id});		
		if (this.SandboxOnly && this.SandboxOnly==CodeUser){
			mongoose.model(ModelName).remove({_id:self._id},function(err){
				return done(err);
			})
		} else {
			updater['Sandbox.'+CodeUser+'.IsActive'] = false;
			mongoose.model(ModelName).findByIdAndUpdate(self._id,updater,function(err){
				return done(err);
			})
		}
	})
/*
	schema.pre('save',function(next,done){
		if (this.isNew){
			this.SandboxOnly = CodeUser;
			return next();
		}
		var FieldsToModify = [];
		var Info = this.$__delta();
		console.log(Info);
		console.log("Info",Info);
		var SandBox = {}; SandBox[CodeUser] = {};
		var self = this;
		EditFields.forEach(function(F){
			if (self.isModified(F) ){
                SandBox[CodeUser][F] = self[F];
			}
		})
		console.log("SandBox",SandBox,"SandBox");
		var Setter = {}; Setter["Sandbox"] = SandBox;
		console.log("Setter",Setter,"Setter");
		
		mongoose.model(ModelName).findByIdAndUpdate(self._id,Setter,function(err){
			return done(err);
		})
	})

*/
}