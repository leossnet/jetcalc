var  crypto   = require('crypto');
var  _   = require('lodash');
var  mongoose   = require('mongoose');

module.exports = {
	models:{
		colsetcol:{
 			IsPredictFormula: {"type": Boolean,"default": false,"view": "none"},
            PredictFormula: {"type": String,"default": "","view": "none"}, 
		}
	},
	schema: {
		
	}
}

