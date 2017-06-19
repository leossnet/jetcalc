module.exports = {
	models:{
		mssettings:{
			usecron:{type:Boolean, default:false},
			RepoOwner:{type:String, default:'dkoviazin'},
			GitLogin :{type:String, default:''},
			Password :{type:String, default:'', template:'form_password'},
			LastSync:{type:Date, default:null},
			DoBundle : {type : Boolean, default:false}
		},
		msmodule:{
			gitid:{type:Number, default:0, index:true},
			ModuleName:{type:String, default:''},
			ShortName:{type:String, default:''},
			Type:{type:String, default:'module'},
			Description:{type:String, default:''},
			ReadMe:{type:String, default:''},
			Model:{type:String, default:''},
			Icon:{type:String, default:''},
			Version:{type:String, default:'1.0'},
			InstalledVersion:{type:String, default:'1.0'},
			IsInstalled: {type : Boolean, default:false}
		},
		msissue:{
			gitid:{type:Number, default:0, index:true},
			Url:{type:String, default:''},
			UserName:{type:String, default:''},
			UserAvatar:{type:String, default:''},
			Number:{type:Number, default:0},
			DateAdded: {type : Date, default:Date.now},
			Title: {type : String, default:''},
			Body: {type : String, default:''},
			BodyMarkDown: {type : String, default:''},
			Module: {type : String, default:'jetcalc'},
			State: {type : String, default:'open'},
			Labels: {type : Array, default:[]},
			Comments: {type : Array, default:[]}
		}
	},
	schema: {
		
	}
}

