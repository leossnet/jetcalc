var mongoose   = require('mongoose');
var router     = require('express').Router();
var _          = require('lodash');
var async      = require('async');
var LIB        = require(__base+'lib/helpers/lib.js');
var HP = LIB.Permits;  



var BizHelper = (new function(){
	var self = this;

	self.CFG = {
		"prod":{query:{},sort:{"NumProd":1},fields:["-_id","CodeProd","NumProd","NameProd","CodeParentProd"]},
		"org":{query:{},sort:{NameOrg:1},fields:["-_id","CodeOrg","NameOrg"]},		
		"dogovor":{query:{},sort:{"NameDogovor":1},fields:["-_id","CodeDogovor","NameDogovor"]},		
		"dogovorart":{query:{},sort:{"NameDogovorArt":1},fields:["-_id","CodeDogovorArt","NameDogovorArt"]},
		"bill":{query:{},sort:{"UseAltOrg":1,"CodeBill":1},fields:["-_id","CodeBill","NameBill"]}
	}

	self.Load = function(CodeDoc,done){
		mongoose.model('doc').findOne({CodeDoc:CodeDoc}).isactive().populate("Link_docbill").lean().exec(function(err,Doc){
			self.CFG.bill.query = {CodeBill:{$in:_.map(Doc.Link_docbill,"CodeBill")}};
			var R = {};
			async.each(["prod","org","dogovor","dogovorart","bill"],function(modelName,cb){
				mongoose.model(modelName).find(self.CFG[modelName].query,self.CFG[modelName].fields.join(" ")).isactive().sort(self.CFG[modelName].sort).lean().exec(function(err,Models){
					R[modelName] = Models;
					return cb(err);
				})
			},function(err){
				if (err) return next(err);
				var prods = R.prod, realProds = [], TreeParents = {}, TreeChildren = [], Indexed = {};			
				prods.forEach(function(Prod){
					Indexed[Prod.CodeProd] = Prod;
					TreeParents[Prod.CodeProd] = Prod.CodeParentProd;
					if (!TreeChildren[Prod.CodeParentProd]) TreeChildren[Prod.CodeParentProd] = [];
					TreeChildren[Prod.CodeParentProd].push(Prod.CodeProd);
				})
				var pR = 50;
				var _parents =  function(CodeProd){
					var Chain = [], Parent = TreeParents[CodeProd];
					while (!_.isEmpty(Parent)){
						if (--pR<=0) break;
						Chain.push(Parent);
						Parent = TreeParents[Parent];
					}
					return Chain;
				}
				prods.forEach(function(Prod){
					pR = 50; 
					if (_.isEmpty(TreeChildren[Prod.CodeProd])){
						realProds.push({
							prod:Prod,
							tree:_.map(_parents(Prod.CodeProd),function(P){
								return Indexed[P];
							})
						});
					}
				})
				R.prod = realProds;
				return done(err,R);
			})
		})
	}

	self.GetRoot = function(CodeDoc,CodeObj,CodeUser,done){
		var Row = mongoose.model("row"), DocRow = mongoose.model("docrow");
		DocRow.find({CodeDoc:CodeDoc}).isactive().lean().exec(function(err,LinkRows){
			if (_.isEmpty(LinkRows)) return done("Нет корневых узлов");
			Row.find({CodeRow:{$in:_.map(LinkRows,"CodeRow")}},"-_id CodeRow").isactive().lean().exec(function(err,Rows){
				var RealRoot = _.find(LinkRows,function(R){
					return _.isEmpty(R.CodeBiztranObj);
				});
				if (_.isEmpty(RealRoot)) return done("Нет корневого узла");
				var MyRoot = _.find(LinkRows,{CodeBiztranObj:CodeObj});
				if (!_.isEmpty(MyRoot)) return done(err,MyRoot.CodeRow);
				var CR = [RealRoot.CodeRow,CodeObj].join("_");
				MyRoot = new Row({CodeRow:CR,NameRow:CR,CodeParentRow:'',treeroot:CR,rowpath:["/",CR,"/"].join(""),level:0});
				MyRoot.save(CodeUser,function(err){
					var L = new DocRow({CodeRow:MyRoot.CodeRow,CodeDoc:CodeDoc,IsExpandTree:true,CodeBiztranObj:CodeObj});
					L.save(CodeUser,function(err){
						return done(err,MyRoot.CodeRow);
					})					
				});
			})
		})
	}

	self.GenerateTree = function(CodeDoc,CodeObj,CodeUser,done){
		var TreeHelper = require(__base+'/lib/helpers/tree.js');
		var Tree = new TreeHelper.Tree("ROOT",{});
		self.GetRoot(CodeDoc,CodeObj,CodeUser,function(err,Root){
			self.Load(CodeDoc,function(err,Sprs){
				var SprIndexed = {};
				for (var ModelName in Sprs){
					var Values = Sprs[ModelName], M = mongoose.model(ModelName), CFG = M.cfg(), Code = CFG.Code;
					SprIndexed[ModelName] = {};
					Values.forEach(function(V){
						if (ModelName == 'prod') {
							SprIndexed[ModelName][V.prod[Code]] = V.prod;	
						} else {
							SprIndexed[ModelName][V[Code]] = V;	
						}					
					})
				}
				mongoose.model("biztranrow").find({CodeDoc:CodeDoc,CodeObj:CodeObj}).isactive().lean().sort({Index:1}).exec(function(err,BRows){
					mongoose.model("docbill").find({CodeDoc:CodeDoc},"-_id CodeBill").isactive().lean().sort({IndexDocBill:1}).lean().exec(function(err,Bills){
						Tree.add(Root,{
							CodeRow:Root,
							treeroot:Root,
							CodeParentRow:"",
							NameRow:[CodeDoc,CodeObj].join("_"),
						},"ROOT");
						var UsedBills = _.map(BRows,"CodeBill"), AlreadyAdded = [], AllBills = _.map(Bills,"CodeBill");
						AllBills.forEach(function(CodeBill){
							if (UsedBills.indexOf(CodeBill)!=-1){
								if (AlreadyAdded.indexOf(CodeBill)==-1){
									AlreadyAdded.push(CodeBill);									
									Tree.add(CodeBill,{
										NumRow:CodeBill,
										CodeRow:Root+"_"+CodeBill,
										treeroot:Root,
										NameRow:SprIndexed.bill[CodeBill].NameBill,
										CodeBill:CodeBill
									},Root);
								}
							}
						})
						UsedBills.forEach(function(CodeBill){
							var _bRows = _.filter(BRows,{CodeBill:CodeBill});
							_bRows.forEach(function(BizRow){
								var Prod = _.find(Sprs.prod,function(PInfo){
									return PInfo.prod.CodeProd == BizRow.CodeProd;
								})
								_.reverse(Prod.tree).concat(Prod.prod).forEach(function(Pr){
									var Cod = [BizRow.CodeBill,Pr.CodeProd].join("_");
									var PCode = _.isEmpty(Pr.CodeParentProd) ? CodeBill : [BizRow.CodeBill,Pr.CodeParentProd].join("_")
									if (AlreadyAdded.indexOf(Cod)==-1){
										AlreadyAdded.push(Cod);									
										Tree.add(Cod,{
											NumRow:Pr.CodeProd,
											CodeRow:Root+"_"+Cod,
											treeroot:Root,
											NameRow:Pr.NameProd,
											CodeBill:BizRow.CodeBill,
											CodeProd:Pr.CodeProd
										},PCode);
									}
								})
								var _pRows = _.filter(_bRows,{CodeProd:Prod.prod.CodeProd});
								_pRows.forEach(function(OrgRow){
									var Cod = [OrgRow.CodeBill,OrgRow.CodeProd,OrgRow.CodeOrg].join("_");
									if (AlreadyAdded.indexOf(Cod)==-1){
										var PCod = [OrgRow.CodeBill,OrgRow.CodeProd].join("_");	
										AlreadyAdded.push(Cod);
										Tree.add(Cod,{
											NumRow:OrgRow.CodeOrg,
											CodeRow:Root+"_"+Cod,
											treeroot:Root,
											CodeProd:OrgRow.CodeProd,
											CodeBill:OrgRow.CodeBill,
											CodeAltOrg:OrgRow.CodeOrg,
											NameRow:SprIndexed.org[OrgRow.CodeOrg].NameOrg
										},PCod);
									}
								})
							})
						})
						var FlatTree = Tree.getFlat();
						FlatTree = self.SetParams(FlatTree);
						return done(err,FlatTree);
					})
				})
			})
		})
	}

	self.SetParams = function(Tree){
		Tree.forEach(function(Branch){
			Branch.rowpath = ['/',_.map(_.sortBy(_.filter(Tree,function(B){
				return Branch.lft>=B.lft && Branch.rgt<=B.rgt;
			}),"lft"),"CodeRow").join("/"),'/'].join("");
		})
		return Tree;
	}

	self.SyncTree = function(CodeDoc,CodeObj,CodeUser,done){
		var Struct = require(__base+"modules/roweditor/lib.js");
		var Helper = require(__base+"modules/roweditor/helper.js");
		self.GenerateTree(CodeDoc,CodeObj,CodeUser,function(err,Rows){
			Helper.LoadRoot(_.first(Rows).CodeRow,function(err,Current){
				Struct.UpdateRoot(Current,Rows,CodeUser,function(err){
					console.log("UpdateRoot",err);
					return done();
				});				
			})
		})
	}

	return self;
})





