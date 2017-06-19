global.__base = __dirname + "/";

var PgSqlTest = require(__base+"sql/mocha/pgsql.js");

PgSqlTest.Do(function(err){
	var MsSqlTest = require(__base+"sql/mocha/mssql.js");
	MsSqlTest.Do(function(){})	
})
