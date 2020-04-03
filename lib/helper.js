var mongoose = require('mongoose'),
config       = require('../config.js'),
fs           = require('fs'),
_            = require('lodash'),
async        = require('async'),
moment       = require('moment'),
Type         = require('type-of-is'),
models       = null,
compare      = require('./objectdiff.js'),
os           = require('os'),
f            = require('./functions.js'),
request      = require('request'),
rootDir      = config.dir;


var 	sql           = require('mssql');
var db = require(__base+'/sql/db.js');



var h_sandbox    = require('./helpers/sandbox.js');
var h_crud       = require('./helpers/crud.js');
var h_sql        = require('./helpers/sql.js');
var h_link       = require('./helpers/link.js');
var h_simplesql  = require('./helpers/sqldb.js');



/*var ModelsConfig = function(){
	var parse  = require('./helpers/parseconfig.js').parse;
	var Raw = {};
	try{
	 	Raw = require(config.dir+'/static/src/serverconfig.js');
	} catch (e){
		console.log("Конфиг не обнаружен");
	}
	var R = parse(Raw);
	return R;
}

*/
var Timer = function(){
	var self = this;
	self._times = {};	
	self.Result = {};	
	self.Init = function(){
		self._times = {};
		self.Result = {};
	}

	self.Start = function(label){
		self._times[label] = process.hrtime();
	};
	self.End = function(label){
		try{
		    var precision = 3;
		    var elapsed = process.hrtime(self._times[label]);
		    var result = (elapsed[0]* 1e9 +elapsed[1])/1000000000;
		    self.Result[label] = result;
		    console.log("Time:"+label,result);
		} catch(e){;}
	};
}





/*

*/







