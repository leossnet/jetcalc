var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require(__base + 'classes/jetcalc/Helpers/Base.js');
var TreeHelper = require(__base+'/lib/helpers/tree.js');
var Tree = TreeHelper.Tree;

var HeaderHelper = (new function(){

	var self = new Base("JHEADER");
	
	self.Fields = {
		"docheader":'-_id CodeDocHeader CodeHeader CodePeriodGrp IsInput IndexDocHeader',
		"header":"-_id CodeHeader CodeParentHeader IndexHeader NameHeader SNameHeader Condition Year CodePeriod IsFixed IsControlPoint CodeRole IsNoRoles CodeValid CodeStyle CodeColset Link_docheader",
		"colset":"CodeColset NameColset SNameColset",
		"colsetcol":'-_id CodeColsetCol CodeStyle CodeFormat CodeColset CodeCol Condition Year NameColsetCol SNameColsetCol CodePeriod IsFixed IsControlPoint Link_colsetcolperiodgrp Link_colsetcolgrp IndexColsetCol IsAgFormula AgFormula AfIndex IsAfFormula AfFormula CodeRole IsNoRole',
		"col":'-_id AsAgFormula IsAgFormula AgFormula CodeCol Formula IsFormula Link_coltag DoSum NoCalcSum NoCalcSumHard NameCol Comment CodeValuta',
		"colsetcolgrp":'CodeGrp NotInGrp CodeColsetCol',
		"colsetcolperiodgrp":'CodePeriodGrp NotInGrp CodeColsetCol',
		"coltag":'CodePeriodGrp NotInGrp CodeColsetCol',
	}
	
	self.SubscribeChanges(_.keys(self.FieldsByModel));
	
	self.get = function(CodeDoc,done){
		self.FromCache(CodeDoc,function(err,Result){
			if (Result) {
				return done (err,Result);	
			}
			self.loadInfo(CodeDoc, function(err,Data){
				self.ToCache(CodeDoc, Data, function(err){
					return done(err,Data);
				})
			})
		})
	}

	self.Colsets = {};

	self.loadInfo = function(CodeDoc,done){
		self.Colsets = {}; self.Tree = new Tree("ROOT",{}); self.Added = {};
		mongoose.model('docheader').find({CodeDoc:CodeDoc},self.Fields['docheader']).isactive().sort({IndexDocHeader:1}).lean().exec(function(err,HeaderLinks){
			if (_.isEmpty(HeaderLinks)) return done("У документа "+CodeDoc+" не настроены заголовки");			
			async.eachSeries(HeaderLinks,self.LoadBranch,function(err){
				self.LoadColsetsWithCols(function(err){
					var ToRemove = [];
					self.Tree.traverseBF(function(Node){
						if (Node.data.Type=='header'){
							if (Node.data.CodeParentHeader && Node.data.CodeColset && Node.parent.code!='ROOT'){
								Node.parent.children = Node.parent.children.concat(Node.children);
								Node.children.forEach(function(N){
									N.parent = Node.parent;										
								})
								Node.children = [];
								self.Tree.remove(Node.code,Node.parent.code,self.Tree.traverseBF);
							}								
						}
					})							
					var FlatTree  = self.Tree.getFlat();
					FlatTree.forEach(function(Node){
						switch(Node.Type){
							case "docheader":
								Node.ShowName = Node.CodeDocHeader;
							break;
							case "header":
								Node.ShowName = Node.NameHeader+' ['+Node.Links+']';
								Node.CodeCol = Node.CodeHeader;
							break;
							case "colset":
								Node.ShowName = Node.NameColset+' ['+Node.Links+']';
								Node.CodeCol = Node.CodeColset;
							break;
							case "colsetcol":
								Node.ShowName = Node.NameColsetCol;
							break;
							case "col":
								Node.ShowName = '['+Node.CodeCol+'] '+Node.NameCol;
							break;
						}
					})
					return done(null,FlatTree);
				})
			})
		})	
	}

	self.Added = {};
	self.AddToTree = function(Code,Data,Parent){
		if (self.Added[Code]){
			return;
		}
		self.Added[Code] = 1;
		self.Tree.add(Code,Data,Parent);
	}
	

	self.LoadBranch = function(Link,done){
        self.LoadHeaders(Link.CodeHeader,function(err,Hs){
            var Codes = _.map(Hs,"CodeHeader");
            Hs.forEach(function(H){
                var ParentCode = "ROOT"; var Code = Link.CodeDocHeader+":"+H.CodeHeader;
                if (H.CodeColset) self.Colsets[Code] = H.CodeColset;
                if (Codes.indexOf(H.CodeParentHeader)!=-1){
                    ParentCode = Link.CodeDocHeader+":"+H.CodeParentHeader;
                }
                self.AddToTree(Code,_.merge(H,{Type:'header',CodePeriodGrp:Link.CodePeriodGrp, IsInput:Link.IsInput}),ParentCode);
            })
            return done();            
        })
	}

	self.LoadHeaders = function(CodeHeader,done){
        var Result = [];
        mongoose.model('header').find({CodeHeader:CodeHeader}, self.Fields['header']).sort({IndexHeader:1}).isactive().lean().exec(function(err,Header){
        	Header.forEach(function(H){
				H.Links = H.Link_docheader.length;
        	})
            Result = Result.concat(Header);
            mongoose.model('header').find({CodeParentHeader:CodeHeader},self.Fields['header']).sort({IndexHeader:1}).isactive().lean().exec(function(err,Children){
                if (_.isEmpty(Children)) return done(null,Result);
                var Tasks = {};
                Children.forEach(function(Node){
                    Tasks[Node.CodeHeader] = function(CodeChildren){
                        return function(cb){
                            self.LoadHeaders(CodeChildren,cb);
                        }
                    }(Node.CodeHeader);
                })
                async.series(Tasks,function(err,R){
                  for (var Key in R){
                    Result = Result.concat(R[Key]);  
                  }                  
                  return done(err,Result);
                })
            })
        })
    }

    self.LoadColsetData = function(done){
    	var Answer = {};
    	var UsedColsets = _.uniq(_.values(self.Colsets));
		mongoose.model('header').find({CodeColset:{$in:UsedColsets}},'CodeHeader CodeColset').isactive().lean().exec(function(err,ColsetsLinks){
			var LinksColsets = {};
			ColsetsLinks.forEach(function(CL){
				if (!LinksColsets[CL.CodeColset]) LinksColsets[CL.CodeColset] = 0;
				LinksColsets[CL.CodeColset]++;
			})
	    	mongoose.model('colset').find({CodeColset:{$in:UsedColsets}},self.Fields["colset"]).isactive().lean().exec(function(err,Colsets){
				if (err) return done(err);    		
				Colsets.forEach(function(C){
					C.Links = LinksColsets[C.CodeColset];
				})
	    		Answer.Colsets = Colsets;
				mongoose.model('colsetcol').find({CodeColset:{$in:UsedColsets}},self.Fields["colsetcol"])
				.sort({IndexColsetCol:1})
				.populate("Link_colsetcolperiodgrp",'NotInGrp CodePeriodGrp')
				.populate("Link_colsetcolgrp",'NotInGrp CodeGrp')
				.isactive()
				.lean().exec(function(err,ColsetCols){
					if (err) return done(err);
					Answer.ColsetCols = ColsetCols;
					var UsedCols = _.uniq(_.map(ColsetCols,"CodeCol"));
					mongoose.model('col').find({CodeCol:{$in:UsedCols}},self.Fields["col"])
					.populate('Link_coltag','CodeTag Value')
					.isactive()
					.lean()
					.exec(function(err,Cols){
						Cols.forEach(function(Col){
							var Tags = [];
							if(Col.Link_coltag.length){
								Col.Link_coltag.forEach(function(CT){
									var Value = "*";
									if (CT.Value) Value = CT.Value;
									Tags.push(CT.CodeTag+":"+Value);				
								})
							}
							Col.Tags = Tags;
						})
						Answer.UsedCols = Cols;
						return done(err,Answer);
					})
		    	})
	    	})
    	})
    }

    self.LoadColsetsWithCols = function(done){
    	self.LoadColsetData(function(err,Data){
    		if (err) return done(err);
    		var ColsByCode = {};
    		Data.UsedCols.forEach(function(Col){
    			ColsByCode[Col.CodeCol] = Col;
    		})
    		for (var CodeHeader in self.Colsets){
    			var LinkName = _.first(CodeHeader.split(":"));
    			var CodeColset = self.Colsets[CodeHeader];
    			var Colset = _.find(Data.Colsets,{CodeColset:CodeColset});
    			var ColsetCodeTree = LinkName+":"+Colset.CodeColset;
    			self.AddToTree(ColsetCodeTree, _.merge(Colset,{Type:"colset"}) ,CodeHeader);
    			var ColsetCols = _.filter(Data.ColsetCols,{CodeColset:CodeColset});
    			ColsetCols.forEach(function(ColsetCol){
    				var ColsetColTreeCode = ColsetCodeTree+":"+ColsetCol.CodeColsetCol;
    				self.AddToTree(ColsetColTreeCode,_.merge(ColsetCol,{Type:"colsetcol"}) ,ColsetCodeTree);
    				var Col = ColsByCode[ColsetCol.CodeCol];
    				self.AddToTree(ColsetColTreeCode+":"+Col.CodeCol, _.merge(Col,{Type:"col"}) ,ColsetColTreeCode);
    			})
    		}
    		return done();
    	})    	
    }

    return self;
})



module.exports = HeaderHelper;

	