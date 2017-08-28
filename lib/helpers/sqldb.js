
var mongoose  = require('mongoose'),
	moment  = require('moment'),
	_       = require('lodash'),
	db = require(__base+'/sql/db.js'),
	config  = require(__base+'config.js');

var IsSqlSaveMap = config.dbsqlmap;

var ModelSaver = require(__base + 'src/modeledit.js');


mongoose.Query.prototype.isactive = function() {
	var query = this;
	var updateActive = function(Condition){
		Condition = Condition || {};
		if (!Condition['$and']) Condition['$and'] = [];
		var q = {'IsActive':true};
		Condition['$and'].push(q);
		return Condition;
	}
	query._conditions = updateActive(query._conditions);
	if (query._mongooseOptions.populate){
		for (var field in query._mongooseOptions.populate){
			query._mongooseOptions.populate[field].match = updateActive(query._mongooseOptions.populate[field].match);
		}
	}	
	return query;
};




module.exports = function(schema, options) {
	
	schema.add({ IsActive:  {type : Boolean, default : true, index:true}});


	schema.methods.GetCode = function(){
		var self = this;
		var Config = self.cfg();
		var EditFields = Config.EditFields;
		var AddFields = ['YearData','Year'];
		var RelatedFields = [];
		for (var NameField in Config.fields){
			if (EditFields.indexOf(NameField)!=-1 && Config.fields[NameField].refmodel || AddFields.indexOf(NameField)!=-1){
				RelatedFields.push(NameField);
			}
		}
		var CodeValue = _.compact([Config.ModelName].concat(_.values(_.pick(self,RelatedFields)))).join("_").toLowerCase();
		return CodeValue;
	}

	schema.methods.SetCode = function(done){
		var self = this;
		var Config = self.cfg();
		var CodeField = Config.Code;
		if (self[CodeField] && (self[CodeField]+'').length && !self.isNew)  return done && done();
		var CodeValue = self[CodeField] || self.GetCode();
		var Check = {}; Check[CodeField] = CodeValue;
		mongoose.model(Config.ModelName).count(Check).isactive().exec(function(err,СС){
			if (!СС) {
				self[CodeField] = CodeValue;	
				return done && done();
			}
			var CheckCh = {};CheckCh[CodeField] = {$regex: new RegExp("^"+CodeValue+"_[0-9]+$")};
			mongoose.model(Config.ModelName).count(CheckCh).isactive().exec(function(err,СС2){
				CodeValue = CodeValue+"_"+(СС2+1);
				self[CodeField] = CodeValue;	
				return done && done();
			})
		})
	}

	schema.methods.GetForSql = function(done){
		var self = this;
		var Config = self.cfg();
		var VirtualFields = [], OldFields = [];
		for (var FieldName in Config.fields){
			if (Config.fields[FieldName].extended && !Config.fields[FieldName].refmodel){
				VirtualFields.push(FieldName);
			}
			if (FieldName.indexOf("Old")==0){
				OldFields.push(FieldName);
			}
		}
		console.log("====================");
		console.log(VirtualFields);
		console.log("====================");
		var Obj = _.pick(self,_.difference(Config.EditFields.concat(['IsActive']).concat(OldFields),VirtualFields));
		if (self.isNew){		
			self.IsActive = true;
		}
		var RealObj = {};
		for (var Field in Obj){
			if (Field.indexOf("Link_")==0 ) continue;
			var Value = Obj[Field];
			var FieldType = "";
			if (Field=='IsActive') {
				FieldType = "Boolean";
			} else {
				var FieldType = Config.fields[Field].type;
				if (typeof FieldType == 'function') FieldType = FieldType.name;
			}
			switch(FieldType){
				case "Boolean":
					if (!Value) Value = 0; else Value = 1;
				break;
				case "Number":
					Value = parseInt(Value)
				break;
				case "Date":
					if (Value) Value = moment(Value).format("YYYY-MM-DDTHH:mm:SS");
					else Value = "1900-01-01 00:00:00";
				break;
			}
			RealObj[Field] = Value;
		}
		RealObj.tableName = Config.tablename;
		RealObj.codeKey = Config.Code;
		return RealObj;
	}

	schema.pre('save',function(next,CodeUser,done){
		var self = this;
		var Config = self.cfg();
		var CodeField = Config.Code;
		self.SetCode(function(err){
			console.log("SET CODE");
			if (err) return next(err);
			if (!IsSqlSaveMap) return next();
			var VirtualFields = [];
			for (var FieldName in Config.fields){
				if (Config.fields[FieldName].extended && !Config.fields[FieldName].refmodel){
					VirtualFields.push(FieldName);
				}
			}
			var Obj = _.pick(self,_.difference(Config.EditFields.concat(['IsActive']),VirtualFields));
			if (self.isNew){		
				self.IsActive = true;
			}
			for (var Field in Obj){
				if (Field.indexOf("Link_")==0) continue;
				var Value = Obj[Field];
				var FieldType = "";
				if (Field=='IsActive') {
					FieldType = "Boolean";
				} else {
					var FieldType = Config.fields[Field].type;
					if (typeof FieldType == 'function') FieldType = FieldType.name;
				}
				switch(FieldType){
					case "Boolean":
						if (!Value) Value = 0; else Value = 1;
					break;
					case "Number":
						Value = parseInt(Value)
					break;
					case "Date":
						if (Value) Value = moment(Value).format("YYYY-MM-DDTHH:mm:SS");
						else Value = "1900-01-01 00:00:00";
					break;
				}
				Obj[Field] = Value;
			}
			Obj.tableName = Config.tablename;
			Obj.codeKey = CodeField;
			var info = {
				NameCommit:"Прямое сохранение",
				SNameCommit:'directsave',
				CodeUser:CodeUser
			}	
			db.save(info,[Obj],function(err,Result){
				return next();
			})
		});
	})


	schema.pre('remove',function(next, CodeUser, done){
		if (typeof CodeUser!=='string') return done("Первый аргумент должен быть CodeUser");
		var self = this, CFG = self.cfg(), CodeField = CFG.Code, ModelName = CFG.ModelName; 
		var Update = {}; Update[CodeField] = mongoose.Types.ObjectId()+'_'+self[CodeField];
		Update.IsActive = false;
		Update.UserEdit = CodeUser;
		Update.DateEdit = Date.now();
		mongoose.model(ModelName).findByIdAndUpdate(self._id,Update,next);
	})

}