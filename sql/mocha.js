var _ = require("lodash");
var assert = require('assert');
var async = require("async");
var config = require("../config.js");

module.exports = function(driver,DataBase){
	var self = this;

	self.DataBase = DataBase;

	self.Do = function(done){
		describe('SQL '+driver+": "+config.dbconfig[driver].protocol, function() {
			describe("CleanUp", self.CleanUp);
			describe("UpdateValutaRate", self.UpdateValutaRate);
			describe("SetCells", self.SetCells);	
			describe("GetCells", self.GetCells);
			describe("GetCellsHistory", self.GetCellsHistory);
			describe("IsRatesWork", self.IsRatesWork);
			describe("IsRatesUpdateWork", self.IsRatesUpdateWork);
			describe("CleanUp", self.CleanUp);
			return done();
		})
	}

	self.SetCells = function() {
		it('Проверяем запись первичных данных ', function(done) {
			self.DataBase.SetCells([
				{ CodeCell:"$row1@col1.Pperiod1.Y2017#obj1?",CodeUser:'zuch',Comment:"Комментарий 1",CalcValue:"=2+2",Value:"4",CodeValuta:"MOCHA_TEST"},
				{ CodeCell:"$row2@col1.Pperiod1.Y2017#obj1?",CodeUser:'zuch',Comment:"Комментарий 2",CalcValue:"=2+3",Value:"5",CodeValuta:"MOCHA_TEST"},
				{ CodeCell:"$row3@col1.Pperiod1.Y2017#obj1?",CodeUser:'zuch',Comment:"Комментарий 3",CalcValue:"=2+4",Value:"6",CodeValuta:"MOCHA_TEST"}
			],done);
		})
	}

	self.GetCells = function() {
		var Template = {
			"$row1@col1.Pperiod1.Y2017#obj1?":{CalcValue:"=2+2",Value:4},
			"$row2@col1.Pperiod1.Y2017#obj1?":{CalcValue:"=2+3",Value:5},
			"$row3@col1.Pperiod1.Y2017#obj1?":{CalcValue:"=2+4",Value:6}
		}
		it('Проверяем получение первичных данных', function(done) {
			self.DataBase.GetCells(
				['CodeCell','Value','CalcValue'],
				_.keys(Template),
				function(err,data){
					assert.equal(data.length, 3);
					data.forEach(function(Cell){
						assert.equal(Cell.CalcValue, Template[Cell.CodeCell].CalcValue);
						assert.equal(Cell.Value, Template[Cell.CodeCell].Value);
					})
					return done();					
				}
			)	
		})
	}

	self.GetCellsHistory = function() {
		it('Проверяем работу истории изменений', function(done) {
			var Codes = ["$row1@col1.Pperiod1.Y2017#obj1?"];
			var ExpectedResult = [{CodeCell:"$row1@col1.Pperiod1.Y2017#obj1?",CalcValue:"=2+2",Value:4},{CodeCell:"$row1@col1.Pperiod1.Y2017#obj1?",CalcValue:"=5+5",Value:10}];
			self.DataBase.SetCells([
				{ CodeCell:"$row1@col1.Pperiod1.Y2017#obj1?",CodeUser:'zuch',Comment:"Комментарий 2",CalcValue:"=5+5",Value:"10",CodeValuta:"MOCHA_TEST"},
			],function(err){
				if (err) return done(err);
				self.DataBase.GetCellsHistory(['CodeCell','Value','CalcValue'],Codes,function(err,data){
					assert.equal(_.isEqual(ExpectedResult,data), true);
					return done();
				})
			});
		})
	}

	self.UpdateValutaRate = function() {
		it('Проверяем запись курсов валют', function(done) {
			self.DataBase.SetValutaRates([{
				CodeValutaRate:["MOCHA_TEST","MOCHA_TEST","MOCHA_TEST2","MOCHA_TEST3",2017,"period1"].join("_"),
				CodeValuta:"MOCHA_TEST",
				CodeReportValuta:"MOCHA_TEST",
				CodeReportValuta1:"MOCHA_TEST2",
				CodeReportValuta2:"MOCHA_TEST3",
				Year:2017,
				CodePeriod:"period1",
				Value:1,
				Value1:2,
				Value2:3,
				CodeUser:"zuch"
			}],function(err){
				if (err) return done(err);
				return done();
			})
		})
	}

	self.CleanUp = function() {
		var Cells = ["$row1@col1.Pperiod1.Y2017#obj1?","$row2@col1.Pperiod1.Y2017#obj1?","$row3@col1.Pperiod1.Y2017#obj1?"];
		var Rates = ["MOCHA_TEST_MOCHA_TEST_MOCHA_TEST2_MOCHA_TEST3_2017_period1"];
		it('Очищаем тестовые данные', function(done) {
			self.DataBase.DB.Exec("DELETE FROM cells WHERE \"CodeCell\" IN ('"+Cells.join("','")+"')",function(err){
				if (err) { console.log(err);return done(err);}
				self.DataBase.DB.Exec("DELETE FROM cells_h WHERE \"CodeCell\" IN ('"+Cells.join("','")+"')",function(err){
					if (err) { console.log(err);return done(err);}
					self.DataBase.DB.Exec("DELETE FROM valuta_rates WHERE \"CodeValutaRate\" IN ('"+Rates.join("','")+"')",function(err){
						if (err) { console.log(err);return done(err);}
						self.DataBase.DB.Exec("DELETE FROM valuta_rates_h WHERE \"CodeValutaRate\" IN ('"+Rates.join("','")+"')",function(err){
							if (err) { console.log(err);return done(err);}
							return done();
						})
					})
				})
			});
		})
	}

	self.IsRatesWork = function(){
		it('Проверяем работу курсов валют', function(done) {
			var Template = {
				"$row1@col1.Pperiod1.Y2017#obj1?":{Value:10,ReportValue:10,ReportValue1:20,ReportValue2:30},
				"$row2@col1.Pperiod1.Y2017#obj1?":{Value:5,ReportValue:5,ReportValue1:10,ReportValue2:15},
				"$row3@col1.Pperiod1.Y2017#obj1?":{Value:6,ReportValue:6,ReportValue1:12,ReportValue2:18}
			}
			self.DataBase.GetCells(
				['CodeCell','Value','ReportValue','ReportValue1','ReportValue2'],
				_.keys(Template),
				function(err,data){
					assert.equal(data.length, 3);
					data.forEach(function(Cell){
						assert.equal(_.isEqual(_.pick(Cell,["Value","ReportValue","ReportValue1","ReportValue2"]),Template[Cell.CodeCell]), true);
					})
					return done();					
				}
			)	
		})
	}	

	self.IsRatesUpdateWork = function(){
		it('Проверяем работу курсов валют обновление должно менять ячейки', function(done) {
			self.DataBase.SetValutaRates([{
				CodeValutaRate:["MOCHA_TEST","MOCHA_TEST","MOCHA_TEST2","MOCHA_TEST3",2017,"period1"].join("_"),
				CodeValuta:"MOCHA_TEST",
				CodeReportValuta:"MOCHA_TEST",
				CodeReportValuta1:"MOCHA_TEST2",
				CodeReportValuta2:"MOCHA_TEST3",
				Year:2017,
				CodePeriod:"period1",
				Value:1,
				Value1:5,
				Value2:10,
				CodeUser:"zuch"
			}],function(err){
				var Template = {
					"$row1@col1.Pperiod1.Y2017#obj1?":{Value:10,ReportValue:10,ReportValue1:50,ReportValue2:100},
					"$row2@col1.Pperiod1.Y2017#obj1?":{Value:5,ReportValue:5,ReportValue1:25,ReportValue2:50},
					"$row3@col1.Pperiod1.Y2017#obj1?":{Value:6,ReportValue:6,ReportValue1:30,ReportValue2:60}
				}
				self.DataBase.GetCells(
					['CodeCell','Value','ReportValue','ReportValue1','ReportValue2'],
					_.keys(Template),
					function(err,data){
						assert.equal(data.length, 3);
						data.forEach(function(Cell){
							assert.equal(_.isEqual(_.pick(Cell,["Value","ReportValue","ReportValue1","ReportValue2"]),Template[Cell.CodeCell]), true);
						})
						return done();					
					}
				)
			})
		})
	}

	return self;
};
