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

    self.GetChilds = function(name) {
        if (name) {
            return _.map(_.filter(self.DocRelations(), function(DR) {
                return DR.CodeDocSourse == name;
            }), function(DR) {
                return {
                    name: DR.CodeDocTarget
                }
            })
        } else {
            var tmp = [];
            var DRS = self.DocRelations();
            for (var i = 0; i < DRS.length; i++) {
                tmp.push(DRS[i].CodeDocTarget);
            }
            tmp = _.uniq(tmp)
            return _.map(_.uniq(_.map(_.filter(self.DocRelations(), function(DR) {
                return !_.includes(tmp, DR.CodeDocSourse);
            }), function(DR) {
                return DR.CodeDocSourse
            })), function(CDS){return {name: CDS}})
        }
    }

    self.Init = function(done) {
        self.LoadDocRelations(done);
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
