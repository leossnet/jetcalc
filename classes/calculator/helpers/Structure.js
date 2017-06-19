var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require('./Base.js');


var StructureHelper = function(Context){
	
	Context = _.clone(Context);
	Context.PluginName = "STRUCTURE";
	var self = this;
	Context.CacheFields = ['CodeObj', 'Year', 'ChildObj','IsInput','CodeDoc','CodePeriod','CodeReport','Params',"IsOlap","CodeGrp","GroupType"];
	Base.apply(self,Context);
	self.Context = Context;	

	



	self.get = function(done){
		self.loadFromCache(function(err,Result){
			if (Result) {
				return done(null,Result);	
			}			
			self.loadInfo(function(err,Result){
				self.saveToCache(Result,function(err){
					return done(err,Result);	
				});
			})
		})
	}

	self.getCells = function(done){
		self.get(function(err,Answer){
			var Result = [];
			Answer.Cells.forEach(function(Row){
				Result = Result.concat(Row);
			})
			var Cells = _.filter(Result,_.isObject);
			var CellNames = _.map(Cells,"Cell");
			return done(err,_.uniq(CellNames));			
		})
	}

	self.Plugin = function(Doc){
		var PluginName = "simple";
		if (self.Context.IsOlap && Doc.IsOlap){
			PluginName = "olap";
		}
		if (Doc && Doc.HasChildObjs && Doc.IsObjToRow){
			PluginName = "objtorow";
		}
		if (Doc && Doc.IsBiztranDoc){
			PluginName = "biztran";
		}
		var Plugin = require(__base+"classes/calculator/helpers/CellPlugins/"+PluginName+".js");
		return Plugin;
	}

	self.loadInfo = function(cb_done){
		// 1. Загружаем документ, ряды, колонки
		// 2. Фильтруем ряды в зависимости от выбранного отчета
		// 3. Определяем тип документа и формируем структуру через нужный плагин
		var Form = require("../Form.js");
		var Loader = ["Doc","Row","Col","Set","Div"];
		var Tasks = {};
		Loader.forEach(function(WorkerName){
			Tasks[WorkerName] = function(WorkerName){
				return function(cb){
					var W = new Form[WorkerName](self.Context);
					W.get(function(err,R){
						cb(err,R)
					});
				}
			}(WorkerName);
		})
		Tasks["Valuta"] = function(cb){
			self.query("valuta",{},"CodeValuta NameValuta SNameValuta SignValuta").exec(cb);
		}
		async.parallel(Tasks,function(err,LoadedData){
			LoadedData.Row.forEach(function(R,index){
				if (!_.isEmpty(R.Link2Use)){
					LoadedData.Row[index] = _.merge(R,R.Link2Use);
				}
			})
			if (!self.Context.IsInput){
				if (self.Context.CodeReport && self.Context.CodeReport!='default'){
					var Report = _.find(LoadedData.Set.List,{CodeReport:self.Context.CodeReport});
					if (Report){
						LoadedData.Row = TreeReparser.ResultTree(LoadedData.Row,Report);
					}
				} else if (self.Context.CodeReport=='default'){
					var DefaultReport = _.find(LoadedData.Set.List,{IsDefault:true});
					if (DefaultReport){
						LoadedData.Row = TreeReparser.ResultTree(LoadedData.Row,DefaultReport);	
					}
				}
			}
			var CodeObj = self.Context.CodeObj;
			if (LoadedData.Doc.HasChildObjs){
				if (self.Context.ChildObj && !LoadedData.Doc.IsObjToRow){
					CodeObj = self.Context.ChildObj;
				}
			}
			var Plugin = self.Plugin(LoadedData.Doc);
			var WorkerPlugin = new Plugin(_.merge(self.Context,{CodeObj:CodeObj}),LoadedData);
			WorkerPlugin.get(function(err,ResultToAnswer){
				cb_done(err,ResultToAnswer);
			});			
		})		
	}


}




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



module.exports = StructureHelper;
