var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require(__base + 'classes/jetcalc/Helpers/Base.js');



var Div = (new function(){

	var self = new Base("JDIV");

	self.Info = {};

	self.FieldsByModel = {
		"region":'-_id CodeRegion NameRegion',
		"otrasl":'-_id CodeOtrasl NameOtrasl',
		'div':'-_id CodeDiv NameDiv Idx',
		'city':'-_id CodeCity NameCity CodeRegion',
		'org':'-_id CodeOrg NameOrg CodeDiv CodeOtrasl CodeCity',
		'objtype':'-_id CodeObjType CodeObjClass',
		'obj':"-_id CodeValuta NameObj SNameObj CodeObjType CodeOrg CodeParentObj CodeObj IsFormula Formula DateBegin DateEnd",
		'objgrp':"-_id CodeObj CodeGrp",
		'objtag':"-_id CodeObj CodeTag Value",
		'objtypetag':"-_id CodeObjType CodeTag Value",
		'objclasstag':"-_id CodeObjClass CodeTag Value"
	};

	self.SubscribeChanges(_.keys(self.FieldsByModel));

	self.get = function(done){
		self.FromCache(null,function(err,Result){
			if (Result) {
				return done (err,Result);	
			}
			self.load(function(err,Data){
				self.ToCache(null,Data,function(err){
					return done(err,Data);
				})
			})
		})
	}

	self.load = function(done){
		var Models = {};
		var ParentsInfo = {}, ChildrenInfo = {};
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
		var _parents = function(Code){
			var ParentsChain = [Code], Max = 100;
			while ((--Max)>0 && ParentsInfo[Code]!=Code && ParentsInfo[Code]){
				Code = ParentsInfo[Code];
				ParentsChain.push(Code);
			}
			return ParentsChain;
		}
		async.each(_.keys(self.FieldsByModel),function(modelName,cb){
			mongoose.model(modelName).find({},self.FieldsByModel[modelName]).isactive().lean().exec(function(err,Objs){
				Models[modelName] = Objs; 
				return cb(err);
			})
		},function(err){
			if (err) return done(err);
			Models.obj && Models.obj.forEach(function(Obj){
				self.Info[Obj.CodeObj] = Obj;
				ParentsInfo[Obj.CodeObj] = Obj.CodeParentObj;
				if (!ChildrenInfo[Obj.CodeParentObj]) ChildrenInfo[Obj.CodeParentObj] = [];
				if (Obj.CodeParentObj != Obj.CodeObj) ChildrenInfo[Obj.CodeParentObj].push(Obj.CodeObj);
				["org","div","objtype","region","otrasl","city"].forEach(function(Binded){
					var M = mongoose.model(Binded), CFG = M.cfg(), Code = CFG.Code, Q = {};
					Q[Code] = self.Info[Obj.CodeObj][Code];
					if (!_.isEmpty(self.Info[Obj.CodeObj][Code])){
						var F = _.find(Models[Binded],Q);
						if (!_.isEmpty(F)){
							self.Info[Obj.CodeObj] = _.merge(self.Info[Obj.CodeObj],F);
						}
					}
				})
			})
			for (var CodeObj in self.Info){
				var Data = self.Info[CodeObj];
				Data.Groups = _.map(_.filter(Models.objgrp,{CodeObj:Data.CodeObj}),"CodeGrp");
				Data.Tags = _.map(_.filter(Models.objtag,{CodeObj:Data.CodeObj}),function(Tag){
					if (!Tag.Value) Tag.Value = "*";
					return Tag.CodeTag+':'+Tag.Value
				})
				Data.TypeTags = _.map(_.filter(Models.objtypetag,{CodeObjType:Data.CodeObjType}),function(Tag){
					if (!Tag.Value) Tag.Value = "*";
					return Tag.CodeTag+':'+Tag.Value
				})
				Data.ClassTags = _.map(_.filter(Models.objclasstag,{CodeObjClass:Data.CodeObjClass}),function(Tag){
					if (!Tag.Value) Tag.Value = "*";
					return Tag.CodeTag+':'+Tag.Value
				})
				Data.RootObj = _rootParent(Data.CodeObj);
				Data.Children = ChildrenInfo[Data.CodeObj] || [];
				Data.AllChildren = _children(Data.CodeObj);				
				Data.Parents = _parents(Data.CodeObj);
			}
			return done(err,self.Info);
		})

	}

	return self;
})



module.exports = Div;