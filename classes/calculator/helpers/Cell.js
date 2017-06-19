var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require('./Base.js');

var Col = require('./Col.js');
var Obj = require('./Obj.js');
var Row = require('./Row.js');
var Set = require('./Set.js');
var Period = require('./Period.js');


var TreeHelper = require(__base+'/lib/helpers/tree.js');
var Tree = TreeHelper.Tree;


var TreeReparser = (new function(){
  var self = this;

  self.ModFields = ["IsHidden","IsToggled","IsShowOlap","IsShowWithParent","IsShowWithChildren"];
  self.IsHidden = [];
  self.IsToggled = [];

  self.IsShowOlap = [];
  self.IsShowWithParent = [];
  self.IsShowWithChildren = [];		

  self.ReportType = function(){
		if (_.sum([self.IsShowOlap.length,self.IsShowWithParent.length,self.IsShowWithChildren.length])){
			return "SingleView";
		} 
		return "ModifyView";
  }


  self._children = function(CodeRow,Rows){
      var Row = _.find(Rows,{CodeRow:CodeRow});
      Rows = Rows.filter(function(R){
        return Row.lft<R.lft && Row.rgt > R.rgt;
      })
      return _.map(Rows,"CodeRow");
  }

  self._parents = function(CodeRow,Rows){
      var Row = _.find(Rows,{CodeRow:CodeRow});
      Rows = Rows.filter(function(R){
        return Row.lft>R.lft && Row.rgt < R.rgt;
      })
      return _.map(Rows,"CodeRow");
  }   

  self.ResultTree = function(Rows,Report){
      var InitialRows = _.clone(Rows), Rows = _.clone(Rows);
      var AllHidden = [], NewTreeCodes = [];
	  if (Report && Report.CodeReport!='default'){
		self.ModFields.forEach(function(Field){
			var F = {}; F[Field] = true;
			self[Field] = _.map(_.filter(Report.Link_reportrow,F),"CodeRow");
		})
	  }
      var Mode = self.ReportType();
      if (Mode=='ModifyView'){
        	var CodesToHide = [];
        	self.IsHidden.forEach(function(HC){
          		CodesToHide = CodesToHide.concat([HC]).concat(self._children(HC,Rows));
        	})
        	self.IsToggled.forEach(function(CC){
          		CodesToHide = CodesToHide.concat(self._children(CC,Rows));
        	})
        	AllHidden = _.uniq(CodesToHide);
        	Rows = _.filter(Rows,function(R){
          		return AllHidden.indexOf(R.CodeRow)==-1;
        	})
      } else {
        var Codes = [];
        self.IsShowOlap.forEach(function(RS){
          Codes.push(RS);
        })
        self.IsShowWithParent.forEach(function(RP){
          Codes.push(RP);
          Codes = Codes.concat(self._parents(RP,Rows));
        })
        self.IsShowWithChildren.forEach(function(RC){
          Codes.push(RC);
          Codes = Codes.concat(self._children(RC,Rows));
        })
        NewTreeCodes = _.uniq(Codes);
        Rows = _.filter(Rows,function(R){
          return NewTreeCodes.indexOf(R.CodeRow)!=-1;
        })
      }
      if (!Rows.length) {
        Rows = InitialRows; 
      } else {
        var T = new Tree("ROOT",{});
        Rows.forEach(function(R){
            var Parents  = self._parents(R.CodeRow,Rows);
            T.add (R.CodeRow, R, _.last(Parents) || "ROOT", T.traverseBF);
        })
        var Result = T.getFlat();
        delete T;
        return Result;
      }
  }

  return self;
})

