var MStyles = (new function(){

    var self = new Module("styles");

    self.Styles = ko.observable(null);

  	self.Init = function(done){
		CxCtrl.Events.addListener("documentchanged",self.UpdateStyles);
		self.rGet("list",{},function(data){
			self.Styles(data);
			Hitch.add([{
				name: '-math-checkrange-with-bounds',  
				filter:   function(match,argsString){
						var args = argsString.split(",");
						var cmp1 = parseInt(args[0]), cmp2 = parseInt(args[1]);
						var value = match.innerText.replace(/\s*/g,'');
						if(!isNaN(value) && !isNaN(cmp1) && !isNaN(cmp2)){
						   return (value >= cmp1 && value <= cmp2);
						}
						return false;
		   			}
		   		},{
				name: '-math-checkrange',  
				filter:   function(match,argsString){
						var args = argsString.split(",");
						var cmp1 = parseInt(args[0]), cmp2 = parseInt(args[1]);
						var value = match.innerText.replace(/\s*/g,'');
						if(!isNaN(value) && !isNaN(cmp1) && !isNaN(cmp2)){
						   return (value > cmp1 && value < cmp2);
						}
						return false;
		   			}
		   		},{
				name: '-math-greaterthan',  
				filter:   function(match,argsString){
						var args = argsString.split(",");
						var cmp = parseInt(args[0]);
						var value = match.innerText.replace(/\s*/g,'');
						if(!isNaN(value) && !isNaN(cmp)){
						   return (value > cmp);
						}
						return false;
		   			}
		   		},{
				name: '-math-lessthan',  
				filter:   function(match,argsString){
						var args = argsString.split(",");
						var cmp = parseInt(args[0]);
						var value = match.innerText.replace(/\s*/g,'');
						if(!isNaN(value) && !isNaN(cmp)){
						   return (value < cmp);
						}
						return false;
		   			}
			}]);			
			return done();	
		})
        
    }

    self.UpdateStyles = function(){
    	console.log("updating styles");
    }


    return self;
})




ModuleManager.Modules.Styles = MStyles;


ko.bindingHandlers.hitch = {
    init: function(element, valueAccessor, allBindingsAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        $(element).text(value);
		$(element).attr("data-hitch-interpret","1");
    } 
};  

