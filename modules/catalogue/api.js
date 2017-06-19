var mongoose = require('mongoose');
var router   = require('express').Router();
var async    = require('async');
var _        = require('lodash');
var api      = require(__base+'/lib/helper.js');
var socket   = require(__base+'/src/socket.js');

var LIB = require(__base+'lib/helpers/lib.js');
var HP = LIB.Permits; 


var ModelsLoadHelper = (new function(){
	var self = this;

	self.NameOverrides = {
		"measure":"SNameMeasure",
        "format":"FormatValue",
        "valuta":"SignValuta",
        "org":"SNameOrg"
	}

	self.Queries = {

	}

	self.Query = function(modelname){
		return self.Queries[modelname] || {};
	}

	self.Sort = function(modelname){
		var S = self.Sorts[modelname];
		if (!S){
			S = {}; S[self.Codes[modelname]] = 1;
		}
		return S;
	}

	self.LoadModel = function(model,ids,done){
		var Model = mongoose.model(model), CFG = Model.cfg();
		var CodeField = CFG.Code;
		var NameField = (self.NameOverrides[model])? self.NameOverrides[model] : CFG.Name;
		var SQ = {}; SQ[CodeField] = {$in:ids};
		var Q = _.merge(self.Query(model),SQ);
		var Query = Model.find(Q,["-_id",CodeField,NameField].join(" ")).lean();
		if (Model.IsSql) Query.isactive();
		Query.exec(function(err,Rs){
			var Answ = {};
			Rs.forEach(function(R){
				Answ[R[CodeField]] = R[NameField];
			})
			return done(err,Answ);
		});
	}

	return self;
})


var QueryHelper = (new function(){
	var self = this;

	self.SetActive = function(req, model, query){

	}

	return self;
})



router.post('/translate',function(req,res,next){
	var ToLoad = req.body.ToLoad, Tasks = {}, Groupped = {};
	if (!ToLoad || !ToLoad.length) return res.json({});
	ToLoad.forEach(function(TL){
		var In = TL.split("_");
		var M  = In.shift(); MCode = In.join("_");
		if (!Groupped[M]) Groupped[M] = [];
		Groupped[M].push(MCode);
	})
	for (var model in Groupped){
		var ids = Groupped[model];
		Tasks[model] = (function(model,ids){
			return function(done){
				ModelsLoadHelper.LoadModel(model,ids,done);
			}
		}(model,ids))
	}
	async.parallel(Tasks,function(err,Result){
		if (err) return next(err);
		return res.json(Result);
	})
});



var SearchQuery = function(ModelName){
	var self = this;
	var M = mongoose.model(ModelName);
	var CFG = M.cfg();
	self.Name = CFG.Name;
	self.Code = CFG.Code;

	var escapeRegExp = function (str) {
  		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	}

	self.Fields = [self.Code,self.Name];
	self.Sort   =  {}; self.Sort[self.Code] = 1;

	self.Skip = 0;
	self.Limit = 50;
	self.Query = {};
	self.Filter = {};
	self.Search = {};

	self.AddFields = function(Arr){
		if (!_.isEmpty(Arr)) self.Fields = _.compact(_.uniq(self.Fields.concat(Arr)));
	}
	self.SetSort = function(Obj){
		if (!_.isEmpty(Obj)) self.Sort = Obj;		
		for (var K in Obj){
			if (typeof (Obj[K]) =='string'){
				self.Sort [K] = Number(Obj[K]);
			}
		}
	}
	self.SetSkip = function(Value){
		try{
			var V = Number(Value);
			if (V) self.Skip = V;
		} catch(e){;}
	}	
	self.SetLimit = function(Value){
		try{
			var V = Number(Value);
			if (V) self.Limit = V;
		} catch(e){;}
	}
	self.SetFilter = function(Str){
		try{
			var filter = JSON.parse(Str);
			if (_.isObject(filter)) self.Filter = filter;
		}catch(e){
			;
		}
	}
	self.SetWord = function(Word){
		if (!_.isEmpty(Word) && _.isString(Word)){
			Word = Word.trim();
			var SearchW = escapeRegExp(Word);
			var Reg = {$regex :  new RegExp(SearchW, "i")},
			QRCode = {}, QRName = {};
			QRCode[self.Code] = Reg; QRName[self.Name] = Reg;
			self.Search = {$or:[QRCode,QRName]};
		}		
	}

	self.Do = function(done){
		var Q = {}, Parts = [], Answer = {count:0, models:[]};
		if (!_.isEmpty(self.Filter)) Parts.push(self.Filter);
		if (!_.isEmpty(self.Search)) Parts.push(self.Search);
		if (Parts.length==2)  Q = {$and:Parts};  else if(Parts.length==1) Q = _.first(Parts);
		var CountQuery = M.count(Q);
		if (M.IsSql) CountQuery.isactive();
		CountQuery.exec(function(err,Count){
			Answer.count = Count;
			var SearchQuery = M.find(Q,self.Fields.join(" ")).sort(self.Sort).skip(self.Skip).limit(self.Limit);
			if (M.IsSql) SearchQuery.isactive();
			SearchQuery.lean().exec(function(err,Models){
				Answer.models = Models;
				return done(err,Answer);
			})
		})
	}

	self.ToIdAndName = function(Result){
		return _.map(Result,function(R){
			return {id:R[self.Code],name:R[self.Name]};
		})
	}

	return self;
}


