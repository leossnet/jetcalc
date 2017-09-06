var mongoose = require("mongoose");
var _ = require('lodash');
var async = require('async');
var LIB = require(__base + "lib/helpers/lib.js");
var Mailer = require(__base + 'src/mailer.js');
var config = require(__base + "config.js");

var SignupHelper = (new function () {
    var self = this;


    self.RequestApprovers = function (done) {
        mongoose.model("taskprivelege").find({
            CodePrivelege: "IsRequestApprover"
        }, "-_id CodeTask").isactive().lean().exec(function (err, Tasks) {
            var Tasks = _.map(Tasks, "CodeTask");
            if (!Tasks.length) return done(null, []);
            mongoose.model("usertask").find({
                CodeTask: {
                    $in: Tasks
                }
            }, "-_id CodeUser").isactive().lean().exec(function (err, UserCodes) {
                if (!UserCodes.length) return done(null, []);
                var Users = _.map(UserCodes, "CodeUser");
                mongoose.model("user").find({
                    CodeUser: {
                        $in: Users
                    }
                }, "-_id NameUser Mail").isactive().lean().exec(function (err, Real) {
                    var ToSend = _.filter(Real, function (R) {
                        return R.Mail && R.Mail.length;
                    })
                    return done(null, ToSend);
                })
            })
        })
    }

    self.UserAcceptors = function (CodeRequest, done) {

        // Пользователь
        mongoose.model("userrequest").findOne({
            CodeRequest: CodeRequest
        }, "-_id CodeUser").isactive().lean().exec(function (err, U) {
            if (!U) return done("no_userrequest");
            mongoose.model("user").findOne({
                CodeUser: U.CodeUser
            }, "-_id CodeObj").isactive().lean().exec(function (err, O) {
                if (!O || !O.CodeObj) return done("nouser");
                mongoose.model("objgrp").find({
                    CodeObj: O.CodeObj
                }, "CodeGrp").isactive().lean().exec(function (err, Ls) {
                    if (!O) return done("nouser");
                    mongoose.model("taskprivelege").find({
                        CodePrivelege: "IsUserAcceptor"
                    }, "-_id CodeTask").isactive().lean().exec(function (err, Tasks) {
                        var Tasks = _.map(Tasks, "CodeTask");
                        if (!Tasks.length) return done(null, []);
                        mongoose.model("usertask").find({
                            CodeTask: {
                                $in: Tasks
                            }
                        }, "-_id CodeUser CodeObj CodeObjGrp").isactive().lean().exec(function (err, Users) {
                            var Grps = _.map(Ls, "CodeGrp");
                            var Obj = O.CodeObj;
                            var Announce = _.map(_.filter(Users, function (U) {
                                return (!U.CodeObj && !U.CodeObjGrp) || (U.CodeObj && U.CodeObj == Obj) || (U.CodeObjGrp && Grps.indexOf(U.CodeObjGrp) != -1);
                            }), "CodeUser");
                            mongoose.model("user").find({
                                CodeUser: {
                                    $in: Announce
                                }
                            }, "-_id NameUser Mail").isactive().lean().exec(function (err, Real) {
                                var ToSend = _.filter(Real, function (R) {
                                    return R.Mail && R.Mail.length;
                                })
                                return done(null, ToSend);
                            })
                        })
                    })
                })
            })
        })
    }

    self.ConfirmRequest = function (CodeRequest, done) {
        // Send Emails to IsRequestApprover
        mongoose.model("request").findOne({
            CodeRequest: CodeRequest
        }).isactive().lean().exec(function (err, R) {
            if (!R) return done("Заявка не найдена");
            self.RequestApprovers(function (err, List) {
                if (!List.length) return done("Некого оповещать о заявке");
                var Data = {};
                for (var K in R) Data["Request" + K] = R[K];
                List.forEach(function (L) {
                    Mailer.CreateSimpleMail("newrequest", _.merge(Data, L), function () {
                        console.log("signup email is sent", L);
                    })
                })
                return done();
            })
        })
    }

    self.AcceptRequest = function (CodeRequest, done) {
        // Send Emails to IsUserAcceptor
        mongoose.model("request").findOne({
            CodeRequest: CodeRequest
        }).isactive().lean().exec(function (err, R) {
            self.UserAcceptors(CodeRequest, function (err, List) {
                if (!List.length) return done("Некого оповещать об утверждении заявки");
                if (err) return done(err);
                var Data = {};
                for (var K in R) Data["Request" + K] = R[K];
                List.forEach(function (L) {
                    Mailer.CreateSimpleMail("newrequestapprove", _.merge(Data, L), function () {
                        console.log("approve notifies are sent", L);
                    })
                })
                return done();
            })
        })
        // Send Emails to IsUserAcceptor
    }

    self.RejectRequest = function (CodeRequest, reason, done) {
        mongoose.model("request").findOne({
            CodeRequest: CodeRequest
        }).isactive().lean().exec(function (err, R) {
            Mailer.CreateSimpleMail('requestreject', {
                NameUser: R.NameUser,
                Mail: R.Mail,
                Reason: reason,
            }, function(){
                console.log('reject notify send');
            })
            return done();
        })
    }

    self.ConfirmUser = function (CodeUser, done) {
        mongoose.model("user").findOne({
            CodeUser: CodeUser
        }, "-_id NameUser Mail LoginUser").isactive().lean().exec(function (err, User) {
            if (!User) return done();
            Mailer.CreateMail("requestcomplete", {
                BaseUrl: '/api/modules/login/byemail/?code=',
                UseMailCode: true,
                CodeUser: CodeUser,
                LoginUser: User.LoginUser
            }, function () {
                console.log("confirm email is sent");
            })
        })
    }


    return self;
})




module.exports = SignupHelper;
