var Raw = require(__base+"modules/models/serverconfig.js");
var _ = require ("lodash");
var fs = require("fs");


module.exports = function(done){
	var lib = require(__base+'lib/helpers/lib.js');
	lib.dbExtend(function(err,Extenders){
		var Fields = {};
		if (!_.isEmpty(Extenders)){
			for (var ModuleId in Extenders){
				var Add = Extenders[ModuleId].models;
				for (var ModelName in Add){
					Fields[ModelName] = _.merge(Fields[ModelName]||{},Add[ModelName]);
				}
			}
		}
		var R = _.clone(Raw);
		for (var Key in Fields){
			if (!R[Key]) {
				R[Key] = {tablename:'addmodel',fields:Fields[Key]};
			} else {
				R[Key].fields = _.merge(R[Key].fields,Fields[Key]);	
			}			
		}
		var Links = {};
		for (var ModelName in R){
			if (R[ModelName].tablename.indexOf("[link].")===0){
				for (var FieldName in R[ModelName].fields){
					if (FieldName.substring(0,4)=="Code" && R[ModelName].fields[FieldName].refmodel){
						var RM = R[ModelName].fields[FieldName].refmodel;
						if (!Links[RM]) Links[RM] = [];
						Links[RM].push(ModelName);
					}
				}
			}
		}
		for (var Model in Links){
			R[Model].Links = Links[Model] || [];
		}
		/*var addDir = __base+'/classes/models';
		var addModels = fs.readdirSync(addDir);
		addModels.forEach(function (fileName){
			R[_.first(fileName.split('.'))] = {
				tablename:"addmodel",
				fields:require(addDir+'/'+fileName)	
			}
		})
		*/	

		return done(err,R, Extenders);
	})


}




