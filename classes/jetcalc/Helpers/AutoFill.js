var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var Base = require(__base + 'classes/jetcalc/Helpers/Base.js');
var Rx = require(__base + "classes/jetcalc/RegExp.js");
var db = require(__base + '/sql/db.js');




var Rabbit = (new function() {
    var self = this;

    var config = require(__base + "config.js");
    var RabbitMQClient = require(__base + "src/rabbitmq_wc.js").client;
    var AFClient = new RabbitMQClient({
        queue_id: config.rabbitPrefix + "auto_fill_worker"
    });

    self.IsConnected = false;


    self.Connect = function(done) {
        if (self.IsConnected) return done();
        AFClient.connect(function(err) {
            self.IsConnected = true;
            return done(err);
        });
    }

    self.sendMessage = function(msg, done) {
        self.Connect(function(err) {
            if (err) console.log(err);
            console.log("Connected");
            AFClient.sendMessage(msg, done);
        })
    }

    return self;
})


var PeriodWorker = require(__base + "classes/jetcalc/Helpers/Period.js");

var AutoFill = (new function() {
    var self = new Base("JAFILL");



    self.UpdateChainDocuments = function(Cx,done){
        console.log("UpdateChainDocuments!!!!!!!!!!!!!");

        self.GetRoute(Cx,function(err, route){
            if (_.isEmpty(route)){
                return done();
            }
            var start = route[Cx.CodeDoc];
            var tasks = [], breakCounter = 10;
            while(!_.isEmpty(start) && (--breakCounter)>0){
                var CodeDocs = _.first(_.values(start));
                tasks = tasks.concat(CodeDocs);
            }
            tasks = _.uniq(tasks);
            async.eachSeries(tasks,function(CodeDoc,next){
                var context = _.merge(_.cloneDeep(Cx),{CodeDoc:CodeDoc});
                self.UpdateAll(context,next);
            },function(err){
                if (err) console.log("All Updated");
                console.log("ALL DONE! UpdateChainDocuments");
                return done(err);
            })
        })
    }

    self.BuildDocRoute = function(CodeDoc,CodePeriod,done){
        PeriodWorker.get(function(err,PInfo){
            var Period = PInfo[CodePeriod];
            if (_.isEmpty(Period)) return done("Не найден период "+CodePeriod);
            var Q = {CodePeriodGrp:{$in:["",null]}};
            if (!_.isEmpty(Period.Grps)){
                Q.CodePeriodGrp["$in"] = _.concat(Q.CodePeriodGrp["$in"],Period.Grps);
            } 
            var Query = _.merge({CodeDocSourse: CodeDoc},Q);
            mongoose.model("docrelation").find(Query, "-_id CodeDocTarget Link_colrelation").populate("Link_colrelation").isactive().lean().exec(function(err, RelatedDocs) {
                var Path = {};
                RelatedDocs.forEach(function(RD){
                    RD.Link_colrelation.forEach(function(ColInfo){
                        if (!Path[ColInfo.CodeColSource]) Path[ColInfo.CodeColSource] = [];
                        Path[ColInfo.CodeColSource].push(RD.CodeDocTarget);
                    })
                })
                var Result = {}; Result[CodeDoc] = Path;
                return done(err,Result);
            })                
        })
    }


    self.GetRoute = function(Cx, done){
        var Result = {};
        self.BuildDocRoute(Cx.CodeDoc,Cx.CodePeriod,function(err,Info){
            Result = _.merge(Result,Info);
            var Docs = _.filter(_.uniq(_.flattenDeep(_.values(_.first(_.values(Info))))),function(V){
                return _.keys(Result).indexOf(V==-1);
            });
            if (_.isEmpty(Docs)){
                return done(err,Result);
            }
            async.each(Docs,function(CodeDoc,next){
                self.BuildDocRoute(CodeDoc,Cx.CodePeriod,function(err,Info){
                    Result = _.merge(Result,Info);
                    return next();
                })
            },function(err){
                return done(err,Result);

            })
        })
    }

    self.HasAF = function(Cx, done) {
        var ColHelper = require(__base + "classes/jetcalc/Helpers/Col.js");
        var RowHelper = require(__base + "classes/jetcalc/Helpers/Row.js");
        ColHelper.get(Cx, function(err, Colls) {
            RowHelper.get(Cx, function(err, Rows) {
                return done(err, 
                    !_.isEmpty(_.filter(Colls, {
                        IsAfFormula: true
                    })) 
                    || 
                    !_.isEmpty(_.filter(Rows, {
                        IsAfFormula: true
                    })) 
                )
            })
        })
    }

    self.GetAF = function(Cx, done) {
        var StrWorker = require(__base + "classes/jetcalc/Helpers/Structure.js");
        var CalcApi = require(__base + "classes/jetcalc/CalcApi.js");
        StrWorker.get(Cx, function(err, Str) {
            var AFCells = _.filter(_.flatten(Str.Cells), {
                IsAFFormula: true,
                IsPrimary: true
            });
            if (_.isEmpty(AFCells)) return done(err, []);
            var ToCalculate = {};
            AFCells.forEach(function(A) {
                ToCalculate[A.Cell] = A.AfFormula;
            })
            CalcApi.CalculateByFormula(ToCalculate, Cx, function(err, Result, AllResult) {
                var Explain = {};
                for (var CodeCell in ToCalculate){
                    Explain[CodeCell] = AllResult.Unmapper.HowToCalculate[CodeCell].FRM;
                }
                return done(err, Result, Explain);
            })
        })
    }

    self.Update = function(Cx, done) {
        self.SaveAF(Cx, done);
        Rabbit.sendMessage(Cx, function(err) {
            console.log("All Is Done");
        });
    }

    self._periods = function(Cx, done) {
        mongoose.model("periodautofill").find({
            CodeSourcePeriod: Cx.CodePeriod
        }, "-_id CodeTargetPeriod").isactive().lean().sort({
            Idx: 1
        }).exec(function(err, Ps) {
            var Periods = _.concat([Cx.CodePeriod], _.map(Ps, "CodeTargetPeriod"));
            return done(err, Periods);
        })
    }

    self.Query = function() {

    }



    self.UpdateAll = function(Cx, done) {
        var DocHelper = require(__base + "classes/jetcalc/Helpers/Doc.js");
        if (_.isEmpty(Cx.FirstPass)) Cx.FirstPass = true;
        async.parallel({
            Periods: self._periods.bind(self, Cx),
            Doc: DocHelper.get.bind(DocHelper, Cx.CodeDoc),
        }, function(err, Result) {
            var Objs = [],
                IsChildObj = false;
            if (Result.Doc.HasChildObjs) {
                Objs = Result.Doc.SubObjs[Cx.CodeObj];
                IsChildObj = true;
            } else {
                Objs = [Cx.CodeObj];
            }
            console.log("... UpdateAll",Cx.CodeDoc,Result.Periods,Objs)

            async.eachSeries(Result.Periods, function(Period, next) {
                async.eachSeries(Objs, function(Obj, cb) {
                    var Context = _.cloneDeep(Cx);
                    if (IsChildObj) {
                        Context.ChildObj = Obj
                    }
                    Context.CodePeriod = Period;
                    self.SaveAF(Context, function(err, CellsSaved) {
                    	if (err) console.log("BBBBB ERR ",err);
                        return cb(err);
                    });
                }, function(err){
                	if (err) console.log("AAAA ERR ",err);
                	return next(err);
                })
            }, function(err) {
                console.log("Update All is finished");
                return done(err);
                self.UpdateChainDocuments(Cx, function(err) {
                    return done(err);
                    if (err) return done(err);
                    self.SaveAF(Cx, function(err, CellsSaved) {
                        return done(err);
                    });
                });
            })
        })
    }

    self.ChainCount = 1;

    self.AFChain = function(Cx, done) {
        mongoose.model("docrelation").find({
            CodeDocSourse: Cx.CodeDoc
        }, "-_id CodeDocTarget").isactive().lean().exec(function(err, RelatedDocs) {
            var Codes = _.map(RelatedDocs, "CodeDocTarget");
            var CellsChanged = {};
            async.eachSeries(Codes, function(CodeDoc, next) {
                self.SaveAF(_.merge(_.clone(Cx), {
                    CodeDoc: CodeDoc
                }), function(err, Changed) {
                    if (!_.isEmpty(Changed)) {
                        CellsChanged[CodeDoc] = Changed;
                    }
                    return next(err);
                })
            }, function(err) {
                if (err || _.isEmpty(CellsChanged)) return done(err);
                async.eachSeries(_.keys(CellsChanged), function(CodeDoc, recnext) {
                    self.AFChain(_.merge(_.clone(Cx), {
                        CodeDoc: CodeDoc
                    }), recnext);
                }, done);
            })
        })
    }



    self.MaxRound = function(V) {
        var r = 0;
        try{
            r = Number(V.toFixed(8));
        } catch(e){
            console.log(e);
        }
        return r;
    }

    self.LoadPrimaries = function(Cells, done) {
        var Answer = {};
        db.GetCells(["CodeCell", "Value"], Cells, function(err, data) {
            if (err) return done(err);
            var Indexed = {};
            data = data || [];
            data.forEach(function(d) {
                Indexed[d.CodeCell] = d.Value;
            })
            Cells.forEach(function(CodeCell) {
                Answer[CodeCell] = Indexed[CodeCell] || 0;
            })
            return done(err, Answer);
        });
    }

    self.SaveAF = function(Context, done) {
        self.GetAF(Context, function(err, Cells) {
            if (_.isEmpty(Cells)) return done(err,[]);
            self.LoadPrimaries(_.keys(Cells), function(err, Current) {
                var ToSave = {};
                for (var CodeCell in Cells) {
                    var V = self.MaxRound(Cells[CodeCell]);
                    if (V != Current[CodeCell]) {
                        ToSave[CodeCell] = V;
                    }
                }
                if (_.isEmpty(ToSave)) return done(err, []);
                self.SaveCells(ToSave, Context, function(err) {
                    return done(err, _.keys(ToSave));
                });
            })
        })
    }

    self.SaveCells = function(Cells, Context, done) {
        var Arr = [];
        for (var CellName in Cells) {
            var Cell = Rx._toObj(CellName);
            Arr.push({
                CodeCell: CellName,
                CodeUser: Context.CodeUser,
                Comment: '',
                CalcValue: '',
                Value: Cells[CellName],
                CodeValuta: Context.CodeValuta
            })
        }
        db.SetCells(Arr, function(err) {
            return done(err);
        })
    }




    return self;
});





