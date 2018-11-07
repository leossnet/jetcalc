var mongoose = require("mongoose");

module.exports = {
	models:{
		chatmessage:{
		    Body     :{ type: String, trim: true},
		    Room     :{ type: String, trim: true, index:true},
		    Ups      :{ type: Array},
		    Downs    :{ type: Array},
		    UserCode :{ type: String},
		    UserName :{ type: String},
		    UserPhoto:{ type: String},
		    CodeObj  :{ type: String},
		    Modified :{ type:Date,default:Date.now,index:true},
		    Created  :{ type:Date,default:Date.now,index:true},
		    Parent   :{ type: mongoose.Schema.Types.ObjectId,ref: 'chatmessage',default: null}
		},
		chatlog:{
			CodeUser    : {type : String, default : null, index: true},
			RoomId    : {type : String, default : null, index: true},
			DateLeave   : {type : Date, default:null}
		}
	},
	schema: {
		
	}
}

