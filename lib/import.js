var config  	= require('../config.js');
var async 		= require('async');
var mongoose 	= require('mongoose');
var api			= require('./helper.js');
var models      = require('../static/src/serverconfig.js');
var mailer      = require('./mailer.js');
var _           = require('lodash');

var ModelsNames = Object.keys(models);

var initialImport = {
	removeAll:function(done){
		async.forEach(ModelsNames, function(collection, cb) {
			mongoose.model(collection).remove({}).exec(cb);
		},done);
	},

	importModels:function(done){
		var tasks = [];
		ModelsNames.forEach(function(collection) {
			tasks.push(function(cb){
				mongoose.model(collection).initialImport(true,cb)	
			})			
		})
		tasks.push(done);
		async.series(tasks);
	},

	removeBadRows:function(done){
	  console.log("Remove bad rows");
	  var Row = mongoose.model('row');
	  Row.find({CodeRow:'000000000000'}).exec(function(err,cRoot){
		  Row.find({IdParentRow:cRoot.IdRow}).exec(function(err,cRows){
		  	console.log(_.map(cRows,'CodeRow'));
		    cRows.forEach(function(R){
		    	var toRemove = [];
		        if (R.isLeaf()){
		        	toRemove.push(R);
		        }
		        var l = toRemove.length;
		        toRemove.forEach(function(RR){
	        	  R.remove(function(err){
		            console.log(R.NameRow,"Remove");  
		            if (--l==0) return done && done();
		          });
		        })
		    })
		  })
		})
	},

	notifyUserAboutPassword:function(email, username, password, done){
		var rString  = "<ul><li><b>Логин:</b></li>";
			rString += "<li>"+username+"</li>";
			rString += "<li><b>Пароль:</b></li>";
			rString += "<li>"+password+"</li>";
			//
		mailer.sendEmail(config.adminmail,"Реквизиты для входа в систему ASSOI 2015","<p>Вам присвоены временные реквизиты для входа в систему:</p><p>"+rString+"</p>",done)
	},

	init:function(done){
		var photos = {
			'tcom':'/media/images/21f03db0d826c5e62d0c08feda153f73.jpg',
			'koltec':'/media/images/28fe9c86a392a1ee3ee9fe0a8071b4cc.jpg',
			'ksug01':'/media/images/e1f8d2817f775059710cdb469269fd64.jpg',
/*			'':'/media/images/0a70e6d496ddbc7391e7fe1cf9ba1120.jpg',
			'':'/media/images/2978a48aadd2d81373b7c273500f699a.jpg',
			'':'/media/images/628b9577921f6260adf07f8929ab1608.jpg',
			'':'/media/images/9356f3617bd28e63da392b4573db9abc.jpg',
			'':'/media/images/f616ffb14c1e10ffbc9ea5dfa6719cf3.jpg',
*/
		};
		initialImport.importModels(function() {
			var Row = mongoose.model('row');
		    Row.findOne({CodeRow:'000000000000'}).exec(function(err,cRoot){
		      cRoot.IdParentRow = 0;
		      cRoot.save(function(err){
		        Row.findOne({CodeRow:'000000000000'}).exec(function(err,cRoot){
	                Row.rebuildTree(cRoot,1,function(){
	                	console.log("Setting passwords to users");
	                    mongoose.model('user').find({IsAdm:true}).exec(function(err,cUs){
	                    	var c = cUs.length
	                    	cUs.forEach(function(cU){
                    			var password = api.randomString(7);
                    			var t = cU.LoginUser.split('intro.').pop();
                    			if (photos[t]){
                    				cU.Photo = photos[t];
                    			}
                    			cU.DoResetPass = true;
	                    		cU.password = password;
	                    		cU.save(function(err){
	                    			initialImport.notifyUserAboutPassword(cU.Mail,cU.LoginUser,password,function(){
		                    			if (--c==0) {
		                    				mongoose.model('doc').findOne({CodeDoc:'nalog'}).exec(function(err,cF){
		                    					cF.IsFavorite = true;
		                    					cF.save(function(err){
		                    						console.log("Nalog is now Favorite for all");
		                    						return initialImport.removeBadRows(done);		
		                    					})
		                    				})		                    				
		                    			}
	                    			});
	                    		});
	                    	})
	                    })
	                });
		        })        
		      })
		    })
		});
	},
}

exports.removeAll  = initialImport.removeAll;
exports.init  = initialImport.init;


