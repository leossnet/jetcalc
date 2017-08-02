var mongoose = require("mongoose");
var _ = require('lodash');
var async = require('async');
var LIB = require(__base+"lib/helpers/lib.js");
var RabbitMQClient = require(__base + "src/rabbitmq_wc.js").client;
var event = require('events').EventEmitter;
var config = require(__base+"config.js")
var fs = require("fs");
var prefix = config.rabbitPrefix;


var MailClient = new RabbitMQClient({
    queue_id: prefix+"send_mail"
})

MailClient.connect(function(err) {
    if (err) console.log("mailer connect error",err);
})


var Mailer = (new function(){
    var self = this;

    self.Events = new event();

    self.Template = function(id){
        var html = "", File = id+'.html';
        try{
            html = fs.readFileSync(__base+'/src/MailTemplates/'+File,"UTF-8");   
        } catch(e){
            html = "Файл "+File+" не найден";
        }
        return html;
    }

    self.Settings = function(done){
        mongoose.model("settings").findOne({},"TechPhone TechMail SystemName").exec(function(err,S){
            if (!S) S = {TechPhone:"",TechMail:"",SystemName:""};
            return done(err,S);
        });
    }

    self.MailCode = function(Data,done){
        if (!Data.UseMailCode) return done(null,Data);
        mongoose.model("user").findOne({CodeUser:Data.CodeUser},"MailCode").isactive().lean().exec(function(err,U){
            if (!U) return done("Пользователь не найден");
            if (U.MailCode && U.MailCode.length) return done(null, _.merge(Data,{MailCode:U.MailCode}));
            var Rand = LIB.Random();
            mongoose.model("user").findByIdAndUpdate(U._id,{MailCode:Rand}).exec(function(err){
                return done(err,_.merge(Data,{MailCode:Rand}));
            })
        })
    }

    self._mail = function(TemplateId,Data,done){
        self.Settings(function(err,Set){
            self.MailCode(Data,function(err, UpdatedData){
                var HTML = self.Template(TemplateId);
                var Replaces = _.merge(UpdatedData,Set);
                if (Replaces.UseMailCode) Replaces.MailCode = Replaces.BaseUrl+Replaces.MailCode;
                for (var ID in Replaces) HTML = HTML.split("["+ID+"]").join(Replaces[ID]);
                var TParse = HTML.replace(/\s+/g,' ').match(/<title>(.*?)<\/title>/);
                var Title = "";
                if (TParse && TParse[1]) Title = TParse[1];
                var M = mongoose.model("mail");
                var NewM = new M({
                    Title:Title,
                    Body:HTML,
                    Type:TemplateId,
                    ToMail:Replaces.Mail,
                    ToName:Replaces.NameUser,
                    FromMail:Replaces.FromMail? Replaces.FromMail:Replaces.TechMail,
                    FromName:Replaces.FromName? Replaces.FromName:"🛠 Техподдержка"
                });
                NewM.save(function(err){
                    done = done || function(){};
                    MailClient.sendMessage({MailId: NewM._id},done);
                })
            })
        })
    }

    self.CreateMail = function(TemplateId,Data,done){
        mongoose.model("user").findOne({CodeUser:Data.CodeUser},"-_id Mail NameUser").isactive().lean().exec(function(err,U){
            self._mail(TemplateId,_.merge(Data,_.pick(U,["Mail","NameUser"])),done);
        })
    } 

    self.CreateSimpleMail = function(TemplateId,Data,done){
        self._mail(TemplateId,Data,done);
    }


    return self;
})


module.exports = Mailer;