var CellHelper = function(Context){

	Context = _.clone(Context);
	Context.PluginName = "CELL";
	var self = this;
	Context.CacheFields = ['CodeObj', 'Year', 'ChildObj','IsInput','CodeDoc','CodePeriod','CodeReport','Params'];

	Base.apply(self,Context);
	self.Context = Context;		


	self.get = function(done){
		self.loadFromCache(function(err,Result){
			if (Result) {
				return done(null,Result);	
			} else {
				self.loadInfo(function(err,Result){
					self.saveToCache(Result,function(err){
						return done(err,Result);
					})
				})
			}
		})
	}

	self.Document = function(cb){
		var ColHelper    = new Col(self.Context);
		var RowHelper    = new Row(self.Context);
		var PeriodHelper = new Period({UseCache:self.Context.UseCache});
		var SetHelper    = new Set(self.Context);
		var Getter = {
				Period:function(done){PeriodHelper.get(done);},
				Rows:function(done){RowHelper.get(done);},
				Cols:function(done){ColHelper.get(done);},
				Set:function(done){SetHelper.get(done);},
		}
		if (self.Context.IsOlap){
			var ObjHelper = new Obj(self.Context);
			Getter.Objs = function(done){ObjHelper.get(done);};
		}
		async.parallel(Getter,function(err,Result){
			if (!self.Context.IsInput && self.Context.CodeReport && self.Context.CodeReport!='default'){
				var Report = _.find(Result.Set.List,{CodeReport:self.Context.CodeReport});
				if (Report){
					Result.Rows = TreeReparser.ResultTree(Result.Rows,Report);
				}
			}
			return cb(err,Result);
		});
	}

	self.loadInfo = function(done){
		var Groupped = {};
		var addWork = function(CellName, CodePeriod){
			if (!Groupped[CodePeriod]){
				Groupped[CodePeriod] = [];
			}
			Groupped[CodePeriod].push(CellName)
		}
		self.Document(function(err,Result){
			if (err) return done(err);
			var Cells = [], MapCells = {}, AFCells = {}; 
			if (self.Context.IsOlap){
				Result.Objs.Objs.forEach(function(O){
					Result.Rows.forEach(function(Row){
						Result.Cols.forEach(function(Col){
							var Vara = ['$',Row.CodeRow,'@',Col.CodeCol,'.P',Col.CodePeriod,'.Y',Col.Year,'#',O.CodeObj,'?'].join('');
							if (Col.CodePeriod[0]=='-') addWork(Vara,Col.CodePeriod);
							Cells.push(Vara);					
						})
					})
				})
			} else {
				Result.Rows.forEach(function(Row,IndexRow){
					Result.Cols.forEach(function(Col){
						var Vara = ['$',Row.CodeRow,'@',Col.CodeCol,'.P',Col.CodePeriod,'.Y',Col.Year,'#',self.Context.CodeObj,'?'].join('');
						Cells.push(Vara);
						if (Col.CodePeriod[0]=='-') addWork(Vara,Col.CodePeriod);						
						if (Col.IsAfFormula){
							AFCells[Vara] = Col.AfFormula;
						}

					})
				})
			}
			var RemoveCells = [], Work = {}, AddCells = [];
			for (var CodePeriod in Groupped){
				var CellsW = Groupped[CodePeriod];
				var RealPeriod = Result.Period[CodePeriod][self.Context.CodePeriod];
				CellsW.forEach(function(Cell){
					if (!_.isArray(RealPeriod)){					
						RealPeriod = [RealPeriod];
					}
					Work[Cell] = [];
					RealPeriod.forEach(function(R){	
						var CellN = Cell.replace('.P'+CodePeriod+'.Y','.P'+R+'.Y')
						AddCells.push(CellN);
						Work[Cell].push(CellN);
					})						
				})
				RemoveCells = RemoveCells.concat(CellsW);
			}
			Cells = _.difference(Cells.concat(AddCells),RemoveCells);
			var Answer = {
				Cells:Cells,     // Список ячеек для расчета
				AFCells:AFCells, // Ячеки автопрокачки
				Work:Work          // Обработка после вычислений -> Как получить запрашиваемые ячейки из периодов -505 и прочего
			}
			return done(null,Answer);
		})
	}
	return self;
}		




module.exports = CellHelper;
