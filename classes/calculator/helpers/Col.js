var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var moment = require('moment');
var Base = require('./Base.js');


var f = require(__base+'/lib/functions.js');
var jison_prepare  = require('../jison/column.js') // Упрощалка


var ColHelper = function(Context){


	Context = _.clone(Context);
	Context.PluginName = "COL";

	var self = this;
	
	Context.CacheFields = ['Year', 'CodePeriod','IsInput','CodeDoc','CodeObj','ChildObj','Params','CodeReport'];

	Base.apply(self,Context);
	self.Context = Context;		


	self.get = function(done){
		self.loadFromCache(function(err,Result){
			if (Result && false) {
				return done(err,self.DebugClean(Result));
			} else {
				self.loadInfo(function(err,Result){
					self.saveToCache(Result,function(err){
						return done(err,self.DebugClean(Result));
					})
				})
			}
		})
	}


	
	self.paramsValues = {};
	self.rawCols = [];	
	self.Params = [];
	self.ParamsValues = {};
	self.CollTree = {};
	self.IsActiveCondition = false;	
	self.ObjGrps = [];
	self.ObjTags = [];
	self.PInfo = {};
	self.PeriodGrps = [];
	self.CodeObj = self.Context.CodeObj;
	if (self.Context.ChildObj){
		self.CodeObj = self.Context.ChildObj;
	}

	self.Headers = {};

	self.Report = null;

	self.Init = function(done){
		var NeedToLoad = ["Doc","Period","Div","Set","Header"];
		var Form = require(__base+'/classes/calculator/Form.js');
		var Tasks = {};
		NeedToLoad.forEach(function(HelperName){
			Tasks[HelperName] = function(HelperName){
				return function(cb){
					var Helper = new Form[HelperName](self.Context);
					Helper.get(cb);
				}
			}(HelperName);
		})
		async.parallel(Tasks,function(err,Result){
			if (err) return done(err);
			self.IsActiveCondition = Result.Doc.IsActiveCondition || !self.Context.IsInput;
			if (self.CodeObj && Result.Div[self.CodeObj]) {
				self.ObjGrps = Result.Div[self.CodeObj].Groups;
				self.ObjTags = Result.Div[self.CodeObj].Tags;
			}
			self.PInfo = Result.Period;
			Result.Header && Result.Header.forEach(function(H){
				self.Headers[H.code] = _.merge(H,{IsRemoved:false,RemoveComment:[]});
			})
			self.PeriodGrps = self.PInfo[self.Context.CodePeriod].Grps;
			self.Params = Result.Set.params;
			if (!self.Context.IsInput){
				if (self.Context.CodeReport && self.Context.CodeReport!='default'){
					self.Report = _.find(Result.Set.List,{CodeReport:self.Context.CodeReport});
				} else if (!self.Context.CodeReport || self.Context.CodeReport=='default'){
					var def = _.find(Result.Set.List,{IsDefault:true});
					if (def){
						self.Report = def;
					}
				}
				if (self.Report){
					for (var CodeParam in self.Report.Params){
						self.ParamsValues[CodeParam] = self.Report.Params[CodeParam];
					}
				}
			}
			return done();
		})
	}

	self.DebugClean = function(Result){
		var Answ = [], FieldsToClean = [];
		if (!self.Context.IsDebug){
			FieldsToClean = [
				'Link_coltag','Type','lft','rgt','IsRemoved','RemoveComment','code','parent','InitialPeriod','ShowName','InitialName','Link_colsetcolperiodgrp','Link_colsetcolgrp',
				'IndexColsetCol','InitialYear','level','NameYear','NamePeriod','MCount','NameCol','Comment'
			];
			Answ =  _.filter(Result,function(El){
				return !El.IsRemoved && El.Type=='col';
			})
		} else {
			Answ = Result;
		}

		Answ.forEach(function(A,i){
			Answ[i] = _.omit(A,FieldsToClean);
		})

		return Answ;
	}

	self.loadInfo = function(done){
		async.series([
			self.Init,              // Загрузка основной информации
			self.PrimitiveFilter,   // CodePeriodGrp и IsInput на уровне docheader Основная фильтрация
			self.InExectFilter,     // ForGroups и ForPeriods на уровне colsetcol Грубая фильтрация
			self.AccurateFilter,    // Condition для colsetcol Тонкая фильтрация колонок на основании выбранных параметров
			self.ExtendParamsToCols,// Переопределяем параметры колонок на основании colsetcol
			self.UpdatePeriods,     // Меняем периоды и сдвигаем года
			self.UpdateNames,       // Меняем {} на соответствующие названия
			self.SimplifyFormula,   // Упрощаем формулы в зависимости от контекста
			//self.removeDubles,
		],function(err){
			return done(err,_.values(self.Headers));
		})
	}




	self.SimplifyFormula = function(done){
		for (var Code in self.Headers){
			var H = self.Headers[Code];
			if (H.Type=='col' && H.IsFormula && H.Formula.length){  
				var Formula = (H.Formula+'').replace(/\s+/g,' ');
				H.InitialFormula = Formula;
				try{
					var P = self.PInfo[H.ContextPeriod];
					if (!P || !P.Conditions) P.Conditions = {iskorrperiod:false,issumperiod:false,isplanperiod:false,isozhidperiod:false};
					var J_Context = _.merge({
						grp:    self.ObjGrps,
						year:   self.Context.Year,
						obj:    self.CodeObj,
						col:    H.CodeCol, 			
						period: H.ContextPeriod, 
						months: P.MonthStart,
						MCOUNT: P.MCount,
						DCOUNT: P.DCount,
						coltags: H.Tags,
						objtags: self.ObjTags
					},P.Conditions);
					jison_prepare.setContext(J_Context);
					Formula = jison_prepare.parse(Formula);
				} catch(e){
					console.log(e.message);
				}
				H.Formula = Formula;
				self.Headers[Code] = H;
			}
		}
		return done();
	}
	
	self.UpdateNames = function(done){
		for (var Code in self.Headers){
			var H = self.Headers[Code];
			if (H.Type=='col'){      		
				H.InitialName = H.NameColsetCol;
				var Year = H.NameYear || H.Year;
				var Name = H.NamePeriod;
				H.NameColsetCol = H.NameColsetCol
					.replaceAll('{0}',Year)
					.replaceAll('{2}',Name)
					.replaceAll('{3}',Year-1)
					.replaceAll('{5}',moment(H.BeginDate).format('DD.MM')+'.'+Year)
					.replaceAll('{6}',moment(H.EndDate).format('DD.MM')+'.'+Year);				
				H.ShowName = H.NameColsetCol;
				self.Headers[Code] = H;
			}
		}
		return done();
	}


	self.ExtendParamsToCols = function(done){
		for (var Code in self.Headers){
			var H = self.Headers[Code];
			if (H.Type=='colsetcol'){      
				var ColCodes = self.ChildrenCodes(H);
				ColCodes.forEach(function(CC){
					var ExFields = ['NameColsetCol','Condition','Year','CodePeriod','IsFixed','IsControlPoint','CodeStyle','IsAfFormula','AfFormula','Link_colsetcolperiodgrp','Link_colsetcolgrp','IndexColsetCol','CodeColsetCol'];
					if (H.IsAgFormula && H.AgFormula.length){
						ExFields = ExFields.concat(["IsAgFormula", "AgFormula"]);
					}
					self.Headers[CC] = _.merge(self.Headers[CC],_.pick(H,ExFields));
				})
			}
		}
		return done();
	}


	self.UpdatePeriods = function(done){
		for (var Code in self.Headers){
			var H = self.Headers[Code];
			if (H.Type=='col'){      
				H.InitialPeriod = H.CodePeriod;
				H.InitialYear = H.Year;
				if (H.CodePeriod=='0') H.CodePeriod = self.Context.CodePeriod;
				var IsFormulaPeriod = false;
				var CodePeriod = H.CodePeriod;
				H.Year = parseInt(self.Context.Year)+parseInt (H.Year);
				H.NameYear = H.Year;
				if (CodePeriod[0]=='-'){
					IsFormulaPeriod = true;
					var P = self.PInfo[CodePeriod][self.Context.CodePeriod];
					
					if (_.isArray(P)){
						H.IsFormula = true;
						var Joiner = '@'+H.CodeCol+'.P';
						H.Formula = Joiner+P.join('?+'+Joiner)+'?';
						CodePeriod = self.Context.CodePeriod;
					} else {
						CodePeriod = P;
					}
					var TestString = self.PInfo.DisplayNames[H.CodePeriod] && self.PInfo.DisplayNames[H.CodePeriod][self.Context.CodePeriod];
					if (TestString){
						var R = TestString.split(":");
						if (R[1]) H.NameYear += parseInt(R[1]);
						CodePeriod = R[0];
					}
				}
				H.ContextPeriod = CodePeriod;
				H.Code = [H.CodeCol,H.CodePeriod,H.Year].join(";")+';';				
				var MainP = self.PInfo[CodePeriod];
				if (MainP){
					H = _.merge(H,_.pick(MainP,["BeginDate","EndDate","MCount"]))
					H.NamePeriod = MainP.Name;
				}
				self.Headers[Code] = H;
			}
		}
		return done();
	}


	self.AccurateFilter = function(done){		
		if (!self.IsActiveCondition ) return done();
		var keys = {};
		if (self.Context.Params){
			keys = self.Context.Params;
		} else {
	 		self.Params.forEach(function(P){
	 			if (self.ParamsValues[P.CodeParam] && P.ParamSets[self.ParamsValues[P.CodeParam]] && P.ParamSets[self.ParamsValues[P.CodeParam]].ParamKeys){
					keys = _.merge(keys,P.ParamSets[self.ParamsValues[P.CodeParam]].ParamKeys);
	 			} else if (P.ParamSets[P.DefaultParamSet]){
	 				keys = _.merge(keys,P.ParamSets[P.DefaultParamSet].ParamKeys);
	 			}
	        })
 		}
		for (var Code in self.Headers){
			var H = self.Headers[Code];
			if (H.Type=='colsetcol'){        
	           if (H.Condition && H.Condition.length){
	           		var C = self.СheckCondition(H.Condition,keys);
					self.Headers[Code].ConditionEval = C.eval;
					if (!C.result){
						self.Remove(H,"Condition");
					}
	           }
			}
		}
		return done();       
	}



	self.InExectFilter = function(done){
		for (var Code in self.Headers){
			var H = self.Headers[Code];
			if (H.Type=='colsetcol'){
				if (H.Link_colsetcolperiodgrp.length){
					var r = false;
					H.Link_colsetcolperiodgrp.forEach(function(Check){
					    if (Check.NotInGrp){
					        if (self.PeriodGrps.indexOf(Check.CodePeriodGrp)==-1) r = r || true;
					    } else {
					        if (self.PeriodGrps.indexOf(Check.CodePeriodGrp)>=0) r = r || true;
					    }
					})
					if (!r) self.Remove(H,"Link_colsetcolperiodgrp");
				}
				if (H.Link_colsetcolgrp.length){
					var r = false;
					H.Link_colsetcolgrp.forEach(function(Check){
					    if (Check.NotInGrp){
					        if (self.ObjGrps.indexOf(Check.CodeGrp)==-1) r = r || true;
					    } else {
					        if (self.ObjGrps.indexOf(Check.CodeGrp)>=0) r = r || true;
					    }
					})
					if (!r) self.Remove(H,"Link_colsetcolgrp");
				}
			}
		}
		return done();	
	}

	self.PrimitiveFilter = function(done){
		for (var Code in self.Headers){
			var H = self.Headers[Code];
			if (H.Type=='header'){
				if (self.Context.IsInput!=H.IsInput){
					self.Remove(H,"IsInput");
				}
				if (self.PeriodGrps.indexOf(H.CodePeriodGrp)==-1){
					self.Remove(H,"CodePeriodGrp");
				}
			}
		}
		return done();		
	}

	self.ChildrenCodes = function(Node){
		var Result = [];
		for (var Code in self.Headers){
			if (self.Headers[Code].lft>Node.lft && self.Headers[Code].rgt<Node.rgt){
				Result.push(Code);
			}
		}
		return Result;
	}

	self.Remove = function(Node,Comment){
		var removed = [Node.code].concat(self.ChildrenCodes(Node));
		removed.forEach(function(C){
			self.Headers[C].IsRemoved = true;
			self.Headers[C].RemoveComment.push(Comment);
		})
	}
	
    self.СheckCondition = function(condition,keys){
        var old = condition, logic = {};
        condition = (condition+'').replace(/\s+/g,' ');
        logic[' and '] = ' && ';logic[' or '] = ' || ';logic[' not '] = ' !';logic['not '] = '!';
        condition = condition.replace(/([A-ZА-Я0-9_]+)/g,'.$1.');
        for (var I in logic){condition = condition.replaceAll(I,logic[I]);}
        for (var I in keys){condition = condition.replaceAll('.'+I+'.',keys[I]);}
        condition = condition.replace(/\.[A-ZА-Я0-9_]+\./g,' false ');
        var result = false;
        try{
          eval("result = "+condition);
        } catch(e){
          console.log('EvalError:',e,'`'+old+'`',"result = "+condition);
        }
        return {
        	result:result,	
        	eval:condition
        };
    }


	self.LoadCols = function(CodeCols,done){
		self.query('col',{CodeCol:{$in:CodeCols}},"-_id CodeCol NameCol IsFormula Formula DoSum NoCalcSum NoCalcSumHard IsAgFormula AsAgFormula AgFormula Link_coltag")
		.populate({
			path:'Link_coltag',
			select:"-_id CodeTag",	
			sort:{CodeTag:1}
		}).lean().isactive().exec(function(err,Cols){
			Cols.forEach(function(Col,Index){
				Cols[Index].Tags = _.map(Cols[Index].Link_coltag,'CodeTag');
				Cols[Index] = _.omit(Cols[Index],"Link_coltag");
			})	
			return done(err,Cols);
		})
	}



	return self;
}		




module.exports = ColHelper;