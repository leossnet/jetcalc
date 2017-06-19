var fs = require('fs');
var _ = require('lodash');
var assert = require("assert");
var calculator = require('../calculator.js');

var filesList = fs.readdirSync('./Documents');

filesList.forEach(function(file){
	var doc = require('./Documents/'+file);
	doc.forEach(function(col){
		col.Contexts && col.Contexts.forEach(function(con){
			contextTest(col.Formula,con.Context,con.Result);
		})
	})
})

function contextTest (formula,context,expected){
	var r = "";
	try {
		calculator.setContext(context);
		r = calculator.parse(formula)+'';
	} catch(e){
		r = JSON.stringify(e)+'';
	}
    it(formula+': '+r+'    ==    '+expected, function () {
      assert.equal(r.replace(/ /g,''), expected.replace(/ /g,''));
    });
}
