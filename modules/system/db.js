module.exports = {
	models:{
		"user":{
			  Server            : {type: String, default:'', extended:true}
		},
		"settings":{
			  TechMail          : {type: String, default:''}
  			, PortalName        : {type: String, default:''}
  			, SystemName        : {type: String, default:'JetCalc v1.0'}
  			, TechPhone         : {type: String, default:'',mask:"+7 (999) 999-9999"}
  			, Logo              : {type: String, default:'',template:"form_image"} 
  			, Servers           : {type: Array, default:[]} 
  			, UseRealMail       : {type: Boolean, default:false}   			
  			, Mails             : {type: Array, default:[]} 
		}
	},
	schema: {



	}
}