var MochaTest = require(__base+"sql/mocha.js");
var DataBase = require(__base+"sql/mssql.js");

module.exports  = (new MochaTest("mssql",DataBase));
