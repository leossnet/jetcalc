var   config = require('../../config.js')
	, mongoose = require('mongoose')
	, api = require('../../lib/helper.js')
	, f   = require('../../lib/functions.js')
	, _ = require('lodash')
	, async = require('async')
	, moment = require('moment')
	, Spr = require('../InitModels.js')() 
	, jison_prepare  = require('./jison/compile.js') // Упрощалка
	, jison          = require('./jison/calculator.js') // Вычислялка
	, db = require(__base+'/sql/db.js')
	, Form = require('./Form.js')
	, numeral = require('numeral')
;


var Unmapper = function(Context, InfoCacher){
	
	var self = this;
	self.Context = _.clone(Context);

	self.DebugInfo      = {}; // Расширенная информация для отладки

	self.Matrix         = {}; // Результат
	self.Unmapped       = {}; // Переменные которые нужно размапить
	self.HowToCalculate = {}; // Переменная и как её считать // Формат {Type, FRM}
	self.LoadedCodeDocs = []; // Список уже загруженных форм - чтобы лишний раз их не загружать

	self.Dependencies = {};   // Зависимости переменных

	self.Redis          = new Redis();
	self.Err            = new ErrorCatcher();
	self.Info           = InfoCacher;
	self.Cols           = {}; // Все используемые колонки
	self.ProductRowCode = 'm150'; // Строки начинающиеся с этого кода - продукция - первичные

	self.CellFormulaOverride = {};

	self.VarRgexp  = /[$@].*?\?/g;
	self.Modifiers = /\.([a-z]*)\((.*?)\)|(\>\>)\((.*?)\)|(\<\<)\((.*?)\)|(\<\<\<)\((.*?)\)/g;
	self.RowRegexp = /\$.*?(?=[@?\.\<\>#])/;
	//self.RowRegexp = /\$.*?(?=(@|\.P|\.Y|<|>|#))/;
	self.ColRegexp = /\@.*?(?=[?\.\<\>#])/;
	self.PeriodRegexp = /\.P[-]?\d*(?=[?\.\<\>#])/;
	self.YearRegexp = /\.Y[-]?\d*(?=[?\.\<\>#])/;
	self.ObjRegexp = /\#(?!:).*?(?=[?\.\<\>])/;

	 	
	self.LoadExisted = function(Cells,done){
		if (!self.Context.UseCache) return done();
		var Setter = function(Cell){
			self.HowToCalculate[Cell.CellName] = _.pick(Cell,['Type','FRM']);
			var RowCode = Cell.CellName.match(/\$(.*?)\@/)[1];
			self.DocRowInfo[RowCode] = Cell.CodeDoc;
			if (Cell.Errors){
				self.Err.Errors[Cell.CellName] = Cell.Errors;
			}
			for (var DepCell in Cell.Dependable){
				self.HowToCalculate[DepCell] = Cell.Dependable[DepCell];
			}
		}
		self.Redis.Get(Cells,function(RootCells){
			if (!RootCells.length) return done();
			RootCells.forEach(Setter);
			self.LoadedCells = _.map(RootCells,"CellName");
			return done();
		})
	}

	self.LoadedCells = [];
	self.NoNeedToSave = false;

	self.AddToUnmap = function(Cell){
		var p = Cell.match(/\$(.*?)\@(.*?)\.P(.*?)\.Y(.*?)\#(.*?)\?/);
		var Set = {Cell:Cell,Row:p[1],Col:p[2],Period:p[3],Year:p[4],Obj:p[5],Type:null};					
		if (Set.Period.indexOf('-')==0) Set.Period = self.Context.CodePeriod;
		var CellResult = self.ParamsFromIncompleteVar(Cell,Set);
		self.Unmapped[Cell] = _.merge(CellResult,{Cell:Cell,Type:null});
	}

	self.Unmap = function(Cells, done){
		self.LoadExisted(Cells,function(err){
			Cells.forEach(function(Cell){ 
				self.Matrix[Cell] = {};
			})
			if (self.LoadedCells.length==Cells.length){
				self.NoNeedToSave = true;
			}
			Cells.forEach(function(Cell){
				if (!self.HowToCalculate[Cell]){
					self.AddToUnmap(Cell);
				}
			})
			self._unmap(function(err){
				self.AfterUnmap(done)
			})
		})
	}

	self.AfterUnmap = function(done){
		if (_.keys(self.TranslateProds).length>0){
			self.DoTranslateProds(function(){
				self.TranslateProds = {};
				self.CompileDependancies();
				return done();
			})
		} else {
			self.CompileDependancies();
			return done();
		}
	}

	self.CacheInfo = {}

	self.CompileDependancies  = function(done){
		var DependanceTree = {}, counter = 60000;
		var _recursiveFind = function(CellName){
			var result = [];
			if (--counter<0) return result			
			var Info = self.Dependencies[CellName];
			if (!Info) return result;
			result = result.concat(Info);
			Info.forEach(function(Cell){
				result = result.concat(_recursiveFind(Cell));
			})
			return result;
		}		
		for (var CellName in self.Matrix){
			counter = 50000;
			DependanceTree[CellName] = _recursiveFind(CellName);
		}
		for (var CellName in DependanceTree){
			var RowCode = CellName.match(/\$(.*?)\@/)[1];
			self.CacheInfo[CellName] = _.merge({CellName:CellName, Dependable:{}},self.HowToCalculate[CellName]);
			self.CacheInfo[CellName].CodeDoc = self.DocRowInfo[RowCode];
			var Vars = DependanceTree[CellName];
			Vars.forEach(function(V){
				self.CacheInfo[CellName].Dependable[V] = self.HowToCalculate[V];
			})
		}	
	}	

	self.UpdateCache = function(done){
		var Errs = self.Err.BuildErrors(self.Matrix,self.CacheInfo);
		for (var CellName in self.CacheInfo){
			if (Errs[CellName]){
				self.CacheInfo[CellName].Errors = Errs[CellName];
			}
		}
		var Setter = _.omit(self.CacheInfo,self.LoadedCells);
		self.Redis.Set(Setter,done);
	}

	self._unmap = function(done){
		self.LoadInfo(self.Unmapped,function(err){
			if (err) return done(err);
			for (var CellName in self.Unmapped){
				var Cell = self.Unmapped[CellName];
				var T = self.RowColFormula(Cell);
				if (self.CellFormulaOverride[CellName]){
					T = {Type:"FRM",FRM:self.CellFormulaOverride[CellName]};	
				} 
				var Row = self.RowsLoaded[Cell.Row];
				if (T.Type=='SUM'){
					try{
						var SumInfo = self.Summs[Row.CodeDoc][Cell.Row];
						T.FRM = "";
						if (SumInfo.Plus.length){
							T.FRM += "$"+SumInfo.Plus.join('? + $')+'?';
						}
						if (SumInfo.Minus.length){
							T.FRM += " - $"+SumInfo.Minus.join('? - $')+'?';
						}
						if (!T.FRM.length){
							//self.Err.Set(CellName,'ROW:'+Cell.Row+":EMPTY_SUM"); // Пустая сумма это не ошибка
							T = {Type:'FRM',FRM:'0'};
							//T = {Type:'ERR'};
						}
					} catch(e){
						//self.Err.Set(CellName,'ROW:'+Cell.Row+":UNK_SUM"); // Пустая сумма это не ошибка
						T = {Type:'FRM',FRM:'0'};
					}
				} else if (T.Type=='FRM'){
					var Tags = _.uniq((T.FRM+'').match(/([_]{2,3}[A-Za-z_]+)/g)); // Заменяем тэги
					if (Tags && Tags.length){
						Tags.forEach(function(Tag){
							var TagValue = self.Info.TagValue(Row,Cell.Obj,Tag);
							if (!TagValue){
								self.Err.Set(CellName,'TAG:'+Tag+":NO_VALUE");
							}
							T.FRM = T.FRM.replaceAll(Tag,TagValue);
						})
					}
				} 
				if (T.FRM) {
					T.FRM = (T.FRM+'').replace(/\s/g,' ');	
					if (self.Context.IsExplain && self.DebugInfo[CellName]){
						self.DebugInfo[CellName].FormulaUpdated = T.FRM;
					}
				}
				self.Unmapped[CellName].Type = T;
			}
			var NewUnmap = {};
			for (var CellName in self.Unmapped){
				var Cell = self.Unmapped[CellName];
				if (['PRD','PRM','HDR','ERR'].indexOf(Cell.Type)!=-1 || !Cell.Type.FRM){
					self.HowToCalculate[CellName] = {Type:Cell.Type.Type};
				} else {
					var Cell = self.SimplifyFormula(Cell);
					if (Cell.Type.FRM==0 || Cell.Type.FRM==void(0)){
						self.HowToCalculate[Cell.Cell] = {Type:'FRM',FRM:0};
					} else {
						ExtendedInfo = self.ExtendVarsInFormula(Cell);
						self.HowToCalculate[CellName] = {Type:'FRM',FRM:ExtendedInfo.FRM};
						self.Dependencies[CellName] = _.keys(ExtendedInfo.DPS);
						try{
							NewUnmap = _.merge(NewUnmap,ExtendedInfo.DPS);
						} catch(e){
							self.HowToCalculate[Cell.Cell] = {Type:'ERR'};
						}
					}					
				}
			}
			if (_.keys(NewUnmap).length) {
				self.Unmapped = NewUnmap;
				return self._unmap(done);
			} else {
				return done();
			}
		})		
	}

	self.ExtendVarsInFormula = function(Cell){
		var Formula = Cell.Type.FRM+'';
		var vars = (Formula+'').match(self.VarRgexp);
 		var UnknownVars = {}, Replaces = {};
		vars && vars.forEach(function(v){
			var R = self.ParamsFromIncompleteVar(v,Cell);
			var ModsText = "";
			if (R.Mods.length){
				R.Mods.forEach(function(M){
					if (M.func!='tovaluta') ModsText+=M.text; // Пока не обрабатываем
				})
			}
			if (R && R.Obj && R.Obj.indexOf("[")!=-1){
				R.Obj = R.Obj.replace(/[\[\]]/g,'').split(",");
			}
			var Objs = R.Obj; var Periods = R.Period;

			if (!_.isArray(Objs)) Objs = [Objs];
			if (!_.isArray(Periods)) Periods = [Periods];
			var FormulaParts = [];
			Objs.forEach(function(Obj){
				var PeriodParts = [];
				Periods.forEach(function(P){
					var RR = _.clone(R);
					var CellName = ['$',RR.Row,'@',RR.Col,'.P',P,'.Y',RR.Year,'#',Obj,ModsText,'?'].join('');
					RR.Obj = Obj;
					RR.Period = P;
					RR.Cell = CellName;
					UnknownVars[CellName] = RR;
					PeriodParts.push(CellName);
				})
				var Pu = "";
				if (R.PeriodOp=="MULT"){
					Pu = PeriodParts.join("*");
				} else {
					Pu = PeriodParts.join("+");
				}
				if (PeriodParts.length>1){
					Pu = "("+Pu+")";
				}
				FormulaParts.push(Pu);
			})

			if (FormulaParts.length>1){
				Replaces[v] = '('+FormulaParts.join('+')+')';
			} else {
				Replaces[v] = _.first(FormulaParts);
			}
		})
		var Initial = (Formula+'').split(/([$@].*?\?)/)
		var ResultFormulaArr = [];
		Initial.forEach(function(Part){
			if (Replaces[Part]) ResultFormulaArr.push(Replaces[Part]);
			else ResultFormulaArr.push(Part);
		})
		Formula = ResultFormulaArr.join('');
		return {FRM:Formula,DPS:UnknownVars};
	}


// <<< Консолидация по всем объектам учета
// С - классы // T - типы // G - группы // D - дивизионы // S - отрасли (сектора) // R - регионы							
// << и функции
// Без аргументов -> по всем дочерним объектам
// _PARENT.CLASS или (^) -> по дочерним объектам парента
// T: или "СЕ_RUDA" -> по типу
// C: или "CALCED" -> по класу
// G: или consgrp по группе
// #4682,#4683,#4714 -> перечисленные объекты учета

	self._parseFilter = function(Filter){
		var R = {};
		var Arr = (Filter+'').split(",");
		Arr.forEach(function(Part){
			var RPart = Part.split(":");
			if (RPart.length==2){
				R[RPart[0].trim()] = RPart[1].trim();
			}
		})
		return R;
	}

	self.GetConsObjs = function(Mode,CodeObj,Filter){
		if (!Filter || (Filter+'')=='undefined') Filter = null;
		var ObjInfo = self.Info.Data.Div[CodeObj];
		var Result = [];
		switch (Mode){
			case "<<<":
				var F = self._parseFilter(Filter);
				var Objs = _.map(_.filter(self.Info.Data.Div,function(O){
					if (F.G && O.Groups.indexOf(F.G)!=-1) return true;
					if (F.C && O.CodeObjClass==F.C) return true;
					if (F.T && O.CodeObjType==F.T) return true;
					if (F.D && O.CodeDiv==F.D) return true;
					if (F.R && O.CodeRegion==F.R) return true;
					if (F.S && O.CodeOtrasl==F.S) return true;
					return false;
				}),"CodeObj");
				Result = Objs;
				break;
			break;
			case "consobj":
				if (!Filter){
					Result = ObjInfo.AllChildren;
				} else if (Filter=='_PARENT.CLASS'){
					var SInfo  = self.Info.Data.Div[ObjInfo.CodeParentObj];
					Result = SInfo.AllChildren;
				} else {
					ObjInfo.AllChildren.forEach(function(C){
						var SInfo = self.Info.Data.Div[CodeObj];
						['CodeObjClass','CodeObjType'].forEach(function(Field){
							if (SInfo[Field]==Filter){
								console.log("+++++++++++++++++++++++");
								console.log(Filter,Field,SInfo[Field]);
								console.log("+++++++++++++++++++++++");
							}
						})
					})
				}
			break;
			case "<<":
			case "consgrp":
					ObjInfo.AllChildren.forEach(function(C){
						var SInfo = self.Info.Data.Div[CodeObj];
						['CodeObjClass','CodeObjType'].forEach(function(Field){
							if (SInfo[Field]==Filter){
								console.log("+++++++++++++++++++++++");
								console.log(Filter,Field,SInfo[Field]);
								console.log("+++++++++++++++++++++++");
							}
						})
					})
			break;			
		}
		return Result;
	}


	self.ParamsFromIncompleteVar = function(v,Cell){

		var _setVar = function(unparsed,name,regexp){
	 		var t = unparsed.match(regexp);
	 		var CellSet = Cell[name];
	 		if (_.isArray(CellSet)){
	 			CellSet = "["+CellSet.join(",")+"]";
	 		}
	 		if (!t || !t[0]) return CellSet;
	 		else return t[0];
	 	}
	 	var R = {
			Row:(_setVar(v, 'Row', self.RowRegexp)+'').replace('$',''),
	 		Col:(_setVar(v, 'Col', self.ColRegexp)+'').replace('@',''),
	 		Period:(_setVar(v, 'Period', self.PeriodRegexp)+'').replace('.P',''),
	 		Year:parseInt((_setVar(v, 'Year', self.YearRegexp)+'').replace('.Y','')),
	 		Obj:(_setVar(v, 'Obj', self.ObjRegexp)+'').replace('#',''),
	 		Mods:[],
	 		PeriodOp:null
	 	}
	 	if (Math.abs(R.Year)<1000) R.Year = parseInt(Cell.Year)+R.Year;
		if (R.Period.indexOf('-')>=0){
			if (self.Info.Data.Period[R.Period] && self.Info.Data.Period[R.Period].Opinfo && self.Info.Data.Period[R.Period].Opinfo[Cell.Period]){
				R.PeriodOp = self.Info.Data.Period[R.Period].Opinfo[Cell.Period];
			}
			R.Period = self.Info.Data.Period[R.Period][Cell.Period];
		}	
		var ObjModifiers = ['toobj','tomainobj','consobj','consgrp','toparentobj','torootobj','<<','<<<']
		var modifiers = v.match(self.Modifiers);
		if (modifiers && modifiers.length){
			var Mods = [];
			var Reg = new RegExp(self.Modifiers);
			while (m = Reg.exec(v)){
				m = _.compact(m);
				var Mod = {text:m[0],func:m[1],args:(m[2]+'').replace(/['"]/g,'')};
				if (ObjModifiers.indexOf(Mod.func)>=0){
					switch (Mod.func){
						case 'toobj':
							var ObjInfo = self.Info.Data.Div[Mod.args];
							if (ObjInfo)
							R.Obj = ObjInfo.CodeObj;
						break;
						case 'toparentobj':
							var ObjInfo = self.Info.Data.Div[R.Obj];
							R.Obj = ObjInfo.CodeParentObj;
						break;
						case 'tomainobj':						
						case 'torootobj':
							var ObjInfo = self.Info.Data.Div[R.Obj];
							R.Obj = ObjInfo.RootObj;							
						break;
						// Консолидация
						case '<<<':
						case '<<':
						case '>>':
						case 'consobj':
						case 'consgrp':
							var Objs = self.GetConsObjs(Mod.func,R.Obj,Mod.args);
							if (Objs.length){
								R.Obj = Objs;	
							} else {
								R.Obj = '0';
							}
						break;
						default:
						;
					}
				} else {
					Mods.push(Mod);	
				}				
			}
			R.Mods = Mods;
		}
		return R;
	}

	self.SimplifyFormula = function(Cell){
		var P = self.Info.Data.Period[Cell.Period+''];
		var Col = self.ColsLoaded[Cell.Col];
		var Row = self.RowsLoaded[Cell.Row];
		if(!Row){
			Cell.Type='ERR';
			return Cell;
		}
		if (!P) {
			self.Err.Set(Cell.Cell,'PERIOD:'+Cell.Period+': UNK');
			Cell.Type='ERR';
			return Cell;
		}		
		var Obj = self.Info.Data.Div[Cell.Obj] || {}; 
		if (!P.Conditions) P.Conditions = {iskorrperiod:false,issumperiod:false,isplanperiod:false,isozhidperiod:false};
		var J_Context = _.merge({
			grp: Obj.Groups,
			year: Cell.Year,
			obj:  Cell.Obj,
			row:Cell.Row, 
			col: Cell.Col, 			
			period:[Cell.Period].concat(P.Grps),
			months:P.MonthStart,
			MCOUNT:P.MCount,
			DCOUNT:P.DCount,
			coltags:Col.Tags,
			rowtags:Row.Tags,
			treetags:Row.AllTags,
			objtags:Obj.Tags
		},P.Conditions);
		jison_prepare.setContext(J_Context);
		var Formula = Cell.Type.FRM;
		try{
			Cell.Type.FRM = jison_prepare.parse(Formula);
			if (self.Context.IsExplain) {
				if (self.DebugInfo[Cell.Cell].What=='Row' && !self.DebugInfo[Cell.Cell].RowFormula.length){
					self.DebugInfo[Cell.Cell].RowFormula = Cell.Type.FRM;		
				}
				self.DebugInfo[Cell.Cell].FormulaParsed = Cell.Type.FRM;	
			}
		} catch(e){
			self.Err.Set(Cell.Cell,'FRM:'+Cell.Type.FRM+' : '+e.message);
			if (self.Context.IsExplain) self.DebugInfo[Cell.Cell].FormulaParsed = "Ошибка в обработке формулы";
			Cell.Type ='ERR';
		}

		return Cell;
	}


	self.RowColFormula = function(Info){
		var Row = self.RowsLoaded[Info.Row];
		var Col = self.ColsLoaded[Info.Col];
		var Obj = Info.Obj;
		if (Info.Obj=="^"){
			var ObjInfo = self.Info.Data.Div[self.Context.CodeObj];
			if (ObjInfo.RootObj) Info.Obj = ObjInfo.RootObj;
			Obj = Info.Obj;
		}
		if (Obj=='0') return {Type:'FRM',FRM:0};
		var CellName = Info.Cell;
		var Result = null;
		var ResultDescription = null;
		var Choosed = null;
		if ((Info.Row+'').indexOf("(")!=-1){
			var ProdCode = _.trim(Info.Row,')(');
			var Prod = self.Info.Data.Prod.ProdTree[ProdCode];
			if (Prod){
				Info.Prods = [ProdCode];
				self.TranslateProds[Info.Cell] = Info;
				Result = {Type:'PRD'};
				ResultDescription = "Подзапрос по продукции";
			}
		} 
		if (Row && Row.Prods && Row.Prods.length){
			Info.Prods = Row.Prods;
			self.TranslateProds[Info.Cell] = Info;
			Result = {Type:'PRD_SUM'};
			ResultDescription = "Подзапрос по сумме продукций";
		}
		if (!Result && !Col){
			self.Err.Set(Info.Cell,"COL:"+Info.Col+':UNK');			
			Result = {Type:"ERR"};	
			ResultDescription = "Колонка не найдена";
		}
		if (!Result && Info.Col=="DEBUG"){
			self.Err.Set(Info.Cell,"COL:"+Info.Col+':NOT_IMPLEMENTED');			
			Result = {Type:"ERR"};	
			ResultDescription = "Колонка DEBUG";
		}
		if (!Result  && !Row) {
			Result = {Type:"ERR"};	
			ResultDescription = "Ряд не найден/отфильтрован";
		}
		if (!Result && (!Row.IsFormula && !Col.IsFormula && !Row.IsSum)) {
			if (Row.IsLeaf)  {
				Result = {Type:"PRM"};
				ResultDescription = "Первичная";
			} else  {
				Result = {Type:"HDR"};
				ResultDescription = "Заголовок";
			}
		}
		if (!Result && (Col.IsFormula && !Row.IsSum)) {
			Result = {Type:"FRM",FRM:Col.Formula};
			Choosed = "Col";
			ResultDescription = "Формула в колонке/Ряд - не IsSum";
		}
		if (!Result && (!Col.IsFormula && Row.IsFormula)) {
			Result = {Type:"FRM",FRM:Row.Formula};
			Choosed = "Row";
			ResultDescription = "Формула в ряду/Колонка - без формулы";
		}
		if (!Result && Col.IsAgFormula && Row.IsSum){
			Result = {Type:"FRM",FRM:Col.AgFormula};	
			Choosed = "Col";
			ResultDescription = "Формула агрегации в колонке, Ряд - IsSum/Колонка - IsAgFormula";
		}
		if (!Result && Col.AsAgFormula && Row.IsSum){
			Result = {Type:"FRM",FRM:Col.Formula};	
			Choosed = "Col";
			ResultDescription = "Формула агрегации в колонке, Ряд - IsSum/Колонка - AsAgFormula";
		}
		if (!Result && Col.IsFormula && Row.IsSum){
			if (!Result && Col.NoCalcSumHard) {
				Result = {Type:"FRM",FRM:Col.Formula};	
				Choosed = "Col";
				ResultDescription = "Формула в колонке, Ряд - IsSum/Колонка - NoCalcSumHard";
			}
			if (!Result && Col.NoCalcSum && !Row.IsCalcSum) {
				Result = {Type:"FRM",FRM:Col.Formula};	
				Choosed = "Col";
				ResultDescription = "Формула в колонке, Ряд - IsSum/Колонка - NoCalcSum, Ряд - нет IsCalcSum";	
			}
			if (!Result && Col.DoSum && Row.NoDoSum){
				Result = {Type:"FRM",FRM:Col.Formula};	
				Choosed = "Col";
				ResultDescription = "Формула в колонке, Ряд - IsSum/Колонка - DoSum, Ряд - NoDoSum";	
			}
			if (!Result  && (Row.IsCalcSum || Col.DoSum)) {
				Result = {Type:"SUM"};	
				Choosed = "Row";
				if (Row.IsCalcSum){
					ResultDescription = "Сумма по рядам, Ряд - IsSum/Ряд - IsCalcSum";		
				} else {
					ResultDescription = "Сумма по рядам, Ряд - IsSum/Колонка - DoSum";		
				}
			}
			if (!Result){
				Choosed = "Col";
				Result = {Type:"FRM",FRM:Col.Formula};
				ResultDescription = "Формула в колонке";		
			}
		}

		if (!Result && Row.IsSum) {
			Result = {Type:"SUM"};
			Choosed = "Row";
			ResultDescription = "Сумма по рядам, Ряд - IsSum";
		}
		if (!Result){
			Result = {Type:"UNK"};
			ResultDescription = "Не понятно как считать";	
		}
		if (self.Context.IsExplain){
			if (!Row) Row = {}; if (!Col) Col = {};
			var RowMarks = Row.Tags||[]; var ColMarks = Col.Tags||[];
			if (Row.Sums) RowMarks = _.merge(RowMarks,Row.Sums);
			var RA = ['IsSum','IsCalcSum','NoDoSum'];
			RA.forEach(function(F){
				if (Row[F]) RowMarks.push(F);
			});
			var CA = ['NoCalcSumHard','DoSum'];
			CA.forEach(function(CF){
				if (Col[CF]) ColMarks.push(CF);
			});
			self.DebugInfo[CellName] = {
				CellName:CellName,
				What:Choosed,
				Text:ResultDescription,
				Formula:Result.FRM,
				CodeRow:Info.Row,
				CodeCol:Info.Col,
				RowFormula:Row.Formula,
				ColFormula:Col.Formula,
				Type:Result.Type,
				RowName:Row.NumRow+'. '+Row.NameRow,
				ColName:Col.NameCol,
				Period:Info.Period,
				Obj:Info.Obj,
				Year:Info.Year,
				Doc:self.DocRowInfo[Row.CodeRow],
				RowMarks:_.uniq(RowMarks),
				ColMarks:_.uniq(ColMarks)
			};
		}
		return Result;
	}

	self.DocRowInfo = {}; // CodeRow -> CodeDoc

	self.LoadInfo = function(Cells,final){
		var Rows2Load = [], Cols2Load = [];
		for (var CodeCell in Cells){
			if (!self.RowsLoaded[Cells[CodeCell].Row]){
				Rows2Load.push(Cells[CodeCell].Row);	
			}	
			if (!self.ColsLoaded[Cells[CodeCell].Col]){
				Cols2Load.push(Cells[CodeCell].Col);	
			}
		}
		Rows2Load = _.uniq(Rows2Load); Cols2Load = _.uniq(Cols2Load);

		var LoadTasks = {};
		if (!Rows2Load.length && !Cols2Load.length) return final();
		console.log("LOADING ROWS:",Rows2Load);
		if (Rows2Load.length){
			LoadTasks.Row = function(cb){
				self.Info.RowHelper.LoadRows(Rows2Load,function(err,Rows){
					var Docs2Load = [];
					Rows.forEach(function(Row){
						var Doc2Load = self.Info.DocByRow(Row,self.Context.CodeObj,self.Context.CodeDoc);
						self.DocRowInfo[Row.CodeRow] = Doc2Load;
						Docs2Load.push(Doc2Load);
					})
					Docs2Load = _.difference(_.compact(_.uniq(Docs2Load)),self.LoadedCodeDocs);
					var Tasks = {};
					Docs2Load.forEach(function(CodeDoc){
						Tasks[CodeDoc] = function(CodeDoc,Context){
							return function(d){
								Context.CodeDoc = CodeDoc;
								self.LoadedCodeDocs.push(CodeDoc);
								var R = new Form.Row(Context);
								R.get(d);
							}
						}(CodeDoc,_.clone(self.Context));
					});
					async.parallel(Tasks,function(err,RowsInfo){
						for (var CodeDoc in RowsInfo){
							var Res = RowsInfo[CodeDoc];
							Res.forEach(function(R,index){
								if (!_.isEmpty(R.Link2Use)){
									Res[index] = _.merge(R,R.Link2Use);
								}
							})
							self.SetLoadedRows(CodeDoc,Res);
						}
						return cb();
					})
				})					
			}
		}
		if (Cols2Load.length){
			LoadTasks.Col = function(cb2){
				self.Info.ColHelper.LoadCols(Cols2Load,function(err,Cols){
					Cols.forEach(function(Col){
						self.ColsLoaded[Col.CodeCol] = Col;
					})
					return cb2();
				})
			}
		}
		async.parallel(LoadTasks,final);
	}

	self.RowsLoaded = {};  // Подгружаемые ряды документов
	self.ColsLoaded = {};  // Подгружаемые колонки
	self.Summs = {};       // Все суммы

	self.SetLoadedRows = function(CodeDoc,Rows){
		Rows.forEach(function(Row){
			Row.CodeDoc = CodeDoc;
			self.DocRowInfo[Row.CodeRow] = CodeDoc;
			self.RowsLoaded [Row.CodeRow] = Row;
		})
		self.Summs[CodeDoc]  = {};
		Rows.forEach(function(Row){
			if (Row.IsSum){
				var Summ = {Plus:[],Minus:[]};
				if (!Row.Sums.length){
					Rows.forEach (function(R){
						if (R.CodeParentRow==Row.CodeRow && !R.NoSum){
							if (R.IsMinus){
								Summ.Minus.push(R.CodeRow);
							} else {
								Summ.Plus.push(R.CodeRow);
							}							
						}
					})					
				} else {
					Rows.forEach (function(R){
						if (R.Sums.length && _.intersection(R.Sums,Row.Sums).length>0 && !R.IsSum){
							if (!R.NoSum){
								if (R.IsMinus){
									Summ.Minus.push(R.CodeRow);	
								} else {
									Summ.Plus.push(R.CodeRow);	
								}			
							}			
						}
					})
				}
				self.Summs[CodeDoc][Row.CodeRow] = Summ;
			}			
		})
	}
	// Обработка ссылок на продукцию

	self.DoTranslateProds = function(done){
		var Cells = _.keys(self.TranslateProds);
		async.each(Cells,self._singleTranslateProd,done);
	}

	self.TranslateProds = {};


	self.parseModifiers = function(Mods){
		var ToFilter = {Bill:[], Alt:[], Grp:[], Div:[], Prod:[], Class:[], Type:[], Sector:[], Region:[]};
		var Letters = {};
		_.keys(ToFilter).forEach(function(FT){
			Letters[FT.substring(0,1)] = FT;
		})
		Letters['#'] = "Alt";
		var OldSyntax = {conto:"Bill",altobjfilter:'Alt',altgrp:'Grp',altdiv:'Div',}
		if (!Mods) return null;
		Mods.forEach(function(M){
			var Args = M.args.split(',');
			switch(M.func){
				case '>>': // Новый синтаксис
					Args.forEach(function(FP){
						var FpParts = FP.replace(/\s+/g,'').split(":");
						var Field = Letters[FpParts[0]];
						ToFilter[Field] = ToFilter[Field].concat([FpParts[1]]);
					})
				break;
				default:
					var Field = OldSyntax[M.func], Setter = "";
					Args.forEach(function(A){
						if (A.substring(0,4)=='div_') Setter = "Div";
						else if (A.substring(0,4)=='grp_') Setter = "Grp";
						else Setter = Field;
						ToFilter[Setter] = ToFilter[Setter].concat([A.split('grp_').pop().split("div_").pop()]);
					})
			}
		})
		for (var Key in ToFilter){
			ToFilter[Key] = _.uniq(ToFilter[Key]);
		}
		return ToFilter;
	}

	self.Alts = function(Mods){
		var Result = [];
		var Translate = {Div:'CodeDiv',Type:'CodeType',Sector:'CodeOtrasl',Region:'CodeRegion',Grp:'Groups'}
		for (var Key in Mods){
			if (Mods[Key].length){
				var Arr = Mods[Key];
				switch (Key) {
					case 'Alt':
						Result = Result.concat(Arr);
					break;
					default:
						var Field2Check = Translate[Key];
						for (var CodeObj in self.Info.Data.Div){
							var O = self.Info.Data.Div[CodeObj];
							var Objs2Test = O[Field2Check];
							if (_.isArray(Objs2Test)){
								if (_.intersection(Objs2Test,Arr).length>0){
									Result.push(O.CodeOrg);
								}
							} else {
								if (Arr.indexOf(Objs2Test)){
									Result.push(O.CodeOrg);
								}
							}
						}
				}
			}
		}
		return Result;
	}

	self._singleTranslateProd = function(CellName,done){
		var Cell = self.TranslateProds[CellName];
		var CodeProds = {};
		if (Cell.Prods.length==1){
			var ProdeCode = _.first(Cell.Prods);
			var Prod = self.Info.Data.Prod.ProdTree[ProdeCode];
			var Children = [];
			if (Prod && Prod.Children) Children = Prod.Children;
			CodeProds = [ProdeCode].concat(Children);
		} else {
			CodeProds = Cell.Prods;
		}
		var Mods = self.parseModifiers(Cell.Mods);
		var ToFilter = {Alt:self.Alts(Mods),Prod:CodeProds,Bill:Mods.Bill};
		ToFilter.Alt = _.uniq(ToFilter.Alt);
		ToFilter.Bill = _.uniq(ToFilter.Bill);
		ToFilter.Prods = CodeProds;
		var Q = {}; 
		if (ToFilter.Alt.length) Q.CodeAltOrg = {$in:ToFilter.Alt};
		if (ToFilter.Bill.length) Q.CodeBill = {$in:ToFilter.Bill};
		if (ToFilter.Prods.length) Q.CodeProd = {$in:ToFilter.Prods};
		mongoose.model('row').find(Q,'-_id CodeRow').lean().exec(function(err,Rows){
			if (Rows || !Rows.length){
				self.HowToCalculate[C] = {Type:'FRM',FRM:'0'};
			} else {
				Cell.Type = {Type:'FRM',FRM:'$'+_.map(Rows,'CodeRow').join('? + $')+'?'};
				Cell.Mods = [];
				ExtendedInfo = self.ExtendVarsInFormula(Cell);
				self.HowToCalculate[CellName] = {Type:'FRM',FRM:ExtendedInfo.FRM};
				self.Dependencies[CellName] = _.keys(ExtendedInfo.DPS);
				for (var C in ExtendedInfo.DPS){
					self.HowToCalculate[C] = {Type:'PRM'};
				}
			}
			return done();
		})
	}


	return self;
}


var ErrorCatcher = function(){
	var self = this;
	
	self.Errors = {}; // CellName => [Errors]
	self.Critical = {};

	self.Critical = function(Code,ErrorMessage){
		if (!self.Critical[Code]) {
			self.Critical[Code] = [];	
		}
		if (self.Critical[Code].indexOf(ErrorMessage)==-1){
			self.Critical[Code].push(ErrorMessage);
		}			
	}

	self.Set = function(CellName,ErrorMessage){
		if (!self.Errors[CellName]){
			self.Errors[CellName] = [];
		}
		if (self.Errors[CellName].indexOf(ErrorMessage)==-1){
			self.Errors[CellName].push(ErrorMessage);
		}
	}

	self.BuildErrors = function(Matrix,CacheInfo){
		if (CacheInfo && _.keys(CacheInfo).length){
			var Result = {}, AllKeys = _.keys(self.Errors);
			for (var CellName in Matrix){
				var TestVars = [CellName];
				if (CacheInfo[CellName].Dependable){
					TestVars = TestVars.concat(_.keys(CacheInfo[CellName].Dependable));
				}
				var Errors = [];
				var Keys = _.intersection(TestVars,AllKeys);
				if (Keys.length){
					Keys.forEach(function(K){
						Errors = Errors.concat(self.Errors[K]);
					})
				}
				Errors = _.uniq(Errors);
				if (Errors.length){
					Result[CellName] = Errors;
				}				
			}
			return Result;
		} else {
			return self.Errors;
		}
	}


	return self;
}	


var GeneralInfo = function(){

	var self = this;	
	self.SmallContext = {'UseCache':true,'IsDebug':false};
	self.RowHelper = new Form.Row(self.SmallContext);
	self.ColHelper = new Form.Col(self.SmallContext);
	self.Data = {};

	self.DefaultTags = {
		"KMULT":1000
	}

	self.TagValue = function(Row, CodeObj, TagNameRaw){
		var TagName = _.trimStart(TagNameRaw,'_');
		var TagInfo = self.Data.Tag[TagName];
		var Obj = self.Data.Div[CodeObj];
		console.log(Row);
		var RowsToCheck = _.difference((Row.rowpath+'').split('/'),['']).reverse();
		console.log(RowsToCheck);
		var TAG = null;
		for (var i=0; i<RowsToCheck.length; i++){
			if (TagInfo && TagInfo[RowsToCheck[i]]){
				TAG = TagInfo[RowsToCheck[i]];
				break;
			}
		}
		if (!TAG && TagInfo && TagInfo[Obj.CodeObjType]){
			TAG = TagInfo[Obj.CodeObjType];
		}
		if (!TAG && self.DefaultTags[TagName]){
			TAG = self.DefaultTags[TagName];	
		}
		return TAG;
	}

	self.DocByRow = function(Row,CodeObj,DefaultDoc){
		var Result = null;
		Row.Path.forEach(function(RP){
			if (self.Data.DocRow[RP]){
				Result = self.Data.DocRow[RP];
			}
			if (self.Data.DocRow[RP]){
				if (DefaultDoc){
					var _map = self.Data.DocRow[RP];
					var allDocs = [];
					for (var c in _map){
						allDocs = allDocs.concat(_.values(_map[c]));
					}
					allDocs = _.uniq(allDocs);
					if (DefaultDoc && allDocs.indexOf(DefaultDoc)!=-1){
						Result = DefaultDoc;
					}
				} 
				if (!Result ){
					var Obj = self.Data.Div[CodeObj];
					if (Obj){
						if (self.Data.DocRow[RP][Obj.CodeObjClass] &&
							self.Data.DocRow[RP][Obj.CodeObjClass][Obj.CodeObjType]){
							Result =  self.Data.DocRow[RP][Obj.CodeObjClass][Obj.CodeObjType];
						} else {
							if (self.Data.DocRow[RP].Empty && 
								self.Data.DocRow[RP].Empty.Empty){
								Result =  self.Data.DocRow[RP].Empty.Empty;
							}
						}
					}
				}
			}			
		})
		if (!Result){
			if (self.Data.DocRow[Row.CodeRow]) Result = self.Data.DocRow[Row.CodeRow];
		}
		if (!Result && DefaultDoc){
			Result = DefaultDoc;
		}
		return Result;
	}
	self.Load = function(done){
		var Tasks = {};
		['Div','DocRow','Period','Prod','Tag'].forEach(function(Key){
			Tasks[Key] = function(Key){
				return function(cb){
					var Worker = new Form[Key](self.SmallContext);
					Worker.get(cb);
				}
			}(Key);
		})		
		Tasks['RowFormat'] = function(done){
			self.RowHelper.LoadAllFormats(done);
		}
		async.parallel(Tasks,function(err,Answer){
			self.Data = Answer;
			return done(err);
		})
	}
	return self;
}


var Redis = function(){
	var redis = require("redis");
	var self = this;
	self.client = redis.createClient(config.redis);

	self.flushAll = function(done){
		self.client.flushdb(done);
	}

	self.GetAll = function(Cells,done){
		var Answer = [];
		self.client.mget(Cells, function (err, res) {
			if (err) console.log(err);
			res && res.forEach(function(r){
				var R = JSON.parse(r);
				if (R){
					Answer.push(R);
				}
			})
			return done(Answer);
		});
	}

	self.Get = function(Cells,done){
		var chunks = _.chunk(Cells, 100); 
		var Answer = [];
	 	async.each(chunks, function(chunk, callback) {
	 		self.client.mget(chunk, function (err, res) {
				res && res.forEach(function(r){
					var R = JSON.parse(r);
					if (R){
						Answer.push(R);
					}
				})
				return callback();
	 		})
	 	},function(err){
	 		return done(Answer);
	 	})
	}

	self.Set = function(Info,done){
		var commands = [];
		for (var CellName in Info){
			commands.push(CellName,JSON.stringify(Info[CellName]));
		}
		var chunks = _.chunk(commands, 100); 
	 	async.each(chunks, function(chunk, callback) {
	 		self.client.mset(chunk, function () {
				return callback();
	 		})
	 	},function(err){
	 		return done(err);
	 	})
	}
}

var Evaluator = function(Unmapper){
	
	var self = this;

	self.Context = Unmapper.Context;
	self.HowToCalculate = Unmapper.HowToCalculate;

	self.Valutas   = {"RUB":"ReportValue","USD":"ReportValue1","EUR":"ReportValue2"};
	self.Field     = 'Value';

	self.Calculated = {};

	if (self.Valutas[self.Context.CodeValuta]){
		self.Field = self.Valutas[self.Context.CodeValuta];
	} else {
		if (self.Context.IsInput){
			self.Field = 'Value';
		} else {
			self.Field = 'ReportValue';
		}
	}

	self.Calculate = function(done){
		var Primaries2Load = [];
		var RemainCells = {}
		for (var CellName in self.HowToCalculate){
			if (self.HowToCalculate[CellName].Type=='PRM'){
				Primaries2Load.push(CellName);
			} else if (['HDR','ERR'].indexOf(self.HowToCalculate[CellName].Type)>=0){
				self.Calculated[CellName] = 0;
			} else {
				RemainCells[CellName] = self.HowToCalculate[CellName];
			}
		}
 		self.LoadPrimaries(Primaries2Load,function(err){
			if (err) return done(err);
			self.HowToCalculate = RemainCells;
			self.currentRecursion = 1;
			self._calculate(function(err){
				return done(err);
			});
		})
	}

	self.FilterResults = function(done){
		var Matrix = Unmapper.Matrix;
		var Formatter = Unmapper.Info.Data.RowFormat;
		var Answer = {};
		var Errors = Unmapper.Err.BuildErrors(Matrix,Unmapper.CacheInfo);
		for (var CellName in Matrix){
			var Value = '', RowCode = CellName.match(/\$(.*?)\@/)[1];
			if (self.Calculated[CellName]!==void(0)){
				Value = self.Calculated[CellName];
			} 
			if (!isFinite(Value)) Value = 0; // Деление на 0 -> 0
			Answer[CellName] = {};
			if (self.PrimariesInfo[CellName]){
				Answer[CellName] = self.PrimariesInfo[CellName];
			}
			if (!Value){
				if (Answer[CellName].IsRealNull){
					Value = "0";
				} else {
					Value = "";	
				}
			} 
			try{
				if (Formatter[RowCode] && (Value+'').length && Formatter[RowCode].length){
					Value = numeral(Value).format(Formatter[RowCode]);
					Answer[CellName].Formatter = Formatter[RowCode];
				} else {
					Value = numeral(Value).format('#.#####');
					if (Value==Math.round(Value)){
						Value = Math.round(Value);
					}
				}	
			} catch (e){
					Unmapper.Err.Set(CellName,"FORMAT: "+Formatter[RowCode]+': '+e)
			}			
			if (Answer[CellName].CalcValue && self.Context.IsInput) {
				Answer[CellName].Value = Answer[CellName].CalcValue;
			} else  {
				Answer[CellName].Value = Value;	
			}
			Answer[CellName] = _.merge(Answer[CellName],Unmapper.HowToCalculate[CellName]);
			Answer[CellName].CodeDoc = Unmapper.DocRowInfo[RowCode];
			if (Errors[CellName]){
				Answer[CellName].Errors = Errors[CellName];
			}
		}
		return Answer;
	}

	self.PrimariesInfo = {};

	self.getCells = function(What2Ask,Primaries,done){
		if (!config.dbsqlmap){
			What2Ask.forEach(function(F,i){
				if (F=='UserEdit') What2Ask[i] = "CodeUser";
			})		
			db.GetCells(What2Ask,Primaries,function(err,data){
				return done(err,data || []);
			});
		} else {
			db.GetCells(What2Ask,Primaries,done);
		}
	}
	
	self.LoadPrimaries = function(Primaries,done){
		var Exclude = [];
		Primaries.forEach(function(P){
			if (P.indexOf('(')!=-1){
				Exclude.push(P);
			}
		})
		Primaries = _.difference(Primaries,Exclude);
		if (!Primaries.length) return done();		
		var What2Ask = ['CodeCell','CalcValue','Comment','UserEdit','DateEdit'];
		What2Ask.push(self.Field);
		self.getCells(What2Ask,Primaries,function(err,ResultCellsArray){

			var ResultCells = {};
			ResultCellsArray.forEach(function(RC){
				ResultCells[RC.CodeCell] = RC;
			})

			if (err) {
				Unmapper.Err.Critical("GETCELLS","ERR: "+err);
				return done (err);
			}
			if (!ResultCells) return done ('Нет ответа от SQL сервера');

			Primaries.forEach(function(PC){
				var Value2Set  = 0, IsRealNull = false, CalcValue = null, Comment = null, UserEdit = null, DateEdit = null;
				if (ResultCells[PC] ){
					UserEdit = ResultCells[PC].UserEdit || ResultCells[PC].CodeUser;  DateEdit = ResultCells[PC].DateEdit;
					if (ResultCells[PC]['CalcValue']){
						CalcValue = ResultCells[PC]['CalcValue'];
					}
					if (ResultCells[PC].Comment && ResultCells[PC].Comment.length && ResultCells[PC].Comment!='undefined'){
						Comment = ResultCells[PC].Comment;
					}
					if (ResultCells[PC][self.Field]){
						Value2Set = parseFloat(ResultCells[PC][self.Field]);
					}
					if (ResultCells[PC][self.Field] ==0 || Number(ResultCells[PC][self.Field])==0){
						IsRealNull = true;
					}
				} else {
					ResultCells[PC] = {};
					ResultCells[PC][self.Field] = 0;
				}
				self.PrimariesInfo[PC] = {
					IsRealNull:IsRealNull,
					Comment:Comment,
					CalcValue:CalcValue,
					UserEdit:UserEdit,
					DateEdit:DateEdit
				};
				self.Calculated[PC] = Value2Set;
			})
			return done();
		})
	}

	self.maxRecursions    = 2000;
	self.currentRecursion = 1;

	self._calculate = function(done){
		if (--self.maxRecursions==0) {
			for (var CellName in self.HowToCalculate){
				var Value = self.HowToCalculate[CellName].FRM;
				var Vars = Value.match(/\$.*?\?/g);
				Vars.forEach(function(V){
					if (self.Calculated[V]) Value = Value.replaceAll(V,"[*]");
				})
				self.HowToCalculate[CellName].FRM = Value;
				Unmapper.Err.Set(CellName,"RECURSION: "+self.HowToCalculate[CellName].FRM);
			}
			Unmapper.Err.Critical('Рекурсии в вычислениях');
			return done();
		}
		self.currentRecursion++; 
		var keys2omit = [];
		for (var CellName in self.HowToCalculate){
			var Value = self.HowToCalculate[CellName].FRM;
			var Vars = (Value+'').match(/\$.*?\?/g);
			var Formula = (Value+'');
			Formula = Formula.replaceAll('undefined','0');
			Formula = Formula.replace(/\s/g,' ');
			if (self._isCalculateble(Vars)){
				if (!(Formula+'').length || Formula=='0' || Formula==0){
					self.Calculated[CellName] = 0;
				} else {
					self._calculateFormula(CellName,Formula,Vars);
				}
				keys2omit.push(CellName);
			}  
		}
		self.HowToCalculate = _.omit(self.HowToCalculate,keys2omit);
		if (!_.keys(self.HowToCalculate).length){
			return done();
		}
		self._calculate(done);
	}

	self._isCalculateble = function(Vars){
		var result = true;
		if (!Vars || !Vars.length) {
			return result;
		}
		Vars.forEach(function(V){
			if (self.Calculated[V] == void(0)){
				result = false;
			}
		})
		return result;
	}
	self._calculateFormula = function(CellName,Formula,Vars){
		if (self.Calculated[CellName]!==void(0)) return;
		var InitialFormula = Formula;
		Vars && Vars.forEach(function(V){
			Formula = Formula.replaceAll(V,self.Calculated[V]);
		})
		Formula = Formula.replace(/-\s-/g,'+');
		var EvalResult = 0;
		try{
			eval("EvalResult="+Formula);
			if (isNaN(EvalResult)) throw 'IsNan';
		} catch (e){
			try {
				EvalResult = jison.parse(Formula);
				if (EvalResult==void(0) || isNaN(EvalResult)) EvalResult = 0;
			} catch (e2){
				console.log(e2);
				EvalResult = 0;
				Unmapper.Err.Set(CellName,"CALCERROR: "+InitialFormula+" : "+e2.message);
				return 0;
			}
		}
		self.Calculated[CellName] = EvalResult;
	}
}




module.exports = {
	Unmapper:Unmapper,
	Evaluator:Evaluator,
	InfoCacher:GeneralInfo
}