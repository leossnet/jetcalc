var spawn = require("child_process").spawn;
var exec = require("child_process").exec;
var base64 = require("base-64");
var utf8 = require("utf8");
var os = require("os");
var async = require("async")
var mongoose = require("mongoose");

var config = require("./config.js");
var RabbitMQWorker = require(__base + "src/rabbitmq_wc.js").worker;
var GFS = require(__base + "src/gfs.js");

var rabbitPrefix = config.rabbitPrefix;


mongoose.Promise = global.Promise;

mongoose.connect(config.mongoUrl,{safe:false});


var mailer    = require('nodemailer');
var transport = mailer.createTransport(config.mailer);



mongoose.connection.on('connected', function(){
    var ModelInit = require(__base+'/classes/InitModels.js');
    ModelInit(function(){
        console.log("models inited");
    });
    var generateUUID = function(){
        return mongoose.Types.ObjectId()+'';
    }

    var pdf_converter_worker = new RabbitMQWorker({
        queue_id: rabbitPrefix+"pdf_convert", 
        worker: function(msg, done) {
            var FileFrom = msg.file_id;
            var tmp = os.tmpdir();
            GFS.ToDisk(FileFrom,tmp,function(err,filepath){
                var command = "soffice  --nofirststartwizard --headless --invisible --nologo --convert-to pdf "+filepath+" --outdir "+tmp;
                exec(command, function(err, out, code) {
                    var resultFile = tmp+'/'+FileFrom+'.pdf';
                    GFS.SaveFile(resultFile,function(err,info){
                        if (err) {
                            return done(err);
                        }
                        return done(err,info.id);
                    })
                });
            })
        }
    })

    var pdf_generator_worker = new RabbitMQWorker({
        queue_id: rabbitPrefix+"pdf_generator",
        worker: function(msg, done) {
            var html = utf8.decode(base64.decode(JSON.parse(msg.html)));
            html = html.replace(new RegExp("root_url", "g"), config.portalname);
            var file_path = `${os.tmpdir()}/${generateUUID()}.pdf`;
            var args = [
                "wkhtmltopdf",
                "-q",
                "--viewport-size", "'1024x768'",
                "--no-background",
                "--print-media-type",
                "--encoding",  "'utf-8'",
                "--load-error-handling", "ignore",
                "--load-media-error-handling", "ignore",
                "-",
                file_path
            ]
            var wkhtmltopdf = spawn(
                "/bin/bash",
                [
                    "-c",
                    args.join(" ") + " | cat ; exit ${PIPESTATUS[0]}"
                ]
            )
            var stderr;
            wkhtmltopdf.stderr.on("data", v => stderr += v.toString("utf8"))
            wkhtmltopdf.on("close", () => {
                if(stderr) return done(stderr);
                return done(null, { file_path: file_path })
            })
            wkhtmltopdf.stdin.write(html)
            wkhtmltopdf.stdin.end()
        }
    })

    var gitbook_generator_worker = new RabbitMQWorker({
        queue_id: rabbitPrefix+"gitbook",
        worker: function(msg, done) {
            var opts = { cwd: msg.book_path }
            async.parallel(
                [
                    (done) => exec("gitbook build", opts, done),
                    (done) => exec("gitbook pdf", opts, done),
                    (done) => exec("gitbook epub", opts, done)
                ],
                done
            )
        }
    }) 


    var phantom_worker = new RabbitMQWorker({
        queue_id: rabbitPrefix+"generatehtml",
        worker: function(msg, done) {
            return done();
        }
    })


    var mail_worker = new RabbitMQWorker({
        queue_id: rabbitPrefix+"send_mail",
        worker: function(msg, done) {
            var Model = mongoose.model("mail");
            var Settings = mongoose.model("settings");
            Settings.findOne({}).lean().exec(function(err,Settings){
                Model.findOne({_id:msg.MailId, IsError:false, IsSent:false}).exec(function(err,M){
                    if (!M) return done();
                    if (!(M.ToMail+'').length) M.Error = "Некому посылать";
                    if (!(M.FromMail+'').length) M.Error = "Не понятно от кого";
                    if (M.Retries>=10) M.Error = "10 попыток отправки";
                    if (M.Error.length){
                        M.IsError = true;
                        return M.save(done);
                    } else {
                        if (!Settings.UseRealMail) M.ToMail = Settings.Mails.join(", ");
                        var ToMail = M.ToMail;                
                        transport.sendMail({
                            from: M.FromName+'<'+M.FromMail+'>',
                            to: M.ToMail,
                            subject:M.Title,
                            html: M.Body
                        }, function(err){
                            if (err) console.log(err);
                            var Update = {};
                            if (err){
                                Update.IsError = true;
                                Update.Error = err;
                            } else {
                                Update.IsSent = true;
                            }
                            Model.findByIdAndUpdate(M._id,Update).exec(function(err){
                                return done(err);
                            })
                        });
                    }
                })
            })
        }
    })

    pdf_converter_worker.connect(function(err) {
        if(err) return console.error(err);    
        return console.log("pdf-converter is running")
    })

    pdf_generator_worker.connect(function(err) {
        if(err) return console.error(err);
        return console.log("pdf-generator is running")
    })

    gitbook_generator_worker.connect(function(err) {
        if(err) return console.error(err);
        return console.log("gitbook-generator is running")
    })

    mail_worker.connect(function(err) {
        if(err) return console.error(err);
        return console.log("mailer is running")
    })



})

