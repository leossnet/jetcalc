module.exports = {
	models:{
		mssettings:{
			usecron:{type:Boolean, default:false},
			RepoOwner:{type:String, default:'dkoviazin'},
			GitLogin :{type:String, default:''},
			Password :{type:String, default:'', template:'form_password'},
			MainRepoOwner:{type:String, default:'leossnet'},
			LastSync:{type:Date, default:null},
			DoBundle : {type : Boolean, default:true}
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
		},
		settings:{
			  TechMail          : {type: String, default:''}
  			, PortalName        : {type: String, default:''}
  			, SubName           : {type: String, default:''}
  			, SystemName        : {type: String, default:'JetCalc v1.4'}
  			, TechPhone         : {type: String, default:'',mask:"+7 (999) 999-9999"}
  			, Logo              : {type: String, default:'',template:"form_image"}
  			, Icon 				: {type: String, default:'',template:"form_image"}
  			, Servers           : {type: Array, default:[]}
  			, UseRealMail       : {type: Boolean, default:false}
  			, Mails             : {type: Array, default:[]}
  			, MailService       : {type: String, default:'Yandex'}
  			, MailHost          : {type: String, default:'smtp.yandex.ru'}
			  , MailPort          : {type: Number, default:465}
  			, MailSecureConnection : {type: Boolean, default:true}
  			, RequiresAuth 		: {type: Boolean, default:true}
  			, MailFromName      : {type: String, default:"Оповещения JetCalc"}
  			, MailAuthUser      : {type: String, default:'jetcalc@yandex.ru'}
  			, MailAuthPass      : {type: String, default:'derparole12j', template:'form_password'}
				, WelcomeMessage    : {type: String, default: '', template: 'form_html'}
		}
	},
	schema: {

	}
}
