var mongoose = require('mongoose');
var _ = require('lodash');
var async = require('async');




module.exports = (new function() {
    var self = this;

    self.docBiztranParams = ["UseDogovorArt","UseDogovor","UseOrg","UseProd"];

    self.getSourceDoc = function(CodeDoc,done){
        mongoose.model("docrelation").find({CodeDocTarget:CodeDoc,DoSetTree:true}).lean().exec(function(err, docs){
            if (err) return done(err);
            if (_.isEmpty(docs)) return done("Не определен документ-источник с параметром DoSetTree");            
            if (docs.length>1) return done("Несколько документов источников: "+_.map(docs,"CodeDocSource").join(", "));
            var result = _.first(docs);
            mongoose.model("doc").findOne({CodeDoc:result.CodeDocSourse}).lean().exec(function(err,docSource){
                if (err) return done(err);
                var answer = {
                    CodeDoc:result.CodeDocSourse,
                    Lines:_.filter(self.docBiztranParams,function(field){
                        return docSource[field];
                    })
                }
                return done(null,answer);
            })
        })
    }  

    self.getTargetDoc = function(CodeDoc,done){
        mongoose.model("doc").findOne({CodeDoc:CodeDoc}).lean().exec(function(err,docTarget){
            if (err) return done(err);
            if (!docTarget) return done("Не найден документ "+docTarget);
            var answer = {
                CodeDoc:CodeDoc,
                Lines:_.filter(self.docBiztranParams,function(field){
                    return docTarget[field];
                })
            }
            return done(null,answer);
        })
    }

    self.loadBills = function(CodeDoc,done){
        mongoose.model("docbill").find({CodeDoc:CodeDoc},"CodeBill").lean().exec(function(err, billsRaw){
            var bills = _.map(billsRaw,"CodeBill");
            var mapBills = {};
            if (err) return done(err);
            if (_.isEmpty(bills)) return done("Не определены счета для документа");
            mongoose.model("billrelation").find({CodeBillTarget:{$in:bills}}).lean().exec(function(err, relations){
                relations.forEach(function(rel){
                    mapBills[rel.CodeBillTarget] = rel.CodeBillSource;
                })
                return done(err,mapBills);
            })            
        })
    }

    

    self.Sync = function(CodeDoc, done){

        self.getTargetDoc(CodeDoc,function(err,target){
            if (err) return done(err);
            console.log("TARGET",target,"<<<<");
            self.getSourceDoc(CodeDoc,function(err,source){
                if (err) return done(err);
                console.log("SOURCE",source,"<<<<");

                self.loadBills(CodeDoc,function(err, bills){
                    if (err) return done(err);                
                    console.log("BILLS",bills,"<<<");


                })
            })
        })



    }

/*
    self.CFG = {
        "prod": { query: {}, sort: { "NumProd": 1 }, fields: ["-_id", "CodeProd", "NumProd", "NameProd", "CodeParentProd", "CodeMeasure", "IsCalcSum"] },
        "org": { query: {}, sort: { NameOrg: 1 }, fields: ["-_id", "CodeOrg", "NameOrg"] },
        "dogovor": { query: {}, sort: { "NameDogovor": 1 }, fields: ["-_id", "CodeDogovor", "NameDogovor"] },
        "dogovorart": { query: {}, sort: { "NameDogovorArt": 1 }, fields: ["-_id", "CodeDogovorArt", "NameDogovorArt"] },
        "bill": { query: {}, sort: { "UseAltOrg": 1, "CodeBill": 1 }, fields: ["-_id", "CodeBill", "NameBill"] }
    }

    self.Load = function(CodeDoc, done) {
        mongoose.model('doc').findOne({ CodeDoc: CodeDoc }).isactive().populate("Link_docbill").lean().exec(function(err, Doc) {
            self.CFG.bill.query = { CodeBill: { $in: _.map(Doc.Link_docbill, "CodeBill") } };
            var R = {};
            async.each(["prod", "org", "dogovor", "dogovorart", "bill"], function(modelName, cb) {
                mongoose.model(modelName).find(self.CFG[modelName].query, self.CFG[modelName].fields.join(" ")).isactive().sort(self.CFG[modelName].sort).lean().exec(function(err, Models) {
                    R[modelName] = Models;
                    return cb(err);
                })
            }, function(err) {
                if (err) return next(err);
                var prods = R.prod,
                    realProds = [],
                    TreeParents = {},
                    TreeChildren = [],
                    Indexed = {};
                prods.forEach(function(Prod) {
                    Indexed[Prod.CodeProd] = Prod;
                    TreeParents[Prod.CodeProd] = Prod.CodeParentProd;
                    if (!TreeChildren[Prod.CodeParentProd]) TreeChildren[Prod.CodeParentProd] = [];
                    TreeChildren[Prod.CodeParentProd].push(Prod.CodeProd);
                })
                var pR = 50;
                var _parents = function(CodeProd) {
                    var Chain = [],
                        Parent = TreeParents[CodeProd];
                    while (!_.isEmpty(Parent)) {
                        if (--pR <= 0) break;
                        Chain.push(Parent);
                        Parent = TreeParents[Parent];
                    }
                    return Chain;
                }
                prods.forEach(function(Prod) {
                    pR = 50;
                    if (_.isEmpty(TreeChildren[Prod.CodeProd])) {
                        realProds.push({
                            prod: Prod,
                            tree: _.map(_parents(Prod.CodeProd), function(P) {
                                return Indexed[P];
                            })
                        });
                    }
                })
                R.prod = realProds;
                return done(err, R);
            })
        })
    }

    self.GetRoot = function(CodeDoc, done) {
        var Row = mongoose.model("row"),
            DocRow = mongoose.model("docrow");
        DocRow.findOne({ CodeDoc: CodeDoc }).isactive().lean().exec(function(err, LinkRow) {
            if (_.isEmpty(LinkRow)) return done("Нет корневых узлов");
            return done(err, LinkRow.CodeRow);
        })
    }

    self.GenerateTree = function(CodeDoc, CodeUser, done) {
        var TreeHelper = require(__base + '/lib/helpers/tree.js');
        var Tree = new TreeHelper.Tree("ROOT", {});
        self.GetRoot(CodeDoc, function(err, Root) {
            self.Load(CodeDoc, function(err, Sprs) {
                var SprIndexed = {},
                    AllProds = {};
                for (var ModelName in Sprs) {
                    var Values = Sprs[ModelName],
                        M = mongoose.model(ModelName),
                        CFG = M.cfg(),
                        Code = CFG.Code;
                    SprIndexed[ModelName] = {};
                    Values.forEach(function(V) {
                        if (ModelName == 'prod') {
                            SprIndexed[ModelName][V.prod[Code]] = V.prod;
                            AllProds[V.prod[Code]] = V.prod;
                            V.tree.forEach(function(T) {
                                AllProds[T[Code]] = T;
                            })

                        } else {
                            SprIndexed[ModelName][V[Code]] = V;
                        }
                    })
                }
                mongoose.model("doc").findOne({ CodeDoc: CodeDoc }, "UseDogovorArt UseDogovor UseOrg UseProd").isactive().lean().exec(function(err, BDocument) {
                    mongoose.model("biztranrow").find({ CodeDoc: CodeDoc }).isactive().lean().sort({ Index: 1 }).exec(function(err, BRows) {
                        mongoose.model("docbill").find({ CodeDoc: CodeDoc }, "-_id CodeBill").isactive().lean().sort({ IndexDocBill: 1 }).lean().exec(function(err, Bills) {
                            Tree.add(Root, {
                                CodeRow: Root,
                                treeroot: Root,
                                CodeParentRow: "",
                            }, "ROOT");
                            var UsedBills = _.map(BRows, "CodeBill"),
                                AlreadyAdded = [],
                                AllBills = _.map(Bills, "CodeBill");
                            AllBills.forEach(function(CodeBill) {
                                if (UsedBills.indexOf(CodeBill) != -1) {
                                    if (AlreadyAdded.indexOf(CodeBill) == -1) {
                                        AlreadyAdded.push(CodeBill);
                                        Tree.add(CodeBill, {
                                            NumRow: CodeBill,
                                            CodeRow: Root + "_" + CodeBill,
                                            treeroot: Root,
                                            NameRow: SprIndexed.bill[CodeBill].NameBill,
                                            CodeBill: CodeBill,
                                            HasFilteredChild: (BDocument.UseOrg) ? true : false
                                        }, Root);
                                    }
                                }
                            })
                            UsedBills.forEach(function(CodeBill) {
                                var _bRows = _.filter(BRows, { CodeBill: CodeBill });
                                _bRows.forEach(function(BizRow) {
                                    var Prod = _.find(Sprs.prod, function(PInfo) {
                                        return PInfo.prod.CodeProd == BizRow.CodeProd;
                                    })
                                    _.reverse(Prod.tree).concat(Prod.prod).forEach(function(Pr) {
                                        var Cod = [BizRow.CodeBill, Pr.CodeProd].join("_");
                                        var PCode = _.isEmpty(Pr.CodeParentProd) ? CodeBill : [BizRow.CodeBill, Pr.CodeParentProd].join("_")
                                        if (AlreadyAdded.indexOf(Cod) == -1) {
                                            AlreadyAdded.push(Cod);
                                            Tree.add(Cod, {
                                                NumRow: Pr.CodeProd,
                                                CodeRow: Root + "_" + Cod,
                                                treeroot: Root,
                                                NameRow: Pr.NameProd,
                                                CodeBill: BizRow.CodeBill,
                                                CodeProd: Pr.CodeProd,
                                                CodeMeasure: AllProds[Pr.CodeProd].CodeMeasure,
                                                HasFilteredChild: false,
                                                IsSum: AllProds[Pr.CodeProd].IsCalcSum
                                            }, PCode);
                                        }
                                    })

                                    if (BDocument.UseOrg) {
                                        var _pRows = _.filter(_bRows, { CodeProd: Prod.prod.CodeProd });
                                        _pRows.forEach(function(OrgRow) {
                                            var Cod = [OrgRow.CodeBill, OrgRow.CodeProd, OrgRow.CodeOrg].join("_");
                                            if (AlreadyAdded.indexOf(Cod) == -1) {
                                                var PCod = [OrgRow.CodeBill, OrgRow.CodeProd].join("_");
                                                AlreadyAdded.push(Cod);
                                                Tree.add(Cod, {
                                                    NumRow: OrgRow.CodeOrg,
                                                    CodeRow: Root + "_" + Cod,
                                                    treeroot: Root,
                                                    CodeProd: OrgRow.CodeProd,
                                                    CodeBill: OrgRow.CodeBill,
                                                    CodeAltOrg: OrgRow.CodeOrg,
                                                    NameRow: (_.isEmpty(OrgRow.CodeOrg)) ? OrgRow.CodeProd : SprIndexed.org[OrgRow.CodeOrg].NameOrg,
                                                    HasFilteredChild: false,
                                                    CodeMeasure: SprIndexed.prod[OrgRow.CodeProd].CodeMeasure
                                                }, PCod);
                                                if (BDocument.UseDogovor && !_.isEmpty(OrgRow.CodeDogovor)) {
                                                    var _dRows = _.filter(_bRows, { CodeProd: Prod.prod.CodeProd , CodeOrg:OrgRow.CodeOrg});
                                                    _dRows.forEach(function(dogRow){
                                                        var DCod = [OrgRow.CodeBill, OrgRow.CodeProd, OrgRow.CodeOrg, dogRow.CodeDogovor].join("_");
                                                        Tree.add(DCod, {
                                                            NumRow: dogRow.CodeDogovor,
                                                            CodeRow: Root + "_" +DCod,
                                                            treeroot: Cod,
                                                            CodeProd: OrgRow.CodeProd,
                                                            CodeBill: OrgRow.CodeBill,
                                                            CodeAltOrg: OrgRow.CodeOrg,
                                                            CodeDogovor: dogRow.CodeDogovor,
                                                            NameRow: (_.isEmpty(dogRow.CodeDogovor)) ? dogRow.CodeDogovor : SprIndexed.dogovor[dogRow.CodeDogovor].NameDogovor,
                                                            HasFilteredChild: false,
                                                            CodeMeasure: SprIndexed.prod[OrgRow.CodeProd].CodeMeasure
                                                        }, Cod);

                                                    })
                                                }
                                            }
                                        })

                                    }
                                })
                            })
                            var FlatTree = Tree.getFlat();
                            FlatTree = self.SetParams(FlatTree);
                            return done(err, FlatTree);
                        })
                    })
                })
            })
        })
    }

    self.SetFilters = function(CodeDoc, CodeUser, done) {
        var Helper = require(__base + "modules/roweditor/helper.js");
        var Link = mongoose.model("rowobj");
        Helper.LoadRoots(CodeDoc, function(err, RowsWithRoots) {
            var Rows = RowsWithRoots[_.first(_.keys(RowsWithRoots))];
            mongoose.model("biztranrow").find({ CodeDoc: CodeDoc }).isactive().lean().sort({ Index: 1 }).exec(function(err, BRows) {
                var AllowObjs = {};
                Rows.forEach(function(Row) {
                    if (Row.CodeBill && Row.CodeProd && Row.CodeAltOrg) {
                        AllowObjs[Row.CodeRow] = _.uniq(_.map(_.filter(_.clone(BRows), { CodeBill: Row.CodeBill, CodeProd: Row.CodeProd, CodeOrg: Row.CodeAltOrg }), "CodeObj"));
                    }
                })
                async.each(_.keys(AllowObjs), function(CodeRow, cb) {
                    Link.find({ CodeRow: CodeRow }).isactive().lean().exec(function(err, Existed) {
                        var Links = _.map(_.uniq(AllowObjs[CodeRow]), function(CodeObj) {
                            var R = { CodeRow: CodeRow, CodeObj: CodeObj };
                            var F = _.find(Existed, R);
                            if (F) R._id = F._id;
                            return R;
                        });
                        var SaverH = require(__base + "src/modeledit.js");
                        var Saver = new SaverH(CodeUser);
                        Saver.SyncLinks("rowobj", { CodeRow: CodeRow }, Links, cb);
                    })
                }, function(err) {
                    if (err) console.log("SET FILTER ERR", err);
                    return done(err);
                });
            })
        })
    }

    self.SetParams = function(Tree) {
        Tree.forEach(function(Branch) {
            Branch.rowpath = ['/', _.map(_.sortBy(_.filter(Tree, function(B) {
                return Branch.lft >= B.lft && Branch.rgt <= B.rgt;
            }), "lft"), "CodeRow").join("/"), '/'].join("");
        })
        return Tree;
    }

    self.SyncTree = function(CodeDoc, CodeUser, done) {
        var Struct = require(__base + "modules/roweditor/lib.js");
        var Helper = require(__base + "modules/roweditor/helper.js");
        self.GenerateTree(CodeDoc, CodeUser, function(err, Rows) {
            Helper.LoadRoot(_.first(Rows).CodeRow, function(err, Current) {
                Struct.UpdateRoot(Current, Rows, ["NumRow", "CodeRow", "CodeProd", "CodeBill", "CodeAltOrg", "NameRow", "CodeMeasure", "treeroot", "HasFilteredChild"], CodeUser, function(err) {
                    self.SetFilters(CodeDoc, CodeUser, function() {
                        return done();
                    })
                });
            })
        })
    }


    /*	setTimeout(function(){
    		self.SyncTree("sale","admin",function(err){
    			console.log("Sync is done");
    		})
    	},2000)
    */
    return self;
})