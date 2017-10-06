var _ = require("lodash");

module.exports = (new function(){
	var self = this;

	self.Symbols =  {Row:"$",Col:"@",Period:".P",Year:".Y",Obj:"#"};
	
	self.Vars = /[$@].*?\?/g;
	self.Var = /[$@].*?\?/;
	
	
	self.Row = /\$.*?(?=[@?\.\<\>#])/;
	self.Col = /\@.*?(?=[?\.\<\>#])/;
	self.Period = /\.P[-]?\d*(?=[?\.\<\>#])/;
	self.Year = /\.Y[-]?\d*(?=[?\.\<\>#])/;
	self.Obj = /\#(?!:).*?(?=[?\.\<\>])/;
	self.Cell = /\$(.*?)\@(.*?)\.P(.*?)\.Y(.*?)\#(.*?)\?/;
	
	self.Tags = /([_]{2,3}[A-Za-z]+)|(\{[A-Za-z]+\})/g;
	self.Tag = /([_]{2,3}[A-Za-z]+)(\{[A-Za-z]+\})/;
	
	self.Mods = /(<<<|>>|<<)\(.*?\)/g;
	self.Mod = /(<<<|>>|<<)\((.*?)\)/;
	


	self._toObj = function(CellName){
		var p = (CellName+"").match(this.Cell);
		return {Cell:CellName,Row:p[1],Col:p[2],Period:p[3],Year:p[4],Obj:p[5]};					
	}

	self._toCell = function(Cell){
		return ['$',Cell.Row,'@',Cell.Col,'.P',Cell.Period,'.Y',Cell.Year,'#',Cell.Obj,'?'].join('');
	}

	self._fromIncomplete = function(v,tpl){
		tpl = tpl || {};
		var _setVar = function(v,tpl,Type){
			var Ar = v.match(self[Type]);
			if (_.isEmpty(Ar)) return tpl[Type];
			return _.first(Ar).replace(self.Symbols[Type],"");
		}
		var Set = {};
		_.keys(self.Symbols).forEach(function(T){
			Set[T] = _setVar(v,tpl,T);
		})
		return Set;
	}

	return self;
})