var mongoose = require('mongoose');
var router = require('express').Router();
var _ = require('lodash');
var async = require('async');
var socket = require(__base + '/src/socket.js');
var api = require(__base + '/lib/helper.js');
var LIB = require(__base + 'lib/helpers/lib.js');
var HP = LIB.Permits;




router.get('/cols', function(req, res, next) {
    var Context = LIB.ReqContext(req);
    var ColHelper = require(__base + 'classes/jetcalc/Helpers/Col.js');
    ColHelper.GetAll(Context, function(err, Cols) {
        if (err) return next(err);
        return res.json(Cols);
    })
})


router.put('/savechanges', HP.TaskAccess("IsColsetTuner"), function(req, res, next) {
    var Changes = JSON.parse(req.body.Changes);
    var Context = LIB.ReqContext(req);
    var CodeUser = req.user.CodeUser;
    var _save = function(modelName,rChanges){
        return function(done){
    		var ModelHelper = require(__base+"src/modeledit.js");
            var M = mongoose.model(modelName), CFG = M.cfg(), Code = CFG.Code;
            if (_.isEmpty(rChanges)) return done();
            async.each(_.keys(rChanges),function(CodeObj,next){
                var SetChange = rChanges[CodeObj], Q = {}; Q[Code] = CodeObj;
                var Links = {}, fieldsToUpdate = {};
                fieldsToUpdate[Code] = CodeObj;
                for (var Field in SetChange){
                	if (Field.indexOf("Link_")==0){
                		Links[Field] = SetChange[Field];
                	} else {
                		fieldsToUpdate[Field] = SetChange[Field];
                	}
                }
				var M = new ModelHelper(CodeUser);
            	M.SaveModel(modelName,fieldsToUpdate,function(err){
                	async.each(_.keys(Links),function(LinkName,cb){
                    	var LinkModelName = _.last(LinkName.split("Link_"));
                    	console.log("++++ SaveLinks",LinkModelName,Links[LinkName]," ---- Save Links");
                        M.SaveLinks(LinkModelName,Links[LinkName],cb);
                	},next);
            	}) 
            },done);
        }
    }
    async.parallel([
        _save("col",Changes.col),
        _save("colsetcol",Changes.colsetcol)
    ],function(err){
        if (err) return next(err);
        var ColHelper = require(__base + 'classes/jetcalc/Helpers/Header.js');
        ColHelper.ClearCache(function(){
            return res.json({});   
        })
    })
})

router.put('/savechangesold', HP.TaskAccess("IsColsetTuner"), function(req, res, next) {
    var Changes = req.body;
    var Context = LIB.ReqContext(req);
    var Data = req.body.data,
        Update = {},
        CodeUser = req.user.CodeUser;
    var ModelHelper = require(__base + "src/modeledit.js");
    try {
        Update = JSON.parse(Data);
    } catch (e) {
        return next("failedtoparse");
    }
    var ColsetCols = _.keys(Update);
    if (_.isEmpty(ColsetCols)) return res.json({});

    mongoose.model("colsetcol").find({
        CodeColsetCol: {
            $in: ColsetCols
        }
    }).isactive().exec(function(err, Current) {
        async.each(Current, function(C, cb) {
            var Fields = _.pick(C, ["_id", "CodeColsetCol"]),
                Links = {};
            for (var Field in Update[C.CodeColsetCol]) {
                if (Field.indexOf("Link_") != 0) {
                    Fields[Field] = Update[C.CodeColsetCol][Field];
                } else {
                    Links[Field] = Update[C.CodeColsetCol][Field];
                    Links[Field].forEach(function(L) {
                        L.CodeColsetCol = C.CodeColsetCol;
                    })
                }
            }
            var M = new ModelHelper(CodeUser);
            M.SaveModel("colsetcol", Fields, function() {
                async.each(_.keys(Links), function(LinkName, done) {
                    var ModelName = _.last(LinkName.split("Link_"));
                    M.SaveLinks(ModelName, Links[LinkName], done);
                }, cb);
            })
        }, function(err) {
            if (err) return next(err);
            return res.json({});
        })
    })

})

module.exports = router
