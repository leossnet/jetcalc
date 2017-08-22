var mongoose   = require('mongoose');
var router     = require('express').Router();
var _          = require('lodash');
var async      = require('async');
var moment      = require('moment');
var LIB = require(__base+'lib/helpers/lib.js');
var HP = LIB.Permits; 



var ReportPeriods = (new function(){
	var self = this;

	self.Opened = function(done){
		mongoose.model("periodedit").find({IsEdit:true},"-_id CodePeriod CodeRole Year IsEdit").isactive().lean().exec(function(err,Set){
			return done(err,Set);
		})
	}

	self.Roles = function(done){
		mongoose.model("doc").find({IsInput:true},"-_id CodeRole").isactive().lean().exec(function(err,Rs){
			return done(err, _.uniq(_.map(Rs,"CodeRole")));
		})
	}

	self.ReportGroups = function(done){
		mongoose.model("periodgrp").find({ForPermits:true},"-_id CodePeriodGrp").isactive().lean().exec(function(err,Rs){
			return done(err, _.uniq(_.map(Rs,"CodePeriodGrp")));
		})
	}

	self.Periods = function(done){
		self.ReportGroups(function(err,Arr){
			if (!Arr.length) return done();
			mongoose.model("period").find({IsReportPeriod:true},"-_id CodePeriod Link_periodgrpref").populate({
				path:"Link_periodgrpref",
				match:{CodePeriodGrp:{$in:Arr}},
				select:"-_id CodePeriodGrp"
			}).isactive().lean().exec(function(err,PS){
				var Groupped = {};
				PS.forEach(function(P){
					var PG = _.first(P.Link_periodgrpref), Gr = "NONE";
					if (PG) Gr = PG.CodePeriodGrp;
					if (!Groupped[Gr])  Groupped[Gr] = [];
					Groupped[Gr].push(P.CodePeriod);
				})
				return done(err,Groupped);
			})
		})
	}
	return self;
})

var MapPeriods = (new function(){

	var self = this;

	self.Map = {};	
	self.Groups = {};

	self.Result = null;

	self.GetMap = function(done){
		self.Map = {};self.Groups = {};
		self.Load(function(err){
			self.DefineGroups(function(err,Result){
				var Answer = {};
				for (var CodeGroup in self.Groups){
					Answer[CodeGroup] = {};
					self.Groups[CodeGroup].forEach(function(CodePeriod){
						Answer[CodeGroup][CodePeriod] = self.Map[CodePeriod];
					})
				}
				return done(err,Answer);
			})
		})
	}

	self.Load = function(done){
		var Links = mongoose.model("reportperiods");
		var Result = {}, Fields = ["-_id","CodeReportPeriod","ReportYear","IsOptional","CodePeriod"];
		Links.find({},Fields.join(" ")).lean().isactive().sort({IndexReportPeriod:1}).exec(function(err,Periods){
			if (!_.isEmpty(Periods)){
				Periods.forEach(function(P){
					if (!self.Map[P.CodePeriod]){
						self.Map[P.CodePeriod] = [];
					}
					self.Map[P.CodePeriod].push({period:P.CodeReportPeriod,year:P.ReportYear,isoptional:P.IsOptional});
				})
				return done(err);
			} else {
				mongoose.model("period").find({IsReportPeriod:true},"-_id CodePeriod NamePeriod").sort({MCount:1,BeginDate:1}).isactive().exec(function(err,Main){
					Main.forEach(function(M){
						self.Map[M.CodePeriod] = [];
					})
					return done(err);

				})
			}
			
		})
	}

	self.ReportGroups = function(done){
		mongoose.model("periodgrp").find({ForPermits:true},"-_id CodePeriodGrp").isactive().lean().exec(function(err,Rs){
			return done(err, _.uniq(_.map(Rs,"CodePeriodGrp")));
		})
	}


	self.DefineGroups = function(done){
		self.ReportGroups(function(err, rArr){
			var PeriodHelper = require(__base+"/classes/calculator/helpers/Period.js");
			var Worker = new PeriodHelper({UseCache:false});
			var Groupped = {};
			rArr.forEach(function(PG){
				Groupped[PG] = [];
			})
			var ToGroup = _.keys(self.Map);
			Worker.get(function(err,Info){
				if (!ToGroup.length){
					ToGroup = _.map(_.filter(_.values(Info),function(In){
						return !_.isEmpty(In.CodePeriod);
					}),"CodePeriod");
				}
				ToGroup.forEach(function(CodePeriod){
					var Inf = Info[CodePeriod];
					rArr.forEach(function(G){
						if (Inf.Grps.indexOf(G)!=-1){
							Groupped[G].push(Inf.CodePeriod);
						}
					})			
				})
				self.Groups = Groupped;
				return done();
			})
		})
	}

	return self;
})

