var Abstract = require('./db.js');
var config = require('../../config.js').dbconfig['mssql'];
var _ = require('lodash');
var f = require('../../lib/functions.js');


var AbstractDb = new Abstract();

var MsSqlConnector = function(){
	var self = AbstractDb;

	self.translateTypes = {
		'bit'      :'TYPE.Boolean',
		'int'      :'TYPE.Number',
		'decimal'  :'TYPE.Number',
		'nvarchar' :'TYPE.String',
		'varchar'  :'TYPE.String',
		'datetime' :'TYPE.Date',
		'date'     :'TYPE.Date',
		'varbinary':'Buffer'
	};

	self.columns = function(done){
		// select * from information_schema.columns
		var sql = "SELECT TABLE_NAME,COLUMN_NAME,TABLE_SCHEMA,COLUMN_DEFAULT,DATA_TYPE FROM "+config.options.database+".INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME NOT LIKE '%_h' AND TABLE_NAME NOT IN ('Cells') AND COLUMN_NAME NOT IN ('IsActive','UserEdit','DateEdit') AND TABLE_SCHEMA <> 'dbo' ORDER BY ORDINAL_POSITION ASC";
		self.query(sql,function(err,res){
			if (err) return done (err);
			var Answer = {};
			res.rows && res.rows.forEach(function(I){
				var key = I.TABLE_SCHEMA+'.'+I.TABLE_NAME;
				if (!Answer[key]){ Answer[key] = {};Answer[key].fields = {};}
				if (self.translateTypes[I.DATA_TYPE]==undefined) 
					return done(I.DATA_TYPE, " Не определен тип данных.")
				var F = {
					type: self.translateTypes[I.DATA_TYPE],
					default:(I.COLUMN_DEFAULT+'').replace(/[\(\)\\]/g,'').replace(/\'/g,'')
				}
				if (F.default=='null') F.default = null;
				Answer[key].fields[I.COLUMN_NAME] = F;
			})
			return done (null,Answer);
		})
	}

	// Answer : err, Hash {TableName:PrimaryKey}
	self.primaryKeys = function(done){
		/*
		SELECT
c.column_name, c.data_type
FROM
information_schema.table_constraints tc 
JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name) 
JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema AND tc.table_name = c.table_name AND ccu.column_name = c.column_name
where constraint_type = 'PRIMARY KEY' 
		 */
		var sql = "SELECT  c.TABLE_NAME, c.COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS c LEFT JOIN (SELECT ku.TABLE_CATALOG,ku.TABLE_SCHEMA,ku.TABLE_NAME,ku.COLUMN_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS ku ON tc.CONSTRAINT_TYPE = 'PRIMARY KEY' AND tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME)   pk ON  c.TABLE_CATALOG = pk.TABLE_CATALOG AND c.TABLE_SCHEMA = pk.TABLE_SCHEMA AND c.TABLE_NAME = pk.TABLE_NAME AND c.COLUMN_NAME = pk.COLUMN_NAME WHERE pk.COLUMN_NAME <> 'NULL' AND pk.TABLE_NAME NOT LIKE '%_h'";
		self.query(sql,function(err,res){
			if (err) return done (err);
			var Answ = {};
			res.rows && res.rows.forEach(function(R){
				Answ[R.TABLE_NAME] = R.COLUMN_NAME;
			})
			return done (null,Answ);
		})	
	}
	// Answer : err, Hash {TableName:{Key:ReferencedTableName, ...}}
	self.foreignKeys = function(done){
		var sql = "SELECT f.name AS ForeignKey, OBJECT_NAME(f.parent_object_id) AS TableName, COL_NAME(fc.parent_object_id,fc.parent_column_id) AS ColumnName, OBJECT_NAME (f.referenced_object_id) AS ReferenceTableName, COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS ReferenceColumnName FROM sys.foreign_keys AS f INNER JOIN sys.foreign_key_columns AS fc ON f.OBJECT_ID = fc.constraint_object_id";
		self.query(sql,function(err,res){
			if (err) return done (err);
			var F_INFO = {};
			res.rows && res.rows.forEach(function(FR){
				if (!F_INFO[FR.TableName]) F_INFO[FR.TableName] = {};
				F_INFO[FR.TableName][FR.ColumnName] = FR.ReferenceTableName;
			})			
			return done (null,F_INFO);
		})	
	}

	self.getTableRows = function(rSchemaName,rTableName,done){
		if (!rSchemaName || !rTableName) return done(null,[]);

		var schemaName = rSchemaName.toLowerCase();
		var tableName = _.capitalize(_.camelCase(_.trimStart(rTableName,'_h')));

		if (_.endsWith(rTableName,'_h')) tableName +='_h';

		var query = 'select * from '+ schemaName + '.' + tableName;
		self.query(query,function(err,data){
			if (err) done(err);
			return done(null, data.rows);
		});
	}


	// Simple SQL
	
	self.getCellsSimple = function(fields,cells,done){
		var data = self.formatCellRequest(cells);
		var IsTable = 0;
		var sql = "EXEC [dbo].[GetCells]  @result='"+fields.join(',')+"', @data = '"+data.replace(/'/g,"''")+"' ";
		self.query(sql,function(err,result){
			// console.log(result);
			if (!result || !result.rows){
				//console.log(">>>  Empty Result Set");
				return done (err,{},sql);
			}
			return done (err,f.remap(result.rows,'CodeCell'),sql);	
		})
	}

	self.setCellsSimple = function(cells,done){
		cells = _.map(cells,function(C){
			return _.pick(C,["CodeCell","CodeUser","CodePeriod","Comment","Year","CalcValue","Value","CodeValuta"]);
		})
		var xml = self.formatCellSetRequest(cells);
		var command = "EXEC [dbo].[SetCellsXML] @data = '"+xml.replaceAll("'","''")+"',	@emulate  = 0";
		self.query(command,function(err){
			if (err) {
				console.log("Ошибка сохранения:");
				console.log(command);
				console.log(err);
			}
			return done(err);
		});
	}


















	self.getCells = function(fields,cells,done){
		var data = self.formatCellRequest(cells);
		var IsTable = 0;
		var sql = "EXEC [pub].[GetCells]  @IsAct = 1,	@IsTable = "+IsTable+", @result='"+fields.join(',')+"', @data = '"+data.replace(/'/g,"''")+"' ";
		self.query(sql,function(err,result){
			// console.log(result);
			if (!result || !result.rows){
				//console.log(">>>  Empty Result Set");
				return done (err,{},sql);
			}
			if (IsTable){
				return done (err,f.remap(result.rows,'CodeCell'),sql);	
			} else {
				self.parseCellAnswer(result.rows,function(err,result){
					return done (err,result,sql);
				});
			}
		})
	}

	self.getCellHistory = function(cell,done){
		var xml = self.formatForHistory(cell);
		var command = "EXEC [pub].[GetCells_h] @data = '"+xml.replaceAll("'","''")+"',	 @IsTable = 1";
		//console.log(command);
		self.query(command,function(err,result){
			if (err) {
				console.log("Ошибка получения истории изменения ячейки:");
				console.log(command);
				console.log(err);
			}
			return done(err,result.rows);
		}) 
	}

	self.setCells = function(cells,done){
		var xml = self.formatCellSetRequest(cells);
		var command = "EXEC [pub].[SetCells] @data = '"+xml.replaceAll("'","''")+"',	@emulate  = 0";
		//console.log(command);
		self.query(command,function(err){
			console.log(command,err);
			if (err) {
				console.log("Ошибка сохранения:");
				console.log(command);
				console.log(err);
			}
			return done(err);
		});
	}

};


var MsSql = new MsSqlConnector();
MsSql = _.extend(AbstractDb,MsSql);

MsSql.connect(config);

module.exports = MsSql;