var Base = require(__base+"sql/base.js");
var Config  = require(__base+"config.js").dbconfig.pgsql;



var _ = require ("lodash");

var Sql = (new function(){
	var self = (new Base(Config));

	self.SetValutaRatesJSON = function (JSON_A,done){
		self.DB.Exec(
			"SELECT public.\"SetValutaRatesJSON\" ('"+JSON_A+"', 0)",
			function(err,data){
				return done(err);
			}
		)		
	}

	self.SetCellsJSON = function(JSON_A,done){
		self.DB.Exec(
			"SELECT public.\"SetCellsJSON\" ('"+JSON_A+"',0)",
			done
		)		
	}

	self.GetCellsJSON = function(Fields, JSON_A, done){
		self.DB.Exec(
			"SELECT public.\"GetCellsJSON\"  ('"+Fields.join(",")+"', '"+JSON_A+"')",
			function(err,data){
				var Result = [];
				try{
					Result = _.first(data.rows).GetCellsJSON;
				} catch(e){
					console.log(e);
				}
				return done(err,Result);
			}
		)		
	}

	self.GetCellsHistoryJSON = function(Fields, JSON_A, done){
		self.DB.Exec(
			"SELECT public.\"GetCellsHistoryJSON\"  ('"+Fields.join(",")+"', '"+JSON_A+"')",
			function(err,data){
				var Result = [];
				try{
					Result = _.first(data.rows).GetCellsHistoryJSON;
				} catch(e){
					console.log(e);
				}
				return done(err,Result);
			}
		)		
	}

	
	return self;
})

module.exports = Sql;