var PeriodRedirects = (new function(){
	var self = this;

	self.Get = function(done){
		var Res = {
			CodeDocType:{Include:{},Exclude:{}},
			CodeGrp:{Include:{},Exclude:{}}
		};
		var _set = function(Type,Value){
			var Set = Value.NotGrp ? Res[Type].Exclude:Res[Type].Include;
			if (!Set[Value[Type]]) Set[Value[Type]] = {};
			Set[Value[Type]][Value.CodePeriod] = Value.CodePeriodToRedirect;
		}
		mongoose.model("periodredirect").find({},"-_id NotGrp CodeDocType CodeGrp CodePeriod CodePeriodToRedirect").isactive().lean().exec(function(err,Links){
			Links.forEach(function(Link){
				if (!_.isEmpty(Link.CodeDocType)){
					_set("CodeDocType",Link);
				} else if (!_.isEmpty(Link.CodeGrp)){
					_set("CodeGrp",Link);
				}
			})
			return done(err,Res);			
		})
	}



	return self;
})


router.put('/update',  HP.TaskAccess("IsPeriodEditTunner"), function(req, res, next){
	var Year = Number(req.body.Year), CodeUser = req.user.CodeUser;
	var PED = mongoose.model("periodedit");
	PED.find({Year:Year}).isactive().exec(function(err,Current){
		var NewArray = [];
		req.body.Value && req.body.Value.forEach(function(V){
			NewArray.push(_.merge(V,{Year:Year}));
		})
		var ToSave = [];
		Current.forEach(function(C){
			var F = _.find(NewArray,{Year:C.Year,CodePeriod:C.CodePeriod,CodeRole:C.CodeRole});
			if (!F && C.IsEdit){
				C.IsEdit = false; ToSave.push(C);
			}
		})
		NewArray.forEach(function(N){
			var F = _.find(Current,{Year:N.Year,CodePeriod:N.CodePeriod,CodeRole:N.CodeRole})
			if (F && !F.IsEdit){
				F.IsEdit = true; ToSave.push(F);
			}
			if (!F){
				F = new PED(N); F.IsEdit = true; ToSave.push(F);
			}
		})
		if (!ToSave.length) return  res.json({});
		async.each(ToSave,function(O,cb){
			O.save(CodeUser,cb);
		},function(err){
			if (err) return next(err);
			return res.json({});
		})
	})
})


router.get('/table', HP.TaskAccess("IsPeriodEditTunner"), function(req, res, next){
	var Year = Number(req.query.Year || moment().format("YYYY"), Table = {});
	ReportPeriods.Roles(function(err,Roles){
		ReportPeriods.Opened(function(err,Opened){
			var Cur = _.filter(Opened,{Year:Year}), Ind = {};
			Cur.forEach(function(PE){
				if (!Ind[PE.CodePeriod])  Ind[PE.CodePeriod] = {};
				Ind[PE.CodePeriod][PE.CodeRole] = PE.IsEdit;
			})
			ReportPeriods.Periods(function(err,List){
				for (var Gr in List){
					Table[Gr] = {};
					List[Gr].forEach(function(P){
						Table[Gr][P] = {};
						Roles.forEach(function(CR){
							Table[Gr][P][CR] = (Ind[P] && Ind[P][CR])? true:false;
						})
					})
				}	
				return res.json(Table);
			})
		})
	})
})

router.get('/init', function(req, res, next){
	ReportPeriods.Opened(function(err,Opened){
		MapPeriods.GetMap(function(err,Map){
			PeriodRedirects.Get(function(err,Redirect){
				return res.json({
					Map:Map,
					Opened:Opened,
					Redirect:Redirect
				});
			})
		})
	})
})  

  
module.exports = router;