var helper = {

	Timer:Timer,

	requireAuth:function(req, res, next){
		if (req.isAuthenticated()) return next();
		return next("forauthusersonly");
	},


	sqlDB:db,

	progressBars:{},


	ProgressBar:function(userid){
		
		var self = this;

		self.userid       = userid;
		self.steps        = 0;
		self.step         = 0;
		self.stepProgress = 0;
		self.stepInfo     = "";
		self.tasks        = 0;
		self.task         = 0;
		self.taskProgress = 0;
		self.time         = 1000;
		self.timeInterval = null;
		self.id = mongoose.Types.ObjectId();
		self.sockets = null;
	
		if (userid){
			mongoose.model('user').findOne({_id: self.userid}).exec(function(err,u){
				u.getSockets(function(sockets){
					var ss = [];
					_.each(sockets, function(socket){
						if (helper.io.sockets.connected[socket]) {
							ss.push(socket);
						}
					})
					self.sockets = ss;
				})
			})
		}

		self.init = function(steps){
			self.steps = steps;
			helper.progressBars[self.id] = self;
			return self.id;
		}

		self.do = function(step,tasks,task,info){
			self.stepInfo = info;
			self.step = step;
			self.stepProgress = Math.floor(self.step/self.steps*100);
			if (isNaN(self.stepProgress)) self.stepProgress = 0;
			self.tasks = tasks;
			self.task = task;
			self.taskProgress = Math.floor(self.task/self.tasks*100);
			if (isNaN(self.taskProgress)) self.taskProgress = 0;
			if (!self.timeInterval){
				self.timeInterval = setInterval(self.announce,self.time);
			}
			if (self.steps==self.step && self.tasks==self.task){
				self.finish();
			}
		}
		self.finish = function(){
			clearInterval(self.timeInterval);
			self.send({IsFinished:true});
			helper.progressBars = _.omit(helper.progressBars,self._id);
			self = null;
		}

		self.send = function(dataR){
			var data = {}; data[self.id] = dataR;
			if (self.sockets){ // юзер будет удален :)
				_.each(self.sockets, function(socket){
					if (helper.io.sockets.connected[socket]) {
						helper.io.sockets.connected[socket].emit('progressbar', data);
					}
				})					
			}				
		}

		self.announce = function(){
			var text = self.task+'/'+self.tasks+': '+self.stepInfo;
			if (self.userid){
				self.send({'step':self.stepProgress,'task':self.taskProgress,'text':text});
			} else {
				helper.log(text,self.stepProgress,self.taskProgress);
			}
		}
		return self;
	},


	connectionMSSQL: null,	
	
	importIsOn : false,
	
	connection :null, // connect to mongo
	sessionStore: null,
	gridfs     : require('./gridfs.js'),

	log:function (){
		if (!config.silent) console.log(arguments);
	},

	getJSON:function(url, done){
		var http = require('http');
	    http.get(url, function(res) {
	        var body = '';
	        res.on('data', function(chunk) {
	            body += chunk;
	        });
	        res.on('end', function() {
	            return done && done(null,JSON.parse(body));
	        });
	    }).on('error', function(e) {
	          return done && done(e);
	    });
	},

	ucfirst:function(text){
		var text = text+'';
		return text.substring(0,1).toUpperCase()+text.substring(1).toLowerCase();
	},
	parseTags:function(text){
		var parts = text.replace(/\/\s*\//g,'/').split('/'); parts.pop(); parts.shift();
		return _.map(parts,function(i){ return '/'+i+'/';})
	},
	
	compareId:function(t1,t2){
		return (t1+'')==(t2+'');
	},

	
	ObjectId:mongoose.Types.ObjectId,
	
	isObjectId:function(id){
		var match = (id+'').match(/^[a-fA-F0-9]{24}$/);
		return match!==null;
	},

	//ModelsConfig:ModelsConfig(),
	//RebuldModelsConfig:ModelsConfig,
	
	mongoosePlugins : {

		Sandbox:h_sandbox,

		SimpleSql:h_simplesql,

		SQL:h_sql,

		LinkUpdate: h_link,		

		Define:function(schema, options) {
			schema.statics['getConfig'] = function(){ return options; };	
			schema.methods['getConfig'] = function(){ return options; };	
		},

		Unselectable:function(schema,fields){
			for (var Field in schema.paths){
				if (Field.substring(0,2)=='Id' && schema.paths['Code'+Field.substring(2)] || Field.substring(0,3)=='Old'){
					schema.path(Field).select(false);		
				}
			}
		},

		Validator:function(schema, options) {
			for (var rule in options){
				if (rule=="maxlength"){
					for (var field in options[rule]){
						schema.path(field).validate(function (v) {
							  if (v=='null' ||!v) return false;

							  return v.length > options[rule][field];
						}, 'Длина поля '+field+' превышает '+options[rule][field]); 		 				
					}
				}
			}
		},

		Modified:function(schema, options) {
			options = options || {};
			schema.add({ DateEdit:  {type : Date  }  });
			schema.add({ UserEdit:  {type : String, default : ''}});
			schema.methods.userSave = function (CodeUser, cb) {
				this.UserEdit = CodeUser
				this.save(cb)
			}
			schema.methods.userRemove = function (CodeUser, cb){
				console.log('AAAAAAAAAAAAAAAAA')
				console.log(arguments)
				console.log(CodeUser, this)
				console.log('------------------')
				this.UserEdit = CodeUser
				this.remove(cb)
			}
			schema.pre('save', function (next,done) {
				this.DateEdit = Date.now();
				return next();
			})
		},

		Searchable: function(schema) {			
			schema.add({ search:  {type : String, default : '', trim : true, select:false}  }) // Не включать index
			schema.post('save', function (next,done) {
				var self = this, search = "";
				var Fields = [];
				if (self.schema.statics.SearchableFields){
					Fields = self.schema.statics.SearchableFields();
				}
				var MC = schema.statics.cfg();
				if (_.isEmpty(Fields)){
					Fields = _.compact([MC.Code,MC.Name]);
				}
				var ModelName = MC.ModelName;
				mongoose.model(ModelName).findOne({_id:self._id},'-_id '+Fields.join(' ')).lean().exec(function(err,cM){
					mongoose.model(ModelName).findByIdAndUpdate(self._id,{$set:{search:_.values(cM).join(' ').toSearchString()}});
				})
			})
		}
	},
	
	REST:h_crud,

	//REST:
	
	// Doc Permissions

	//middleware to check if user authenticated
	checkAuth: function(req,res,next) {
		if (req.isAuthenticated())
			return next();
		else
			res.status(401).send({error: 'unauthorized'});
	},

	// middleware to check doc permissions
	// checkDocPermissions: function(req,res,next) {
	// 	if (req.user.isAdmin) return next();
	// 	if (!req.session && !req.session.permissions) {
	// 		var params = req.params;
	// 		var permits = req.session.permissions;

	// 		mongoose.model('doc').findOne({CodeDoc: params.doc},'-_id CodeRole').lean().exec(function(err,D){
	// 			if (err) console.log(err);
	// 			if (D) {
	// 				permsPath.push(D.CodeRole);
	// 				permsPath.push(params.org);

	// 				var select = {
	// 					CodePeriod    : params.period, 
	// 					CodePeriodGrp : {$in: ['PLAN','FACT','KORR']},
	// 				}

	// 				mongoose.model('periodgrpref').findOne(select,'-_id CodePeriodGrp').lean().exec(function(err,periodGrp){
	// 					if (err) console.log(err);
	// 					permsPath.push(periodGrp.CodePeriodGrp);

	// 					var isInput = false;
	// 					if (parmas.type && parmas.type=='input' || api.parseBoolean(parmas.IsInput)) isInput = true;
	// 					if (isInput) {
	// 						permsPath.push('w');
	// 					} else {
	// 						permsPath.push('r');
	// 					}

	// 					console.log(permits)
	// 					var status = _.get(permits,permsPath.join('.'));
	// 					console.log('Permissions_status: ',status, permsPath);

	// 					if (!status) {
	// 						do {
	// 							permsPath.pop();
	// 							console.log(permsPath.length,permsPath.join('.'));
	// 						} while (_.get(permits),permsPath && permsPath.length > 0)

	// 						switch (permits.length) {
	// 							case 1: status = 'У вас нет прав на работу с этим документом'; break;
	// 							case 2: status = 'Для вас не назначены права для работы с организацией'; break;
	// 							case 3: status = 'У вас не хватает прав'; break;
	// 							default: status = 'У вас нет прав на работу с этим документом';
	// 						}

	// 						return done(status);

	// 					} else {
	// 						return done(null);
	// 					}
	// 				});
	// 			}
	// 		});

	// 	} else {
	// 		res.send(401);
	// 	}
	// },
	checkDocPermissions: function(params,permits,done) {
		// console.log(req.user)
		// if (api.parseBoolean(req.user.isAdmin)) return done(null);
		var permsPath = [];
		mongoose.model('doc').findOne({CodeDoc: params.doc},'-_id CodeRole').lean().exec(function(err,D){
			if (err) console.log(err);
			if (D) {
				permsPath.push(D.CodeRole);
				permsPath.push(params.org);

				var select = {
					CodePeriod    : params.period, 
					CodePeriodGrp : {$in: ['PLAN','FACT','KORR']},
				}

				mongoose.model('periodgrpref').findOne(select,'-_id CodePeriodGrp').lean().exec(function(err,periodGrp){
					if (err) console.log(err);
					permsPath.push(periodGrp.CodePeriodGrp);

					if (params.type) {
						permsPath.push('w');
					} else {
						permsPath.push('r');
					}

					var status = _.get(permits,permsPath.join('.'));

					if (!status) {
						do {
							permsPath.pop();
						} while (_.get(permits),permsPath && permsPath.length > 0)
						if (permits){
							switch (permits.length) {
								case 1: status = 'У вас нет прав на работу с этим документом'; break;
								case 2: status = 'Для вас не назначены права для работы с организацией'; break;
								case 3: status = 'У вас не хватает прав'; break;
								default: status = 'У вас нет прав на работу с этим документом';
							}
						} else {
							status = 'Не понятно, что произошло';
						}

						return done(status);
					} else {
						return done(null);
					}
				});
			}
		});


		// if (req.session && req.session.Permissions) {
		// 	var request = [params.org,params.period,role]
		// } else {
		// 	res.statusCode = 401; 
		// 	res.end();
		// }

	},
	// checkDocPermissions:function(params,permits, done){
	// 	// console.log(permits);
	// 	if(permits.sys.indexOf('IsAdmin')>=0) return done(null);
	// 	mongoose.model('doc').findOne({CodeDoc:params.doc},'-_id CodeRole').exec(function(err,cD){
	// 		if (err) console.log("checkDocPermissions@err:",err);
	// 		if (cD) {
	// 			var DocType = cD.CodeRole;
	// 			mongoose.model('periodgrpref').find({CodePeriod:params.period,CodePeriodGrp: { $in: ['PLAN','FACT','KORR'] }},'-_id CodePeriodGrp').lean().exec(function(err,cGrps){
	// 				var periodGrp = _.first(_.map(cGrps,'CodePeriodGrp'));
	// 				var field = "DoRead";
	// 				if (params.type){
	// 					field = "DoWrite";
	// 				}
	// 				var org = params.org;
	// 				var testOrg = org;
	// 				if (!_.isArray(testOrg)) testOrg = [testOrg];
	// 				var test = false, errorText = "У вас не хватает прав"; 
	// 				var avOrgs = permits.allobjs;
	// 				var OrgTest = true;	
	// 				testOrg.forEach(function(TO){
	// 					if (avOrgs.indexOf(TO)==-1) {
	// 						errorText = "Для вас не назначены права для работы с организацией";	
	// 						OrgTest = false;
	// 					}
	// 				})
	// 				if (!OrgTest) return done(errorText);
	// 				permits && permits.roles && permits.roles.forEach(function(Role){
	// 					if (Role[field] && Role.periodGrp==periodGrp){
	// 						if (Role.role.CodeRole!=DocType){
	// 							errorText = "У вас нет прав на работу с этим документом: (нужны права на роль: "+DocType+")";
	// 						} else {
	// 							errorText = "";
	// 							test = true;
	// 						}
	// 					}
	// 				})
	// 				if (!test) {
	// 					return done(errorText);
	// 				} else {
	// 					return done(null);
	// 				}
	// 			})
	// 		} else {
	// 			return done(err);
	// 		}
	// 	})
	// },

	// Drop Zone 
	resizeImage:function(xsize){
		return function(req, res, next){
			if (req.files){
				var im = require('imagemagick');
				var image = req.files.file, path = image.path;								
				var temp = image.path.split('.'), ext = temp.pop();
				var newPath = temp.join('.')+'_r'+'.'+ext;				
				im.resize({
					srcPath: path,
					dstPath: newPath,
					filter: 'lanczos',
					strip: false,
					width:   xsize
				}, function(err, stdout, stderr){
					fs.unlink(path,function(err){
						req.files.file.path = newPath;
						next();
					})
				});
			} else {
				next();
			}
		}	
	},
	imageFromCanvas:function(className,field){
		return function(req, res, next){
			if (req.body[field] && req.body[field].indexOf(';base64,')!=-1){
				var fileName = helper.canvasToFile(req.body[field],100,config.staticDir+'/media/'+className+'/'+req[className]._id);	
				req.body[field] = fileName.replace(config.staticDir,'');
			}
			next();			
		}	
	},
	dropZone_add:function(req,res,next){
		if (req.files){
			var image = req.files.file, path = image.path;										
			res.json({name:image.originalname,path:path});
		} else {
			res.json({err:'Upload problem'});
		}
	},
	dropZone_remove:function(req,res,next){
		return res.json({status:'ok'})
	},


	checkRole:function(roles){
		return function(req, res, next){
			var verdict = false;
			roles.forEach(function(R){
				if (req.user[R]) verdict = true;
			})
			req.roleCheck = verdict;
			return next();
		}
	},
	forceCheckRole:function(roles){
		return function(req, res, next){
			var verdict = false;
			roles.forEach(function(R){
				if (req.user[R]) verdict = true;
			})
			req.roleCheck = verdict;
			if (!verdict) return res.send(401,{require:roles});
			next();
		}
	},
	role: function(roles,modelname){		
		return function(req, res, next){
			if (roles.indexOf(req.user.role)>=0){
				next();
			} else if (roles.indexOf('owner')>=0){
				if (req[modelname] && typeof req[modelname].isOwner=='function'){
					if (req[modelname].isOwner(req.user)){
						next();
					} else {
						res.statusCode = 401; 
						res.end(); 
					}
				} else {
					res.statusCode = 401; 
					res.end();
				}
			} else {
				res.statusCode = 401; 
				res.end(); 
			}
		}
	},
	md5: function(text){
		var crypto = require('crypto');
		var hash = crypto.createHash('md5').update(text).digest('hex');		
		return hash;
	},
	 	
	
	dropZoneRemove:function(req,objectType,field,done){
		var W = req[objectType];
		var dir = ""; var files = [];
		if (!W){
			dir = rootDir+'/static/files/temp/'+req.user._id;	
			files = req.session.tempFiles[field];
		} else {
			dir = rootDir+'/static/files/'+W._id;	
			files = W[field];
		}	
		var fileName = req.body.id;
		var remover = -1;
		files.forEach(function(it,i){
			if (it.path.split('/').pop()==fileName){
				remover = i;
			}
		})
		if (remover>=0){
			if(fs.existsSync(dir+'/'+fileName)){
				fs.unlinkSync(dir+'/'+fileName);
			}
			files.splice(remover,1)
		}
		return done && done(files);
	},
	dropZoneAdd:function(req,objectType,field,done){
		var W =req[objectType];
		var dir = ""; var tempDir = null; var files = []; var wwwdir = '/files';
		if (!W){
			dir = rootDir;	
			tempDir = rootDir+'/static/files/temp';
			wwwdir += '/temp/'+req.user._id;
			dir = tempDir+'/'+req.user._id;
			if (!req.session.tempFiles) req.session.tempFiles = {};
			if (!req.session.tempFiles[field]){
				req.session.tempFiles[field] = [];
			}		
			files = req.session.tempFiles[field];
		} else {
			dir = rootDir+'/static/files/'+W._id;	
			wwwdir += '/'+W._id;
			files = W[field];
		}
		if (tempDir && !fs.existsSync(tempDir)) fs.mkdirSync(tempDir, 0777, function(err){})
		if(!fs.existsSync(dir)) fs.mkdirSync(dir, 0777, function(err){})
		var file = req.files.file;
		helper.copyFile(file.path,dir+'/'+file.name,function(err){
			var infer = {
				path:wwwdir+'/'+file.name,
				size:file.size,
				type:file.type
			};
			if (err) return done && done(files);
			files.push(infer);
			return done && done(files);
		});
	},	
	randomNumber:function(length){
		var text = "";
		var possible = "0123456789";
		for( var i=0; i < length; i++ ) text += possible.charAt(Math.floor(Math.random() * possible.length));
		return text;
	},
	randomString:function(length){
		var text = "";
		var possible = "abcdefghijklmnopqrstuvwxyz";
		for( var i=0; i < length; i++ ) text += possible.charAt(Math.floor(Math.random() * possible.length));
		return text;
	},
	translit: function(str){
		var arr={'а':'a', 'б':'b', 'в':'v', 'г':'g', 'д':'d', 'е':'e', 'ж':'g', 'з':'z', 'и':'i', 'й':'y', 'к':'k', 'л':'l', 'м':'m', 'н':'n', 'о':'o', 'п':'p', 'р':'r', 'с':'s', 'т':'t', 'у':'u', 'ф':'f', 'ы':'i', 'э':'e', 'А':'A', 'Б':'B', 'В':'V', 'Г':'G', 'Д':'D', 'Е':'E', 'Ж':'G', 'З':'Z', 'И':'I', 'Й':'Y', 'К':'K', 'Л':'L', 'М':'M', 'Н':'N', 'О':'O', 'П':'P', 'Р':'R', 'С':'S', 'Т':'T', 'У':'U', 'Ф':'F', 'Ы':'I', 'Э':'E', 'ё':'yo', 'х':'h', 'ц':'ts', 'ч':'ch', 'ш':'sh', 'щ':'shch', 'ъ':'', 'ь':'', 'ю':'yu', 'я':'ya', 'Ё':'YO', 'Х':'H', 'Ц':'TS', 'Ч':'CH', 'Ш':'SH', 'Щ':'SHCH', 'Ъ':'', 'Ь':'',
		'Ю':'YU', 'Я':'YA'};
		var replacer=function(a){return arr[a]||a};
		return str.replace(/[А-яёЁ]/g,replacer).toLowerCase().replace(/[^a-z]/g,'');
	},
	dirname:function(path, next){
		var z = path.split('/');z.pop();
		return z.join('/');
	},
	copyFile:function(source, target, cb) {
		  var cbCalled = false;
		  var rd = fs.createReadStream(source);
		  rd.on("error", done);
		  var wr = fs.createWriteStream(target);
		  wr.on("error", done);
		  wr.on("close", function(ex) {
			done();
		  });
		  rd.pipe(wr);
		  function done(err) {
			if (!cbCalled) {
			  cb(err);
			  cbCalled = true;
			}
		  }
	},
	canvasToFile:function (data,size,fileName){
		var im = require('node-imagemagick');
		var r = new RegExp (/^data:image\/(\w+);base64,/);
		var match = r.exec(data);
		if (!match || !match.length) return '';
		var extension = match[1];
		
		data = data.replace(/^data:image\/\w+;base64,/, "");
		var buf = new Buffer(data, 'base64');
		
		var realFileName = fileName+'.'+extension;
		fs.writeFile(realFileName, buf,null,function(err){
			if (err) {

			} else {
				// helper.log("Saved!");
			}
			var imparams = {
				width: size,
				srcPath: realFileName,
				dstPath: realFileName,
				filter: 'Lanczos',
				strip:false
			}
			/**/
			im.resize(imparams, function(err, stdout, stderr){
				if (err){
					//throw err;	
					helper.log(err,stdout,stderr);
				} else {
					// helper.log("Resized!");
				}

			});	
			/**/	
		});	
		return realFileName;
	},

	parseBoolean:function (test){
		return (test===true || test==="true");
	},	
	parseNumber:function (test){
		var test = helper.ignoreEmpty(test);
		if (test===null || test==='null') return 0;
		if (test===undefined || test==='undefined') return 0;
		if (isNaN(test)) return 0;
		var s = (test+'').replace(',','.')
		var result = parseFloat(s);
		if (isNaN(result)) return 0;
		return result;
	},
	isArray:function(arr){
		return Object.prototype.toString.call(arr)=="[object Array]";
	},
	ignoreEmpty:function(val) {
  		if ("" === val || val==undefined) {
    		return null;
  		} else {
    		return val
  		}
	},	
	aliaser:function(str){
		var arr={'а':'a', 'б':'b', 'в':'v', 'г':'g', 'д':'d', 'е':'e', 'ж':'g', 'з':'z', 'и':'i', 'й':'y', 'к':'k', 'л':'l', 'м':'m', 'н':'n', 'о':'o', 'п':'p', 'р':'r', 'с':'s', 'т':'t', 'у':'u', 'ф':'f', 'ы':'i', 'э':'e', 'А':'A', 'Б':'B', 'В':'V', 'Г':'G', 'Д':'D', 'Е':'E', 'Ж':'G', 'З':'Z', 'И':'I', 'Й':'Y', 'К':'K', 'Л':'L', 'М':'M', 'Н':'N', 'О':'O', 'П':'P', 'Р':'R', 'С':'S', 'Т':'T', 'У':'U', 'Ф':'F', 'Ы':'I', 'Э':'E', 'ё':'yo', 'х':'h', 'ц':'ts', 'ч':'ch', 'ш':'sh', 'щ':'shch', 'ъ':'', 'ь':'', 'ю':'yu', 'я':'ya', 'Ё':'YO', 'Х':'H', 'Ц':'TS', 'Ч':'CH', 'Ш':'SH', 'Щ':'SHCH', 'Ъ':'', 'Ь':'','Ю':'YU', 'Я':'YA'};
		var replacer=function(a){return arr[a]||''};
		return str.replace(/[А-яёЁ]/g,replacer).toLowerCase().replace(/[^A-Za-z0-9\.]/g,' ').trim().replace(/\s/g,'_').replace(/__/g,'_').replace(/_/g,'-').replace('-.','.');
	},

	
	
	getTableAnswer:function (modelname,query,defaultsort,req,res,populates,done){
		var s      = req.query["skip"] || req.body["skip"];
		var l      = req.query["limit"] || req.body["limit"];
		var srt    = req.query["sort"] || req.body["sort"];
		var search = req.query["search"] || req.body["search"];
		var skip   = parseInt(s)||0; 
		var limit  = parseInt(l)||10;
		var sort   = srt || defaultsort;
		query      = req.query["query"] || req.body["query"] || {};
		if (search && search.length>1){
			query['search'] = {$regex :  new RegExp(search, "i")};
		}
		if (!req.session.sandbox) req.session.sandbox = {On:false,CodeUser:req.user.CodeUser};
		mongoose.model(modelname).count(query).sandbox(req.session.sandbox.CodeUser,req.session.sandbox.On).exec(function(err,cCount){
			var qwimer = mongoose.model(modelname).find(query).sandbox(req.session.sandbox.CodeUser,req.session.sandbox.On).skip(skip).limit(limit).sort(sort);
			populates && populates.forEach(function(p){
				qwimer.populate(p[0],p[1]);
			})
			qwimer.lean().exec(function(err,cObjects){
				// console.log(modelname,err,cObjects)
				var result = {};
				if (mongoose.model(modelname).maskIt){
					result.content = _.map(cObjects, function(p){
						return mongoose.model(modelname).maskIt(p,req.user);
					})
				} else {
					result.content = cObjects;					
				}
				result.total = cCount;
				result.totalPages = Math.ceil(cCount/limit);
				result.size = limit;
				done && done (result);
			})
		})
	},
	tableAnswer:function (modelname,query,defaultsort,req,res,populates){
		helper.getTableAnswer(modelname,query,defaultsort,req,res,populates,function(result){
			res.json(result);
		})
	}


}


module.exports = helper;
