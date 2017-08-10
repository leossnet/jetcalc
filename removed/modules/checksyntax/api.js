var mongoose = require('mongoose');
var router   = require('express').Router();
var _        = require('lodash');
var async    = require('async');
var HP = require(__base+'lib/helpers/lib.js').Permits; 


var FormulaLoader = function(){
	var self = this;

    self.FormulaPlaces = {'col':"CodeCol",'row':"CodeRow"};

    self.Load = function(cb){
      var Tasks = {};
      for (var ModelName in self.FormulaPlaces){
      	  Tasks[ModelName] = function(ModelName,Field){
      	  	return function(done){
		      mongoose.model(ModelName).find({IsFormula:true,IsActive:true},Field+" OldFormula").lean().exec(function(err,Objs){
		      	  var Result = {};
		          Objs.forEach(function(O){ Result[ModelName+"."+O[Field]] = O.OldFormula;});
		          return done(err,Result);
	          })
      	  	}
      	  }(ModelName,self.FormulaPlaces[ModelName]);
      }
      async.parallel(Tasks,function(err,Result){
      	var Formulas = {};
      	for (var ModelName in self.FormulaPlaces){
      		var Formulas = _.merge(Formulas,Result[ModelName]);
      	}
      	return cb(err,Formulas);
      })
    }

    return self;
}

var FormualChecker = function(){
   var self = this;

   self.jison = require(__base + 'classes/calculator/jison/parser.js');

   self.Do = function(cb){
     var Loader = new FormulaLoader();
     Loader.Load(function(err,Formulas){
         if (err) return done(err);
         var Errors = {};
         for (var Code in  Formulas){
           var TestFormula = (Formulas[Code]+'').replace(/\s+/g,' ');
           try {
             self.jison.parse(TestFormula);
           } catch(e){
               var e = e.message+'';
               if (TestFormula.length){
	               Errors[Code] = {
	                   Code:Code,
	                   Formula:TestFormula,
	                   Error:e+''
	               }
               }
           }
         }
         return cb(null,Errors);
     })
   }

   return self;
}

