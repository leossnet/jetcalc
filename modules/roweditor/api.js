var mongoose   = require('mongoose');
var router     = require('express').Router();
var _          = require('lodash');
var async      = require('async');
var LIB        = require(__base+'lib/helpers/lib.js');
var HP = LIB.Permits;  
var Helper  = require('./helper.js');
var StructureHelper = require('./lib.js');



router.get('/rows',  HP.TaskAccess("IsRowTuner"), function(req,res,next){
	var Context = LIB.ReqContext(req);
	Helper.LoadRoots(Context.CodeDoc,function(err,Rows){
		var Answ = [];
		for (var K in Rows){
			Answ = Answ.concat(Rows[K]);
		}
		return res.json(Answ);
	})
})

router.put('/structure',  HP.TaskAccess("IsRowTuner"), function(req,res,next){
	var Context = req.body.Context, CodeUser = req.user.CodeUser, Row = mongoose.model("row");
	var Rows = StructureHelper.ReparseRequest(req.body.Rows);
	StructureHelper.EnsureRootsExisits(_.keys(Rows),Context.CodeDoc,CodeUser,function(err){
		if (err) return next(err);
		Helper.LoadRoots(Context.CodeDoc,function(err,CurrentRows){
			if (err) return next(err);
			async.each(_.intersection(_.keys(CurrentRows),_.keys(Rows)),function(CodeRow,cb){
				StructureHelper.UpdateRoot(CurrentRows[CodeRow],Rows[CodeRow],CodeUser,cb);
			},function(err){
				if (err) return next(err);
				return res.json({});
			})
		})
	})
})

router.put('/rows', HP.TaskAccess("IsRowTuner"), function(req, res,next){
	var Update = JSON.parse(req.body.Modify), CodeUser = req.user.CodeUser;
	var ModelHelper = require(__base+"src/modeledit.js");
	if (_.isEmpty(Update)) return res.json({});
	mongoose.model("row").find({CodeRow:{$in:_.keys(Update)}}).isactive().exec(function(err,Current){
		async.each(Current,function(C,cb){
			var Fields = _.pick(C,["_id","CodeRow"]), Links = {};
			for (var Field in Update[C.CodeRow]){
				if (Field.indexOf("Link_")!=0) {
					Fields[Field] = Update[C.CodeRow][Field];	
				} else {
					Links[Field] = Update[C.CodeRow][Field];
					Links[Field].forEach(function(L){
						L.CodeRow = C.CodeRow;
					})
				}				
			}
			var M = new ModelHelper(CodeUser);
			M.SaveModel("row",Fields,function(){
				async.each(_.keys(Links),function(LinkName,done){
					var ModelName = _.last(LinkName.split("Link_"));
					M.SaveLinks(ModelName,Links[LinkName],done);
				},cb);
			})
		},function(err){
			return res.json({});
		})
	})
})



































module.exports = router