var config = require(__base + '/config.js').gridfs || {};
var mongo = require('mongodb');
var grid = require('gridfs-stream');
var fs = require('fs');
var mime = require('mime-types');
var _ = require('lodash');
var multer = require('multer');
var os = require("os");

var GridFS = (new function () {
    var self = this;

    self.GFS = null;

    self.router = require("express").Router();

    self.Init = function (done) {
        var dbName = config.dbname;
        var hostName = config.host;
        var port = config.port || 27017;
        var db = new mongo.Db(dbName, new mongo.Server(hostName, port));
        db.open(function (err) {
            if (err) return done(err);
            self.GFS = grid(db, mongo);

            self.router.post('/api/gfs', multer({ dest: os.tmpdir()}).single('file'),function (req, res, next) {
            	console.log(req.file);
                if (!req.file || !req.file) return next("Upload File Error");
                var File = req.file;
                File.name = File.originalname;
                self.SaveFile(File, function (err, FileInfo) {
                    if (err) return next(err);
                    return res.json(FileInfo);
                })
            })
            self.router.get('/api/gfs/remove/:id', function (req, res, next) {
                self.RemoveFile(req.params.id, function (err, data) {
                    if (err) return next(err);
                    return res.json({});
                });
            })
            self.router.get('/api/gfs/download/:id', function (req, res, next) {
                self.DownloadStreamToRes(req.params.id, res, next);
            })
            self.router.get('/api/gfs/:id', function (req, res, next) {
                self.PipeFileStreamToRes(req.params.id, res, next);
            })
            self.router.get('/api/gfs/byname/download/:id', function (req, res, next) {
                self.DownloadStreamToResByName(req.params.id, res, next);
            })
            self.router.get('/api/gfs/byname/:id', function (req, res, next) {
                self.PipeFileStreamToResByName(req.params.id, res, next);
            })
            return done();
        })
    };

    self.SaveFile = function (FileInfo, done, filename) {

        if (typeof FileInfo == 'string') {
            var Stat = {};
            fs.stat(FileInfo, function (err, stats) {
                if (err) return done(err);
                Stat = stats;
            });
            FileInfo = {
                path: FileInfo,
                name: _.last(FileInfo.split("/")),
                size: Stat.size
            }
            if (filename) {
                FileInfo.name = _.last(filename.split('/'));
            }
        }
        var WriteStream = self.GFS.createWriteStream({
            filename: FileInfo.name,
            content_type: mime.lookup(FileInfo.name)
        });
        var ReadStream = fs.createReadStream(FileInfo.path)
        ReadStream.on('error', function (err) {
            return done(err);
        });
        ReadStream.on('close', function () {
            return done(null, {
                name: FileInfo.name,
                size: FileInfo.size,
                id: WriteStream.id
            })
        });
        ReadStream.pipe(WriteStream);
    };

    self.FileInfo = function (id, done) {
        try {
            id = new mongo.ObjectID(id);
        } catch (e) {
            return done("Файл не найден");
        }
        self.GFS.files.find({
            _id: id
        }).toArray(function (err, files) {
            if (!files.length) err = err || "Файл не найден";
            return done(err, _.first(files));
        })
    };

    self.FileInfoByName = function (name, done) {
        self.GFS.files.find({
            filename: name.split('/').slice(-1).join('')
        }).toArray(function (err, files) {
            if (!files.length) err = err || "Файл не найден";
            return done(err, _.first(files));
        })
    };

    self._pipeToResByName = function (name, isDownload, res, next) {
        self.FileInfoByName(name, function (err, FileInfo) {
            if (err) return next(err);
            res.setHeader('Content-type', FileInfo.contentType);
            if (isDownload) {
                res.setHeader('Content-disposition', 'attachment; filename=' + encodeURIComponent(FileInfo.filename));
            } else {
                res.setHeader('Content-disposition', 'inline; filename=' + encodeURIComponent(FileInfo.filename));
            }
            var ReadStream = self.GFS.createReadStream({
                _id: FileInfo._id
            });
            ReadStream.on('error', function (err) {
                return next(err);
            });
            ReadStream.pipe(res);
        })
    };

    self._pipeToFileByName = function (name, file, done) {
        self.FileInfoByName(name, function (err, FileInfo) {
            if (err) return done(err);
            var ReadStream = self.GFS.createReadStream({
                _id: FileInfo._id
            });
            ReadStream.on('error', function (err) {
                return done(err);
            });
            ReadStream.pipe(file);
            return done();
        })
    };

    self.getReadStreamByName = function (name, done) {
        self.FileInfoByName(name, function (err, FileInfo) {
            if (err) {
                return done(err, {});
            }
            return done(null, self.GFS.createReadStream({
                _id: FileInfo._id
            }))
        })
    }

    self.DownloadStreamToResByName = function (name, res, next) {
        self._pipeToResByName(name, true, res, next);
    };

    self.PipeFileStreamToResByName = function (name, res, next) {
        self._pipeToResByName(name, false, res, next);
    };

    self.ToDisk = function (id, dir, done) {
        self.FileInfo(id, function (err, FileInfo) {
            if (err) return done(err);
            var File2Save = dir + '/' + id + '.' + FileInfo.filename.split(".").pop();
            var writeStream = fs.createWriteStream(File2Save);
            var ReadStream = self.GFS.createReadStream({
                _id: id
            });
            ReadStream.on('error', function (err) {
                return done(err);
            });
            ReadStream.on('close', function () {
                return done(null, File2Save)
            });
            ReadStream.pipe(writeStream);
        })
    };

    self.CopyFile = function (id, done) {
        self.FileInfo(id, function (err, FileInfo) {
            if (err) return done(err);
            var writestream = self.GFS.createWriteStream({
                filename: FileInfo.filename
            });
            var ReadStream = self.GFS.createReadStream({
                _id: id
            });
            ReadStream.on('error', function (err) {
                return done(err);
            });
            ReadStream.on('close', function () {
                return done(null, {
                    name: FileInfo.name,
                    size: FileInfo.size,
                    id: WriteStream.id
                })
            });
            ReadStream.pipe(writestream);
        })
    };

    self._pipeToRes = function (id, isDownload, res, next) {
        self.FileInfo(id, function (err, FileInfo) {
            if (err) return next(err);
            res.setHeader('Content-type', FileInfo.contentType);
            if (isDownload) {
                res.setHeader('Content-disposition', 'attachment; filename=' + encodeURIComponent(FileInfo.filename));
            } else {
                res.setHeader('Content-disposition', 'inline; filename=' + encodeURIComponent(FileInfo.filename));
            }
            var ReadStream = self.GFS.createReadStream({
                _id: id
            });
            ReadStream.on('error', function (err) {
                return next(err);
            });
            ReadStream.pipe(res);
        })
    };

    self.DownloadStreamToRes = function (id, res, next) {
        self._pipeToRes(id, true, res, next);
    };

    self.PipeFileStreamToRes = function (id, res, next) {
        self._pipeToRes(id, false, res, next);
    };

    self.RemoveFile = function (id, done) {
        var id = new mongo.ObjectID(id);
        self.GFS.remove({
            _id: id
        }, function (err) {
            return done(err);
        });
    };

    self.DropDatabase = function (done) {
        self.GFS.dropDatabase(done);
    };

    self.ClearPresentCache = function (CodePresent, done) {
        self.GFS.files.find({}).toArray(function (err, files) {
            if (err) {
                return done(err)
            } else {
                files.forEach(function (file) {
                    if (file.filename.startsWith("CP" + CodePresent)) {
                        self.RemoveFile(file._id, function () {})
                    }
                })
                return done()
            }
        })
    };

    return self;
});


GridFS.Init(function (err) {
    if (err) return console.log("GridFs init failed ", err);
});


module.exports = GridFS;