var FormulaUpdateSyntax = function(){
	var self = this;
	self.Formulas = {};
	self.FormulasAll = {};

	self.diff = require('googlediff');

	self.Rules = {
		Replaces:[
			[/f\.monthInKvart\([\s]*q\.Column\.Period[\s]*\)/g,'monthInKvart(0)'],
			[/f\.If/g,'if'],
			[/f\.round/g,'round'],
			[/System\.Math\.Round/g,'round'],
			[/f\.checklimit/g,'checklimit'],
			[/f\.choose/g,'choose'],
			[/\!\=/g,'<>'],
			[/q\.Column\.Code[\s]*\=\=[\s]*["'](.*?)["']/g,'colin($1)'],
			[/query\.Column\.Code[\s]*\=\=[\s]*["'](.*?)["']/g,'colin($1)'],
			[/([$@.].*?)\.sign(.*?)\?/g,'if ($1? > 0, {$1?})'],
		]
	}

	self.UpdateVariables = function(Formula){
		var Vars = Formula.match(self.VarRgexp);
		if (!Vars) return Formula;
		if (Formula.indexOf("onperiods")!=-1
			||Formula.indexOf("q.Zone.Type")!=-1
			) return Formula;
		var Result = {};
		var ModifyFilter = function(Filter,letter,args){
			args = args;
			if (!args.length) args = "##";
			var Groups = args.split(',');
			Groups.forEach(function(B){
				Filter.push(letter+':'+B.replace(/['"]/g,''));
			})
			return Filter;
		}
		Vars.forEach(function(V){
			var Reparsed = self.ParamsFromIncompleteVar(V);
			var Filter = [], Valuta = null;
			if (Reparsed.Mods.length){
				Reparsed.Mods.forEach(function(M){
					if (M.args && M.args.length) M.args = (M.args+'').trim()
					switch (M.func){
						case "toparentobj":
						case "tomainobj":
						case "torootobj":
							Reparsed.Obj = "^";
						break;
						case "conto":
							if ((M.args+'').substring(0,3)=="SIB"){
								Filter = ModifyFilter(Filter,"T",M.args);	
							} else {
								Filter = ModifyFilter(Filter,"B",M.args);	
							}							
						break;
						case "altgrp":
							Filter = ModifyFilter(Filter,"G",M.args);
						break;
						case "altdiv":
							Filter = ModifyFilter(Filter,"D",M.args);
						break;
						case "toobj":
							Reparsed.Obj = M.args;
						break;
						case "tovaluta":
							Reparsed.Valuta = '.C'+M.args;
						break;
						case "altobjfilter":
							var Test  = M.args.split(",");
							var Divs = [], Grps = [], Objs = [];
							Test.forEach(function(T){
								if(T.indexOf("div_")==0){
									Divs.push(T.split("div_").splice(1).join('div_'));
								} else
								if(T.indexOf("grp_")==0){
									Divs.push(T.split("grp_").splice(1).join('grp_'));
								} else {
									Objs.push(T);
								}
							})
							if (Divs.length) Filter = ModifyFilter(Filter,"D",Divs.join(','));
							if (Grps.length) Filter = ModifyFilter(Filter,"G",Grps.join(','));
							if (Objs.length) Filter = ModifyFilter(Filter,"#",Objs.join(','));
						break;
						case "altobj":
							Filter = ModifyFilter(Filter,"#",M.args);
						break;
						case "consobj":
						    // Проверка аргумента
							if (M.args=="_PARENT.CLASS"){
								Reparsed.ConsObj = "(^)";
							} else if (!M.args.length){
								Reparsed.ConsObj = "()";
							} else {
								Reparsed.ConsObj = "(T:"+M.args+')';
							}
						break;
						default:
							console.log(Vars,Formula);
							console.log(M);
							die();
					}
				})
			}
			if (Filter.length){
				Reparsed.Filter = "("+Filter.join(', ')+")";
			}
			Result[V] = self.JoinBack(Reparsed);
		})
		for (var Key in Result){
			Formula = Formula.split(Key).join(Result[Key]);
		}
		return Formula;
	}

	self.VarRgexp  = /[$@].*?\?/g;
	self.Modifiers = /\.([a-z]*)\((.*?)\)/g;

	self.JoinBack = function(R){
		var Result = "";
		for (var Key in self.Signs){
			if (R[Key] && R[Key]!='null') Result += self.Signs[Key]+R[Key];
		}
		return Result+'?';
	}

	self.Signs = {"Row": "$", "Col": "@", "Year":'.Y',"Period":".P", "Obj":"#", "ConsObj":"<<","Filter":">>","Valuta":""}



	self.ParamsFromIncompleteVar = function(v){
		var _setVar = function(unparsed,name,regexp){
	 		var t = unparsed.match(regexp);
	 		if (!t || !t[0]) return null;
	 		else return t[0];
	 	}
	 	var R = {
	 		Row:(_setVar(v, 'Row', /\$.*?(?=[@?\.\<\>])/)+'').replace(self.Signs.Row,''),
	 		Col:(_setVar(v, 'Col', /\@.*?(?=[?\.\<\>])/)+'').replace(self.Signs.Col,''),
			Year:(_setVar(v, 'Year',/\.Y[-]?\d*(?=[?\.\<\>])/)+'').replace(self.Signs.Year,''),
	 		Period:(_setVar(v, 'Period',/\.P[-]?\d*(?=[?\.\<\>])/)+'').replace(self.Signs.Period,''),
	 		Obj:(_setVar(v, 'Obj',/\#(?!:).*?(?=[?\.\<\>])/)+'').replace(self.Signs.Obj,''),
	 		Mods:[],
	 		ConsObj:null,
	 		Filter:null,
	 		Valuta:null
	 	}
	 	if (R.Row.indexOf("m150")==0 && self.CodeProds.indexOf(R.Row)!=-1){
	 		R.Row = "("+R.Row+")";
	 	}
	 	if (R.Col && R.Col.indexOf("_FA")!=-1) {
	 		if(R.Col.indexOf("_FA")==(R.Col.length-3)){
	 			R.Col = R.Col.substring(0,(R.Col.length-3));
	 		}
	 	}
	 	var modifiers = v.match(self.Modifiers)
		if (modifiers && modifiers.length){
			var Mods = [];
			var Reg = new RegExp(self.Modifiers);
			while (m = Reg.exec(v)){
				var Mod = {text:m[0],func:m[1],args:(m[2]+'').replace(/['"]/g,'')};
				Mods.push(Mod);
			}
			R.Mods = Mods;
		}
		return R;
	}



	self.Reparse = function(Formula){
		self.Rules.Replaces.forEach(function(Arr){
			Formula = Formula.replace(Arr[0],Arr[1]);
		})
		Formula = self.UpdateVariables(Formula);
		return Formula;
	}

	self.OnlyShow = false;


	self.ProdRows = [];
	self.CodeProds = [];
	self.LoadInfo = function(done){
		mongoose.model("prod").find({},"-_id CodeProd").isactive().lean().exec(function(err,Prods){
			self.CodeProds = _.map(Prods,"CodeProd");
			mongoose.model("row").find({CodeRow:{$regex:"^m150.*?"}},"CodeRow").isactive().lean().exec(function(err,Rs){
				self.ProdRows = _.map(Rs,"CodeRow");
				return done();
			})		
		})
	}

	self.UpdateTags = function(done){
		return done();
		var ToUpdate = [];
		async.each(["coltag","doctag","objtag","rowtag","objtypetag"],function(model,cb){
			var M = mongoose.model(model);
			M.find({},[M.cfg().Code,"Value"].join(" ")).isactive().exec(function(err,Tags){
				Tags.forEach(function(T){
					var DoUpdate = false;
					//if (T.Value.indexOf("(")!=-1){
						T.Value = T.Value.replace("(","").replace(")","");
//						DoUpdate = true;
//					}
//					if (self.CodeProds.indexOf(T.Value)!=-1 && self.ProdRows.indexOf(T.Value)==-1){
						//T.Value = "("+T.Value+")";
						//console.log("1",model,T.Value,self.CodeProds.indexOf(T.Value),self.ProdRows.indexOf(T.Value));
//						ToUpdate.push(T);
//					} else if (DoUpdate){
						//console.log("2",model,T.Value);
						ToUpdate.push(T);
//					}

				})
				return cb();
			});
		},function(err){

			if (!ToUpdate.length) return done();
			async.each(ToUpdate,function(ob,cb1){
				ob.save("",cb1);
			},done)
		});
	}

	self.Do = function(done){
		var Loader = new FormulaLoader();
		var BulkUpdate = {
			row:mongoose.model('row').collection.initializeOrderedBulkOp(),
			col:mongoose.model('col').collection.initializeOrderedBulkOp()
		}
		var Counters = {row:0,col:0};
		self.LoadInfo(function(err){
			Loader.Load(function(err,Formulas){
				for (var Key in Formulas){
					var Old = Formulas[Key];
					var Reparsed = self.Reparse(Old);
					if (Reparsed!=Old){
						var dmp = new self.diff();
						var diff = dmp.diff_main(Old, Reparsed);
						self.Formulas[Key] = {
							Code:Key,
							OldFormula:Old,
							Formula: dmp.diff_prettyHtml(diff).replaceAll('&para;','')
						}
						var partKeys = Key.split('.');
						Counters[partKeys[0]]++;
						if (partKeys[0]=='row'){
							BulkUpdate.row.find({CodeRow:partKeys[1]}).update({$set:{Formula:Reparsed}});
						} else {
							BulkUpdate.col.find({CodeCol:partKeys[1]}).update({$set:{Formula:Reparsed}});
						}
					} else {
						self.FormulasAll[Key] = {
							Code:Key,
							OldFormula:Old,
							Formula: Reparsed
						}
					}
				}
				var doUpdate = function(counter,bulk){
					return function(done){
						if (!counter || self.OnlyShow) return done();
						bulk.execute(done);
					}
				}
				async.parallel({
					col:doUpdate(Counters.col,BulkUpdate.col),
					row:doUpdate(Counters.row,BulkUpdate.row),
					tag:self.UpdateTags,
				},function(err){
					if (!_.keys(self.Formulas).length) return done(err,self.FormulasAll);
					return done(err,self.Formulas);
				})
			})
		})
	}
}

router.get('/checkformula', HP.TaskAccess("IsFormulaEditor"), function(req,res,next){
	var F = new FormualChecker();
	F.Do(function(err,Result){
		if (err) return next(err);
		return res.json(Result);
	})
})

router.get('/updateformula', HP.TaskAccess("IsFormulaEditor"), function(req,res,next){
	var F = new FormulaUpdateSyntax();
	F.Do(function(err,Result){
		if (err) return next(err);
		return res.json(Result);
	})
})

module.exports = router
