var mongoose   = require('mongoose');
var router     = require('express').Router();
var _          = require('lodash');
var async      = require('async');
var socket     = require(__base+'/src/socket.js');
var api        = require(__base+'/lib/helper.js');
var LIB        = require(__base+'lib/helpers/lib.js');
var HP = LIB.Permits;


router.put('/savechanges', HP.TaskAccess("IsColsetTuner"), function(req,res,next){
	var Data = req.body.data, Update = {}, CodeUser = req.user.CodeUser;
	var ModelHelper = require(__base+"src/modeledit.js"); 
	try{
		Update = JSON.parse(Data);
	} catch(e){
		return next ("failedtoparse");
	}
	var ColsetCols = _.keys(Update);
	if (_.isEmpty(ColsetCols)) return res.json({});

	mongoose.model("colsetcol").find({CodeColsetCol:{$in:ColsetCols}}).isactive().exec(function(err,Current){
		async.each(Current,function(C,cb){
			var Fields = _.pick(C,["_id","CodeColsetCol"]), Links = {};
			for (var Field in Update[C.CodeColsetCol]){
				if (Field.indexOf("Link_")!=0) {
					Fields[Field] = Update[C.CodeColsetCol][Field];	
				} else {
					Links[Field] = Update[C.CodeColsetCol][Field];
					Links[Field].forEach(function(L){
						L.CodeColsetCol = C.CodeColsetCol;
					})
				}				
			}
			var M = new ModelHelper(CodeUser);
			M.SaveModel("colsetcol",Fields,function(){
				async.each(_.keys(Links),function(LinkName,done){
					var ModelName = _.last(LinkName.split("Link_"));
					M.SaveLinks(ModelName,Links[LinkName],done);
				},cb);
			})
		},function(err){
			if (err) return next(err);
			return res.json({});
		})
	})

})


router.get('/cols', function(req,res,next){
	//var ContextFields = ['Year', 'CodePeriod','IsInput','CodeDoc','CodeObj','ChildObj'];
	var Context = _.merge(req.query,{IsDebug:true});
	Context.IsInput = api.parseBoolean(Context.IsInput);
	Context.UseCache = false;	
	Context.Year = parseInt(Context.Year);
	var ColHelper = require(__base+'classes/jetcalc/Helpers/Col.js');
	ColHelper.GetAll(Context,function(err, Cols){
		if (err) return next (err);
		return res.json(Cols);
	})
})







module.exports = router