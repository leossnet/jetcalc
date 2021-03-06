var mongoose   = require('mongoose');
var router     = require('express').Router();
var _          = require('lodash');
var async      = require('async');
var LIB        = require(__base+'lib/helpers/lib.js');
var HP = LIB.Permits;  
var Helper  = require('./helper.js');
var StructureHelper = require('./lib.js');



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

    self.GenerateTree = function(){

    }




    return self;
})





router.get('/biztraninfo',  HP.TaskAccess("IsRowTuner"), function(req,res,next){
    BizHelper.Load(req.query.CodeDoc,function(err,Result){
        Result.prod = _.map(Result.prod,function(P){
            return P.prod;
        })
        return res.json(Result);
    })
    
})

router.get('/rows',  HP.TaskAccess("IsRowTuner"), function(req,res,next){
    var Context = LIB.ReqContext(req);
    Helper.LoadRootsFiltered(Context,function(err,Rows){
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
                StructureHelper.UpdateRoot(CurrentRows[CodeRow],Rows[CodeRow],["NumRow","NameRow","CodeRowLink"],CodeUser,cb);
            },function(err){
                if (err) return next(err);
                return res.json({});
            })
        })
    })
})



var CheckToLinks = (new function(){
    var self = this;

    self.FilterFields = ["ForObjType","ForObj","ForObjClass","Link_rowobjgrp"];
    self.OptionsFields = ["IsAlwaysEditable","IsAlwaysFixed"];

    self.Do = function(Context,Update,done){
        console.log("DO",Update);
        self.FilterDo(Context,Update,function(err,ModifiedUpdates){
            return done(err,ModifiedUpdates);
            /*console.log("FilterDo");
            self.OptionsDo(Context,ModifiedUpdates,function(err,LastUpdates){
                console.log("OptionsDo");
                return done(err,LastUpdates);
            })
            */
        })        
    }

    self.OptionsDo = function(Context,Update,done){
        var ToDo = {};
        for (var CodeRow in Update){
            var Changes = Update[CodeRow];
            if (!_.isEmpty(_.intersection(_.keys(Changes),self.OptionsFields))){
                ToDo[CodeRow] = _.pick(Changes,self.OptionsFields);
            }
        }
        if (_.isEmpty(ToDo)) return done(null,Update);
        mongoose.model("rowcoloption").find({CodeRow:{$in:_.keys(ToDo)}}).exec(function(err,ExistedAll){
            var ExistedByRows = {};
            ExistedAll.forEach(function(E){
                ExistedByRows[E.CodeRow] = E;
            })
            for (var CodeRow in ToDo){
                if (!ExistedByRows[CodeRow]){
                    ExistedByRows[CodeRow] = {IsEditable:false,IsFixed:false,CodeRow:CodeRow};
                }
                var Change = ToDo[CodeRow];
                [{Source:"IsAlwaysFixed",Target:"IsFixed"},{Source:"IsAlwaysEditable",Target:"IsEditable"}].forEach(function(Obj){
                    if (_.isBoolean(Change[Obj.Source])){
                        ExistedByRows[CodeRow][Obj.Target] = Change[Obj.Source];
                    }
                })
                if (!ExistedByRows[CodeRow].IsFixed && !ExistedByRows[CodeRow].IsEditable){
                    Update[CodeRow].Link_rowcoloption = [];    
                } else {
                    Update[CodeRow].Link_rowcoloption = [ExistedByRows[CodeRow]];    
                }             
                Update[CodeRow] = _.omit(Update[CodeRow],self.OptionsFields);
            }
            return done(err,Update);
        })
    }

    self.FilterDo = function(Context,Update,done){
        var ToDo = {};
        for (var CodeRow in Update){
            var Changes = Update[CodeRow];
            if (!_.isEmpty(_.intersection(_.keys(Changes),self.FilterFields))){
                ToDo[CodeRow] = _.pick(Changes,self.FilterFields);
            }
        }
        if (_.isEmpty(ToDo)) return done(null,Update);
        mongoose.model("rowobj").find({CodeRow:{$in:_.keys(ToDo)}}).exec(function(err,ExistedAll){
            var Existed = _.filter(ExistedAll,function(Ex){
                return _.isEmpty(Ex.CodeGrp);
            })
            var GrpLinks = _.filter(ExistedAll,function(Ex){
                return !_.isEmpty(Ex.CodeGrp);
            })
            var ExistedByRows = {};
            Existed.forEach(function(E){
                if (!ExistedByRows[E.CodeRow]) ExistedByRows[E.CodeRow] = [];
                ExistedByRows[E.CodeRow].push(E);
            })
            for (var CodeRow in ToDo){
                var V = ToDo[CodeRow];
                if (!ExistedByRows[CodeRow]) ExistedByRows[CodeRow] = [];
                if (_.isBoolean(V["ForObjType"])){
                    var Ex = _.find(ExistedByRows[CodeRow],{CodeObjType:Context.ObjType});
                    if (V["ForObjType"]){
                        ExistedByRows[CodeRow].push({CodeRow:CodeRow,CodeObjType:Context.ObjType});
                    } else {
                        ExistedByRows[CodeRow] = _.filter(ExistedByRows[CodeRow], function(R){
                            return R.CodeObjType!=Context.ObjType;
                        })
                    }
                }
                if (_.isBoolean(V["ForObjClass"])){
                    var Ex = _.find(ExistedByRows[CodeRow],{CodeObjClass:Context.ObjClass});
                    if (V["ForObjClass"]){
                        ExistedByRows[CodeRow].push({CodeRow:CodeRow,CodeObjClass:Context.ObjClass});
                    } else {
                        ExistedByRows[CodeRow] = _.filter(ExistedByRows[CodeRow], function(R){
                            return R.CodeObjClass!=Context.ObjClass;
                        })
                    }
                }
                if (_.isBoolean(V["ForObj"])){
                    var codeToSet = Context.CodeObj;
                    if (!_.isEmpty(Context.ChildObj)) codeToSet = Context.ChildObj;
                    var Ex = _.find(ExistedByRows[CodeRow],{CodeObj:codeToSet});
                    if (V["ForObj"]){
                        ExistedByRows[CodeRow].push({CodeRow:CodeRow,CodeObj:codeToSet});
                    } else {
                        ExistedByRows[CodeRow] = _.filter(ExistedByRows[CodeRow], function(R){
                            return R.CodeObj!=codeToSet;
                        })
                    }
                }
                if (!_.isEmpty(V.Link_rowobjgrp)){
                    V.Link_rowobjgrp.forEach(function(GrB){
                        ExistedByRows[CodeRow].push({CodeRow:CodeRow,CodeGrp:GrB.CodeGrp});
                    })                    
                } else if (!_.has(V,"Link_rowobjgrp")){
                    ExistedByRows[CodeRow] = ExistedByRows[CodeRow].concat(GrpLinks);
                }
                Update[CodeRow] = _.omit(Update[CodeRow],self.FilterFields);
                Update[CodeRow].Link_rowobj = ExistedByRows[CodeRow];
            }
            return done(null,Update);
        })
    }


    return self;
})





