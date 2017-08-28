var mongoose   = require('mongoose');
var _          = require('lodash');
var async      = require('async');




module.exports = (new function(){
	var self = this;

	self.CFG = {
		"prod":{query:{},sort:{"NumProd":1},fields:["-_id","CodeProd","NumProd","NameProd","CodeParentProd","CodeMeasure","IsCalcSum"]},
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

	self.GetRoot = function(CodeDoc,done){
		var Row = mongoose.model("row"), DocRow = mongoose.model("docrow");
		DocRow.findOne({CodeDoc:CodeDoc}).isactive().lean().exec(function(err,LinkRow){
			if (_.isEmpty(LinkRow)) return done("Нет корневых узлов");
			return done(err,LinkRow.CodeRow);
		})
	}

	self.GenerateTree = function(CodeDoc,CodeUser,done){
		var TreeHelper = require(__base+'/lib/helpers/tree.js');
		var Tree = new TreeHelper.Tree("ROOT",{});
		self.GetRoot(CodeDoc,function(err,Root){
			self.Load(CodeDoc,function(err,Sprs){
				var SprIndexed = {}, AllProds = {};
				for (var ModelName in Sprs){
					var Values = Sprs[ModelName], M = mongoose.model(ModelName), CFG = M.cfg(), Code = CFG.Code;
					SprIndexed[ModelName] = {};
					Values.forEach(function(V){
						if (ModelName == 'prod') {
							SprIndexed[ModelName][V.prod[Code]] = V.prod;	
							AllProds[V.prod[Code]] = V.prod;
							V.tree.forEach(function(T){
								AllProds[T[Code]] = T;
							})

						} else {
							SprIndexed[ModelName][V[Code]] = V;	
						}					
					})
				}
				mongoose.model("biztranrow").find({CodeDoc:CodeDoc}).isactive().lean().sort({Index:1}).exec(function(err,BRows){
					mongoose.model("docbill").find({CodeDoc:CodeDoc},"-_id CodeBill").isactive().lean().sort({IndexDocBill:1}).lean().exec(function(err,Bills){
						Tree.add(Root,{
							CodeRow:Root,
							treeroot:Root,
							CodeParentRow:"",
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
											CodeProd:Pr.CodeProd,
											CodeMeasure:AllProds[Pr.CodeProd].CodeMeasure,
											IsSum:AllProds[Pr.CodeProd].IsCalcSum
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
											NameRow:SprIndexed.org[OrgRow.CodeOrg].NameOrg,
											CodeMeasure:SprIndexed.prod[OrgRow.CodeProd].CodeMeasure
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

	self.SyncTree = function(CodeDoc,CodeUser,done){
		var Struct = require(__base+"modules/roweditor/lib.js");
		var Helper = require(__base+"modules/roweditor/helper.js");
		self.GenerateTree(CodeDoc,CodeUser,function(err,Rows){
			Helper.LoadRoot(_.first(Rows).CodeRow,function(err,Current){
				Struct.UpdateRoot(Current,Rows,CodeUser,function(err){
					return done();
				});				
			})
		})
	}

	return self;
})