module.exports = AutoFill;





/*
module.exports =  function(){
	var self = this;

	self.UpdateAll = function(Context,done){
		mongoose.model("periodautofill").find({CodeSourcePeriod:Context.CodePeriod},"-_id CodeTargetPeriod").isactive().lean().exec(function(err,Ps){
			var Periods = _.map(Ps,"CodeTargetPeriod");
			Periods.push(Context.CodePeriod);
			async.each(Periods,function(P,cb){
				var CX  = _.clone(Context);
				CX.CodePeriod = P;
				self.SaveAF(CX,cb);
			},function(err){
				return done(err);
			})
		})
	}

	self.SaveAF = function(Context,done){
		self.GetAF(Context,function(err,Arr){
			var Cells = self.Primaries(Arr);
			if (!Cells.length) return done();
			var OldValues = {}, NewValues = {};
			Arr.forEach(function(Row){
				Row.forEach(function(Cell){
					if (Cell!=""){
						NewValues[Cell.CellName] = Cell.Value;
					}
				})
			})
			self.Calculate(Context,function(err,R){
				Cells.forEach(function(CellName){
					var V = 0;
					if (R.Cells[CellName] && R.Cells[CellName].Value){
						V = R.Cells[CellName].Value;
					}
					OldValues[CellName] = V;
				})
				var ToSave = [];
				for (var CellName in NewValues){
					if (CellName && (CellName+'')!='undefined'){
						if (!OldValues[CellName] || OldValues[CellName]!=NewValues[CellName]){
							ToSave.push({Cell:CellName,Value:NewValues[CellName]});
						}
					}
				}
				if (!ToSave.length) return done();
				self.SaveToDB(ToSave, Context, done);
			})
		})
	}

	self.Round = function round(value) {
	  var  exp = 5;
	  if (typeof exp === 'undefined' || +exp === 0)
	    return Math.round(value);
	  value = +value;
	  exp = +exp;
	  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
	    return NaN;
	  value = value.toString().split('e');
	  value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));
	  value = value.toString().split('e');
	  return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
	}


	self.Primaries = function(Arr){
		var Cells = [];
		Arr.forEach(function(Row){
			Row.forEach(function(Cell){
				if (Cell!=""){
					Cells.push(Cell.CellName);
				}
			})
		})
		return  _.uniq(Cells);
	}

	self.Calculate = function(Context,done){
		RabbitManager.CountConsumers(function(ConsumersCount){
			if (!ConsumersCount){
				return next('Проблема с сервером. Ни одного расчетчика не запущено');
			}
			Context.Priority = 1;
			RabbitManager.CalculateDocument(Context,function(err,Result){
				return done(err,Result);
			})
		})
	}

	self.GetAF = function(Context,done){
		var StrWorker = require(__base+"classes/jetcalc/Helpers/Structure.js");

		var ColWorker = new Col(Context);
		var DocWorker = new Doc(Context);
		DocWorker.get(function(err,Doc){
			ColWorker.get(function(err,Ans){
				var ColsByIndex = {}, Left = 2;
				if (Doc.IsShowMeasure){
					Left = 3;
				}
				Ans.forEach(function(Col,Ind){
					if (Col.IsAfFormula){
						ColsByIndex[Ind+Left] = Col.AfFormula;
					}
				})

				StrWorker.get(Context,function(err,Struct){
					var Answer = [], ByIndex = {}, ToCalculate = {};
					Struct.Cells.forEach(function(Row,RowInd){
						var NR = [];
						Row.forEach(function(Cell,ColInd){
							if (Cell.IsPrimary && ColsByIndex[ColInd]){
								NR.push(Cell.Cell+":"+ColsByIndex[ColInd]);
								ByIndex[Cell.Cell+":"+ColsByIndex[ColInd]] = [RowInd,ColInd];
								ToCalculate[Cell.Cell] = ColsByIndex[ColInd];
							} else {
								NR.push("");
							}
						})
						Answer.push(NR);
					})

					Calc.CalculateByFormula(Context,ToCalculate,function(err,Result){
						var VS = Result.Values || {};
						for (var CellName in ByIndex){
							var xy = ByIndex[CellName];
							var Current = Answer[xy[0]][xy[1]].split(":");
							var CellName = _.first(Current);
							var Formula = _.last(Current);
							Answer[xy[0]][xy[1]] = {
								CellName:CellName,
								Formula:Formula,
								Value:self.Round(VS[CellName])
							}
						}
						return done(null,Answer);
					})
				})
			})
		})
	}


	return self;
}
*/
