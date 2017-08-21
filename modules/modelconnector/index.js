var MModelConnector = (new function () {

    var self = this;

    self.LinkModels = ko.observable();
    self.MainModels = ko.observableArray([]);

    self.row_data = ko.observable();

    self.source_model = ko.observable();
    self.target_model = ko.observable();
    self.code_source_model = ko.observable();
    self.name_source_model = ko.observable();
    self.code_target_model = ko.observable();
    self.source_model_field_name = ko.observable();
    self.source_index_field_name = ko.observable();
    self.get_query = ko.observable({});
    self.get_sort = ko.observable({});
    self.get_fields = ko.observable("-_id");

    self.empty_target_model = ko.observable(null);
    self.empty_target_model_loaded = ko.observable(false);

    self.model_edit_fields = ko.observableArray([]);

    self.RemoveLinkModel = function (Code) {
        self.LinkModels()[Code].remove(this);
    };

    self.AddLinkModel = function (Code) {
        var link_for_add = {};
        link_for_add[self.source_model_field_name()] = Code;
        if (self.source_index_field_name()) {
            link_for_add[self.source_index_field_name()] = self.LinkModels()[Code]().length + 1;
        }
        self.LinkModels()[Code].push(MModels.Create(self.target_model(), link_for_add));
    }

    self.AddMainModel = function () {
        self.empty_target_model = ko.observable(MModels.Create(self.target_model(), {}));
        self.empty_target_model_loaded(true);
        $("#add_main_model_modal").modal('show');
    }

    self._AddMainModel = function () {
        var main_for_add_code = self.empty_target_model()[self.code_source_model()]();
        if (!self.LinkModels()[main_for_add_code]) {
            self.LinkModels()[main_for_add_code] = ko.observableArray();
            var MM = {};
            self.row_data().MainModels.forEach(function (e) {
                if (e[self.code_source_model()] === main_for_add_code) {
                    MM = e;
                }
            })
            if (!MM[self.name_source_model()]) {
                MM[self.name_source_model()] = '';
                MM[self.code_source_model()] = main_for_add_code;
            }
            self.MainModels.push(MModels.Create(self.source_model(), MM))
        }
        $("#add_main_model_modal").modal('hide');
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
            self.row_data(data);
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
            Str2 = {};
            _.keys(Str).forEach(function (k) {
                if (!_.isEmpty(Str[k]())) {
                    Str2[k] = Str[k];
                }
            })
            self.LinkModels(Str2);
            self.MainModels(_.filter(self.MainModels(), function (e) {
                return self.LinkModels()[e[e.Code]()];
            }))
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
                self.LoadModels(function () {
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
            self.MainModels([]);
            self.LinkModels({});
            ModelTableEdit.InitModel(data.target_model);
            self.source_model(data.source_model);
            self.target_model(data.target_model);
            self.code_source_model(data.code_source_model || self._get_code_source_model());
            self.name_source_model(data.name_source_model || self._get_name_source_model());
            self.code_target_model(data.code_target_model || self._get_code_target_model());
            self.source_model_field_name(data.source_model_field_name || self.code_source_model());
            self.source_index_field_name(data.source_index_field_name || null);
            self.get_query(data.get_query || {});
            self.get_sort(data.get_sort || {});
            self.get_fields(data.get_fields || self._get_get_fields());
            self.model_edit_fields(self._get_model_edit_fields(data.model_edit_fields));
            self.LoadModels();
        }
        done && done();
    }

    self._get_code_source_model = function () {
        return _.filter(_.keys(MModels.Config[self.source_model()].fields), function (k) {
            return MModels.Config[self.source_model()].fields[k].role === 'code';
        })[0];
    }

    self._get_name_source_model = function () {
        return _.filter(_.keys(MModels.Config[self.source_model()].fields), function (k) {
            return MModels.Config[self.source_model()].fields[k].role === 'name';
        })[0];
    }

    self._get_code_target_model = function () {
        return _.filter(_.keys(MModels.Config[self.target_model()].fields), function (k) {
            return MModels.Config[self.target_model()].fields[k].role === 'code';
        })[0];
    }

    self._get_get_fields = function () {
        return "-_id " + self.code_source_model() + " " + self.name_source_model();
    }

    self._get_model_edit_fields = function (mef) {
        if (!mef) {
            mef = ModelClientConfig.TableFields(self.target_model());
            mef = _.filter(mef, function (f) {
                return f != self.source_model_field_name()// && f != self.code_target_model();
            })
        }
        var model_edit_fields = [];
        mef.forEach(function (f) {
            if ((typeof f) === "object") {
                model_edit_fields.push(f);
            } else {
                var edit_params = self._get_field_edit_params(f);
                var nf = {
                    field_name: f,
                    name: Tr(self.target_model(), f),
                    class: '',
                    target_model: edit_params.target_model,
                    editor: edit_params.editor,
                    wrapper: edit_params.wrapper,
                }
                model_edit_fields.push(nf);
            }
        })
        return model_edit_fields;
    }

    self._get_field_edit_params = function (field_name) {
        var cfg = MModels.Config[self.target_model()].fields[field_name];
        if (cfg.refmodel) {
            return {
                target_model: cfg.refmodel,
                wrapper: function (x) {
                    return Catalogue.GetHtmlWithCode(cfg.refmodel, x())
                },
                editor: 'combobox',
            };
        }
        if (cfg.type === "Boolean") {
            return {
                target_model: '',
                editor: 'check',
                wrapper: function (x) {
                    var ret = "<input type='checkbox' onclick='return false;' class='ace ace-checkbox-2'";
                    if (x()) {
                        ret += 'checked';
                    }
                    ret += "><span class='lbl'></span></input>";
                    return ret;
                },
            };
        }
        if (cfg.type === "Number") {
            return {
                target_model: '',
                editor: 'number',
                wrapper: function (x) {
                    return x().toString()
                },
            };
        }
        return {
            target_model: '',
            editor: 'text',
            wrapper: function (x) {
                return x().toString();
            },
        };
    }

    self.Settings = function () {
        $("#connector_settings_modal").modal("show");
    }

    self.SaveSettings = function () {
        ModelClientConfig.Save({
            ModelName: ModelTableEdit.ModelName(),
            TableFields: ModelTableEdit.TableFieldsCheck(),
            EditFields: ModelTableEdit.EditFieldsCheck(),
            Links: ModelTableEdit.LinksCheck()
        }, function () {
            $("#connector_settings_modal").modal("hide");
            ModelTableEdit.InitModel(ModelTableEdit.ModelName(), ModelTableEdit.Sort(), ModelTableEdit.Filter());
            self.model_edit_fields(self._get_model_edit_fields());
        })
    }

    return self;
})


ModuleManager.Modules.ModelConnector = MModelConnector;
