module.exports = {
	models:{
		file:{
			CodeDoc    : {type : String  , default: "", refmodel: "doc", index: true},
			CodePeriod : {type : String  , default: "", refmodel: "period", index: true},
			YearData   : {type : Number  , index : true},
			CodeObj    : {type : String  , default: "", refmodel: "obj", index: true},
			File       : {type : String  ,  default:"", view:'none',  template:'form_file', extended:true},
			PDF       : {type : String  ,  default:"", view:'none',  template:'file', extended:true}
		}
	},
	schema: {
	}
}

