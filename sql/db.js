var DbType  = require(__base+"config.js").db;
var Db = null;

if (DbType=='mssql'){
	Db = require(__base+'sql/mssql.js');
} else {
	Db = require(__base+'sql/pgsql.js');
}

module.exports = Db;