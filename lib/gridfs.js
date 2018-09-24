var config = require('../config.js').gridfs;
var mongo = require('mongodb');
var Grid = require('gridfs-stream');	




var mongoose = require('mongoose');
var Grid = require('gridfs-stream');
Grid.mongo = mongoose.mongo;



var GridFileSystem = function (){

	var self = this;
	self.gfs = null;	
	 
	self.init = function(){
		return;
		var url = 'mongodb://localhost:27017/'+config.dbname;
		var conn = mongoose.createConnection(url);
		conn.once('open', function () {
		  GridFileSystem.gfs = Grid(conn.db);
		  console.log("GFS is inited");
		  // all set!
		})
	}
	
	self.saveData = function(data,done){
		console.log("save to gfs",data);
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