var mongoose = require("mongoose");
var async = require("async");
var _ = require("lodash");
var SocketManager = require(__base + "src/socket.js");
var router = require("express").Router();
var LIB = require(__base + 'lib/helpers/lib.js');
var HP = LIB.Permits;

var ImportHelper = (new function () {
    var self = this;

    self.serverconfig = require(__base + 'modules/models/serverconfig.js');

    self.import_no_links_works = 0;

    self.import_json = function (CodeUser) {
        console.log('start import')
        var fs = require('fs');
        var import_obj = JSON.parse(fs.readFileSync(__dirname + "/export.json", 'utf8'));
        self.import_no_links_works = 1;
        self.import_no_links(import_obj, CodeUser);
        self.import_no_links_works -= 1;
        var check_ready = function () {
            if (self.import_no_links_works == 0) {
                self.import_links(import_obj, CodeUser);
            } else {
                setTimeout(check_ready, 500);
            }
        }
        check_ready();
    }

    self.import_no_links = function (import_obj, CodeUser) {
        _.keys(import_obj).forEach(function (model) {
            if (self.serverconfig[model].menuplace != "Link") {
                var codename;
                _.keys(self.serverconfig[model].fields).forEach(function (fk) {
                    if (self.serverconfig[model].fields[fk].role === "code") {
                        codename = fk;
                    }
                });
                import_obj[model].forEach(function (obj) {
                    var query = {};
                    query[codename] = obj[codename];
                    self.import_no_links_works += 1;
                    self.add_model({
                        model: model,
                        data: obj,
                        query: query,
                    }, CodeUser);
                })
            }
        })
    }

    self.import_links = function (import_obj, CodeUser) {
        _.keys(import_obj).forEach(function (model) {
            if (self.serverconfig[model].menuplace === "Link") {
                var codename;
                _.keys(self.serverconfig[model].fields).forEach(function (fk) {
                    if (self.serverconfig[model].fields[fk].role === "code") {
                        codename = fk;
                    }
                });
                import_obj[model].forEach(function (obj) {
                    var query = {};
                    query[codename] = obj[codename];
                    self.add_model({
                        model: model,
                        data: obj,
                        query: query,
                    }, CodeUser);
                })
            }
        })
    }

    self.add_model = function (obj2save, CodeUser) {
        console.log('Import', obj2save.model);
        var Q = mongoose.model(obj2save.model).findOne(obj2save.query);
        Q.remove().exec(function () {
            var M = mongoose.model(obj2save.model);
            var Obj = new M(obj2save.data);
            Obj.save(CodeUser, function () {
                self.import_no_links_works -= 1;
            });
        });
    }

    return self;
})

