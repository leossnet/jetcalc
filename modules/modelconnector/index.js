var MModelConnector = (new function () {

    var self = this;

    self.LinkModels = ko.observable();
    self.MainModels = ko.observableArray([]);

    self.source_model = ko.observable();
    self.target_model = ko.observable();
    self.code_source_model = ko.observable();
    self.name_source_model = ko.observable();
    self.code_target_model = ko.observable();
    self.source_model_field_name = ko.observable();
    self.target_model_field_name = ko.observable();
    self.source_index_field_name = ko.observable();
    self.get_query = ko.observable({});
    self.get_sort = ko.observable({});
    self.get_fields = ko.observable("-_id");

    self.model_edit_fields = ko.observableArray([]);

    self.RemoveLinkModel = function (Code) {
        self.LinkModels()[Code].remove(this);
    }

    self.AddLinkModel = function (Code) {
        var link_for_add = {};
        link_for_add[self.source_model_field_name()] = Code;
        if (self.source_index_field_name()) {
            link_for_add[self.source_index_field_name()] = self.LinkModels()[Code]().length + 1;
        }
        self.LinkModels()[Code].push(MModels.Create(self.target_model(), link_for_add));
    }

    self.EditModel = ko.observable(null);

    self.SetEditModel = function (data) {
        if (self.IsCurrentEditModel(data)) {
            self.EditModel(null);
        } else {
            self.EditModel(data);
        }
    }

    self.IsCurrentEditModel = function (data) {
        return self.EditModel() == data;
    }

    self.LoadModels = function (done) {
        $.getJSON('/api/modules/modelconnector/connect', {
            source_model: self.source_model(),
            target_model: self.target_model(),
            get_query: self.get_query(),
            get_fields: self.get_fields(),
            get_sort: self.get_sort(),
            indexfieldname: self.source_index_field_name(),
        }, function (data) {
            self.MainModels(_.map(data.MainModels, function (MM) {
                return MModels.Create(self.source_model(), MM);
            }));
            var Str = {};
            data.MainModels.forEach(function (MM) {
                Str[MM[self.code_source_model()]] = ko.observableArray();
            })
            data.LinkModels.forEach(function (LM) {
                if (Str[LM[self.code_source_model()]]) {
                    Str[LM[self.code_source_model()]].push(MModels.Create(self.target_model(), LM));
                }
            })
            self.LinkModels(Str);
            done && done();
        })
    }

    self.SaveChanges = function () {
        var FieldsToPass = MModels.Create(self.target_model()).EditFields.concat(["_id"]);
        var Data = ko.toJS(self.LinkModels),
            Reparsed = {};
        for (var Key in Data) {
            Reparsed[Key] = _.filter(_.map(Data[Key], function (M) {
                return _.pick(M, FieldsToPass);
            }), function (D) {
                return !_.isEmpty(D[self.source_model_field_name()]);
            })
        }
        $.ajax({
            url: '/api/modules/modelconnector/connect',
            data: {
                JSON: {
                    data: JSON.stringify(Reparsed),
                    source_model: self.source_model(),
                    target_model: self.target_model(),
                    code_source_model: self.code_source_model()
                }
            },
            success: function (data) {
                self.Init();
                self.LoadModels(function(){
                    swal("изменения сохранены", "Изменения успешно сохранены", "success");
                });
            },
            type: 'PUT',
        })
    }

    self.IsAvailable = function () {
        return true;
    }

    self.IsLoaded = ko.observable(false);

    self.Init = function (data, done) {
        if (data) {
            self.source_model(data.source_model);
            self.target_model(data.target_model);
            self.code_source_model(data.code_source_model);
            self.name_source_model(data.name_source_model);
            self.code_target_model(data.code_target_model);
            self.source_model_field_name(data.source_model_field_name);
            self.source_index_field_name(data.source_index_field_name);
            self.get_query(data.get_query);
            self.get_sort(data.get_sort);
            self.get_fields(data.get_fields);
            self.model_edit_fields(data.model_edit_fields);
            self.LoadModels();
        }
        done && done();
    }

    return self;
})


ModuleManager.Modules.ModelConnector = MModelConnector;
