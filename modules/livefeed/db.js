var  mongoose   = require('mongoose');
var  async   = require('async');
var  _   = require('lodash');

module.exports = {
	models:{
		lfmessage:{
	        MarkDown: {type : String, default:''},
	        HTML: {type : String, default:''},
	        MessageType: {type : String, default:'Message'},
	        CodeRole: {type : Array, default:[]},
	        CodeGrp: {type : Array, default:[]},
	        CodeManualPage: {type : Array, default:[]},
	        CodeAttach: {type : Array, default:[]},
	        NeedConfirm: {type : Boolean, default:false},
	        HasQuestion: {type : Boolean, default:false},
	      	Question: {type: String, default: ""},
	      	Options: {type: Array, default: []},
	      	DateAdded: {type: Date, index:true},
	      	CodeUser: {type: String, default: ""},
			Correct: {type: Array, default: []},
			UsersToShow:{type: Array, default: [],index:true},
			UsersConfirmed:{type: Array, default: [],index:true}
		}/*,
		user:{
			InAttentive: {type : Boolean, default:false}
		}
		*/
	},
	schema: {
		lfmessage:function(schema){

			schema.methods.users = function(done){
				var self = this, result = [];
				var _loadRoles = function(Roles,done){
					if (_.isEmpty(Roles)) return done(null,null);					
					mongoose.model("permitrole").find({CodeRole:{$in:Roles}},"-_id CodePermit").isactive().lean().exec(function(err,Permits){
						mongoose.model("userpermit").find({CodePermit:{$in:_.map(Permits,"CodePermit")},CodeUser:{$ne:self.CodeUser}},"-_id CodeUser").isactive().lean().exec(function(err,users){
							return done(null,_.map(users,"CodeUser"));
						})
					})
				}
				var _loadGrps = function(Grps,done){
					if (_.isEmpty(Grps)) return done(null,null);
					mongoose.model("objgrp").find({CodeGrp:{$in:Grps}},"-_id CodeObj").isactive().lean().exec(function(err,Objs){
						mongoose.model("user").find({CodeObj:{$in:_.map(Objs,"CodeObj")},CodeUser:{$ne:self.CodeUser}},"-_id CodeUser").isactive().lean().exec(function(err,users){
							return done(null,_.map(users,"CodeUser"));
						})
					})
				}
				var _loadAll = function(done){
					mongoose.model("user").find({CodeUser:{$ne:self.CodeUser}},"-_id CodeUser").isactive().lean().exec(function(err,users){
						return done(null,_.map(users,"CodeUser"));
					})
				}
				_loadAll(function(err,usersAll){
					_loadGrps(self.CodeGrp,function(err,users1){
						if (users1==null) users1 = usersAll;
						_loadRoles(self.CodeRole,function(err,users2){
							if (users2==null) users2 = usersAll;
							return done(null,_.uniq(_.intersection(users1,users2)));
						})
					})
				})
			}
			
			return schema;
		}
	}
}

