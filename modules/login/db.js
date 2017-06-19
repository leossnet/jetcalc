var  crypto   = require('crypto');

module.exports = {
	models:{
		user:{
			UserPhoto  : {type : String  , default : null, extended:true, ignoresave:true, template:"form_image"},
			MailCode   : {type : String, default : '', trim : true, select:false},
			MobilePhone: {type : String, default : '', trim : true, mask:"+7 (999) 999-9999"},
			PassHash   : {select:false},
			PassSalt   : {select:false}
		},
		request:{
			MailCode  : {type : String, default : '', trim : true,select:false}	
		},
		mail: {
		    Title       : {type: String, default:''},
		    Body        : {type: String, default:''},
		    Type        : {type: String, index:true}, 
		    ToMail      : {type: String, index:true}, 
		    ToName      : {type: String}, 
		    FromMail    : {type: String, index:true}, 
		    FromName    : {type: String}, 
		    Date        : {type: Date, default:Date.now},
		    IsSent      : {type: Boolean, default: false},
		    IsError     : {type: Boolean, default: false},
		    IsRead      : {type: Boolean, default: false},
		    IsRemoved   : {type: Boolean, default: false},
		    Error       : {type: String, default: ""},
		    Retries     : {type: Number, default:0}
		}
	},
	schema: {
		user: function(schema){

			schema.path('LoginUser').set(function(val){  return (val+'').toLowerCase().trim(); });
			schema.path('Mail').set(function(val){ return (val+'').toLowerCase().trim(); });

			schema.statics.SearchableFields = function(){
				return ["NameUser","CodeUser","LoginUser","JobTitle","Phone","Mail","Comment","CodeObj"];
			}

			schema.virtual('password')
			.set(function(password) {
				if (password) {
					this._plainPassword = password;
					this.PassSalt = Math.random() + '';
					this.PassHash = this.encryptPassword(password);
					this.DoResetPass = false;
					}
				})
			.get(function() { return this._plainPassword; });
			schema.method({
				encryptPassword : function(password) {
				  return crypto.createHmac('sha512', this.PassSalt).update(password).digest('hex'); 
				},
				checkPassword : function(password) {
				  if ((this.PassHash)&&(password))
				  		return this.encryptPassword(password+'') === this.PassHash;
				  else return false;
				}
			});
			return schema; 
		},
		request: function(schema){
			schema.path('Mail').set(function(val){
				return (val+'').toLowerCase().trim();
			});
			return schema;  
		}
	}
}