router.get('/searchmodel', function(req,res,next){
	var SQ = new SearchQuery(req.query.model);
	SQ.AddFields(req.query.fields);
	SQ.SetSort(req.query.sort);
	SQ.SetSkip(req.query.skip);
	SQ.SetLimit(req.query.limit);
	SQ.SetFilter(req.query.filter);
	SQ.SetWord (req.query.q);
	SQ.Do (function(err,Result){
		if (err) return next(err);
		return res.json(Result);
	});
})



router.get('/search',function(req,res){
	var SQ = new SearchQuery(req.query.model);
	if (_.isObject(req.query.q)){
		SQ.SetWord (req.query.q.word);
		SQ.SetFilter(req.query.q.filter);
	} else {
		SQ.SetWord (req.query.q);
	}
	var FieldsAsk = false;
	if (!_.isEmpty(req.query.fields)){
		FieldsAsk = true;
		SQ.AddFields(req.query.fields);
	}
	SQ.Do(function(err,Result){
		var Res = Result.models;
		if (!FieldsAsk) Res = SQ.ToIdAndName(Res)
		return res.json(Res);
	})
})


router.get('/validate', LIB.Require(['model','code']), function(req,res){
	var model = req.query.model, CodeValue = (req.query.code+'').trim(), _id = req.query._id;
	var M = mongoose.model(model), CFG = M.cfg(), CodeField = CFG.Code, Q = {}; 
	if (_.isEmpty(CodeValue) || _.isEmpty(CodeField)) return next("novalidationavailable");
	if (!_.isEmpty(_id)) Q._id = {$ne:_id};
	Q[CodeField] = CodeValue;
	M.count(Q).isactive().exec(function(err,C){
		console.log("Validation query ",Q,C);
		return res.json({validate:(C)?false:true});
	})
})




router.get('/model',function(req,res,next){
	var ModelName = req.query.model;
	var M = mongoose.model(ModelName);
	var CFG = M.cfg();
	if (!M) return next("Модель не найдена");
	var Q = {}; Q[CFG.Code] = req.query.code;
	var EditFields = M.cfg().EditFields;
	EditFields = _.filter(EditFields,function(E){
		return M.schema.paths[E].selected!==false;
	})
	var links = req.query.links, LinkFields = [];
	if (links){
		links.forEach(function(l){
			LinkFields.push("Link_"+l);
		})
	}
	var FindQuery = M.findOne(Q,EditFields.concat(LinkFields).join(" "));
	if (LinkFields.length){
		LinkFields.forEach(function(L){
			FindQuery.populate(L);
		})
	}
	if (M.IsSql) FindQuery.isactive();
	FindQuery.exec(function(err,C){
		if (!C) err = "Объект не найден";
		if (err) return next(err);
		return res.json(C);
	})
})

router.put('/model', HP.ModelAccessM(), function(req,res,next){
	var ModelSaver = require(__base + 'src/modeledit.js',req.body.isnew);
	var ModelName = req.body.model, M = mongoose.model(ModelName), CFG = M.cfg(), CodeField = CFG.Code, links = req.body.links;
	var Data = req.body.data;
	var M = new ModelSaver(req.user.CodeUser);
	var ModelData = _.pick(Data,_.filter(CFG.EditFields.concat("_id"),function(F){
		return F.indexOf("Link_")==-1;
	}));

	M.SaveModel(ModelName,ModelData,function(err){
		if (err) return next(err);
		async.each(links,function(link, cb){
			M.SaveLinks(link,Data["Link_"+link],cb);
		},function(err){
			if (err) return next(err);
			var Answ = CodeField
			return res.json({code:M.BaseModel[CodeField]});
		})
	})
})

router.delete('/model', HP.ModelAccessM(), function(req,res,next){
	var ModelName = req.body.model;
	var M = mongoose.model(ModelName);
	var CFG = M.cfg();
	if (!M) return next("Модель не найдена");
	var Q = {}; Q[CFG.Code] = req.body.code;	
	M.findOne(Q).isactive().exec(function(err,C){
		if (!C) err = "Объект не найден";
		if (err) return next(err);
		var CodeUser = req.user.CodeUser;
		C.remove(CodeUser,function(err){
			if (err) return next(err);
			if (M.IsSandBox) socket.emitTo(CodeUser,"sandboxchange",{});			
			return res.json({});
		})
	})
})




module.exports = router; 
