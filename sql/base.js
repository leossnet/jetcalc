var _ = require("lodash");

var Base = function(config){
	var self = this;

	self.Config = config;
	self.Protocol = self.Config.protocol;
	self.Pool = null;

	self.DB = {
		Pool:null,
		Exec:function(sql,done){
			if (!this.Pool) this.Connect();
			this.Query(sql,done);
		},
		Query: function(sql,params,done){
			var passed = [];
			(typeof params=='function') ? done = params:passed = params;
			done = done || function(){};
			this.Pool.query(sql, passed, done);
		},
		Connect:function(done){
			var anyDB = require('any-db');
			var ConnectUrl = !_.isEmpty(self.Config.url)? self.Config.url : [
				self.Config.adapter,
				"://",
				self.Config.userName,":",self.Config.password,
				"@",self.Config.server,":",self.Config.options.port,"/",
				self.Config.options.database
			].join("");
			this.Pool = anyDB.createPool(ConnectUrl , {min: 1, max: 20});
		}
	}

	// Set Cells
	self._reparseCells = function(Cells){
		var ReCells = [];
		Cells.forEach(function(Cell){
			var p = Cell.CodeCell.match(/\$(.*?)\@(.*?)\.P(.*?)\.Y(.*?)\#(.*?)\?/);
			var Set = {Cell:Cell,Row:p[1],Col:p[2],Period:p[3],Year:p[4],Obj:p[5]};	
			ReCells.push({
				CodeCell:Cell.CodeCell,
				CodeUser:Cell.CodeUser,
				CodePeriod:Set.Period,
				Comment:Cell.Comment,
				Year:Set.Year,
				CalcValue:Cell.CalcValue,
				Value:Cell.Value,
				CodeValuta:Cell.CodeValuta,
				CodeCol:Set.Col,
				CodeRow:Set.Row,
				CodeObj:Set.Obj
			})
		})
		return ReCells;
	}
	self.FormatSetCellsXml = function(Cells){
		var Rows  = [], ReCells = self._reparseCells(Cells);
		ReCells.forEach(function(RC){
			var Arr = ["<Row"];
			for (var K in RC){
				Arr.push(K+'="'+RC[K]+'"');
			}
			Arr.push("/>");
			Rows.push(Arr.join(" "));
		})
		return "<Rows>"+Rows.join("\n")+"</Rows>"
	}
	self.FormatSetCellsJSON = function(Cells){
		return JSON.stringify(self._reparseCells(Cells));
	}
	self.SetCellsJSON = function(JS,done){};
	self.SetCells = function(Cells,done){
		if (self.Protocol=='json'){
			self.SetCellsJSON(self.FormatSetCellsJSON(Cells),done);
		} else if (self.Protocol=='xml'){
			self.SetCellsXML(self.FormatSetCellsXml(Cells),done);
		} else {
			throw new Error ("Не определен протокол обмена данными с SQL базой");
		}
	}


	// Get Cells and CellsHistory
	self.FormatGetCellsJSON = function(Cells){
		return JSON.stringify(_.map(Cells,function(C){
			return {CodeCell:C};
		}));
	}

	self.FormatGetCellsXML = function(Cells){
		return '<Cells>'+_.map(Cells,function(Cell){
			return '<Cell CodeCell = "'+Cell+'" />';
		}).join("\n")+'</Cells>';
	}

	self.GetCellsJSON = function(){}
	self.GetCellsXML = function(){}

	self.GetCells = function(Fields,Cells,done){
		if (self.Protocol=='json'){
			self.GetCellsJSON(Fields,self.FormatGetCellsJSON(Cells),done);
		} else if (self.Protocol=='xml'){
			self.GetCellsXML(Fields,self.FormatGetCellsXML(Cells),done);
		} else {
			throw new Error ("Не определен протокол обмена данными с SQL базой");
		}
	}

	self.GetCellsHistoryJSON = function(){}
	self.GetCellsHistoryXML = function(){}

	self.GetCellsHistory = function(Fields,Cells,done){
		if (self.Protocol=='json'){
			self.GetCellsHistoryJSON(Fields,self.FormatGetCellsJSON(Cells),done);
		} else if (self.Protocol=='xml'){
			self.GetCellsHistoryXML(Fields,self.FormatGetCellsXML(Cells),done);
		} else {
			throw new Error ("Не определен протокол обмена данными с SQL базой");
		}
	}








	// Set ValutaRates
	 
	self._formatRates = function(Rates){
		return _.map(Rates,function(Rate){
			return _.pick(Rate,["CodeValutaRate","CodeValuta","CodeReportValuta","CodeReportValuta1","CodeReportValuta2","Year","CodePeriod","Value","Value1","Value2","CodeUser"])
		})
	}

	self.FormatValutaRatesJSON = function(Rates){
		return JSON.stringify(Rates);
	}

	self.FormatValutaRatesXML = function(Rates){
		var RatesStrs  = [], ReRates = self._formatRates(Rates);
		ReRates.forEach(function(RC){
			var Arr = ["<Rate"];
			for (var K in RC){
				Arr.push(K+'="'+RC[K]+'"');
			}
			Arr.push("/>");
			RatesStrs.push(Arr.join(" "));
		})
		return "<Rates>"+RatesStrs.join("\n")+"</Rates>"

	}

	self.SetValutaRatesJSON = function (JSON,done){
		
	}

	self.SetValutaRatesXML = function (XML,done){

	}

	self.SetValutaRates = function(Rates,done){
		if (self.Protocol=='json'){
			self.SetValutaRatesJSON(self.FormatValutaRatesJSON(Rates),done);
		} else if (self.Protocol=='xml'){
			self.SetValutaRatesXML(self.FormatValutaRatesXML(Rates),done);
		} else {
			throw new Error ("Не определен протокол обмена данными с SQL базой");
		}
	}

	return self;
}

module.exports = Base;