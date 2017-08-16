var MPeriodForm = (new function () {

    var self = this;

    self.LinkPeriods = ko.observable();
    self.MainPeriods = ko.observableArray([]);

    self.model = ko.observable();
    self.source_period_field_name = ko.observable();
    self.target_period_field_name = ko.observable();
    self.source_index_field_name = ko.observable();

    self.period_edit_fields = ko.observableArray([]);

    self.RemoveLinkPeriod = function (CodePeriod) {
        self.LinkPeriods()[CodePeriod].remove(this);
    }

    self.AddLinkPeriod = function (CodePeriod) {
        var link_for_add = {};
        link_for_add[self.source_period_field_name()] = CodePeriod;
        link_for_add[self.source_index_field_name()] = self.LinkPeriods()[CodePeriod]().length + 1;
        self.LinkPeriods()[CodePeriod].push(MModels.Create(self.model(), link_for_add));
    }

    self.EditPeriod = ko.observable(null);

    self.SetEditPeriod = function (data) {
        if (self.IsCurrentEditPeriod(data)) {
            self.EditPeriod(null);
        } else {
            self.EditPeriod(data);
        }
    }

    self.IsCurrentEditPeriod = function (data) {
        return self.EditPeriod() == data;
    }

    self.LoadPeriods = function () {
        self.rGet("periodconnect", {
            model: self.model()
        }, function (data) {
            self.MainPeriods(_.map(data.MainPeriods, function (MP) {
                return MModels.Create("period", MP);
            }));
            var Str = {};
            data.MainPeriods.forEach(function (MP) {
                Str[MP.CodePeriod] = ko.observableArray();
            })
            data.LinkPeriods.forEach(function (LP) {
                if (Str[LP.CodePeriod]) {
                    Str[LP.CodePeriod].push(MModels.Create(self.model(), LP));
                }
            })
            self.LinkPeriods(Str);
        })
    }

    self.SaveChanges = function () {
        var FieldsToPass = MModels.Create(self.model()).EditFields.concat(["_id"]);
        var Data = ko.toJS(self.LinkPeriods),
            Reparsed = {};
        for (var Key in Data) {
            Reparsed[Key] = _.filter(_.map(Data[Key], function (M) {
                return _.pick(M, FieldsToPass);
            }), function (D) {
                return !_.isEmpty(D[self.target_period_field_name()]);
            })
        }
        self.rPut("periodconnect", {
            JSON: {
                data: JSON.stringify(Reparsed),
                model: self.model()
            }
        }, function (data) {
            self.Init();
            self.LoadPeriods();
        })
    }

    self.IsAvailable = function () {
        return true;
    }

    self.IsLoaded = ko.observable(false);

    self.Init = function (done) {}

    return self;
})


ModuleManager.Modules.PeriodForm = MPeriodForm;
