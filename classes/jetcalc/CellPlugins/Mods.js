var DivInfo = require(__base+"classes/jetcalc/Helpers/Div.js");


module.exports = (new function(){
	var self = this;
	self.Info = {};

	self.Prepare = function(done){
		DivInfo.get(function(err,Info){
			self.Info = Info;
			return done(err);
		})
	}

	self.Translate = function(CellName){
		return CellName;
	}

})