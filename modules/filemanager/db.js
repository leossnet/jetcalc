module.exports = {
	models:{
		file:{
			CodeDoc    : {type : String  , index : true, extended:true, ignoresave:true},
			CodePeriod : {type : String  , index : true, extended:true, ignoresave:true},
			YearData   : {type : Number  , index : true, extended:true, ignoresave:true},
			CodeObj    : {type : String  , index : true, extended:true, ignoresave:true},
			File       : {type : String  ,  default:"", view:'none',  template:'form_file', extended:true},
			PDF       : {type : String  ,  default:"", view:'none',  template:'file', extended:true}
		}
	},
	schema: {
	}
}



