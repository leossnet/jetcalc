var MochaTest = require(__base+"sql/mocha.js");
var DataBase = require(__base+"sql/pgsql.js");

var Test = new MochaTest("pgsql",DataBase);


module.exports  = Test;