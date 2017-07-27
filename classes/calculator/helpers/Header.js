var async = require('async');
var moment = require('moment');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require('./Base.js');

var TreeHelper = require(__base+'/lib/helpers/tree.js');
var Tree = TreeHelper.Tree;




var HeaderHelper = function(Context){
	
	Context = _.clone(Context);
	Context.PluginName = "HEADER";
	var self = this;
	Context.CacheFields = ['CodeDoc'];
	Base.apply(self,Context);
	self.Context = Context;	

	self.Fields = {
		"docheader":'-_id CodeDocHeader CodeHeader CodePeriodGrp IsInput IndexDocHeader',
		"header":"-_id CodeHeader CodeParentHeader IndexHeader NameHeader SNameHeader Condition Year CodePeriod IsFixed IsControlPoint CodeRole IsNoRoles CodeValid CodeStyle CodeColset Link_docheader",
		"colset":"CodeColset NameColset SNameColset",
		"colsetcol":'-_id CodeColsetCol CodeStyle CodeColset CodeCol Condition Year NameColsetCol SNameColsetCol CodePeriod IsFixed IsControlPoint Link_colsetcolperiodgrp Link_colsetcolgrp IndexColsetCol IsAgFormula AgFormula  IsAfFormula AfFormula CodeRole IsNoRole',
		"col":'-_id AsAgFormula IsAgFormula AgFormula CodeCol Formula IsFormula Link_coltag DoSum NoCalcSum NoCalcSumHard NameCol Comment CodeValuta',
	}

	self.get = function(done){
		self.loadFromCache(function(err,Result){
			if (Result && false) {
				return done(null,Result);	
			}			
			self.loadInfo(function(err,Result){
				self.saveToCache(Result,function(err){
					return done(err,Result);	
				});
			})
		})
	}

	self.loadInfo = function(done){
		self.query('docheader',{CodeDoc:self.Context.CodeDoc},self.Fields['docheader'])
			.sort({IndexDocHeader:1}).exec(function(err,HeaderLinks){
			if (!HeaderLinks.length) return done("У документа "+self.Context.CodeDoc+" не настроены заголовки");
			self.Tree = new Tree("ROOT",{});

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
					//console.log(FlatTree);
					return done(null,FlatTree);
				})
			})
		})	
	}

	self.Colsets = {};

	self.LoadBranch = function(Link,done){
        //self.Tree.add (Link.CodeDocHeader, _.merge(Link,{Type:"docheader"}), "ROOT");
        self.LoadHeaders(Link.CodeHeader,function(err,Hs){
            var Codes = _.map(Hs,"CodeHeader");
            Hs.forEach(function(H){
                var ParentCode = "ROOT"; var Code = Link.CodeDocHeader+":"+H.CodeHeader;
                if (H.CodeColset) self.Colsets[Code] = H.CodeColset;
                if (Codes.indexOf(H.CodeParentHeader)!=-1){
                    ParentCode = Link.CodeDocHeader+":"+H.CodeParentHeader;
                }
                self.Tree.add(Code,_.merge(H,{Type:'header',CodePeriodGrp:Link.CodePeriodGrp, IsInput:Link.IsInput}),ParentCode);
            })
            return done();            
        })
	}

	self.LoadHeaders = function(CodeHeader,done){
        var Result = [];
        self.query('header',{CodeHeader:CodeHeader}, self.Fields['header']).sort({IndexHeader:1}).exec(function(err,Header){
        	Header.forEach(function(H){
				H.Links = H.Link_docheader.length;
        	})
            Result = Result.concat(Header);
            self.query('header',{CodeParentHeader:CodeHeader},self.Fields['header']).sort({IndexHeader:1}).exec(function(err,Children){
                if (!Children || !Children.length) return done(null,Result);
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
		self.query('header',{CodeColset:{$in:UsedColsets}},'CodeHeader CodeColset').exec(function(err,ColsetsLinks){
			var LinksColsets = {};
			ColsetsLinks.forEach(function(CL){
				if (!LinksColsets[CL.CodeColset]) LinksColsets[CL.CodeColset] = 0;
				LinksColsets[CL.CodeColset]++;
			})
	    	self.query('colset',{CodeColset:{$in:UsedColsets}},self.Fields["colset"]).exec(function(err,Colsets){
				if (err) return done(err);    		
				Colsets.forEach(function(C){
					C.Links = LinksColsets[C.CodeColset];
				})
	    		Answer.Colsets = Colsets;
				self.query('colsetcol',{CodeColset:{$in:UsedColsets}},self.Fields["colsetcol"])
				.sort({IndexColsetCol:1})
				.populate("Link_colsetcolperiodgrp",'-_id NotInGrp CodePeriodGrp')
				.populate("Link_colsetcolgrp",'-_id NotInGrp CodeGrp')
				.isactive().exec(function(err,ColsetCols){
					if (err) return done(err);
					Answer.ColsetCols = ColsetCols;
					var UsedCols = _.uniq(_.map(ColsetCols,"CodeCol"));
					self.query('col',{CodeCol:{$in:UsedCols}},self.Fields["col"])
					.populate('Link_coltag','-_id CodeTag Value')
					.isactive().exec(function(err,Cols){
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
    			self.Tree.add(ColsetCodeTree, _.merge(Colset,{Type:"colset"}) ,CodeHeader);
    			var ColsetCols = _.filter(Data.ColsetCols,{CodeColset:CodeColset});
    			ColsetCols.forEach(function(ColsetCol){
    				var ColsetColTreeCode = ColsetCodeTree+":"+ColsetCol.CodeColsetCol;
    				self.Tree.add(ColsetColTreeCode,_.merge(ColsetCol,{Type:"colsetcol"}) ,ColsetCodeTree);
    				var Col = ColsByCode[ColsetCol.CodeCol];
    				self.Tree.add(ColsetColTreeCode+":"+Col.CodeCol, _.merge(Col,{Type:"col"}) ,ColsetColTreeCode);
    			})
    		}
    		return done();
    	})    	
    }
}


var HeaderHelperOld = function(Context){
	
	Context = _.clone(Context);
	Context.PluginName = "HEADER";
	var self = this;
	Context.CacheFields = ['CodeDoc'];
	Base.apply(self,Context);
	self.Context = Context;	

	self.get = function(done){
		self.loadFromCache(function(err,Result){
			if (Result) {
				return done(null,Result);	
			}			
			self.loadInfo(function(err,Result){
				self.saveToCache(Result,function(err){
					return done(err,Result);	
				});
			})
		})
	}

	self.Init = function(done){
		self.query('header',{},"-_id CodeHeader CodeParentHeader IndexHeader NameHeader SNameHeader Condition Year CodePeriod IsFixed IsControlPoint CodeRole IsNoRoles CodeValid CodeStyle CodeColset Link_docheader").exec(function(err,Headers){
			var Parents = {}, Children = {};
			Headers.forEach(function(Header){
				Parents[Header.CodeHeader] = Header.CodeParentHeader;
				if (!Children[Header.CodeParentHeader]){
					Children[Header.CodeParentHeader] = [];
				}
				if (Header.CodeHeader != Header.CodeParentHeader){
					Children[Header.CodeParentHeader].push(Header.CodeHeader);
				}
			})
			var Info = {};
			Headers.forEach(function(Header){
				Info[Header.CodeHeader] = Header;
				Info[Header.CodeHeader].Children = Children[Header.CodeHeader];
				Info[Header.CodeHeader].Links = Info[Header.CodeHeader].Link_docheader.length;
				Info[Header.CodeHeader] = _.omit(Info[Header.CodeHeader],"Link_docheader");
			})
			return done(err,Info);
		})
	}

	self.HInfo = {};

	self.loadInfo = function(done){
		self.Init(function(err,HInfo){
			if (err) return done(err);
			self.HInfo = HInfo;
			self.LoadTree(function(err,Tree){
				return done(err,Tree);
			})
		})
	}

	self.Tree = null;

	self.AddToTree = function(Code, Data, ParentCode){
		self.Tree.add (Code, Data, ParentCode, self.Tree.traverseBF);
		if (Data.Children && Data.Children.length){
			Data.Children.forEach(function(CodeChildren){
				if (self.HInfo[CodeChildren]){
					var Ch = _.merge(self.HInfo[CodeChildren],{Type:'header'});
					self.AddToTree (CodeChildren,Ch,Code);
				}				
			})
		}		
	}

	self.GetNodes = function(Type){
		var Reparsed = [];
		self.Tree.traverseBF(function(A){
			if (A.code!='ROOT'){
				Reparsed.push(_.omit(_.merge({code:A.code,parent:A.parent.code},A.data),"Children"));
			}
		})
		if (Type){
			return _.filter(Reparsed,function(El){
				return (El.Type==Type);
			})
		} else {
			return Reparsed;
		}
	}


	self.LoadTree = function(done){
		self.Tree = new Tree("ROOT",{});
		self.query('docheader',{CodeDoc:self.Context.CodeDoc},'-_id CodeDocHeader CodeHeader CodePeriodGrp IsInput IndexDocHeader')
			.sort({IndexDocHeader:1}).exec(function(err,HeaderLinks){
			if (!HeaderLinks.length) return done("У документа "+self.Context.CodeDoc+" не настроены заголовки");
			_.map(HeaderLinks,function(H){
				console.log(_.pick(H,["IndexDocHeader","CodeHeader"]));
			})
			HeaderLinks.forEach(function(HLink){
				self.AddToTree (HLink.CodeHeader,_.merge(self.HInfo[HLink.CodeHeader],{Type:'header',CodePeriodGrp:HLink.CodePeriodGrp, IsInput:HLink.IsInput}),"ROOT");//HLink.CodeDocHeader
			})			
			var Nodes = self.GetNodes('header');
			var ColsetsByHeaders = {};
			Nodes.forEach(function(N){
				ColsetsByHeaders[N.CodeHeader] = N.CodeColset;
			})
			var UsedColsets = _.uniq(_.difference(_.values(ColsetsByHeaders),['cs_empty']));
			self.query('header',{CodeColset:{$in:UsedColsets}},'CodeHeader CodeColset').exec(function(err,ColsetsLinks){
				var LinksColsets = {};
				ColsetsLinks.forEach(function(CL){
					if (!LinksColsets[CL.CodeColset]) LinksColsets[CL.CodeColset] = 0;
					LinksColsets[CL.CodeColset]++;
				})
				self.query('colset',{CodeColset:{$in:UsedColsets}},'CodeColset NameColset SNameColset').exec(function(err,Colsets){
					var Indexed = {}; 
					Colsets.forEach(function(Cs){
						Indexed[Cs.CodeColset] = _.merge(Cs,{Type:'colset',Links:LinksColsets[Cs.CodeColset]});
					})
					for (var CodeHeader in ColsetsByHeaders){
						var CodeColset = ColsetsByHeaders[CodeHeader];
						if (Indexed[CodeColset]){
							self.AddToTree (CodeColset,Indexed[CodeColset],CodeHeader);
						}
					}
					var UsedCols = [];
					self.query('colsetcol',{CodeColset:{$in:UsedColsets}},
						'-_id CodeColsetCol CodeStyle CodeColset CodeCol Condition Year NameColsetCol SNameColsetCol CodePeriod'+
						' IsFixed IsControlPoint Link_colsetcolperiodgrp Link_colsetcolgrp IndexColsetCol IsAgFormula'+
						' AgFormula  IsAfFormula AfFormula CodeRole IsNoRole')
						.sort({IndexColsetCol:1})
						.populate("Link_colsetcolperiodgrp",'-_id NotInGrp CodePeriodGrp') // For periods
						.populate("Link_colsetcolgrp",'-_id NotInGrp CodeGrp')       // For Groups
						.isactive()
						.exec(function(err,ColsetCols){				
							UsedCols = _.uniq(_.map(ColsetCols,"CodeCol"));
							var ColsetColCols = {};
							ColsetCols.forEach(function(CC){
								if (!ColsetColCols[CC.CodeColsetCol]) ColsetColCols[CC.CodeColsetCol] = [];
								ColsetColCols[CC.CodeColsetCol].push(CC.CodeCol);
								self.AddToTree (CC.CodeColsetCol,_.merge(CC,{Type:'colsetcol'}),CC.CodeColset);
							})
						self.query('col',{CodeCol:{$in:UsedCols}},'-_id AsAgFormula IsAgFormula AgFormula CodeCol Formula IsFormula Link_coltag DoSum NoCalcSum NoCalcSumHard NameCol Comment CodeValuta')
						.populate('Link_coltag','-_id CodeTag Value')
						.isactive()
						.exec(function(err,Cols){
							var IndexedCols = {};
							Cols.forEach(function(Col){
								IndexedCols[Col.CodeCol] = _.merge(Col,{Type:'col'});
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
							for (var CodeColsetCol in ColsetColCols){
								ColsetColCols[CodeColsetCol].forEach(function(C){
									self.AddToTree (CodeColsetCol+'_'+C,IndexedCols[C],CodeColsetCol);			
								})
							}
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
							
							self.FlatTree  = self.Tree.getFlat();
							self.FlatTree.forEach(function(Node){
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
							return done(null,self.FlatTree);
						})						
					})
				})
			})
		})
	}	

	return self;
}



module.exports = HeaderHelper;

	