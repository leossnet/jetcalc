var Lang = (new function(){

	var self = new Module("lang");

	self.Strs = {
		default:{
			"enter": "Войти",
	 		"restorepassword":"Восстановить",
	 		"register":"Регистрация",
	 		"enter":"Вход",			
	 		"password":"Пароль"			
		}
	}

	self.IsInited = ko.observable(false);

	self.Init = function(done){
		if (self.IsInited()) return done();
		$.getJSON(self.base+"translates",function(data){
			if (data.err) return done();
			for (var type in data){
				self.Register(type,data[type]);
			}
			self.IsInited(true);
			MSite.Events.on("navigate",self.ResetCollection);
			return done();
		})
	}

	self.OnPage = {};

	self.ResetCollection = function(){
		self.OnPage = {};		
	}

	self.Register = function(type,Obj){
		if (!self.Strs[type]) self.Strs[type] = {};
		self.Strs[type] = _.merge(self.Strs[type],Obj);
		self.Strs.default = _.merge(Obj,self.Strs.default);
	}

	self.Tr = function(Prefix,Str){
		if (typeof Str == 'function') Str = null;
		if (!Str) {
			Str = Prefix;
			Prefix = null;
		}
		if (_.isArray(Str)){
			var Result = [];
			Str.forEach(function(S){
				Result.push(self.Tr(S));
			})
			return Result;
		} else {
			var Result = Str;
			try{
				Result = self.Strs[Prefix][Str];
			} catch(e){
				;
			}
			if (Result == Str && !_.isEmpty(self.Strs.default[Str])) Result = self.Strs.default[Str];
			if (_.isEmpty(Result)) Result = Str;
			self.OnPage[Str] = Result;			
			return Result;
		}
	}

	return self;
})

var Tr = Lang.Tr;

ko.bindingHandlers.lang = {
    update: function(element, valueAccessor, allBindingsAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var params = ko.utils.unwrapObservable(allBindingsAccessor());
        var isInited = Lang.IsInited();
        if (!isInited) return value;
        var model = params.model;
        var text = Lang.Tr(model,value);
        $(element).html(text);
    } 
};



ModuleManager.Modules.Lang = Lang;