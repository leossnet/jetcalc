var IsClientSide = (typeof window != 'undefined');

if (!IsClientSide) {
	var _ = require('lodash');
}

var PermChecker = (new function(){
	var self = this;

	self.P = null; // For Client use

	self.Find = function(PPlace,Code){
		var Result = [];
		for (var CR in PPlace){
			if (PPlace[CR].indexOf(Code)!=-1){
				Result.push(CR);
			}
		}
		return Result;
	}

	self.ReqContext = function(req){
		var SandBox = req.session.sandbox, CodeUser = req.user.CodeUser, Context = {};
		var data = req.body;
		switch (req.method) {
			case 'GET': 
				data = _.clone(req.query);
				break;
			default: 
				data = _.clone(req.body);
				break;
		}

		Context = data.Context || data.context || data;
		Context.SandBox = null;
		if (SandBox && SandBox.On && SandBox.ToSave) Context.SandBox = SandBox.CodeUser;
		['IsInput','UseCache','IsDebug','IsOlap'].forEach(function(Field){
			Context[Field] = (Context[Field]===true || Context[Field]==="true");
		})
		Context.Year = parseInt(Context.Year);
		Context.CodeUser  = CodeUser;
		return Context;
	}


	self.TaskAccess = function(T){
		return function(req, res, next){
			if (!_.isArray(T)) T = [T];
			if (self.CheckPrivelegeAny(T,self.ReqContext(req),req.session.permissions)){
				return next();	
			} else {
				return next("Не хватает прав для совершения действия: "+T);
			}			
		}
	}

	self.UserTaskAccess = function(T){
		return function(req, res, next){
			var CodeUser = req.query.CodeUser;
			if (self.CheckUserPrivelege(T,CodeUser,req.session.permissions)){
				return next();	
			} else {
				return next("Не хватает прав для совершения действия: "+T);
			}			
		}
	}

	self.ModelAccessM = function(T){
		return function(req, res, next){
			T = T || req.query.model || req.body.model;
			console.log("Checking Model ",T);
			if (self.ModelAccess(T,self.ReqContext(req),req.session.permissions)){
				return next();	
			} else {
				return next("Не хватает прав для объектов: "+T);
			}			
		}
	}

	self.ModelAccess = function(ModelName, Context, P){
		P = P || self.P;
		var R = false;
		if (P.Catalogue[ModelName]){
			P.Catalogue[ModelName].forEach(function(Action){
				R = R || self.CheckPrivelege (Action, Context, P);
			})
		}
		return R;
	}

	self.DocAccess = function(T){
		return function(req, res, next){
			if (self.CheckDocAccess(T,self.ReqContext(req),req.session.permissions)){
				return next();	
			} else {
				return next("Не хватает прав для совершения действия: "+T);
			}			
		}
	}

	self.CheckDocAccess = function( Action, Context, P){
		P = P || self.P;
		var Search = {}; Search[Action] = true;
		Context = Context || {}
		if (Context.CodeRole) Search.CodeRole = Context.CodeRole;
		if (Context.CodeDoc) {
			var CR = self.Find(P.Tr.DocRoles,Context.CodeDoc);
			if (!CR) return false;
			Search.CodeRole = _.first(CR);
		}
		var BeforeObj = _.filter(P.Pass,Search);
		if (!BeforeObj.length) return false;
		var RealContext = {
			CodePeriodGrp:Context.PeriodGrp || self.Find(P.Tr.PeriodGrps,Context.CodePeriod),
			CodeObj:Context.CodeObj,
			CodeObjGrp:self.Find(P.Tr.ObjGrps,Context.CodeObj),
		};
		var Last = _.filter(BeforeObj,function(R){
			return RealContext.CodePeriodGrp.indexOf(R.CodePeriodGrp)!=-1 && (
					RealContext.CodeObj == R.CodeObj 
				||  RealContext.CodeObjGrp.indexOf(R.CodeGrp)!=-1
			)
		});
		return Last.length!=0;
	}

	self.CheckUserPrivelege = function(CodePrivelege,CodeUser,P){
		P = P || self.P;
		var Test = _.filter(P.Task,{CodePrivelege:CodePrivelege});
		if (!Test.length) return false;
		var UsObjs = P.Tr.UsrObjs, ObjGrps = P.Tr.ObjGrps;
		var CodeObjs = [], CodeCrps = [];
		for (var CodeObj in UsObjs){
			if (UsObjs[CodeObj].indexOf(CodeUser)!=-1) CodeObjs.push(CodeObj);
		}
		for (var CodeObjGrp in ObjGrps){
			if (_.intersection(ObjGrps[CodeObjGrp],CodeObjs).length) CodeCrps.push(CodeObjGrp);	
		}
		var Result = false;
		Test.forEach(function(T){
			if (!T.CodeObj && !T.CodeObjGrp) Result = true;
			if (T.CodeObj && CodeObjs.indexOf(T.CodeObj)!=-1) Result = true;
			if (T.CodeObjGrp && CodeCrps.indexOf(T.CodeObjGrp)!=-1) Result = true;
		})
		return Result;
	}


	self.CheckPrivelegeAny = function(Actions, Context, P){
		if (!_.isArray(Actions)) Actions = [Actions];
		for (var i = 0; i<Actions.length; i++){
			if (self.CheckPrivelege(Actions[i],Context, P)) return true;
		}
		return false;
	}

	self.CheckPrivelege = function(Action, Context, P){
		P = P || self.P;
		if (!P) return null;
		Context = Context||{};
		var Test = _.filter(P.Task,{CodePrivelege:Action});
		if (!Test.length) return false;
  	    var Search = {
		    CodeRole: Context.CodeRole || self.Find(P.Tr.DocRoles,Context.CodeDoc),
    		CodeDoc: Context.CodeDoc || [],
    		CodeObj: Context.CodeObj || [],
    		CodeObjGrp: Context.CodeObjGrp || self.Find(P.Tr.ObjGrps,Context.CodeObj)
  	    };
  	    for (var K in Search) if (!_.isArray(Search[K])) Search[K] = [Search[K]];
  	    var Last = _.filter(Test,function(T){
  	    	var R = true;
  	    	T = _.merge({CodeObj:'',CodeObjGrp:'',CodeDoc:'',CodeRole:''},T);
  	    	if (((T.CodeObj+'').length || T.CodeObjGrp.length) && (Search.CodeObj.length || Search.CodeObjGrp.length)){
  	    		if (T.CodeObjGrp.length && Search.CodeObjGrp.indexOf(T.CodeObjGrp)==-1) R = false;
  	    		if (T.CodeObj.length && Search.CodeObj.indexOf(T.CodeObj)==-1) R = false;
  	    	}
  	    	if ((T.CodeDoc.length || T.CodeRole.length) && (Search.CodeDoc.length || Search.CodeRole.length)){
  	    		if (T.CodeRole.length && Search.CodeRole.indexOf(T.CodeRole)==-1) R = false;
  	    		if (T.CodeDoc.length && Search.CodeDoc.indexOf(T.CodeDoc)==-1) R = false;
  	    	}
  	    	return R;
  	    })
  	    return Last.length!=0;
	}

	self.AvDoc = function(P){
		P = P || self.P;
		if (!P) return [];
		var roles = self.AvRole(P), Result = [];
		roles.forEach(function(R){
			Result = Result.concat(P.Tr.DocRoles[R]);
		})
		return _.uniq(Result);
	}

	self.AvRole = function(P){
		P = P || self.P;
		if (!P) return [];
		return _.compact(_.uniq(_.map(P.Pass,"CodeRole")));
	}

	self.AvObj = function(P){
		P = P || self.P;
		if (!P) return [];
		var Objs = _.compact(_.uniq(_.map(P.Pass,"CodeObj")));
		var Grs = self.AvObjGrp(P);
		Grs.forEach(function(G){
			Objs = Objs.concat(P.Tr.ObjGrps[G]);
		})
		return _.uniq(Objs);
	}

	self.AvObjGrp = function(P){
		P = P || self.P;
		if (!P) return [];
		return _.compact(_.uniq(_.map(P.Pass,"CodeGrp")));
	}


	self.AvPrivelegeObj = function(CodePrivelege,P){
		P = P || self.P;
		if (!P) return [];
		var Prvs = _.filter(P.Task,{CodePrivelege:CodePrivelege});
		if (!Prvs.length) return [];
		var Result = [];
		Prvs.forEach(function(Pr){
			if (Pr.CodeObjGrp){
				Result = _.concat(Result,P.Tr.ObjGrps[Pr.CodeObjGrp]);
			} else {
				Result = _.concat(Result,_.keys(P.Tr.UsrObjs));
			}
		})
		return _.uniq(Result);
	}
	


	self.AvPermitObj = function(P,CodePrivelege){
		P = P || self.P;
		if (!P) return [];
		var Objs = _.compact(_.uniq(_.map(P.Pass,"CodeObj")));
		var Grs = self.AvPermitObjGrp(P, CodePrivelege);
		Grs.forEach(function(G){
			Objs = Objs.concat(P.Tr.ObjGrps[G]);
		})
		return _.uniq(Objs);
	}

	self.AvPermitObjGrp = function(P,CodePrivelege){
		P = P || self.P;
		if (!P) return [];
		return _.compact(_.uniq(_.map(P.Pass,"CodeGrp")));
	}

	
	self.AvPeriod = function(P){
		P = P || self.P;
		if (!P) return [];
		var PGs = self.AvPeriodGrp(P), Result = [];
		PGs.forEach(function(G){
			Result = Result.concat(P.Tr.PeriodGrps[G]);
		})
		return _.uniq(Result);
	}

	self.AvPeriodGrp = function(P){
		P = P || self.P;
		if (!P) return [];
		return _.compact(_.uniq(_.map(P.Pass,"CodePeriodGrp")));
	}

})

if (!IsClientSide) {
	module.exports = PermChecker;
} 