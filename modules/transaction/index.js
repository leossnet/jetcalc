var MTransaction = (new function() {

    var self = new Module("transaction");


    self.BeforeHide = function() {
        self.UnSubscribe();
    }

    self.BeforeShow = function() {
        self.Subscribe();
        self.Show();
    }

    self.Update = function() {
        self.Show();
    }

    self.ModelIsSaved = function() {
        self.Update();
    }
    self.ModelIsDeleted = function() {
        self.Update();
    }

    self.IsAvailable = function() {
        return PermChecker.CheckPrivelegeAny(["IsTransactionTunner"]);
    }

    self.DocRelationsView = ko.observable('table');

    self.ChangeView = function() {
        if (self.DocRelationsView() == 'table') {
            self.DocRelationsView('tree');
        } else {
            self.DocRelationsView('table');
        }
    }

    self.DocRelations = ko.observableArray([]);

    self.LoadDocRelations = function(done) {
        $.getJSON('/api/modules/transaction/docrelations', {}, function(data) {
            self.DocRelations(data);
            done && done();
        })
    }

    self.ColRelations = ko.observableArray([]);

    self.LoadColRelations = function(done) {
        $.getJSON('/api/modules/transaction/colrelations', {}, function(data) {
            self.ColRelations(data);
            done && done();
        })
    }

    self.GetChilds = function(name) {
        if (name) {
            var CodeDoc = name.split('::')[0];
            var CodeColSource = name.split('::')[1].split('=>')[0];
            var CodeColTarget = name.split('::')[1].split('=>')[1];
            var filtered = _.filter(self.DocRelations(), function(DR) {
                return DR.CodeDocSourse == CodeDoc;
            })
            ret = [];
            filtered.forEach(function(DR) {
                DR.Link_colrelation.forEach(function(CR) {
                    self.ColRelations().forEach(function(RCR) {
                        if (CR === RCR._id) {
                            var CRCS = RCR.CodeColSource ? RCR.CodeColSource : RCR.CodeColTarget;
                            var CRCT = RCR.CodeColTarget ? RCR.CodeColTarget : RCR.CodeColSource;
                            if (CodeColTarget === CRCS) {
                                ret.push(
                                    DR.CodeDocTarget + '::' + CRCS + '=>' + CRCT
                                )
                            }
                        }
                    })
                })
            })
            return _.map(_.uniq(ret), function(O) {
                return {
                    name: O
                }
            });
        } else {
            var tmp = [];
            var DRS = self.DocRelations();
            for (var i = 0; i < DRS.length; i++) {
                tmp.push(DRS[i].CodeDocTarget);
            }
            tmp = _.uniq(tmp);
            var root_docs = _.uniq(_.map(_.filter(self.DocRelations(), function(DR) {
                return !_.includes(tmp, DR.CodeDocSourse);
            }), function(DR) {
                return DR;
            }))
            var ret = [];
            root_docs.forEach(function(DR) {
                DR.Link_colrelation.forEach(function(CR) {
                    self.ColRelations().forEach(function(SCR) {
                        if (SCR._id === CR) {
                            ret.push(
                                DR.CodeDocSourse + '::' + (SCR.CodeColSource ? SCR.CodeColSource : SCR.CodeColTarget) + '=>' + (SCR.CodeColTarget ? SCR.CodeColTarget : SCR.CodeColSource)
                            )
                        }
                    })
                })
            })
            return _.map(_.uniq(ret), function(O) {
                return {
                    name: O
                }
            });
        }
    }

    self.Init = function(done) {
        self.LoadDocRelations(self.LoadColRelations(done));
    }

    self.SaveChanges = function() {}

    self.Show = function(done) {
        if (!self.Mode()) return self.InitSetMode("BillRelations");
        switch (self.Mode()) {
            case "BillRelations":
                ModelTableEdit.InitModel("billrelation");
                break;
            case "DocBills":
                ModelTableEdit.InitModel("docbill");
                break;
            case "DocRelations":
                ModelTableEdit.InitModel("docrelation");
                break;
            case "ColRelations":
                ModelTableEdit.InitModel("colrelation");
                break;
            case "Bills":
                ModelTableEdit.InitModel("bill");
                break;
            case "Prods":
                ModelTreeEdit.Init({
                    model: "prod",
                    parent_code_field: "CodeParentProd",
                });
                break;
            case "Dogovors":
                ModelTableEdit.InitModel("dogovor");
                break;
            case "DogovorTypes":
                ModelTableEdit.InitModel("dogovortype");
                break;
        }
        return done && done()
    }



    return self;
})





ModuleManager.Modules.Transaction = MTransaction;
