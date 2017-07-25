var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require('./Base.js');



var DivHelper = function(Context){
	
	Context = _.clone(Context); 
	Context.PluginName = "DIV";
	var self = this;
	Context.CacheFields = [];
	Base.apply(self,Context);
	self.Context = Context;	

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

	//  obj -> CodeObjType CodeOrg CodeParentObj
	//  org -> CodeDiv CodeOtrasl CodeCity
	//  city -> CodeRegion
	//  objtype -> CodeObjClass
	self.loadInfo = function(cb_done){
		var CityInfo = {}, DivInfo = {}, OtraslInfo = {}, CityOrgInfo = {}, ClassInfo = {};
		var Names = {CodeCity:{},CodeDiv:{},CodeRegion:{},CodeOtrasl:{},CodeOrg:{}}, Sorts = {};
		self.query('region',{},'-_id CodeRegion NameRegion').exec(function(err,ORegions){
			ORegions && ORegions.forEach(function(OR){ Names.CodeRegion[OR.CodeRegion] = OR.NameRegion;})
			self.query('otrasl',{},'-_id CodeOtrasl NameOtrasl').exec(function(err,OOtrasls){
				OOtrasls && OOtrasls.forEach(function(OT){ Names.CodeOtrasl[OT.CodeOtrasl] = OT.CodeOtrasl;})
				self.query('div',{},'-_id CodeDiv NameDiv Idx').exec(function(err,ODivs){
					ODivs && ODivs.forEach(function(OD){ Names.CodeDiv[OD.CodeDiv] = OD.NameDiv; Sorts[OD.CodeDiv] = OD.Idx;})
					self.query('city',{},'-_id CodeCity NameCity CodeRegion').exec(function(err,OCities){
						OCities && OCities.forEach(function(City){ CityInfo[City.CodeCity] = City.CodeRegion; Names.CodeCity[City.CodeCity] = City.NameCity;})
						self.query('org',{},'-_id CodeOrg NameOrg CodeDiv CodeOtrasl CodeCity').exec(function(err,ODivs){
							ODivs && ODivs.forEach(function(OT){
								 DivInfo[OT.CodeOrg] = OT.CodeDiv; 
								 CityOrgInfo[OT.CodeOrg] = OT.CodeCity;
								 OtraslInfo[OT.CodeOrg] = OT.CodeOtrasl;
								 Names.CodeOrg[OT.CodeOrg] = OT.NameOrg;
							});
							self.query('objtype',{},'-_id CodeObjType CodeObjClass').exec(function(err,OTypes){
								OTypes && OTypes.forEach(function(OT){ ClassInfo[OT.CodeObjType] = OT.CodeObjClass;})
								self.query('obj',{}, '-_id CodeValuta NameObj SNameObj CodeObjType CodeOrg CodeParentObj CodeObj IsFormula Formula DateBegin DateEnd Link_objtag Link_objgrp')
								.populate('Link_objgrp','-_id CodeGrp')
								.populate('Link_objtag','-_id CodeTag Value').isactive().exec(function(err,Objs){
									var Result = [], ParentsInfo = {}, ChildrenInfo = {};
									Objs && Objs.forEach(function(Obj){
										Obj.CodeDiv =  DivInfo[Obj.CodeOrg];
										Obj.NameDiv    = Names.CodeDiv[Obj.CodeDiv];
										Obj.CodeObjClass =  ClassInfo[Obj.CodeObjType];
										Obj.Groups = _.map(Obj.Link_objgrp,"CodeGrp");
										Obj.CodeCity = CityOrgInfo[Obj.CodeOrg];
										Obj.NameCity   = Names.CodeCity[Obj.CodeCity];
										Obj.CodeRegion = CityInfo[Obj.CodeCity];
										Obj.NameRegion = Names.CodeRegion[Obj.CodeRegion];
										Obj.CodeOtrasl = OtraslInfo[Obj.CodeOrg];
										Obj.NameOtrasl = Names.CodeOtrasl[Obj.CodeOtrasl];
										Obj.NameOrg    = Names.CodeOrg[Obj.CodeOrg];	
										Obj.IndexDiv   = Sorts[Obj.CodeDiv];
										if (!ChildrenInfo[Obj.CodeParentObj]) ChildrenInfo[Obj.CodeParentObj] = [];
										if (Obj.CodeParentObj !=Obj.CodeObj)  ChildrenInfo[Obj.CodeParentObj].push(Obj.CodeObj);
										Obj = _.omit(Obj,'Link_objgrp');					
										Obj.Tags = [];
										Obj.Link_objtag && Obj.Link_objtag.forEach(function(OT){
											if (!OT.Value) OT.Value = "*";
											Obj.Tags.push(OT.CodeTag+':'+OT.Value);
										})
										Obj = _.omit(Obj,'Link_objtag');					
										ParentsInfo[Obj.CodeObj] = Obj.CodeParentObj;
										Result.push(Obj);
									})
									var _rootParent = function(Code){
										if (ParentsInfo[Code]==Code || !ParentsInfo[Code]) return Code;
										return _rootParent(ParentsInfo[Code]);
									}
									var _children = function(Code){
										var AllChildren = [];
										AllChildren.push(Code);							
										if (!ChildrenInfo[Code] || !ChildrenInfo[Code].length){
											return AllChildren;
										}
										ChildrenInfo[Code].forEach(function(C){
											AllChildren = AllChildren.concat(_children(C));
										})
										return AllChildren;
									}
									var ToSave = {};
									Result.forEach(function(O,Index){
										Result[Index].RootObj = _rootParent(O.CodeObj);
										Result[Index].Children = ChildrenInfo[O.CodeObj] || [];
										Result[Index].AllChildren = _children(O.CodeObj);
										ToSave[O.CodeObj] = Result[Index];
									})
									return cb_done	&& cb_done(null,ToSave);
								})
							})
						})
					})
				})
		})
		})
	}

	return self;
}



module.exports = DivHelper;