router.put('/rows', HP.TaskAccess("IsRowTuner"), function(req, res,next){
    var Update = JSON.parse(req.body.Data), CodeUser = req.user.CodeUser;

    console.log(Update,"<<< 1 ");

    var ModelHelper = require(__base+"src/modeledit.js");
    if (_.isEmpty(Update)) return res.json({});
    CheckToLinks.Do(req.body.Context, Update, function(err,Update){
        console.log(Update,"<<< 2 ");
        mongoose.model("row").find({CodeRow:{$in:_.keys(Update)}}).isactive().exec(function(err,Current){
            async.each(Current,function(C,cb){
                var Fields = _.pick(C,["_id","CodeRow"]), Links = {};
                for (var Field in Update[C.CodeRow]){
                    console.log("FIELD : ",Field);
                    if (Field.indexOf("Link_")!=0) {
                        Fields[Field] = Update[C.CodeRow][Field];   
                    } else if(Field!='Link_rowobjgrp'){
                        Links[Field] = Update[C.CodeRow][Field];
                        if (_.isArray(Links[Field])){
                            Links[Field].forEach(function(L){
                                L.CodeRow = C.CodeRow;
                            })
                        }
                    }               
                }
                var M = new ModelHelper(CodeUser);
                M.SaveModel("row",Fields,function(err){
                    async.each(_.keys(Links),function(LinkName,done){
                           var ModelName = _.last(LinkName.split("Link_"));

                            M.SaveLinks(ModelName,Links[LinkName],done);
                    },cb);
                })
            },function(err){
                if (err) return next (err);
                return res.json({});
            })
        })
    })
})



































module.exports = router