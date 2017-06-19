var 
	mongoose  = require('mongoose')
	, _       = require('lodash')
	, async   = require('async')
;


module.exports = function(schema, options) {

	var config = schema.statics.cfg();
	var model = config.ModelName;
	var refs = [];
	for (var FieldName in config.fields){
		var I = config.fields[FieldName];
		if (I.refmodel) refs.push(I.refmodel);
	}
	refs = _.uniq(refs);

	schema.post('save', function (doc) {
		var BindedModels = _.uniq(_.values(refs));
		BindedModels.forEach(function(ModelName){
			var M = mongoose.model(ModelName), Code = M.cfg().Code;
			var linkField = "Link_"+model, query   = {}, updater = {'$addToSet':{}};
			query[Code] = doc[Code];
			updater['$addToSet'][linkField] = doc._id;					
			M.findOneAndUpdate(query,updater, function(err){
				if (err) console.log(err);
			})
		})
	})
	schema.post('remove', function (doc) {
		var BindedModels = _.uniq(_.values(refs));
		BindedModels.forEach(function(ModelName){
			var M = mongoose.model(ModelName), Code = M.cfg().Code;
			var linkField = "Link_"+model, query   = {}, updater = {'$pull':{}};
			query[Code] = doc[Code];
			updater['$pull'][linkField] = doc._id;		
			M.findOneAndUpdate(query,updater, function(err){
				if (err) console.log(err);
			})
		})				
	})
		
}