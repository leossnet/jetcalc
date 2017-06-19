var 
  mkdirp = require('mkdirp'),
  fs = require('fs'),
  config = require('../config.js'),
  exec = require('child_process').exec,
  execFile = require('child_process').execFile;


//, execOptions = { cwd: fileId }

var fileConverter = function() {

  var self = this;
  // Директория, в которую помещаются конвертированные из PDF в JPG файлы
  self.baseDir = config.dir + "/static/media/converted";
  // Директория, в которую  конвертированные в PDF Файлы
  self.workDir = self.baseDir;
  // Id пользователя, заказавшего конверсию данного документа
  self.userId = null;
  // Id прикрепленного файла в базе данных
  self.attachId = null;
  // Code процесса, по которому пользователь определит, что это его процесс
  self.code = null;

  self.filePath = "";
  self.ext = "";
  self.fileName = "";
  self.pdfName = "";
  self.result = {};

  self.init = function(moduleId, done) {
    self.baseDir = config.dir + "/static/media/converted";
    self.workDir = self.baseDir + "/" + moduleId;
    mkdirp(self.baseDir, 0777, function(){
      mkdirp(self.workDir, 0777, function() {
        done && done();
      })  
    })
    
  }

  self.doIt = function(pathData, done) {
    console.log("FC.doIt@pathData:",pathData);
    // Parse pathData
    self.userId = pathData.userId;
    self.attachId = pathData.attachId;
    self.filePath = pathData.from;
    self.baseDir = pathData.to;
    self.code = pathData.code;


    self.ext = self.filePath.split(".").pop()
    self.fileName = self.filePath.split("/").pop();
    self.workDir = self.baseDir + self.fileName;
   
    self.result = {
      attachId: self.attachId,
      userId: self.userId,
      pages: 0,
      path: self.from,
      code: self.code,
      err: [],
    };

    mkdirp(self.baseDir, 0777, function(){
      mkdirp(self.workDir, 0777, function() {
        self.toPdf(function() {
            self.toImages("1024", function() { //1024x768
             // fs.unlink(self.pdfName, function(){
                done((self.result.err.length ? self.result.err : null), self.result);                  
              //});
            })
        });
      })
    })
    
  }

  self.toPdf = function(done) {
    if (self.ext == 'pdf') {
      self.pdfName = self.workDir + "/" + self.fileName;
      copyFile(self.filePath, self.pdfName, function() {
        done && done();
      })
    } else {
      self.pdfName = self.workDir + "/" + self.fileName.split(".").slice(0, -1).join(".") + ".pdf";
      var command = "lodraw";
      if (["doc", "docx", "odt", "rtf"].indexOf(self.ext) !== -1) {
        command = "lowriter";
      } else if (["ppt", "pptx", "odp", "pps", "ppsx"].indexOf(self.ext) !== -1) {
        command = "loimpress";
      } else if (["xls", "xlsx", "ods"].indexOf(self.ext) !== -1) {
        command = "localc";
      }
      command = "soffice";
      if (self.filePath.substring(0, 2) == "./") {
        self.filePath = __dirname.split("/").slice(0, -1).join("/") + "/" + self.filePath.substring(2)
        console.log("<<<<<<<<<<<<<<<<<<<", self.filePath, "<<<<<<<<<<<<<<<<<<<");
      }
      command += "  --nofirststartwizard --headless --invisible --nologo --convert-to pdf " + self.filePath.replace(/\s/g, "\\ ") + " --outdir " + self.workDir.replace(/\s/g, "\\ ");
      console.log(command);
      exec(command, {
        cwd: self.workDir.replace(/\s/g, "\\ ")
      }, function(error, stdout, stderr) {
        //console.log('stdout (pdf): ' + stdout);
        //console.log('stderr (pdf): ' + stderr);
        if (error !== null) {
          console.log('exec error (pdf): ' + error);
          self.result.err.push(error);
        }        
        self.pdfName = self.workDir + "/" + self.fileName.split(".").slice(0, -1) + ".pdf";
        console.log(self.pdfName);
        done && done();
        //console.log(a,b);
      });
    }
  }

  self.toImages = function(dim, done) {
    var subDir = (self.workDir + "/" + dim);
    mkdirp(subDir, 0777, function(a, b) {
      console.log("self.pdfName:",self.pdfName);
      console.log("subDir:",subDir);
      var command = "pdftoppm -jpeg -r 72 -scale-to " + dim + " " + self.pdfName.replace(/\s/g, "\\ ") + " " + subDir.replace(/\s/g, "\\ ") + "/";
      console.log("Command:",command);
      exec(command, {}, function(error, stdout, stderr) {
        //console.log('stdout (img): ' + stdout);
        //console.log('stderr (img): ' + stderr);
        if (error !== null) {
          console.log('exec error (img): ' + error);
          self.result.err.push(error);
        }
        fs.readdir(subDir, function(err, filesRaw) {
          if (err) {
            console.log(err);
            return;
          }
          filesRaw.forEach(function(z) {
            var newName = z.replace("-0", "").replace("-", "");
            fs.renameSync(subDir + "/" + z, subDir + "/" + newName);
          })
          fs.readdir(subDir, function(err, files) {
            if (err) {
              console.log(err);
              return;
            }
            // self.result[dim] = files;
            // self.result["count"] = files.length;
            // self.result["wwwpath"] = self.workDir.split("/static/").pop();
            // self.result["dirpath"] = self.workDir;
            self.result.pages = files.length;
            done && done();
          });
        });
      });
    });
  }


}

module.exports.fc = fileConverter;

function copyFile(source, target, cb) {
  var cbCalled = false;
  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
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
}

var fc = new fileConverter();

process.on('message', function(message) {
  fc.doIt(message, function(err,result){
    process.send({
      err: err,
      result: result
    });
  })
})