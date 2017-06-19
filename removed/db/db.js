var anyDBblank = require("any-db");
var _ = require('lodash');
var mongoose = require('mongoose'); // For random Number
var parserXml = require('xml2js').parseString;

var DB = function(){

	var self = this;
	self.config = null;
	self.pool = null;

	self.parseCellAnswer = function(data,done){
		var resultDB = {};					
		if (self.config.protocol=='xml'){
			var xml = "";
			data && data.forEach(function(part){
				for (var i in part){
					xml += part[i];
				}
			})
			parserXml(xml, function (err2, js) {
				if (err2) return done(err2);
				if (!js && !err2) return done && done(null,resultDB);
				if (js && !js.Cells && !err2) return done && done(null,{});
				if (js.Cells && js.Cells.Cell){
					js.Cells.Cell.forEach(function(R){
						if (R){
							var V = R['$'];
							var Value = (V.CodeCell+'');
							resultDB[Value] = V;
						}
					})
					
				} 
				return done && done(null,resultDB);
			})
		} else {
			throw "Не определен спопоб форматирования";
		}
	}

	self.parseHistoryAnswer = function(data){
		//console.log(data);
		

	}

	self.formatForHistory = function(cell){
		if (self.config.protocol=='xml'){	
			var xml = '<Rows>\n'+
			  '<Row Year = "'+cell.Year+'" CodePeriod = "'+cell.CodePeriod+'" CodeObj = "'+cell.CodeObj+'" CodeRow = "'+cell.CodeRow+'" CodeCol = "'+cell.CodeCol+'" Value = "0.0" />\n'+
			  '</Rows>';			
			return xml;
		} else {
			throw "Не определен спопоб форматирования";	
		}
	}

		

	self.formatCellSetRequest = function(cells){
		if (self.config.protocol=='xml'){	
			var xml = "<Rows>\n";
			cells.forEach(function(Cell){
				var add = "<Row ";
				for (var I in Cell){
					add +=' '+I+'="'+Cell[I]+'"';
				}
				xml+=add+'/>\n';
			})
			xml += "</Rows>\n";
			return xml;
		} else {
			throw "Не определен спопоб форматирования";
		}
	}

	self.formatCellRequest = function(cells){
		if (self.config.protocol=='xml'){
			var xml = '<Cells>\n'
			cells && cells.forEach(function(C){
				xml += '<Cell Code = "'+C+'" />\n';		
			})
			xml += '</Cells>';			
			return xml;
		} else if (self.config.protocol=='json'){
			var json = [];
			cells && cells.forEach(function(cellCode){
				json.push({code: cellCode});
			});
			return JSON.stringify(json);
		} else {
			throw "Не определен спопоб форматирования";
		}
	}



	self.formatUniversalSet = function(info, objectsArray){
		var result = "";
		if (self.config.protocol=='xml'){
			if (!_.isArray(objectsArray)) objectsArray = [objectsArray];
			var random = mongoose.Types.ObjectId();
			result = '<Commit CodeCommit="'+(info.CodeCommit||random)+'" NameCommit = "'+(info.NameCommit||'')+'" SNameCommit = "'+(info.SNameCommit||'')+'" CodeUser = "'+(info.CodeUser||'')+'" /><Rows>';
			objectsArray.forEach(function(ORaw){
				var tablename = ORaw.tableName.replace(/[\[\]]/g,'');
				var key = ORaw.codeKey;
				O = _.omit(ORaw,['codeKey','tableName','IsNew']), pairs = [];
				for (var i in O){
					if (i!=key){
						pairs.push(i+'="'+O[i]+'"');
					} else {
						pairs.unshift('Old'+i+'="'+O[i]+'"')
						pairs.unshift('New'+i+'="'+O[i]+'"')
					}
				}
				result +='<'+tablename+' '+pairs.join(' ')+' />';	
			})
			result +='</Rows>';		
			//console.log(result);
			return result;
		} else {
			throw "Не определен споcоб форматирования";
		}
	}


	self.save = function(commitInfo,objectsArray,done){
		var Set = self.formatUniversalSet(commitInfo,objectsArray);
		var sql = "EXEC priv.UniversalSet @data = '"+Set.replace(/'/g,"''")+"', @emulate = 0 ";
		if (commitInfo.Sql) return sql;
		self.query(sql,function(err,result){
			if (err) console.log(err,sql);
			return done (err,result);
		})
	}

	self.connect = function(config){
		self.config = config;
		if (!self.pool){
			self.pool = anyDBblank.createPool(self.config , {min: 1, max: 20},function(err,status){
				console.log(err,status);
			});
		}
	}

	self.queryStream = function(sql,ondata,onend){
		if (self.config.debugSql){
			//console.log(">>>",sql);
		}
		var q = self.pool.query(sql);
		q.on('data', ondata);
		q.on('end', onend);
	}

	self.query = function(sql,params,done){
		var passed = [];
		if (typeof params=='function'){
			done = params;
		} else {
			passed = params;
		}
		if (!done){
			done = function(){};
		}
		if (self.config.debugSql){
			//console.log(">>>",sql);
		}
		self.pool.query(sql, passed, done);
	}

}


module.exports = DB;