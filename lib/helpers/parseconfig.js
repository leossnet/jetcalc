var
	  _       = require('lodash')
	, f       = require('../functions.js')
;


var Parser = function(config){

	var self = this;
	self.config = config;
	self.Result = {};
	/*
	*  Обработка файла serverconfig.js
	*  @results {ModelName:{Table:'',Primary:'',Code:'',Name:'',EditFields:[],Booleans:[],Indexes:[],Refs:{},Links:[], Unselectable:[], SaveMapper:{}}}
	*/
	self.parse = function(){
		self.MainFields();
		self.Fields();
		self.Links();
		return self.Result;
	}
	/*
	*  Вычисляет поля Primary, Code, Name, Table	
	*  Table - Имя sql-таблицы 
	*  @private
	*/
	self.MainFields = function(){
		for (var ModelName in self.config){
			var Info = self.config[ModelName];
			self.Result[ModelName] = {
				Table: Info.tablename,
				ModelName:ModelName
			};
			for (var FieldName in Info.fields){
				var FInfo = Info.fields[FieldName];
				if (FInfo.role){
					if (FInfo.role=='id'){
						self.Result[ModelName].Primary = FieldName;	
					}
					if (FInfo.role=='code'){
						self.Result[ModelName].Code = FieldName;	
					}					
				}
			}
			var NameFieldTest = 'Name'+self.Result[ModelName].Primary.substring(2);
			if (Info.fields[NameFieldTest]){
				self.Result[ModelName].Name = NameFieldTest;
			} else {
				self.Result[ModelName].Name = self.Result[ModelName].Code;
			}
		}
	}

	/*
	*  Вычисляет поля доступные для изменений и сохраняем информацию о всех полях
	*  @private
	*/
	self.Fields = function(){
		for (var ModelName in self.config){
			var Info = self.config[ModelName];
			var R = self.Result[ModelName];
			R.EditFields = []; 
			R.AllFields = {}; 
			R.SaveMapper = {}; 
			R.Unselectable = []; 
			R.Indexes = []; 
			R.Booleans = []; 
			R.Dates = [];
			R.Numeric = []; 
			R.Links = []; 
			R.Refs = []; 
			for (var Field in Info.fields){
				var FInfo = Info.fields[Field];
				if (Field.substring(0,2)=='Id' && Info.fields['Code'+Field.substring(2)] || Field.substring(0,3)=='Old'){
					R.SaveMapper['Code'+Field.substring(2)] = Field;
					R.Unselectable.push(Field);
				} else {
					R.EditFields.push(Field);	
				}
				R.AllFields[Field] = FInfo;
				if (FInfo['refmodel']) R.Refs[Field] = FInfo['refmodel'];
				if (FInfo['index'] && R.Unselectable.indexOf(Field)==-1) {
					R.Indexes.push(Field);	
				}
				if (FInfo.type.name){
					if (FInfo.type.name=='Boolean') R.Booleans.push(Field);
					if (FInfo.type.name=="Number") R.Numeric.push(Field);
					if (FInfo.type.name=="Date") R.Dates.push(Field);
				} 				
			}
		}
	}

	/*
	*  Прописываем в информацию об объектах, модели-ссылки, зависящие от них
	*  @private
	*/
	self.Links = function(){
		for (var ModelName in self.config){
			var R = self.Result[ModelName];
			if (R.Table.indexOf('[link]')==0){
				var dependable = _.uniq(_.values(R.Refs));
				dependable.forEach(function(model){
					self.Result[model].Links.push(ModelName);
				})
			}
		}
	}

}

module.exports =  {

	parse:function(config){
		var P = new Parser(config);
		var Result = P.parse();
		P = null;
		return Result;
	}


}