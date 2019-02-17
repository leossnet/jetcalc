var MColumns = (new function() {

    var self = new Module("columns");

    self.IsAvailable = function() {
        return PermChecker.CheckPrivelegeAny(["IsColumnEditor", "IsColsetEditor", "IsHeaderEditor"]);
    }

    self.ColsetCols = ko.observableArray();

    self.LoadColset = function() {
        self.ColsetCols([]);
        var CodeColset = ModelTableEdit.LoadedModel().CodeColset();
        self.rGet("colsetcol", {
            CodeColset: CodeColset
        }, function(data) {
            self.ColsetCols(_.map(data, function(d) {
                return MModels.Create("colsetcol", d);
            }));
        })
    }

    self.LoadHeader = function() {
        self.Headers([]);
        var CodeHeader = ModelTableEdit.LoadedModel().CodeHeader();
        self.rGet("headers", {
            CodeHeader: CodeHeader
        }, function(data) {
            data = _.filter(data, function(d) {
                return d.CodeColset;
            });
            self.Headers(_.map(data, function(d) {
                return MModels.Create("header", d);
            }));
        })
    }

    self.RemoveColset = function(data) {
        self.ColsetCols.remove(data);
    }

    self.RemoveHeader = function(data) {
        self.Headers.remove(data);
    }

    self.AddColsetCol = function() {
        var CodeColset = ModelTableEdit.LoadedModel().CodeColset();
        self.ColsetCols.push(MModels.Create("colsetcol", {
            CodeColset: CodeColset,
            IsEdit: true
        }));
    }

    self.Headers = ko.observableArray([]);

    self.AddHeader = function() {
        var CodeHeader = ModelTableEdit.LoadedModel().CodeHeader();
        self.Headers.push(MModels.Create('header', {
            CodeParentHeader: CodeHeader,
            IsEdit: true,
        }));
    }

    self.SaveColsetCols = function() {
        var Code = ModelTableEdit.LoadedModel().CodeColset();
        var ColsetCols = [];
        var Data = {
            CodeColset: Code,
            Cols: _.map(self.ColsetCols(), function(Model) {
                return _.merge(_.pick(Model.toJS(), Model.EditFields), {
                    CodeColset: Code
                });
            })
        };
        console.log("Data",Data);

        self.rPut("colsetcol", Data, function() {
            self.LoadColset();
        })
    }

    self.SaveHeaders = function(done) {
        var Code = ModelTableEdit.LoadedModel().CodeHeader();
        var Headers = [];
        var Data = {
            CodeHeader: Code,
            Headers: _.map(self.Headers(), function(Model) {
                return _.merge(_.pick(Model.toJS(), Model.EditFields), {
                    CodeParentHeader: Code
                });
            })
        };
        self.rPut("headers", Data, function() {
            done && done();
        })
    }

    self.Tree = ko.observable(null);

    self.LoadHeadersTree = function(done) {
        self.rGet("headerstree", {}, function(data) {
            self.Tree(data);
            return done && done();
        })
    }

    self.BeforeShow = function() {
        self.Subscribe();
        self.Show();
    }

    self.BeforeHide = function() {
        self.UnSubscribe();
    }

    self.ModelIsLoaded = function() {
        switch (self.Mode()) {
            case "ColSet":
                self.ColsetCols([]);
                self.LoadColset();
                break;
            case 'Header':
                self.Headers([]);
                self.LoadHeader();
                break;
        }
    }

    self.ModelIsCreated = function() {
        switch (self.Mode()) {
            case "ColSet":
                self.ColsetCols([]);
                break;
            case "Header":
                self.Headers([]);
                break;
        }
    }

    self.ModelIsSaved = function() {
        switch (self.Mode()) {
            case 'ColSet':
                self.SaveColsetCols();
                break;
            case 'Header':
                var LM = ModelTableEdit.LoadedModel();
                self.SaveHeaders(function() {
                    self.Show();
                    setTimeout(function() {
                        ModelTableEdit.LoadedModel(LM);
                        self.LoadHeader();
                    }, 1000)
                });
                break;
        }
    }

    self.Show = function(done) {
        if (!self.Mode()) return self.InitSetMode("Cols");
        switch (self.Mode()) {
            case "Cols":
                ModelTableEdit.InitModel("col");
                break;
            case "Header":
                ModelTreeEdit.Init({
                    model: "header",
                    parent_code_field: 'CodeParentHeader',
                    wrapper: function(el) {
                        return el.NameHeader + '(' + el.CodeHeader + ')';
                    },
                    add_fields: ["CodeColset"],
                    filter: function(el) {
                        return el.CodeColset == "";
                    }
                }, function() {
                    ModelTableEdit.IsExtendEditor(true);
                });
                break;
            case "ColSet":
                ModelTableEdit.InitModel("colset");
                ModelTableEdit.IsExtendEditor(true);
                break;
        }
        return done && done()
    }

    return self;
})

ModuleManager.Modules.Columns = MColumns;