var ExtractorHelper = (new function () {
    var self = this;

    self.extractedModel = {};

    self.used_ids = {};

    self.models_black_list = ["user", "userfavorite", "usertask", "userrequest", "labeluser", "userpermit", "periodedit", "permit", "permitrole", "obj", "org", "objtype", "objgrp", "objtag", "objtypetag", "data", "file"];

    self.works = 0;

    self.serverconfig = require(__base + 'modules/models/serverconfig.js');

    self.getObjByQuery = function (model, query, done) {
        var Query = mongoose.model(model).findOne(query);
        Query.exec(function (err, obj) {
            if (!obj) {
                return done('объект не найден')
            } else {
                return done(null, obj);
            }
        })
    };

    self.getObjectsByQuery = function (model, query, done) {
        var Query = mongoose.model(model).find(query);
        Query.exec(function (err, obj) {
            if (!obj) {
                return done('объект не найден')
            } else {
                return done(null, obj);
            }
        })
    };

    self.prepare = 0;

    self.extractModel = function (model, query) {
        self.used_ids = [];
        self.docs = [];
        self.rootrows = [];
        self.extractedModel = {};
        self.prepare = 1;
        self._getDocList(query[_.keys(query)[0]])
        var waitPrepare = function () {
            if (self.prepare != 0) {
                setTimeout(waitPrepare, 500);
                return;
            }
            self.works = 1;
            self._extractModel({
                model: model,
                query: query,
                depth: 1,
                done: function () {

                }
            })
            var checkDone = function () {
                if (self.works === 0) {
                    var fs = require("fs");
                    fs.writeFile(__dirname + "/export.json", JSON.stringify(self.extractedModel, null, "\t"), function (err) {});
                } else {
                    setTimeout(checkDone, 500);
                }
            }
            checkDone();
        }
        waitPrepare();
    }

    self._extractModel = function (el) {
        if (self.models_black_list.indexOf(el.model) != -1) {
            self.works -= 1;
            return;
        }
        if (el.depth > 20) {
            self.works -= 1;
            return;
        }
        if (!self.used_ids[el.model.toLowerCase()]) {
            self.used_ids[el.model.toLowerCase()] = [];
        }
        self.getObjByQuery(el.model, el.query, function (err, obj) {
            if (!obj || obj.err || obj.IsActive == false) {
                self.works -= 1;
                return;
            }
            if (self.used_ids[el.model.toLowerCase()].indexOf(obj._id.toString()) != -1) {
                self.works -= 1;
                return;
            }
            if (el.model === "doc" && self.docs.indexOf(obj.CodeDoc) === -1) {
                self.works -= 1;
                return;
            }
            if (el.model === "row" && self.rootrows.indexOf(obj.treeroot) === -1) {
                self.works -= 1;
                return;
            }
            self.used_ids[el.model.toLowerCase()].push(obj._id.toString());
            self._extractDependent(el, obj);
            var objects_for_extract = [];
            _.keys(obj._doc).forEach(function (k) {
                if (k.startsWith("Code")) {
                    try {
                        var model = self.serverconfig[el.model].fields[k].refmodel;
                        if (model) {
                            var query = {};
                            query[k] = obj[k];
                            objects_for_extract.push({
                                model: model,
                                query: query,
                                done: function () {},
                                depth: el.depth + 1,
                            })
                        }
                    } catch (e) {}
                }
                if (k.startsWith("Link_")) {
                    if (obj[k]) {
                        obj[k].forEach(function (lk) {
                            var model = k.substr(5).toLowerCase();
                            var query = {
                                _id: lk
                            };
                            objects_for_extract.push({
                                model: model,
                                query: query,
                                done: function () {},
                                depth: el.depth + 1,
                            })
                        })
                    }
                }
            })
            if (!self.extractedModel[el.model]) {
                self.extractedModel[el.model] = [];
            }
            self.extractedModel[el.model].push(self._prepareObj(obj));
            console.log('Extract ' + el.model);
            self.works += objects_for_extract.length;
            async.each(objects_for_extract, self._extractModel, el.done)
            self.works -= 1;
        })
    }

    self._extractDependent = function (el, obj) {
        self.works += 1;
        obj.Dependent(function (err, dependents) {
            if (err) {
                return
            }
            var objects_for_extract = [];
            _.keys(dependents).forEach(function (k) {
                dependents[k].forEach(function (c) {
                    var codename;
                    _.keys(self.serverconfig[k].fields).forEach(function (fk) {
                        if (self.serverconfig[k].fields[fk].role === "code") {
                            codename = fk;
                        }
                    })
                    var query = {};
                    query[codename] = c;
                    objects_for_extract.push({
                        model: k,
                        query: query,
                        done: function () {},
                        depth: el.depth + 1,
                    })
                })
            })
            self.works += objects_for_extract.length;
            async.each(objects_for_extract, self._extractModel, function () {})
            self.works -= 1;
        })
    }

    self.docs = [];
    self.rootrows = [];

    self._getDocList = function (CodeDocFolder) {
        self.getObjectsByQuery('docfolderdoc', {
            CodeDocFolder: CodeDocFolder
        }, function (err, dfds) {
            dfds.forEach(function (dfd) {
                self.docs.push(dfd.CodeDoc);
            })
            self.prepare -= 1;
        })
        self.getObjectsByQuery('docfolder', {
            CodeParentDocFolder: CodeDocFolder
        }, function (err, dfs) {
            self.prepare += dfs.length;
            dfs.forEach(function (df) {
                self.getObjectsByQuery('docfolderdoc', {
                    CodeDocFolder: df.CodeDocFolder
                }, function (err, dfds) {
                    dfds.forEach(function (dfd) {
                        self.docs.push(dfd.CodeDoc);
                        self.prepare += 1;
                        self.getObjectsByQuery('docrow', {
                            CodeDoc: dfd.CodeDoc
                        }, function (err, drs) {
                            drs.forEach(function (dr) {
                                self.rootrows.push(dr.CodeRow);
                            })
                            self.prepare -= 1;
                        })
                    })
                    self.prepare -= 1;
                })
            })
        })
    }

    self._prepareObj = function (obj) {
        var prepared = {};
        obj.cfg().EditFields.forEach(function (field) {
            if (!field.startsWith("Link_")) {
                prepared[field] = obj[field];
            }
        })
        return prepared;
    }

    return self;
});

router.post('/search', function (req, res, next) {
    var model = req.body['model'];
    var query = req.body['query'];
    return ExtractorHelper.getObjByQuery(model, query,
        function (err, ret) {
            if (!err) {
                return res.json(ret);
            }
            next(err);
        });
});

router.get('/extract', function (req, res, next) {
    model = req.query.model;
    query = req.query.query;
    ExtractorHelper.extractModel(model, query);
    return res.json({});
})

router.get('/import', function (req, res, next) {
    console.log('here')
    var CodeUser = req.user.CodeUser;
    ImportHelper.import_json(CodeUser);
    return res.json({});
})

module.exports = router;
