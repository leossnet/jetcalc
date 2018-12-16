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

mongoose.connect(config.mongoUrl, { useMongoClient: true });


mongoose.connection.on('connected', function() {
    var ModelInit = require(__base + '/classes/InitModels.js');

    ModelInit(function() {
        console.log("models inited");

        var generateUUID = function() {
            return mongoose.Types.ObjectId() + '';
        }

        var mail_worker = new RabbitMQWorker({
            queue_id: rabbitPrefix + "send_mail",
            worker: function(msg, done) {
                var Model = mongoose.model("mail");
                mongoose.model("settings").findOne({}, "+MailAuthPass").lean().exec(function(err, Settings) {
                    Model.findOne({ _id: msg.MailId, IsError: false, IsSent: false }).exec(function(err, M) {
                        if (!M) return done();
                        if (!(M.ToMail + '').length) M.Error = "Некому посылать";
                        if (!(M.FromMail + '').length) M.Error = "Не понятно от кого";
                        if (M.Retries >= 10) M.Error = "10 попыток отправки";
                        if (M.Error.length) {
                            M.IsError = true;
                            return M.save(done);
                        } else {
                            if (!Settings.UseRealMail) M.ToMail = Settings.Mails.join(", ");
                            var ToMail = M.ToMail;
                            var mailer = require('nodemailer');
                            var TransportCFG = {
                                host: Settings.MailHost,
                                port: Settings.MailPort,
                                secureConnection: Settings.MailSecureConnection,
                                requiresAuth: Settings.RequiresAuth,
                                auth: {
                                    user: Settings.MailAuthUser,
                                    pass: Settings.MailAuthPass,
                                },
                                from: {
                                    name: Settings.MailFromName,
                                    email: Settings.MailAuthUser
                                }
                            };
                            var Transport = mailer.createTransport(TransportCFG);
                            var MailCFG = {
                                from: M.FromName + '<' + Settings.MailAuthUser + '>',
                                to: M.ToMail,
                                subject: M.Title,
                                html: M.Body
                            };
                            console.log("Transport", TransportCFG);
                            console.log("Mail", MailCFG);
                            Transport.sendMail(MailCFG, function(err) {
                                if (err) console.log(err);
                                var Update = {};
                                if (err) {
                                    Update.IsError = true;
                                    Update.Error = err;
                                } else {
                                    Update.IsSent = true;
                                }
                                Model.findByIdAndUpdate(M._id, Update).exec(function(err) {
                                    return done(err);
                                })
                            });
                        }
                    })
                })
            }
        })

        var calc_cache_worker = new RabbitMQWorker({
            queue_id: rabbitPrefix + "calc_cache",
            worker: function(msg, done) {
                var CacheHelper = require(__base + "classes/jetcalc/Cache.js");
                CacheHelper(msg, function(err) {
                    if (err) console.log(err);
                    return done();
                });
            }
        })


        var auto_fill_worker = new RabbitMQWorker({
            queue_id: rabbitPrefix + "auto_fill_worker",
            worker: function(msg, done) {
                var AF = require(__base + "classes/jetcalc/Helpers/AutoFill.js");
                AF.UpdateAll(msg, function(err) {
                    if (err) console.log(err);
                    AF.UpdateChainDocuments(msg,function(err){
                        console.log("Rabbit task is finished");
                        return done(err);

                    })
                });
            }
        })



        var pdf_converter_worker = new RabbitMQWorker({
            queue_id: rabbitPrefix + "pdf_convert",
            worker: function(msg, done) {
                var FileFrom = msg.file_id;
                var tmp = os.tmpdir();
                GFS.ToDisk(FileFrom, tmp, function(err, filepath) {
                    var command = "soffice  --nofirststartwizard --headless --invisible --nologo --convert-to pdf " + filepath + " --outdir " + tmp;
                    exec(command, function(err, out, code) {
                        var resultFile = tmp + '/' + FileFrom + '.pdf';
                        GFS.SaveFile(resultFile, function(err, info) {
                            if (err) {
                                return done(err);
                            }
                            return done(err, info.id);
                        })
                    });
                })
            }
        })

        var pdf_generator_worker = new RabbitMQWorker({
            queue_id: rabbitPrefix + "pdf_generator",
            worker: function(msg, done) {
                mongoose.model("settings").findOne({}, "PortalName").lean().exec(function(err, Settings) {
                    var html = utf8.decode(base64.decode(JSON.parse(msg.html)));
                    html = html.replace(new RegExp("root_url", "g"), Settings.PortalName);
                    var file_path = `${os.tmpdir()}/${generateUUID()}.pdf`;
                    var args = [
                        "wkhtmltopdf",
                        "-q",
                        "--viewport-size", "'1024x768'",
                        "--no-background",
                        "--print-media-type",
                        "--encoding", "'utf-8'",
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
                        if (stderr) return done(stderr);
                        return done(null, { file_path: file_path })
                    })
                    wkhtmltopdf.stdin.write(html)
                    wkhtmltopdf.stdin.end()
                })
            }
        })

        var gitbook_generator_worker = new RabbitMQWorker({
            queue_id: rabbitPrefix + "gitbook",
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
            queue_id: rabbitPrefix + "generatehtml",
            worker: function(msg, done) {
                return done();
            }
        })



        pdf_converter_worker.connect(function(err) {
            if (err) return console.error(err);
            return console.log("pdf-converter is running")
        })

        pdf_generator_worker.connect(function(err) {
            if (err) return console.error(err);
            return console.log("pdf-generator is running")
        })

        gitbook_generator_worker.connect(function(err) {
            if (err) return console.error(err);
            return console.log("gitbook-generator is running")
        })

        mail_worker.connect(function(err) {
            if (err) return console.error(err);
            return console.log("mailer is running")
        })

        calc_cache_worker.connect(function(err) {
            if (err) return console.error(err);
            return console.log("cache saver is running")
        })

        auto_fill_worker.connect(function(err) {
            if (err) return console.error(err);
            return console.log("auto fill worker is running")
        })
    });
})

    setTimeout(function(){
        var AF = require(__base + "classes/jetcalc/Helpers/AutoFill.js");
        var cx = {CodeDoc:"repair",CodePeriod:"12"};
        AF.BuildDocRoute(cx.CodeDoc,cx.CodePeriod,function(err,Path){
                console.log(err,Path);

        })

    },1000)



