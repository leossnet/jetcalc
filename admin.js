var jison = require("jison")
var Parser = jison.Parser
var fs = require("fs-extra")

var config   = require('./config.js');
var Menu = require('terminal-menu');

require('shelljs/global');

jison.print = function() {} // теперь jison не засирает логи

var generateParser = function(grammar) {
    var parser = new Parser(grammar)
    return parser.generate()
}

var Tasks = {
	compile: function() {
        var items = [
            { file_name: "calculator.jison", output_path: __base + "classes/calculator/jison/calculator.js" },
            { file_name: "column.jison", output_path: __base + "classes/calculator/jison/column.js" },
            { file_name: "compile.jison", output_path: __base + "classes/calculator/jison/compile.js" },
            { file_name: "parser.jison", output_path: __base + "classes/calculator/jison/parser.js" },
            { file_name: "parser.jison", output_path: __base + "static/src/parser.js" }
        ]
        var template = fs.readFileSync(__base + "classes/calculator/jison/template.jison", "utf8")
        items.forEach(function(item) {
            var lexes = fs.readFileSync(__base + "classes/calculator/jison/" + item.file_name, "utf8")
            var grammar = template.replace("<% CAN_HAVE_U_PREFIX_LEXES %>", lexes)
            var parser = generateParser(grammar)

            fs.writeFileSync(item.output_path, parser, "utf8")
        })
    	cd(__base + 'classes/calculator/jison/mocha');
    	exec('mocha start.js');
    	cd(__base);
	},
	install: function(){
		global.__is_install = true;
		var config   = require('./config.js');
		var mongoose = require('mongoose');
		var dbsync    = require('./lib/dbsync.js');
		var api      = require('./lib/helper.js');
		api.connection = mongoose.connect(config.mongoUrl,{
				safe:false,
				server: { socketOptions: {keepAlive: 600000, connectTimeoutMS:800000,socketTimeoutMS:800000 } },
		});
		mongoose.connection.on('connected', function(){
			mongoose.connection.db.dropDatabase(function(){
				dbsync.resync(0,function(){});
			});
		})
	},
	convert: function(){
		var config = require('./config.js'),
		_          = require('lodash'),
		async      = require('async'),
		moment     = require('moment'),
		progress   = require('progress'),
		ms         = require('./db_migration/db/connector.js').ms,
		pg         = require('./db_migration/db/connector.js').pg;
		var msconfig = require('./config.js').dbconfig['mssql'];
		var pgconfig = require('./config.js').dbconfig['postgres'];
		var syncPostgres = {
			getMSModels: function(done){
				var tasks = {
					Columns   : ms.columns,
					Primaries : ms.primaryKeys,
					Foreigns  : ms.foreignKeys,
				};
				async.parallel(tasks,function(err,res){
					if (err) return done(err);
					return done(null,res);
				});
			},
			syncData: function(msStruct,done) {
				var tasks = [];

				var msDbName = msconfig.options.database;
				var pgDbName = pgconfig.options.database;

				var struct = msStruct.Columns;
				_.keys(struct).forEach(function(schemaKey){
					_.keys(struct[schemaKey]).forEach(function(tableKey){
						var sTableKey = _.snakeCase(tableKey);
						tasks.push(function(done){
							var tableName  = msDbName + '.' + schemaKey + '.' + tableKey;
							var sTableName = pgDbName + '.' + schemaKey + '.' + sTableKey;

							var getQuery = 'SELECT * FROM ' + tableName + ';';
							// console.log('get',getQuery);

							ms.query(getQuery,function(err,data){
								if (err) done(err);
								if (data && data.rowCount) {

									var row    = _.first(data.rows)
									var keys   = _.keys(row);
									var values = '';

									keys.forEach(function(key,index){
										keys[index] = _.snakeCase(key);
									});
									keys = '(' + keys.join(',') + ')';


									var toInsert = _.chunk(data.rows,1000);
									var bar = new progress('INSERT ' + tableKey + ' ' + '[:bar] :percent', {
										total: toInsert.length,
										// width: 250,
									});

									var chunkIndex = null;
									async.eachSeries(toInsert,function(rows, done){
										chunkIndex = toInsert.indexOf(rows);
										rows.forEach(function(row,rIndex){
											rValues = _.values(row);
											rValues.forEach(function(val,index){
												if (val == null) {
													rValues[index] = val + '';
												} else if (val instanceof Number) {
													rValues[index] = "'" + val + "'";
												} else {
													if (val instanceof Date)
														val = moment(val).toISOString();
													if (_.includes(val,"'")) {
														val = val.replaceAll("'","''");
													}
													rValues[index] = "'" + val + "'";
												}
											});

											values += '(' + rValues.join(',') + ')';

											if (rIndex != rows.length-1) {
												values +=',\n';
											} else {
												values +=';';
											}

										});

										var setQuery = 'INSERT INTO ' + sTableName + keys + ' VALUES ' + values;
										pg.query(setQuery,function(err){
											// console.log('INSERT INTO ' + sTableName);
											bar.tick(chunkIndex);
											values = '';
											return done(err);
										});
									},function(err){
										return done(err);
									});
								} else {
									return done(null);
								}
							});
						});
					});
				});
				async.series(tasks,function(err){
					console.log('\n');
					return done(err);
				});
			},
			sync: function(done) {
				syncPostgres.getMSModels(function(err,msStruct){
					if (err) return done(err);

					var tasks = [
						function(callback) {
							async.each(_.keys(msStruct.Columns),function(schemaName, done){
								pg.dropSchema(schemaName,function(err){
									return done(err);
								});
							},function(err) {
								callback(err);
							});
						},
						function(callback) {
							pg.createColumns(msStruct.Columns,function(err){
								callback(err);
							});
						},
						function(callback) {
							syncPostgres.syncData(msStruct,function(err){
								callback(err);
							});
						},
						function(callback) {
							pg.createPrimaryKeys(msStruct.Columns,msStruct.Primaries,function(err){
								callback(err);
							});
						},
						function(callback) {
							pg.createForeignKeys(msStruct.Columns,msStruct.Foreigns,function(err){
								callback(err);
							});
						},
					];

					async.series(tasks, function(err) {
						return done(err);
					});
				});
			}
		}
		syncPostgres.sync(function(err){
			if (err) {
				if (err && err.message) console.log(err.message);
				console.log(err);
			} else {
				console.log('Sync completed');
			}
			process.exit();
		});
	}
}

var StartTask = "";
process.argv.forEach(function (val, index, array) {
  	if (Tasks[val]) StartTask = val;
});

if (StartTask){
	Tasks[StartTask]();
} else {
	var menu = Menu({ width: 29, x: 4, y: 2 });
	menu.reset();
	menu.write('Выбор действия\n');
	menu.write('-------------------------\n');
	menu.add('Синхронизация с SQL базой');
	menu.add('MSSQL -> PostgreSQL');
	menu.add('Компиляция парсеров');
	menu.add('Выход');
	menu.on('select', function (label) {
	    menu.close();
	    exec('clear');
	    console.log(label);
	    switch (label){
	    	case 'Компиляция парсеров':
	    		Tasks.compile();
	    	break;
	    	case 'Синхронизация с SQL базой':
	    		Tasks.install();
		   	break;
	    	case 'MSSQL -> PostgreSQL':
	    		Tasks.convert();
		   	break;

	    }
	});

	process.stdin.pipe(menu.createStream()).pipe(process.stdout);

	process.stdin.setRawMode(true);
	menu.on('close', function () {
	    process.stdin.setRawMode(false);
	    process.stdin.end();
	});





}
