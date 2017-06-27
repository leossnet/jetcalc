var MochaTest = require("../mocha.js");
var DataBase = require("../pgsql.js");

var Test = new MochaTest("pgsql",DataBase);


module.exports  = Test;