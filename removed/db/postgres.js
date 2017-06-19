var Abstract = require('./db.js');
var config   = require('../../config.js').dbconfig['postgres'];
var _        = require('lodash');
var f        = require('../../lib/functions.js');
var mongoose = require('mongoose');


var AbstractDb = new Abstract();

var PgSqlConnector = function(){

	var self = AbstractDb;

	self.config = config;
	self.translateTypes = {
			'boolean'                    : 'TYPE.Boolean',
			'integer'                    : 'TYPE.Number',
			'numeric'                    : 'TYPE.Number',
			'character varying'          : 'TYPE.String',
			'text'                       : 'TYPE.String',
			'timestamp'                  : 'TYPE.Date',
			'timestamp without time zone': 'TYPE.Date',
			'date'                       : 'TYPE.Date',
			'bytea'                      : 'Buffer'
		};

	self.columns = function(done){
		var sql = "SELECT table_name,column_name,table_schema,column_default,data_type FROM "+config.options.database+".information_schema.columns WHERE table_name NOT LIKE '%_h' AND table_name NOT IN ('cells') AND column_name NOT IN ('is_active','user_edit','date_edit') AND table_schema IN ('core','link','spr') ORDER BY ORDINAL_POSITION ASC";
		self.query(sql,function(err,res){
			if (err) return done (err);
			var Answer = {};
			res.rows && res.rows.forEach(function(I){
				var key = I.table_schema+'.'+ _.ucfirst(_.camelCase(I.table_name));
				if (!Answer[key]){
					Answer[key] = {};
					Answer[key].fields = {};
				}
				if (self.translateTypes[I.data_type]==undefined) 
					return done(I.data_type, " Не определен тип данных.")
				var F = {
					type: self.translateTypes[I.data_type],
					default:(I.column_default+'').replace(/[\(\)\\]/g,'').replace(/\'/g,'')
				}
				if (F.default=='null')
					F.default = null;
				Answer[key].fields[_.ucfirst(_.camelCase(I.column_name))] = F;
			});
			return done (null,Answer);
		});
	}

	self.primaryKeys = function(done){
		var sql = "SELECT  c.TABLE_NAME, c.COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS c LEFT JOIN (SELECT ku.TABLE_CATALOG,ku.TABLE_SCHEMA,ku.TABLE_NAME,ku.COLUMN_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS ku ON tc.CONSTRAINT_TYPE = 'PRIMARY KEY' AND tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME)   pk ON  c.TABLE_CATALOG = pk.TABLE_CATALOG AND c.TABLE_SCHEMA = pk.TABLE_SCHEMA AND c.TABLE_NAME = pk.TABLE_NAME AND c.COLUMN_NAME = pk.COLUMN_NAME WHERE pk.COLUMN_NAME <> 'NULL' AND pk.TABLE_NAME NOT LIKE '%_h'";
		self.query(sql,function(err,res){
			if (err) return done (err);
			var Answ = {};
			res.rows && res.rows.forEach(function(R){
				Answ[_.ucfirst(_.camelCase(R.table_name))] = _.ucfirst(_.camelCase(R.column_name));
			})
			return done (null,Answ);
		});
	}

	self.foreignKeys = function(done){
		var sql = "SELECT tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS reference_table_name, ccu.column_name AS reference_column_name FROM information_schema.table_constraints AS tc JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name WHERE constraint_type = 'FOREIGN KEY';";
		self.query(sql,function(err,res){
			if (err) return done (err);
			var F_INFO = {};
			res.rows.forEach(function(FR){
				var TableName         = _.ucfirst(_.camelCase(FR.table_name));
				var ColumnName        = _.ucfirst(_.camelCase(FR.column_name));
				var RefereceTableName = _.ucfirst(_.camelCase(FR.reference_table_name));

				if (!F_INFO[TableName]) 
					F_INFO[TableName] = {};

				F_INFO[TableName][ColumnName] = RefereceTableName;
			});
			return done (null,F_INFO);
		});
	}

	self.getTableRows = function(schemaName,tableName,done){
		if (!schemaName || !tableName) return done(null,[]);

		schemaName = _.trim(schemaName.toLowerCase(),'[]');
		tableName  = _.trim(_.snakeCase(tableName).toLowerCase(),'[]');

		var query  = 'select * from '+ schemaName + '.' + tableName;

		self.query(query,function(err,data){
			console.log(tableName)
			if (err) done(err);			
			if (data && data.rows && data.rows.length) {
				var resRows = [];

				data.rows.forEach(function(row){
					var resRow = {};

					for (var key in row) {
						resRow[_.ucfirst(_.camelCase(key))] = row[key];
					}

					resRows.push(resRow);
				});
				return done(null, resRows);
			} else {
				return done(null,[]);
			}
		});
	}

	self.getCells = function(fields,cells,done){
		var data = self.formatCellRequest(cells);

		fields && fields.forEach(function(field,index){
			fields[index] = _.snakeCase(field);
		});

		var sql = "select pub.getcells('"+fields.join(',')+"','"+ data +"')";
		self.query(sql,function(err,result){
			if (err) return done(err);
			
			if (!result || !result.rows || !result.rows[0].getcells){
				console.log(">>>  Empty Result Set");
				return done (err,{},sql);
			}

			var cells = [];

			result.rows[0].getcells.forEach(function(cell){
				var resCell = {};

				_.keys(cell).forEach(function(key){
					resCell[_.ucfirst(_.camelCase(key))] = cell[key];
				});

				cells.push(resCell);
			});

			cells = f.remap(cells,'CodeCell')
			return done(err,cells,sql);
		});
	}

	self.formatCellSetRequest = function(cells){
		if (self.config.protocol=='json'){
			var json = [];
			cells.forEach(function(Cell,index){
				json[index] = {};
				for (var key in Cell){
					json[index][_.snakeCase(key).toLowerCase()] = Cell[key];
				}
			});
			return JSON.stringify(json);
		} else {
			throw "Не определен спопоб форматирования";
		}
	}

	self.setCells = function(cells,done){
		var data = self.formatCellSetRequest(cells);
		var command = "select pub.setcells('" + data + "',0)";
		//console.log(command);
		self.query(command,function(err){
			if (err) {
				console.log("Ошибка сохранения:");
				console.log(command);
				console.log(err);
			}
			return done(err);
		});
	}

	self.formatUniversalSet = function(info, objectsArray){
		var result = {
			'core.commits': {},
		};

		if (self.config.protocol=='json'){
			if (!_.isArray(objectsArray)) objectsArray = [objectsArray];
			var random = mongoose.Types.ObjectId();

			result['core.commits'] = {
				code_commit  : (info.CodeCommit||random),
				name_commit  : (info.NameCommit||''),
				s_name_commit: (info.SNameCommit||''),
				code_user    : (info.CodeUser||'')
			};


			objectsArray.forEach(function(ORaw){
				var rTableName = ORaw.tableName.replace(/[\[\]]/g,'').split('.');

				var schemaName = _.trim(_.first(rTableName),'[]').toLowerCase();
				var tableName = _.snakeCase(_.trim(_.last(rTableName),'[]')).toLowerCase();
				var resTableName = schemaName + '.' + tableName;

				var key = ORaw.codeKey;
				O = _.omit(ORaw,['codeKey','tableName','IsNew']);
				result[resTableName] = {};
				for (var i in O){
					if (i!=key){
						var sI = _.snakeCase(i).toLowerCase();
						result[resTableName][sI] = O[i];
					} else {
						var sI = _.snakeCase(i).toLowerCase();
						result[resTableName]['old_'+sI] = O[i];
						result[resTableName]['new_'+sI] = O[i];
					}
				}
			});
			console.log(result);
			return JSON.stringify(result);
		} else {
			throw "Не определен споcоб форматирования";
		}
	}

	self.formatForHistory = function(cell){
		if (self.config.protocol=='json'){	
			var json = {};
			json.year = cell.Year;
			json.code_period = cell.CodePeriod;
			json.code_obj = cell.CodeObj;
			json.code_row = cell.CodeRow;
			json.code_col = cell.CodeCol;
			
			return json;
		} else {
			throw "Не определен спопоб форматирования";	
		}
	}

	self.getCellHistory = function(cell,done){
		var json = JSON.stringify(self.formatForHistory(cell));

		var command = "select * from pub.getcells_h('" + json + "');";
		console.log(command);
		self.query(command,function(err,result){
			console.log(err,result);
			if (err) {
				console.log("Ошибка получения истории изменения ячейки:");
				console.log(command);
				console.log(err);
				return done(err);
			}
			if (result && result.rows) {
				var res = [];
				result.rows.forEach(function(r,i){
					res[i] = {};
					_.keys(r).forEach(function(key){
						res[i][_.ucfirst(_.camelCase(key))] = r[key];
					});
				});
				return done(err,res);
			}
		}) 
	}

	self.save = function(commitInfo,objectsArray,done){
		return done(null);
		var data = self.formatUniversalSet(commitInfo,objectsArray);
		console.log(">>>>>>>>>>>>>>",Set,">>>>>>>>>>>>>>");
		var sql = "SELECT pub.setuniversal('" + data + "'::json, 0)";
		if (commitInfo.Sql) return sql;
		// console.log(sql);
		self.query(sql,function(err,result){
			// if (err) console.log(err);
			return done (null,result);
		});
	}

};


var PgSql = new PgSqlConnector();
PgSql = _.extend(AbstractDb,PgSql);

PgSql.connect(config);
module.exports = PgSql;