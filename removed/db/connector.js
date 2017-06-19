var config = require('../../config.js');
var anydb = require("any-db-"+config.db); // any-db-mssql
var db = require('./'+config.db+'.js');   // mssql.js










module.exports = db;