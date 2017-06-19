var Base = require(__base+"sql/base.js");
var Config  = require(__base+"config.js").dbconfig.mssql;

var Sql = (new function(){
	var self = new Base(Config);

	self.SetCellsXML = function(XML,done){
		self.DB.Exec(
			"EXEC [dbo].[SetCellsXML] @data = '"+XML.replace(/'/g,"''")+"',	@emulate  = 0",
			done
		)		
	}

	self.GetCellsXML = function(Fields, XML, done){
		self.DB.Exec(
			"EXEC [dbo].[GetCellsXML]  @result='"+Fields.join(",")+"', @data = '"+XML.replace(/'/g,"''")+"'",
			function(err,data){
				return done(err,data.rows);
			}
		)		
	}

	self.GetCellsHistoryXML = function(Fields, XML, done){
		self.DB.Exec(
			"EXEC [dbo].[GetCellsHistoryXML]  @result='"+Fields.join(",")+"', @data = '"+XML.replace(/'/g,"''")+"'",
			function(err,data){
				return done(err,data.rows);
			}
		)		
	}

	self.SetValutaRatesXML = function (XML,done){
		self.DB.Exec(
			"EXEC [dbo].[SetValutaRatesXML]  @data = '"+XML.replace(/'/g,"''")+"', @emulate  = 0",
			done
		)		
	}

	return self;
})

module.exports = Sql;