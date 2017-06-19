var mongoose   = require('mongoose');
var router     = require('express').Router();
var _          = require('lodash');
var async      = require('async');
var socket     = require(__base+'/src/socket.js');
var api        = require(__base+'/lib/helper.js');
var HP = require(__base+'lib/helpers/lib.js').Permits;  





router.put('/structure',  HP.TaskAccess("IsRowTuner"), function(req,res,next){
	var Cx = req.body.Context, AllRows = req.body.Rows || [], CodeUser = req.user.CodeUser, Row = mongoose.model("row");
	var Rows = _.filter(AllRows,function(R){
		return R.DoRemove !='true';
	});
	mongoose.model("docrow").find({CodeDoc:Cx.CodeDoc,IsExpandTree:true},"-_id CodeRow").isactive().lean().exec(function(err,roots){
		var Root = _.first(_.map(roots,"CodeRow"));
		if (_.isEmpty(Root)) return next("norootrow");
		Row.findOne({CodeRow:Root}).isactive().exec(function(err,RootNode){
			Row.find({treeroot:RootNode.CodeRow}).isactive().exec(function(err,Tree){
				var ExistedIndexed = {}; Tree.forEach(function(Branch){ ExistedIndexed[Branch.CodeRow] = Branch;});
				var ClientIndexed = {}; Rows.forEach(function(Branch){ ClientIndexed[Branch.CodeRow] = Branch;});
				var ToRemoveCodes = _.difference(_.map(Tree,"CodeRow"),_.map(Rows,"CodeRow").concat([Root])), 
					ToRemove = _.map(ToRemoveCodes,function(C){ // Удаляем ненужные
						return ExistedIndexed[C];
					});
				var ToAddCodes = _.difference(_.map(Rows,"CodeRow").concat([Root]),_.map(Tree,"CodeRow"));
				ToAddCodes.forEach(function(NCode){
					ExistedIndexed[NCode] = new Row(_.merge(ClientIndexed[NCode],{treeroot:RootNode.CodeRow}));
				})
				var Index = 0; 
				var ToUpdate = [], ByParents = {1:RootNode.CodeRow};
				for (var CodeRow in ClientIndexed){
					var R = ExistedIndexed[CodeRow], C = ClientIndexed[CodeRow];
					["NumRow","NameRow"].forEach(function(F){
						R[F] = C[F];
					})
					R.level = Number(C.level);
					R.IndexRow = (Index++); R.treeroot = RootNode.CodeRow;
					R.CodeParentRow = ByParents[R.level];
					ByParents[(R.level+1)] = R.CodeRow; // Обновляем парентов и порядок
					ToUpdate.push(R); 
				}
				async.each(ToRemove,function(R,cb){
					R.remove(CodeUser,cb);
				},function(err){
					async.each(ToUpdate,function(U,cb){ // Обновляем существующие
						U.save(CodeUser,cb)
					},function(err){
						console.log("err",err);
						RootNode.IndexNewTree(CodeUser,function(err){// Индексируем дерево
							return res.json({});
						})						
					})
				})
			})
		})
	})
})


router.get('/rows',  HP.TaskAccess("IsRowTuner"), function(req,res,next){
	var Context = RowEditorHelper.getContext(req);
	RowEditorHelper.get(Context,req.session.sandbox,function(err, Rows){
		if (err) return next (err);
		return res.json(Rows);
	});
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

































var RowEditorHelper = (new function(){
	var self = this;
    
    self.EditableLinks = ['Link_rowcoloption','Link_rowsumgrp','Link_rowobj','Link_docrow','Link_rowchartline','Link_rowtag'];

	self.get = function(Context,SandBox,done){
		var Row = require(__base+'/classes/calculator/helpers/Row.js');
		if (SandBox.On) Context.SandBox = SandBox.CodeUser;
		var RowHelper = new Row(Context);
		RowHelper.get(done);
	}
    
    self.getContext = function(req){
       var ContextFields = ['CodeObj','Year','ChildObj','IsInput','CodeDoc','UseCache'];
	   var Context = {};
	   ContextFields.forEach(function(F){
		  Context[F] = req.query[F];
	   })
	   Context.IsInput = api.parseBoolean(Context.IsInput);
	   Context.Year = parseInt(Context.Year);
	   Context.IsDebug = true;
        return Context;
    }
    
	return self;
})

//



module.exports = router