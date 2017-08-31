var _ = require("lodash");
var async = require("async");
var csv = require('csv-parser')
var fs = require('fs')

var Reparse = (new function(){
	var self = this;

	self.PeriodTranslate = {
		"январь":"11",
		"февраль":"12",
		"март":"13",
		"апрель":"14",
		"май":"15",
		"июнь":"16",
		"июль":"17",
		"август":"18",
		"сентябрь":"19",
		"октябрь":"110",
		"ноябрь":"111",
		"декабрь":"112",
	}

	self.Result = {};


	self.do = function(done){
		if (!_.isEmpty(self.Result)) return done(null,self.Result);
		self.Result = {};
		var lvl = function(text){
			return (text.length-(text.trim()).length)/2;
		}
		async.eachSeries(["Младенческая смертность.csv","Число разводов.csv","Число браков.csv","Численность умерших.csv","Численность родившихся.csv"],
		function(filename,cb){
			self.toJSON(filename,function(err,rows){
				rows.forEach(function(row){
					var place = row['Территории'];
					var name = place.trim();
					var rowName = _.first(filename.split("."))
					if (!self.Result[name]) self.Result[name] = {Level:lvl(place),Name:name};
					delete row['Территории'];
					var Data = {};
					for (var date in row){
						var cleared = date.replace(/[^а-я0-9 ]/g,"").split(" ");
						var year = cleared[1], month = cleared[0];
						if (!Data[year]) Data[year] = {};
						Data[year][self.PeriodTranslate[month]] = parseInt(row[date]);					
					}
					var ReWorked = {};
					for (var Year in Data){
						var ByMonths = Data[Year], Last = 0;
						ReWorked[Year] = {};
						for (var Period in ByMonths){
							ReWorked[Year][Period] = Data[Year][Period]-Last;
							Last = Data[Year][Period];
						}
					}
					self.Result[name][rowName] = ReWorked;
				})
				return cb();
			})
		},function(err){
			return done(err,self.Result);
		});	
	}

	self.toJSON = function(filename,done){
		var path2file = __base+'modules/predict/data/'+filename;
		var stream = csv({
		  raw: false,     // do not decode to utf-8 strings
		  separator: ';', // specify optional cell separator
		  quote: '"',     // specify optional quote character
		  escape: '"',    // specify optional escape character (defaults to quote value)
		  newline: '\n',  // specify a newline character
		  strict: false    // require column length match headers length
		})		
		var Rows = [];
		fs.createReadStream(path2file).pipe(stream).on('data', function (data) {
			Rows.push(data);
  		}).on('end',function(){
  			return done(null,Rows);
  		})
	}




	return self;
})

module.exports = Reparse;