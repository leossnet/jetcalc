var async = require('async');
var mongoose = require('mongoose');
var moment = require('moment');
var _ = require('lodash');
var HelpersPath = __base + 'classes/jetcalc/Helpers/';
var Base = require(HelpersPath+'Base.js');
var jison_prepare  = require(__base+'classes/calculator/jison/column.js') // Упрощалка




var ColHelper = (new function(){

	var self = new Base("JCOL");

	self.GetClean = function(Cx,done){
		self.GetAll(Cx,function(err,Result){
			var FieldsToClean = [
				'Link_coltag','Type','lft','rgt','IsRemoved','RemoveComment','code','parent','InitialPeriod','ShowName','InitialName','Link_colsetcolperiodgrp','Link_colsetcolgrp',
				'IndexColsetCol','InitialYear','level','NameYear','NamePeriod','MCount','NameCol','Comment'
			];
			FieldsToClean = [
				'Link_coltag','Link_colsetcolperiodgrp','Link_colsetcolgrp'
			];
			var Answ =  _.map(_.filter(Result,function(El){
				return !El.IsRemoved && El.Type=='col';
			}),function(A){
				return _.omit(A,FieldsToClean);
			})
			return done(err,Answ);
		})
	}

	self.get = self.GetClean;

	self.GetAll = function(Cx,done){
		self.Init(Cx,function(err,INFO){
			INFO.Result = INFO.Header;			
			async.series([
				self.PrimitiveFilter(Cx,INFO),   // CodePeriodGrp и IsInput на уровне docheader Основная фильтрация
				self.InExectFilter(Cx,INFO),     // ForGroups и ForPeriods на уровне colsetcol Грубая фильтрация
				self.AccurateFilter(Cx,INFO),    // Condition для colsetcol Тонкая фильтрация колонок на основании выбранных параметров
				self.ExtendParamsToCols(Cx,INFO),// Переопределяем параметры колонок на основании colsetcol
				self.UpdatePeriods(Cx,INFO),     // Меняем периоды и сдвигаем года
				self.UpdateNames(Cx,INFO),       // Меняем {} на соответствующие названия
				self.SimplifyFormula(Cx,INFO),   // Упрощаем формулы в зависимости от контекста
			],function(err){
				return done(err,_.values(INFO.Result));
			})			
		})
	}

	self.Init = function(Cx,final){
		var PeriodHelper = require(HelpersPath+'Period.js');
		var DivHelper = require(HelpersPath+'Div.js');
		var SetHelper = require(HelpersPath+'Set.js');
		var HeaderHelper = require(HelpersPath+'Header.js');
		async.parallel({
			Period:PeriodHelper.get,
			Div:DivHelper.get,
			Set:SetHelper.get.bind(SetHelper,Cx),
			Header:function(Cx){
				return function(done){					
					HeaderHelper.get(Cx.CodeDoc,function(err,Res){
						var Indexed = {};
						Res.forEach(function(N){
							Indexed[N.code] = _.merge(N,{IsRemoved:false,RemoveComment:[]});
						})
						return done(err,Indexed);
					});
				}
			}(Cx)
		},final)
	}

	self.ChildrenCodes = function(Nodes,Node){
		var Result = [];
		for (var Code in Nodes){
			if (Nodes[Code].lft>Node.lft && Nodes[Code].rgt<Node.rgt){
				Result.push(Code);
			}
		}
		return Result;
	}
	self.Remove = function(Nodes,Node,Comment){
		var removed = [Node.code].concat(self.ChildrenCodes(Nodes,Node));
		removed.forEach(function(C){
			Nodes[C].IsRemoved = true;
			Nodes[C].RemoveComment.push(Comment);
		})
	}	
	self.AddComment = function(Nodes,Node,Params){
		var nodes = self.ChildrenCodes(Nodes,Node);
		nodes.forEach(function(C){
			if (!_.isEmpty(Params)){
				Nodes[C].RemoveComment.push(Params);
			}
		})
	}

	self.PrimitiveFilter = function(Cx,INFO){
		return function(cb){
			var PeriodGrps = INFO.Period[Cx.CodePeriod].Grps;
			for (var Code in INFO.Result){
				var H = INFO.Result[Code];
				if (H.Type=='header'){
					if (Cx.IsInput!=H.IsInput){
						self.Remove(INFO.Result, H, "IsInput");
					}
					if (!_.includes(PeriodGrps,H.CodePeriodGrp)){
						self.Remove(INFO.Result, H, "CodePeriodGrp");
					}
				}
			}
			return cb();
		}
	}

	self.InExectFilter = function(Cx,INFO){
		return function(cb){
			var PeriodGrps = INFO.Period[Cx.CodePeriod].Grps;
			var ObjGrps = !_.isEmpty(INFO.Div[Cx.CodeObj])? INFO.Div[Cx.CodeObj].Groups:[];
			for (var Code in INFO.Result){
				var H = INFO.Result[Code];
				if (H.Type=='colsetcol'){
					if (!_.isEmpty(H.Link_colsetcolperiodgrp)){
						var r = false;
						H.Link_colsetcolperiodgrp.forEach(function(Check){
						    if (Check.NotInGrp){
						        if (!_.includes(PeriodGrps,Check.CodePeriodGrp)) r = r || true;
						    } else {
						        if (_.includes(PeriodGrps,Check.CodePeriodGrp)) r = r || true;
						    }
						})
						if (!r) self.Remove(INFO.Result,H,"Link_colsetcolperiodgrp");
					}
					if (!_.isEmpty(H.Link_colsetcolgrp)){
						var r = false;
						H.Link_colsetcolgrp.forEach(function(Check){
						    if (Check.NotInGrp){
						        if (!_.includes(ObjGrps,Check.CodeGrp)) r = r || true;
						    } else {
						        if (_.includes(ObjGrps,Check.CodeGrp)) r = r || true;
						    }
						})
						if (!r) self.Remove(INFO.Result,H,"Link_colsetcolgrp");
					}
				}
			}
			return cb();				
		}
	}

	self.AccurateFilter = function(Cx,INFO){		
		return function(cb){
			var keys = [];
			if (!_.isEmpty(Cx.Params)){
				keys = Cx.Params;
			} else {
				if (!_.isEmpty(Cx.CodeReport)){
					var R = _.find(INFO.Set.List,{CodeReport:Cx.CodeReport});
					if (!R){
						keys = INFO.Set.Keys;
					} else {
						keys = R.Keys;
					}
				} else {
					keys = INFO.Set.Keys;	
				}
				
	 		}
			for (var Code in INFO.Result){
				var H = INFO.Result[Code];
				if (H.Type=='colsetcol'){        
		           if (!_.isEmpty(H.Condition)){
		           		var C = self.СheckCondition(H.Condition,keys);
						INFO.Result[Code].ConditionEval = C.eval;
						if (!C.result){
							self.Remove(INFO.Result,H,"Condition");
						}
						self.AddComment(INFO.Result,H,{ConditionHTML:C.reparsed});
		           }
				}
			}
			return cb();
		}		
	}

	self.ExtendParamsToCols = function(Cx,INFO){	
		return function(cb){
			for (var Code in INFO.Result){
				var H = INFO.Result[Code];
				if (H.Type=='colsetcol'){      
					var ColCodes = self.ChildrenCodes(INFO.Result,H);
					ColCodes.forEach(function(CC){
						var ExFields = ['NameColsetCol','Condition','Year','CodePeriod','IsFixed','IsControlPoint','CodeStyle','CodeFormat','AfIndex','IsAfFormula','AfFormula','Link_colsetcolperiodgrp','Link_colsetcolgrp','IndexColsetCol','CodeColsetCol'];
						if (H.IsAgFormula && H.AgFormula.length){
							ExFields = ExFields.concat(["IsAgFormula", "AgFormula"]);
						}
						INFO.Result[CC] = _.merge(INFO.Result[CC],_.pick(H,ExFields));
					})
				}
			}
			return cb();			
		}
	}

	self.UpdatePeriods = function(Cx,INFO){
		return function(cb){
			for (var Code in INFO.Result){
				var H = INFO.Result[Code];
				if (H.Type=='col'){      
					H.InitialPeriod = H.CodePeriod;
					H.InitialYear = H.Year;
					if (H.CodePeriod=='0') H.CodePeriod = Cx.CodePeriod;
					var CodePeriod = H.CodePeriod;
					var IsFormulaPeriod = _.includes(INFO.Period.FormulaPeriods,CodePeriod);
					H.Year = parseInt(Cx.Year)+parseInt (H.Year);
					H.NameYear = H.Year;
					if (IsFormulaPeriod){
						var P = INFO.Period[CodePeriod][Cx.CodePeriod];
						if (_.isArray(P)){
							H.IsFormula = true;
							var Joiner = '@'+H.CodeCol+'.P';
							H.Formula = Joiner+P.join('?+'+Joiner)+'?';
							CodePeriod = Cx.CodePeriod;
						} else {
							CodePeriod = P;
						}
						var TestString = INFO.Period.DisplayNames[H.CodePeriod] && INFO.Period.DisplayNames[H.CodePeriod][Cx.CodePeriod];
						if (TestString){
							var R = TestString.split(":");
							if (R[1]) H.NameYear += parseInt(R[1]);
							CodePeriod = R[0];
						}
					}
					H.ContextPeriod = CodePeriod;
					H.Code = [H.CodeCol,H.CodePeriod,H.Year].join(";")+';';				
					var MainP = INFO.Period[CodePeriod];
					if (MainP){
						H = _.merge(H,_.pick(MainP,["BeginDate","EndDate","MCount","DCount","MonthStart"]))
						H.NamePeriod = MainP.Name;
					}
					INFO.Result[Code] = H;
				}
			}
			return cb();
		}
	}	

	self.UpdateNames = function(Cx,INFO){
		return function(cb){
			for (var Code in INFO.Result){
				var H = INFO.Result[Code];
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
					INFO.Result[Code] = H;
				}
			}
			return cb();
		}
	}

	self.SimplifyFormula = function(Cx,INFO){
		return function (cb){
			var PeriodGrps = INFO.Period[Cx.CodePeriod].Grps;
			var ObjGrps = !_.isEmpty(INFO.Div[Cx.CodeObj]) ? INFO.Div[Cx.CodeObj].Groups:[];
			var ObjTags = !_.isEmpty(INFO.Div[Cx.CodeObj]) ? INFO.Div[Cx.CodeObj].Tags:[];
			for (var Code in INFO.Result){
				var H = INFO.Result[Code];
				if (H.Type=='col' && H.IsFormula && H.Formula.length){  
					var Formula = (H.Formula+'').replace(/\s+/g,' ');
					H.InitialFormula = Formula;
					try{
						var J_Context = {
							grp:    ObjGrps,
							year:   Cx.Year,
							obj:    Cx.CodeObj,
							col:    H.CodeCol, 			
							period: H.ContextPeriod, 
							months: H.MonthStart,
							MCOUNT: H.MCount,
							DCOUNT: H.DCount,
							coltags: H.Tags,
							objtags: ObjTags
						};
						jison_prepare.setContext(J_Context);
						Formula = jison_prepare.parse(Formula);
					} catch(e){
						console.log(e.message);
					}
					H.Formula = Formula;
					INFO.Result[Code] = H;
				}
			}			
			return cb();
		}
	}

	self.СheckCondition = function(condition,keys){
        var old = condition, logic = {};
        condition = (condition+'').replace(/\s+/g,' ');
        logic[' and '] = ' && ';logic[' or '] = ' || ';logic[' not '] = ' !';logic['not '] = '!';
        condition = condition.replace(/([A-ZА-Я0-9_]+)/g,'.$1.');
        var resultText = (condition+'');        
        for (var I in logic){
        	condition = condition.replaceAll(I,logic[I]);
        	resultText = resultText.replaceAll(I,"<logic>"+I+"</logic>");
        }
        keys.forEach(function(Key){
			condition = condition.replaceAll('.'+Key+'.',' true ');
       		resultText = resultText.replace('.'+Key+'.','<good>'+Key+'</good>')
	    })
        condition = condition.replace(/\.[A-ZА-Я0-9_]+\./g,' false ');
        resultText = resultText.replace(/\.[A-ZА-Я0-9_]+\./g,function(match){
        	return "<bad>"+_.trim(match,".")+"</bad>";
        })
        var result = false;
        try{
          eval("result = ("+condition+")");
        } catch(e){
          console.log('EvalError:',e,'`'+old+'`',"result = "+condition);
        }
        return {
        	result:result,	
        	eval:condition,
        	reparsed:resultText
        };
    }

		

	return self;
})



module.exports = ColHelper;