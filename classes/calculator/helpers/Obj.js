var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');
var Base = require('./Base.js');

/**
 * Получение списков объектов учета с группировками для OLAP-отчетов и Агрегатов
 * В зависимости от контекста создается дерево
 *
 * Группа, по которой выводится общий итог и фильтруются объекты учета верхнего уровня 
 * (не имеющие родительского объекта учета) - по умолчанию группа G1 
 * (позднее для отображаемых групп и группы по умолчанию будет реализована поддержка на уровне базы данных)
 *
 * Схема группировки объектов учета из фиксированного списка 
 * (по дивизионам, по отраслям,по регионам, по городам, не группировать) - по умолчанию группировать по дивизионам
 *
 * Признак вывода отдельных предприятий - если признак не установлен, то выводить только итоги по группам 
 * (или не выводить ничего, если установлена схема группировки "не группировать") - по умолчанию признак установлен
 * 
 * UseCache - использовать кэшированные результаты или нет
 * Кэширование результатов происходит в Reddis-е
 *  
 * @param {object} Context 
 *        CodeGrp - Корневой узел
 *        SandBox - CodeUser или null
 *        UseCache
 * 
 *    
 * @return {array} Массив объектов учета
 */


var ObjHelper = function(Context){
	
	Context = _.clone(Context);
	Context.PluginName = "OBJ";
	var self = this;
	Context.CacheFields = [];
	Base.apply(self,Context);
	self.Context = Context;		



	self.get = function(done){
		self.loadFromCache(function(err,Result){
			if (Result) {
				return done(null,Result);	
			}			
			var Answer = {};
			self.loadInfo(function(err,Result){
				Answer.Grp  = _.first(Result.grp[self.Context.CodeGrp]);
				Answer.Objs = [];
				var Objs = _.map(Result.objgrp[self.Context.CodeGrp],'CodeObj');
				Objs.forEach(function(CodeObj){
					var ObjInfo = _.first(Result.obj[CodeObj]);
					var OrgInfo = _.first(Result.org[ObjInfo.CodeOrg]);
					if (OrgInfo){
						ObjInfo = _.merge(ObjInfo,OrgInfo);
						[_.first(Result.city[ObjInfo.CodeCity]),_.first(Result.otrasl[ObjInfo.CodeOtrasl]),_.first(Result.div[ObjInfo.CodeDiv])].forEach(function(In){
							if (In) ObjInfo = _.merge(ObjInfo,In);
						})
						ObjInfo = _.merge(ObjInfo,_.first(Result.region[ObjInfo.CodeRegion]));
					}
					Answer.Objs.push(ObjInfo);
				})
				Answer.Objs = _.sortBy(Answer.Objs, 'IndexObj');
				self.saveToCache(Answer,function(err){
					return done(err,Answer);	
				});
			})
		})
	}

	self.loadInfo = function(done){
		var Tasks = {};
		var _remap = function(key,objects){
			var R = {}
			objects && objects.forEach(function(O){
				if (!R[O[key]]){
					R[O[key]] = [];
				}
				R[O[key]].push(O);
			})
			return R;
		}
		var ToLoad = [
			{model:'grp',fields:'CodeGrp NameGrp',remap:"CodeGrp"},
			{model:'org',fields:'CodeOrg CodeOtrasl CodeDiv CodeCity NameOrg',remap:"CodeOrg"},
			{model:'obj',fields:'CodeObj NameObj CodeOrg CodeObjType IndexObj',remap:"CodeObj"},
			{model:'objgrp',fields:'CodeObj CodeGrp',remap:"CodeGrp"},
			{model:'city',fields:'CodeCity NameCity CodeRegion',remap:"CodeCity"},
			{model:'div',fields:'CodeDiv NameDiv Idx',remap:"CodeDiv"},
			{model:'otrasl',fields:'CodeOtrasl NameOtrasl',remap:"CodeOtrasl"},
			{model:'region',fields:'CodeRegion NameRegion',remap:"CodeRegion"}
		];
		ToLoad.forEach(function(Info){
			Tasks[Info.model] = function(Info){
				return function(done){
					self.query(Info.model,{},'-_id '+Info.fields).exec(function(err,Result){	
						return done(err,_remap(Info.remap,Result));
					})
				}
			}(Info);
		})
		async.parallel(Tasks,done);
	}

	return self;
}



module.exports = ObjHelper;