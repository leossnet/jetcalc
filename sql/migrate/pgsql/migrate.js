var _ = require("lodash");
var async = require("async");
var Pg = require(__base+'sql/pgsql.js');
var fs = require("fs");
var Rx = require(__base+"classes/calculator/RegExp.js");

var AfterAdd = (new function(){
	var self = this;

	self.UpdateCells = function(TableName,Field,done){
		var Tp = Field.replace("Code","");
		Pg.DB.Exec("SELECT \"CodeCell\" FROM "+TableName,function(err,data){
			var CellsToUpdate = _.map(data.rows,function(p){
				return _.pick(p,["CodeCell"]);
			})
			async.each(CellsToUpdate,function(C,cb){
				var Fv = _.first(C.CodeCell.match(Rx[Tp])).replace(Rx.Symbols[Tp],"");
				Pg.DB.Exec("UPDATE "+TableName+" SET \""+Field+"\" = '"+Fv+"' WHERE \"CodeCell\"='"+C.CodeCell+"';",cb);
			},done);
		})
	}

	self.ToWork = {
		'cells_h.CodeRow':["UpdateCells","cells_h","CodeRow"],
		'cells_h.CodeCol':["UpdateCells","cells_h","CodeCol"],
		'cells_h.CodeObj':["UpdateCells","cells_h","CodeObj"],
		'cells.CodeRow':["UpdateCells","cells","CodeRow"],
		'cells.CodeCol':["UpdateCells","cells","CodeCol"],
		'cells.CodeObj':["UpdateCells","cells","CodeObj"],
	}

	self.Execute = function(FieldName,done){
		var Arr = self.ToWork[FieldName];
		if (_.isEmpty(Arr)){
			return done();
		}
		self[_.first(Arr)].apply(this,Arr.splice(1).concat(done));
	}

	return self;
})

var Migrate = (new function(){
	var self = this;

	self.Execute = function(done){
		async.series([
			self.SyncProcedures,
			self.SyncStructure
		],done)
	}

	self.callPsql = function(base,command, done){
		var exec = require('child_process').exec;
		exec(command, {
		  cwd: base,
		  env: {'PGPASSWORD': 'postgres'}
		}, function(error, stdout, stderr) {
			if (error) console.log(error);
			if (stderr) console.log(stderr);
			return done();
		});	
	}


	self.SyncProcedures = function(done){
    	var dir = __base+"sql/migrate/pgsql/procedures";
		fs.readdir(dir, function(err, files){
  			async.eachSeries(files,function(FileName,cb){
  				console.log("Синхронизация процедуры: "+FileName);
  				var command = "psql -h 127.0.0.1 -U postgres -w -f ./"+FileName+" -d jetcalc";
  				self.callPsql(dir,command,cb);
  				//console.log("psql -h 127.0.0.1 -U postgres -w -f ./"+FileName+" -d jetcalc");
  				//var ex = exec();
  				//console.log(ex);
  				//return done();
  				/*fs.readFile(dir+"/"+FileName,function(err,content){
					Pg.DB.Exec(content+'',cb);
  				})
  				*/
  			},function(err){
  				if (err) return done(err);
  				console.log("Обновлены хранимые процедуры");
  				return done();
  			})
		})
	}

	self.AddFields = function(Info,done){
		if (_.isEmpty(Info)) {
			console.log("... Новых колонок - нет");
			return done();
		}
		var Sqls = {};
		for (var TableName in Info){
			var Cols = Info[TableName];
			for (var CollName in Cols){
				var Type = Cols[CollName], TStr = "";
				switch(_.first(Type)){
					case 'character varying':
						TStr = [" ",Type[0],"(",Type[1],")"].join("");
					break;
					default:
						throw "Не прописан тип",_.first(Type);
				}
				Sqls[[TableName,CollName].join(".")] = "ALTER TABLE "+TableName+" ADD COLUMN \""+CollName+"\" "+TStr+" NULL;";
			}						
		}
		async.eachSeries(_.keys(Sqls),function(Key,cb){
			Pg.DB.Exec(Sqls[Key],function(err){
				if (err) return cb(err);
				AfterAdd.Execute(Key,function(err){
					console.log("Добавлено поле "+Key);
					return cb(err);
				});
			});
		},done)
	}

	self.UpdateFields = function(Info,done){
		if (_.isEmpty(Info)) {
			console.log("... Изменений в типах колонок - нет");
			return done();
		}
		var Sqls = [];
		for (var TableName in Info){
			var Fields = Info[TableName];
			for (var Field in Fields){
				var NewType = Fields[Field];
				var UpdStr = "";
				switch(_.first(NewType)){
					case "numeric":
						UpdStr = "numeric("+NewType[1]+","+NewType[2]+")";
					break;
					default:
					throw "Не определено обновление для поля типа:"+_.first(NewType);
				}
				Sqls.push("ALTER TABLE "+TableName+" ALTER COLUMN \""+Field+"\" TYPE "+UpdStr);
			}
		}
		async.each(Sqls,function(SQL,cb){
			Pg.DB.Exec(SQL,cb);
		},done);
	}

	self.SyncStructure = function(done){
		var Update = require(__base+"sql/migrate/pgsql/structure.js");
		self.Structure(function(err,Info){
			var ToUpdate = {}, ToAdd = {}; 
			for (var TableName in Info){
				var New = Update[TableName], Old = Info[TableName], AddFields = _.difference(_.keys(New),_.keys(Old));
				if (!_.isEmpty(AddFields)){
					ToAdd[TableName] = _.pick(New,AddFields);
				} 
				for (var K in Old){
					var NewF = New[K], OldF = Old[K];
					if (!_.isEmpty(NewF) && !_.isEmpty(OldF) && !_.isEqual(NewF,OldF)){
						if (_.isEmpty(ToUpdate[TableName])) ToUpdate[TableName] = {};
						ToUpdate[TableName][K] = NewF;
					}
				}
			}
			self.AddFields(ToAdd,function(err){
				if (err) return done(err)
				console.log("Все поля добавлены");
				self.UpdateFields(ToUpdate,function(err){
					if (err) return done(err);
					console.log("Все поля обновлены");
					return done();
				})
			})
		})
	}

	self.Structure = function(done){
		var Result = {};
		self._tablesList(function(err,List){
			async.each(List,function(TableName,cb){
				self._columnList(TableName,function(err,Сolumns){
					Result[TableName] = Сolumns;
					return cb(err);
				})
			},function(err){
				return done(err,Result);
			});
		})
	}

	self._tablesList = function(done){
		Pg.DB.Exec("SELECT table_schema,table_name as table FROM information_schema.tables WHERE table_schema='public'",function(err,data){
			if (err) return done(err);
			done(null,_.map(data.rows,"table"));
		});
	}

	self._columnList = function(TableName,done){
		Pg.DB.Exec("SELECT column_name as col,data_type as type,character_maximum_length as len,numeric_precision as numlen,numeric_scale as digits FROM information_schema.columns WHERE table_name = '"+TableName+"'",function(err,data){
			if (err) return done(err);
			var Info = _.map(data.rows,_.values);
			var Answ = {};
			Info.forEach(function(Arr){
				Answ[_.first(Arr)] = _.compact(Arr.splice(1));
			})
			return done(null,Answ);
		})
		
	}

	return self;
})


module.exports = Migrate;