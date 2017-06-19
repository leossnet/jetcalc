var Debug = (new function(){
	var self = this;

	self.trace = function(){
		var color = "gray", sign = "[.]";
		var args = _.values(arguments);
		var type = args.shift();
		switch (type){
			case "Er": color="maroon"; sign = "[x]"; break;
			case "Ok": color="green"; sign = "[+]"; break;
			case "In": color="orange"; sign = "[>>>]"; break;
			case "Ou": color="orange"; sign = "[<<<]"; break;
		}
		console.log(['%c '+sign+' '].concat(args).join(' '),'color:'+color);
	}
	
	return self;
})
