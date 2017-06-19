var mongoose  = require('mongoose');
var api = require('../lib/helper.js');
var fs = require("fs");
var _ = require("lodash");

var IsInstallMode = false;
try{
	IsInstallMode = __is_install;
}catch(e){
	;
}

var ShemaCompiller = (new function(){
	var self = this;

	self.Cache = {};

	self.Get = function(done){
		if (!_.isEmpty(self.Cache)) return done(null,self.Cache);
		var models = require(__base+"src/models.js");
		models(function(err, modelConfig, modelExtend){
			var Update = {};
			for (var Module in modelExtend){
				for (var ClassName in modelExtend[Module].schema){
					if (!Update[ClassName]) Update[ClassName] = [];
					Update[ClassName].push(modelExtend[Module].schema[ClassName]);
				}
			}
			for (var ModelName in modelConfig){
				var Info = modelConfig[ModelName];
				var IsSql = (Info.tablename!="addmodel");
				var Fields = Info.fields;
				var Booleans = [], Numeric = [], Refs = [], Searchable = [], Code = "", EditFields = [], Name = "";
				for (var FieldName in Fields){
					if (Fields[FieldName].type.name=="Boolean") {
						Fields[FieldName].set = api.parseBoolean;
					}
					if (Fields[FieldName].type.name=="Number"){
						Fields[FieldName].set = api.parseNumber;	
					}
					if (Fields[FieldName].role=="code"){
						Code = FieldName
						Searchable.push(FieldName);
					}
					if (Fields[FieldName].role=="name"){
						Name = FieldName;
						Searchable.push(FieldName);
					}
					if (FieldName.indexOf(0,4)=="Code" && Fields[FieldName].refmodel){
						Refs.push(FieldName);
					}
					if (FieldName.substring(0,2)=='Id' && Fields['Code'+FieldName.substring(2)] || FieldName.substring(0,3)=='Old' || Fields[FieldName].select===false){
		   				;
		   			} else {
		   				EditFields.push(FieldName);
		   			} 			
				}
				var schema = mongoose.Schema(Fields);

				var Links = Info.Links || [];
				Links.forEach(function(modelName){
					var Field2Add = {};
					Field2Add["Link_"+modelName] = [{type: mongoose.Schema.ObjectId, ref: modelName,set: api.ignoreEmpty}];
					schema.add(Field2Add);
					EditFields.push("Link_"+modelName);
				})
				if (IsSql){
					schema.plugin(api.mongoosePlugins.Modified);
					if (Searchable.length){
						schema.plugin(api.mongoosePlugins.Searchable,{fields:Searchable});
					}
				}
				schema.statics.cfg = function(Info){
					return function(){
						return Info;	
					}			
				}(_.merge(Info,{ModelName:ModelName,Refs:Refs,Code:Code,Name:Name,EditFields:EditFields}));
				schema.methods.cfg = function(Info){
					return function(){
						return Info;	
					}			
				}(_.merge(Info,{ModelName:ModelName,Refs:Refs,Code:Code,EditFields:EditFields}));

				if (IsSql){
					if (!IsInstallMode){
						if (Info.tablename.indexOf('[link]')==0){
							schema.plugin(api.mongoosePlugins.LinkUpdate);
						}
						if (['doc','docrow','docpacket','docfolderdoc','doctag','docobjtype','doclabel','docparamkey','docbill','docheader', 'row', 'rowcoloption','rowsumgrp','rowobj','docrow','rowtag'].indexOf(ModelName)!=-1 && false){
							schema.statics.IsSandBox = true;			
							schema.statics.IsSql = true;			
							schema.plugin(api.mongoosePlugins.Sandbox,{});
						}  else {
							schema.statics.IsSandBox = false;
							schema.statics.IsSql = true;
							schema.plugin(api.mongoosePlugins.SimpleSql,{});
						}
					} else {
						schema.add({ IsActive:  {type : Boolean, default : true, index:true}});
					}
					schema.plugin(api.mongoosePlugins.SQL);
				}
				if (Update[ModelName]){
					Update[ModelName].forEach(function(call){
						schema = call(schema);
					})
				}			
				self.Cache[ModelName] = schema;
			}
			return done(null, self.Cache);
		});		

	}

	return self;
})




module.exports = function(done){
	var removeModel = function(modelName) {
		delete mongoose.models[modelName];
		delete mongoose.modelSchemas[modelName];
	};
	ShemaCompiller.Get(function(err,Shemas){
		for (var ModelName in Shemas){
			var schema = Shemas[ModelName];
			removeModel(ModelName);
			mongoose.model(ModelName, schema);
		}
		return done && done();
	})
}