router.get('/biztraninfo',  HP.TaskAccess("IsBiztranTuner"), function(req,res,next){
	BizHelper.Load(req.query.CodeDoc,function(err,Result){
		Result.prod = _.map(Result.prod,function(P){
			return P.prod;
		})
		return res.json(Result);
	})	
})

router.get('/rows',  HP.TaskAccess("IsBiztranTuner"), function(req,res,next){
	var CodeDoc = req.query.CodeDoc, CodeObj = req.query.CodeObj; 
	mongoose.model("biztranrow").find({CodeDoc:CodeDoc,CodeObj:CodeObj}).isactive().sort({Index:1}).lean().exec(function(err,List){
		return res.json(List);
	})	
})


router.post('/modifyrows',  HP.TaskAccess("IsBiztranTuner"), function(req,res,next){
	var CodeDoc = req.body.Context.CodeDoc, CodeObj = req.body.Context.CodeObj, Rows = req.body.Rows, CodeUser = _.clone(req.user.CodeUser); 
	Rows.forEach(function(Row){
		Row.CodeDoc = CodeDoc;
		Row.CodeObj = CodeObj;
	})
	Rows = _.filter(Rows,function(R){
		return !_.isEmpty(R.CodeBill);
	})
	var Editor = require(__base+"src/modeledit.js");
	var Saver = new Editor(CodeUser);
	Saver.SyncLinks("biztranrow", {CodeDoc:CodeDoc,CodeObj:CodeObj}, Rows, function(err){
		BizHelper.SyncTree(CodeDoc,CodeObj,CodeUser,function(err){
			return res.end();
		})
	})
})



module.exports = router