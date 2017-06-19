var MCheckSyntax = (new function() {
	var self = this;

	self.base = "/api/modules/checksyntax/";

	self.CellClick = function(data,e){
		var rotator = ["as_diff","as_old","as_new"];
		var next = "as_old";
		var el = $(e.target); if (!el.is('td')) el = $(el.parent());
		rotator.forEach(function(r,i){
			if (el.hasClass(r)){
				(i==2) ? next = "as_diff" : next = rotator[i+1];
			}
		})
		el.removeClass(rotator.join(" "));
		el.addClass(next);
		console.log(el);
	}


    self.IsAvailable = function(){
        return PermChecker.CheckPrivelege("IsFormulaEditor");
    }  


	self.Errors = ko.observableArray();
	self.NoErrors = ko.observable(false);

	self.IsLoading = ko.observable(false);

	self.LoadInfo = function(){
		if (self.Errors().length) {
			self.Errors([]);
			return;
		}
		self.NoErrors(false);
		self.Updated([]);
		self.IsLoading(true);
		$.getJSON(self.base+'checkformula',function(data){
			self.Errors(_.values(data));
			if (!_.values(data).length){
				self.NoErrors(true);
			}
			self.IsLoading(false);
		})
	}

	self.IsUpdating = ko.observable(false);
	self.Updated = ko.observableArray();

	self.UpdateFormula = function(){
		if (self.Updated().length) {
			self.Updated([]);
			return;
		}
		self.Errors([]);
		self.IsUpdating(true);
		self.NoErrors(false);
		$.getJSON(self.base+'updateformula',function(data){
			self.Updated(_.values(data));
			self.IsUpdating(false);
		})
	}

	return self;
})
ModuleManager.Modules.CheckSyntax = MCheckSyntax;