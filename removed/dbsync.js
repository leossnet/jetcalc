var mongoose      = require('mongoose'),
	config        = require('../config.js'),
	_             = require('lodash'),
	sql           = require('mssql'),
	async         = require('async'),
	moment        = require('moment'),
	api           = require('./helper.js'),
	fs            = require('fs'),
	extendSchema  = {},
	backupFields  = {},
	db = require(__base+'/sql/db.js'),
	ModelsSync    = require('../classes/InitModels.js'),
	ConfigPlace   = __base+'/modules/models/serverconfig.js',
	f             = require('./functions.js');

	

// Не должно быть каких-то прямых сохранений в Mongo через Mongoose, чтобы не выполнялись pre-save и post-save


var db_helper = {

	p:null,
	current:0,
	all:0,

	resync:function(req,done){
		var u = 0; 
		if (req) u = req.user._id;
		db_helper.p = new api.ProgressBar(u);
		var session = req.session;
		done(db_helper.p.id);
		db_helper.p.init(6); //6 Шагов
		db_helper.syncModels(function(){
			ModelsSync(function(){
				db_helper.syncData(function(){
					db_helper.mapPeriods(function(){
						db_helper.indexSearch(function(){
							db_helper.buildTrees(function(){								
								db_helper.p.finish();
								console.log("All Done!");
								if (req) {
									mongoose.model('user').findOne({CodeUser:req.user.CodeUser}).exec(function(err,cU){
										session.passport.user = cU._id;
										session.save();
									});
								}
								if (!req) process.exit();
							});
						});
					});
				});
			});
		});
	},



	indexSearch:function(done){
		mongoose.model('user').find().exec(function(err,cUs){
			var tasks = [], Fields = mongoose.model('user').SearchableFields();
			cUs.forEach(function(cU){
				tasks.push(function(cU){
					return function(done){
						var S = "";  Fields.forEach(function(F){ S+= cU[F];})
						var query = {
							CodeUser : cU.CodeUser
						};
						var update = {
							Mail     : (cU.Mail+'').toLowerCase(),
							LoginUser: (cU.LoginUser+'').toLowerCase(),
							search   : S.toSearchString()
						};
						mongoose.model('user').update(query,update).exec(done);
					}
				}(cU))
			})
			async.parallel(tasks,done);
		})
	},

	inviteUsers:function(done){
		var User = mongoose.model('user');
		User.find({Mail:config.adminmail,IsAdmin:true}).exec(function(err,cUsers){
			if (!cUsers.length) return done();
			var tasks = [];
			cUsers.forEach(function(cU){
				tasks.push(function(user){
					return function(cb){
						user.initEmailAuth('signin',cb);
					}
				}(cU))
			})
			async.parallel(tasks,done);
		})
	},

	buildTrees:function(done){
        var Row = mongoose.model("row"), Parents = {}, Trees = {};
        Row.find({CodeParentRow:{$in:['',null]}}).exec(function(err,RootRows){
		  	console.log("Creating Tree ",RootRows.length);
			var Index = RootRows.length;
		    async.eachSeries(RootRows,function(Row,cb){
		    	console.log("Root",Row.CodeRow);
				Row.IndexTree("",function(err){
					console.log((--Index)," remain");
					return cb();
				});        		
		    },function(err){
	        	console.log("All Trees are indexed");
	        	return done();
        	})
        })	  

	},

	mapPeriods:function(done){
        var Period = mongoose.model("period");
        Period.find().exec(function(err,Ps){
        	async.each(Ps,function(P,cb){
        		P.BeginDateText = moment(P.BeginDate).format("DD-MM");
        		P.EndDateText = moment(P.EndDate).format("DD-MM");
        		P.save(cb);
        	},function(){
        		console.log("Periods are indexed");
        		return done();
        	})
        })
	},


	buildTreesOld:function(done){
		db_helper.current = 0;
		db_helper.all = 0;
		db_helper.p.do(5,db_helper.all,db_helper.current,'Индексация дерева рядов(Rows) - долгая');
		var self = this;
		self.ParentChildren = {}; self.Result = {}; self.Codes = {}, self.ChildrenParents = {}; 
		self.Row = mongoose.model('row'); self.CodeRoot = '000000000000';
		self.setLftRgt = function(parentCode, left){
			self.Result[parentCode].lft = left;
			self.Result[parentCode].rgt = left+1;
			var children = self.ParentChildren[parentCode];
			if (children && children.length > 0) {
				children.forEach(function(child) {
					self.setLftRgt(child, self.Result[parentCode].rgt);
					self.Result[parentCode].rgt = self.Result[child].rgt + 1;
				});
				return;
			} else {
				return;
			}
		}
		self.init = function(done){
			self.Row.update({CodeRow:{$in:[self.CodeRoot]}},{CodeParentRow:'ROOT'},function(){
				self.Row.find({CodeRow:{$not:{$in:['ROOT','NONE']}}},"CodeRow CodeParentRow").sort({IndexRow:1,NumRow:1}).lean().cursor().on('data',function(object){
					if (!self.ParentChildren[object.CodeParentRow]) self.ParentChildren[object.CodeParentRow] = [];
					self.ParentChildren[object.CodeParentRow].push(object.CodeRow);

					self.ChildrenParents[object.CodeRow] = object.CodeParentRow;
					self.Result[object.CodeRow]          = {lft:0,rgt:0,rowpath:''};
					self.Codes[object.CodeRow]           = object.CodeRow;
				}).on('end',done);
			});
		}
		self.init(function(){
			self.Row.findOne({CodeRow:self.CodeRoot},"CodeRow").lean().exec(function(err,cRoot){
				self.Result[cRoot.CodeRow] = {lft:0,rgt:0,rowpath:''};
				self.setLftRgt(cRoot.CodeRow,0);
				for (var rowCode in self.Result){
					var codes = [], current = rowCode;
					while(current>cRoot.CodeRow){
						codes.unshift(self.Codes[current]);
						current = self.ChildrenParents[current];
					}
					codes.unshift(self.CodeRoot);
					self.Result[rowCode].rowpath = '/'+codes.join('/')+'/';
				}
				var tasks = [];
				for (var rowCode in self.Result){
					var Update = self.Result[rowCode];
					tasks.push(function(CodeRow,Update){
						return function(cb){
							self.Row.update({CodeRow:CodeRow},Update,function(){
								db_helper.current++;
								db_helper.p.do(5,db_helper.all,db_helper.current,'Индексация дерева рядов(Rows)');
								cb();
							});
						}
					}(rowCode,Update));
				}
				self.all = tasks.length;
				async.series(tasks,done);
			});
		});
	},

	getTablesInfo:function(done){

		var casts = {
			'TYPE.Number' :api.parseNumber,
			'TYPE.String' :String,
			'TYPE.Boolean':api.parseBoolean
		};

		var F_INFO = {}; 

		async.parallel({
			Columns  : db.columns,
			Primaries: db.primaryKeys,
			Foreigns : db.foreignKeys,
		},function(err,res){
			if (err) return done(err);

			var Columns   = res.Columns;
			var Primaries = res.Primaries;
			var Foreigns  = res.Foreigns;

			for (var TableName in Primaries){
				Primaries[TableName] = Primaries[TableName].replace("Id",'').replace("_",'').toLowerCase();
			}

			for (var TableName in Foreigns){
				var mName = Primaries[TableName];
				if (!F_INFO[mName]) F_INFO[mName] = {};
				for (var Field in Foreigns[TableName]){
					F_INFO[mName][Field] = Primaries[Foreigns[TableName][Field]];
				}
			}

			var result = {};
			// set default value
			for (var TableName in Columns) {
				var ColumnInfo = Columns[TableName].fields;

				if (!result[TableName]) {
					result[TableName] = {};
					result[TableName].fields = {};
				}

				for (var ColumnName in ColumnInfo) {
					var F = ColumnInfo[ColumnName];

					if (casts[F.type]) {
						var value = (F.default+'').replace(/[\(\)\\]/g,'').replace(/\'/g,'').split('::')[0];
						F.default = casts[F.type](value);
					}

					if (F.type=='TYPE.Date')
						F.default = new Date(F.default);
					if (F.default=='null') 
						F.default = null;

					result[TableName].fields[ColumnName] = F;
				}
			}

			var realResult = {}, links = {};
			for (var tableName in result){

				var fields    = result[tableName].fields;
				var keys      = _.keys(fields); 

				var primary         = _.trimStart(_.first(keys),'Id');

				var CodeField = "Code"+ primary;
				var IdField   = "Id"  + primary;
				var NameField = "Name"+ primary;
				var ModelName = primary.toLowerCase();

				//set primary key
				if (fields[CodeField]) {
					fields[CodeField].view   = 'all';
					fields[CodeField].role   = 'code';
					fields[CodeField].index  = true;
					fields[CodeField].unique = true;
				}
				if (fields[IdField]) {
					fields[IdField].view     = 'none';
					fields[IdField].role     = 'id';
					fields[IdField].readonly = true;
					fields[IdField].index    = true;
				}
				if (fields[NameField]) {
					fields[NameField].view = 'all';
					fields[NameField].role = 'name';
				}

				//set foreign key
				keys.forEach(function(k){
					if (F_INFO[ModelName] && F_INFO[ModelName][k]){
						var RModel = F_INFO[ModelName][k];

						fields[k].refmodel = RModel;
						fields[k].view     = "none";
						fields[k].dep      = "Code"+k.substring(2);

						fields["Code"+k.substring(2)] = {
							type    :'TYPE.String',
							default :"",
							view    :'none',
							dep     :k,
							refmodel:RModel,
							index   :true,
							extended:true
						};

						fields[k].hidden=true;
					}
				});


				//set table schema
				var Place = tableName.split('.')[0].ucfirst();
				if (Place=='Spr')
					Place='Service';

				//extend schema
				if (extendSchema[ModelName]){
					for (var VarName in extendSchema[ModelName]){
						fields[VarName] = extendSchema[ModelName][VarName];
					}
				}

				for (var i in fields){
					if (!fields[i].view){
						fields[i].view = 'none';
					}
				}

				realResult[ModelName] = {
					tablename :'['+tableName.replace('.','].[')+']',
					menuplace :Place,
					fields    :fields
				}
			}

			return done && done(null,realResult);
		});
	},


	syncModels:function(done){
		db_helper.getTablesInfo(function(err,r){
			if (err) return done(err);
			var ignoreTableSync = ['cell'];//,'valutarate','course','data'
			ignoreTableSync.forEach(function(t){
				if (r[t]) r[t].ignoredatasync = true;
			})
			var s = JSON.stringify(r,null,'\t').replace(/\"TYPE\.(.*?)\"/g,"$1");
			fs.writeFile(ConfigPlace,'module.exports = '+s,function(){
				done();
			});
		});
	},


	syncData:function(done){
		var self = {};
		self.finalCallback = done;
		self.Current = require(ConfigPlace);
		self.Backup = {};
		// Step 1 - Сохраняем дополнительные данные
		self.getBackupData = function(done){
			return done();
			// db_helper.all = _.keys(extendSchema).length;
			// db_helper.current = 0;
			// db_helper.p.do(1,db_helper.all,db_helper.current,'Резервное копирование данных');
			var tasks = [];
			for (var ModelName in extendSchema){

				var CodeField     = "", 
					Fields2Stay   = _.keys(extendSchema[ModelName]);

				if (backupFields[ModelName]) 
					Fields2Stay = _.uniq(Fields2Stay.concat(backupFields[ModelName]));

				for (var FieldName in self.Current[ModelName].fields){
					var Info = self.Current[ModelName].fields[FieldName];
					if (Info.role=='code') CodeField = FieldName;
				}

				tasks.push(function(ModelName,Fields2Stay,CodeField){return function(callback){
					mongoose.model(ModelName).find({},Fields2Stay.concat([CodeField]).join(' ')).lean().exec(function(err,cCs){
						self.Backup[ModelName] = {Code:CodeField,Data:{}};
						cCs.forEach(function(C){
							self.Backup[ModelName].Data[C[CodeField]] = _.omit(_.omit(C,CodeField),'_id');
						});
						// db_helper.current++;
						// db_helper.p.do(1,db_helper.all,db_helper.current,'Резервное копирование данных');
						return callback();
					});
				}}(ModelName,Fields2Stay,CodeField));
			}
			async.parallel(tasks,function(err){
				return done(err);
			})
		}
		// Step 2 - Импорт данных + дополнительные поля побэкапленные
		self.importData = function(done){
			self.Current = require(ConfigPlace);
			// db_helper.current = 0;
			// db_helper.all = _.keys(self.Current).length;
			// db_helper.p.do(2,db_helper.all,db_helper.current,'Импорт данных из MSSQL');
			var tasks = [];
			_.keys(self.Current).forEach(function(ModelName){
			// for (var ModelName in self.Current){
				var Info = self.Current[ModelName];
				if (!Info.ignoredatasync)
				tasks.push(
				function(ModelName){
					return function(done){
					// db_helper.current ++;
					// db_helper.p.do(2,db_helper.all,db_helper.current,'Импорт данных '+ModelName);
					var M = mongoose.model(ModelName);
					M.remove().exec(function(err){
						console.log(ModelName,Info.tablename)
						if (err) return done(err);
						var rows = [];
						var schemaName = Info.tablename.split('.')[0];
						var tableName  = Info.tablename.split('.')[1];

						db.getTableRows(schemaName,tableName,function(err,rows){
							if (err) return done(err);
							if (rows && rows.length) {

								var row    = _.first(rows)
								var keys   = _.keys(row);
								var values = '';

								keys.forEach(function(key,index){
									keys[index] = _.snakeCase(key);
								});

								async.eachSeries(_.chunk(rows,999),function(rows, done){
									var resRows = [];

									rows.forEach(function(row){
										var resRow = {};

										_.keys(row).forEach(function(key){
											var cKey = _.ucfirst(_.camelCase(key));
											resRow[cKey] = row[key];
										})
										resRows.push(resRow);
									});
									M.collection.insertMany(resRows, function(err) {
										if (err && (err.code != 11000)) 
											return done(err);
										else 
											return done(null);
									});
								},function(err){
									return done(err);
								});
							} else {
								return done(null);
							}
						});
					});
					}
				}(ModelName));
			});
			async.series(tasks,function(err){
				return done(err);
			})
		}
		// Step 3 - Обновление ссылок
		self.mapLinks = function(done){
			self.Current = require(ConfigPlace);
			db_helper.current = 0;
			db_helper.all = 0;
			db_helper.p.do(3,db_helper.all,db_helper.current,'Установка связей между объектами');
			var tasks = [], LinkInfo = [];
			var PrimaryIds = {};
			for (var ModelName in self.Current){
				var Fields  = self.Current[ModelName].fields;
				for (var FF in Fields){
					if (Fields[FF].role=='id') {
						PrimaryIds[ModelName] = FF;
					}
				}
				if (self.Current[ModelName].menuplace=="Link"){

					var linkName       = "Link_"+ModelName.toLowerCase();
					LinkInfo[linkName] = {model:ModelName,deps:{}};

					for (var FieldName in Fields){
						var Info = Fields[FieldName];
						if (FieldName.substring(0,2)=="Id" && Info.refmodel){
							LinkInfo[linkName].deps[FieldName] = Info.refmodel;
						}
					}
				}
			}
			function initEmptyLinks(LinkInfo,done){
				var tasks = [];
				for (var LinkName in LinkInfo){
					var classes = _.values(LinkInfo[LinkName].deps);
					classes.forEach(function(className){
						tasks.push(function(LinkName,className){
							return function(cb){
								var u = {}; u[LinkName] = [];
								mongoose.model(className).update({},u,{multi:true},cb);
							}
						}(LinkName,className))
					})
				}
				async.parallel(tasks,done);
			}

			initEmptyLinks(LinkInfo,function(){
				var Setter = {}, IdFields = {};

				for (var Field2Set in LinkInfo){
					var Deps = LinkInfo[Field2Set].deps, Model = LinkInfo[Field2Set].model; 
					tasks.push(function(Model,Deps,Field2Set){
						return function(done){
							var Fields2Find = _.keys(Deps);
							mongoose.model(Model).find({},Fields2Find.join(' ')).lean().cursor().on("data", function(object){
								for (var IdField in Deps){
									var className = Deps[IdField];
									if (!IdFields[className])IdFields[className] = IdField;
									if (!Setter[className]) Setter[className] = {};
									if (!Setter[className][object[IdField]]) Setter[className][object[IdField]] = {};
									if (!Setter[className][object[IdField]][Field2Set]) Setter[className][object[IdField]][Field2Set] = [];
									Setter[className][object[IdField]][Field2Set].push(object._id);
								}
							}).on("end",function(err,R){
								return done(err,R);
							});
						}
					}(Model,Deps,Field2Set));
				}
				async.parallel(tasks,function(){ 
					var tasksToUpdate = [];
					for (var model in Setter){
						for (var id in Setter[model]){
							tasksToUpdate.push(function(model,id,update){
								return function(cb){
									if (!id || id=='null') {
										return cb();	
									}
									id = parseInt(id);
									var q = {}; q[PrimaryIds[model]] = id;
									mongoose.model(model).update(q,update,function(err){
										if (err) { 
											console.log(err);
										 }
										if (model=='doc' && id==306){
											console.log("Q:",q,"UPDATE",update,"ID",id);
										}

										db_helper.current ++;
										db_helper.p.do(3,db_helper.all,db_helper.current,'Установка связей между объектами :'+model);
										return cb();
									});
								}
							}(model,id,Setter[model][id]))
						}
					}
					db_helper.all = tasksToUpdate.length;
					async.series(tasksToUpdate,function(err,R){
						return done(err,R);
					});
				});
			})

		}
		// Step 4 - Обновление кодов

		self.Translates = {};

		self.loadTranslates = function(done){
			var tasks = [];
			for (var ModelName in self.Current){
				var Fields  = self.Current[ModelName].fields;
				var IdField = "", CodeField = "";
				if (self.Current[ModelName].menuplace!="Link"){
					for (var FieldName in Fields){
						if (Fields[FieldName].role){
							if (Fields[FieldName].role=='code') CodeField = FieldName;
							if (Fields[FieldName].role=='id')   IdField = FieldName;
						}
					}
				}
				tasks.push(function(ModelName,IdField,CodeField){
					return function(done){
						mongoose.model(ModelName).find({},"-_id "+[IdField,CodeField].join(' ')).lean().exec(function(err,cRs){
							self.Translates[ModelName] = {}
							cRs.forEach(function(cR){
								self.Translates[ModelName][cR[IdField]] = cR[CodeField];
							})
							return done && done();
						})
					}
				}(ModelName,IdField,CodeField))
			}
			async.parallel(tasks,done);
		}

		self.mapCodes = function(done){
			ModelsSync(function(){
				db_helper.current = 0;
				db_helper.all = 0;
				db_helper.p.do(4,db_helper.all,db_helper.current,'Переход от Id на Code ');
				self.loadTranslates(function(){
					var tasks = [];
					for (var ModelName in self.Current){
						var Fields = self.Current[ModelName].fields;
						var MapCodes = {}, NeedToMap = false; var MapModels = {}; 
						for (var FieldName in Fields){
							if (Fields[FieldName].refmodel && FieldName.substring(0,2)=="Id"){
								NeedToMap = true;
								MapCodes[FieldName] = Fields[FieldName].dep;
								MapModels[FieldName] = Fields[FieldName].refmodel;
							}
						}
						if (NeedToMap){
							tasks.push(function(ModelName,MapCodes,MapModels){
								return function(realCb){
									console.log(ModelName,MapCodes);
									var cb = function(){
										db_helper.current++;
										db_helper.p.do(4,db_helper.all,db_helper.current,'Переход от Id на Code '+ModelName);
										return realCb();
									}
									var Fields = _.uniq(_.keys(MapCodes).concat(_.values(MapCodes))).join(" ");
									var M = mongoose.model(ModelName);
									M.count().exec(function(err,Count){
										if (!Count) return cb(); 
										var curr = 0, max = Count;
										M.find({},Fields).lean().cursor().on("data", function(object){
											curr++;
											var Update = {}, needUpdate = false;
											for (var Id in MapCodes){
												var Code = MapCodes[Id];
												var MM = MapModels[Id];
												if (self.Translates[MM][object[Id]]){
													needUpdate = true;
													Update[Code] = self.Translates[MM][object[Id]];
												}
											}
											if (!needUpdate) {
												// console.log('here')
												db_helper.p.do(4,db_helper.all,db_helper.current,'Переход от Id на Code. '+ModelName+': '+Math.min(curr,max)+'/'+max);
												if (--Count==0) return cb();
											} else {
												M.findByIdAndUpdate(object._id,Update,function(err){
													// console.log('here2')
													db_helper.p.do(4,db_helper.all,db_helper.current,'Переход от Id на Code. '+ModelName+': '+Math.min(curr,max)+'/'+max);
													if (--Count==0) return cb();
												});
											}
										});
									});
								}
							}(ModelName,MapCodes,MapModels))
						} 
					}
					db_helper.all = tasks.length;
					async.series(tasks,done);
				});
			});
		}

		async.series([
			self.getBackupData,
			self.importData,
			self.mapLinks,
			self.mapCodes,
		],self.finalCallback)

	},

}

module.exports = db_helper;