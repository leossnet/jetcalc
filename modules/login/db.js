var  crypto   = require('crypto');
var  _   = require('lodash');
var  mongoose   = require('mongoose');

module.exports = {
	models:{
		user:{
			UserPhoto  : {type : String  , default : null, extended:true, ignoresave:true, template:"form_image"},
			MailCode   : {type : String, default : '', trim : true, select:false},
			MobilePhone: {type : String, default : '', trim : true},
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
			schema.pre('save',function(next, CodeUser, done){
				var self = this;
				var SimilarQ = [];
				if (!_.isEmpty(self.LoginUser)){
					SimilarQ.push({LoginUser:self.LoginUser,_id:{$ne:self._id}});
				}
				if (!_.isEmpty(self.Mail)){
					SimilarQ.push({Mail:self.Mail,_id:{$ne:self._id}});
				}
				mongoose.model("user").findOne({$or:SimilarQ},"-_id LoginUser Mail").isactive().exec(function(err,Similar){
					if (Similar) {
						var Errs = [];
						if (!_.isEmpty(Similar.Mail) && Similar.Mail==self.Mail)return done("почта "+Similar.Mail+' уже используется');
						if (!_.isEmpty(Similar.LoginUser) && Similar.LoginUser==self.LoginUser) return done("логин "+Similar.LoginUser+' уже используется');
					}
					return next();
				})
			});


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

