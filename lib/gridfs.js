var config = require('../config.js').gridfs;
var mongo = require('mongodb');
var Grid = require('gridfs-stream');	



var GridFileSystem = function (){

	var self = this;
	self.gfs = null;	
	 
	self.init = function(){
		var db = new mongo.Db(config.dbname, new mongo.Server(config.host, config.port||27017));
		self.gfs = Grid(db, mongo);  
		//mongo.MongoClient.connect(function (err) {
		//	if (err) {console.log(err);} 
			
		//})
	}
	
	self.saveData = function(data,done){
		  data = JSON.stringify(data);
		  var writestream = self.gfs.createWriteStream();
		  writestream.on('finish', function () {return done(writestream.id)});
		  writestream.write(data);
		  writestream.end();
	}
	

	self.getData = function (id,done){
		var readstream = self.gfs.createReadStream({_id: mongo.ObjectID(id)});
		var buffer = "";
		readstream.on('data', function(data) {
            buffer += data
        }).on("end", function() {
            done(null, JSON.parse(buffer.toString('utf-8'))); 
        }).on("error", function(e) {
            done(e);
        })
	}
	
	self.removeData = function(ids,done){
		ids = ids.map(function(u){return mongo.ObjectID(u);})
		self.gfs.remove({ _id: {$in:ids}}, function (err) {
			if (err) console.log(err);
			return done && done();
		});
	}
	
};

var FS = new GridFileSystem();
FS.init();

module.exports = exports = FS;