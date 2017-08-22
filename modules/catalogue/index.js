var ModelConnectorEdit = (new function () {

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
    self.use_sync_links = ko.observable(false);

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
        $.getJSON('/api/modules/catalogue/connector', {
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
                if (Str[LM[self.source_model_field_name()]]) {
                    Str[LM[self.source_model_field_name()]].push(MModels.Create(self.target_model(), LM));
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
            url: '/api/modules/catalogue/connector',
            data: {
                JSON: {
                    data: JSON.stringify(Reparsed),
                    source_model: self.source_model(),
                    target_model: self.target_model(),
                    code_source_model: self.source_model_field_name(),
                    use_sync_links: self.use_sync_links(),
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
            self.use_sync_links(data.use_sync_links || false);
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
                return f != self.source_model_field_name() // && f != self.code_target_model();
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
});


var ModelRestrict = (new function () {
    var self = this;

    self.Restrictions = {
        docfolder: {
            CodeParentDocFolder: {
                CodeParentDocFolder: ""
            }
        },
        routeperiod: {
            CodePeriod: {
                IsFormula: false
            }
        },
        statecalendardate: {
            CodePeriod: {
                IsFormula: false
            }
        },
        file: {
            CodePeriod: {
                IsFormula: false
            }
        },
        data: {
            CodePeriod: {
                IsFormula: false
            }
        },
        periodredirect: {
            CodePeriodToRedirect: {
                IsFormula: false
            },
            CodePeriod: {
                IsFormula: false
            }
        },
        routecheckperiod: {
            CodeCheckPeriod: {
                IsFormula: false
            },
            CodePeriod: {
                IsFormula: false
            }
        },
        routerefperiod: {
            CodeRefPeriod: {
                IsFormula: false
            },
            CodePeriod: {
                IsFormula: false
            }
        },
        docfolderdoc: {
            CodeDocFolder: {
                CodeParentDocFolder: {
                    $ne: ""
                }
            }
        },
        docrow: {
            CodeRow: {
                CodeParentRow: ""
            }
        },
        docheader: {
            CodeHeader: {
                CodeParentHeader: ""
            }
        }
    }

    self.Get = function (modelName, FieldName) {
        if (self.Restrictions[modelName] && self.Restrictions[modelName][FieldName]) {
            return self.Restrictions[modelName][FieldName];
        }
    }

    return self;
})


var ModelClientConfig = (new function () {
    var self = this;

    self.Config = {};

    self.CodeAndName = function (ModelName) {
        return [MModels.Config[ModelName].Code, MModels.Config[ModelName].Name];
    }

    self.TableFields = function (ModelName) {
        return _.compact(_.isEmpty(self.Config[ModelName]) ? self.CodeAndName(ModelName) : self.Config[ModelName].TableFields);
    }

    self.Links = function (ModelName) {
        return _.compact(_.isEmpty(self.Config[ModelName]) ? [] : self.Config[ModelName].Links);
    }

    self.EditFields = function (ModelName) {
        return _.compact(_.isEmpty(self.Config[ModelName]) ? self.CodeAndName(ModelName) : self.Config[ModelName].EditFields);
    }

    self.base = '/api/modules/catalogue/';

    self.Load = function (done) {
        $.getJSON(self.base + "clientsettings", function (data) {
            self.Config = data;
            return done && done();
        })
    }

    self.Save = function (data, done) {
        $.ajax({
            url: self.base + "clientsettings",
            method: 'post',
            data: data,
            success: function () {
                self.Load(done);
            }
        })
    }

    return self;
})





var ModelChooser = (new function () {

    var self = this;

    self.ModelName = ko.observable();
    self.Choosed = ko.observable();
    self.ModelInfo = ko.observable();

    self.ModelName.subscribe(function (V) {
        if (V && MModels.Config[V]) {
            self.ModelInfo(MModels.Config[V]);
        }
    })

    self.ChoosedCss = function (data) {
        var CodeField = self.ModelInfo()["Code"];
        return (self.Choosed() && data[CodeField]() == self.Choosed()[CodeField]()) ? 'active' : '';
    }

    self.Error = ko.observable(null);


    self.NewModel = ko.observable();

    self.SaveNew = function () {
        self.Error(null);
        var CodeField = self.ModelInfo()["Code"];
        var Model2Save = self.NewModel().toJS();
        var CodeValue = (Model2Save[CodeField] + '').trim();
        if (!CodeValue.length) return self.Error("Придумайте код");
        Catalogue.CheckCodeAvailable(self.ModelName(), CodeValue, function (err) {
            if (err) return self.Error("Код уже используется");
            $.ajax({
                url: Catalogue.base + '/addmodel',
                method: 'put',
                data: {
                    Model: Model2Save,
                    ModelName: self.ModelName(),
                },
                success: function (data) {
                    if (data.err) return self.Error(data.err);
                    self.SearchStr(CodeValue);
                    self.SearchStr.valueHasMutated();
                    $("#select_table_modal_add").modal('hide');
                }
            })
        })
    }

    self.AddNew = function () {
        var M = MModels.Create(self.ModelName(), {});
        self.NewModel(M);
        $("#select_table_modal_add").modal('show');
        $("#select_table_modal_add").on('hidden.bs.modal', function () {
            self.Error(null);
            self.NewModel(null);
        })
    }

    self.CancelAdd = function () {
        $("#select_table_modal_add").modal('hide');
    }

    self.Fields = {
        "measure": ["CodeMeasure", "NameMeasure", "SNameMeasure"],
        "format": ["CodeFormat", "NameFormat", "FormatValue"],
        "valuta": ["CodeValuta", "NameValuta", "SignValuta"],
        "style": ["CodeStyle", "NameStyle", "CSS"],
        "grp": ["CodeGrp", "NameGrp"],
        "prod": ["CodeProd", "NameProd"],
        "org": ["CodeOrg", "NameOrg"],
        "dogovor": ["CodeDogovor", "NameDogovor"],
        "dogovorakt": ["CodeDogovorAkt", "NameDogovorAkt"],
        "row": ["CodeRow", "NameRow"]
    }

    self.TableFields = function () {
        return self.Fields[self.ModelName()] || [];
    }

    self.SearchStr = ko.observable("");
    self.SearchResults = ko.observableArray();

    self.UpdateSearch = ko.computed(function () {
        var model = self.ModelName() + '',
            query = self.SearchStr() + '';
        self.SearchResults([]);
        if (model.length && window.Catalogue) {
            Catalogue.SearchModelExtended(model, query, function (Res) {
                var Updated = ModelEdit.ToArr(model, Res);
                self.SearchResults(Updated);
            });
        }
    }).extend({
        throttle: 800
    });

    return self;
})


var Catalogue = (new function () {

    var self = this;

    self.base = '/api/modules/catalogue';

    self.ToLoad = ko.observableArray();
    self.InProgress = [];

    self.SetCheck = ko.observable(false);
    self.Error = ko.observable(null);

    self.Init = function (done) {
        MSite.Events.on("save", function () {
            if (!ModelTableEdit.NoAccess() && ModelTableEdit.LoadedModel()) {
                ModelTableEdit.Save();
            }
        })
        MSite.Events.on("addrecord", function () {
            if (!ModelTableEdit.NoAccess()) {
                ModelTableEdit.Add();
            }
        })
        ModelClientConfig.Load(done);
    }

    self.LoadModels = function (modelName, Fields, Sort, Search, limit, skip, filter, done) {
        self.Error(null);
        $.ajax({
            url: self.base + '/searchmodel',
            data: {
                model: modelName,
                fields: Fields,
                sort: Sort,
                q: Search,
                limit: limit,
                skip: skip,
                filter: JSON.stringify(filter)
            },
            success: function (SearchResult) {
                if (SearchResult.err) return self.Error(SearchResult.err);
                return done(SearchResult);
            }
        })
    }


    /*   self.throttled = {};
    self.throttledTimer = null;
    self.SearchThrottle = function(params,callback){
        if (!self.throttled[params.model]) self.throttled[params.model] = {};
        if (!self.throttled[params.model][params.q]) self.throttled[params.model][params.q] = [];
        self.throttled[params.model][params.q].push(callback);
        if (self.throttledTimer) clearTimeout(self.throttledTimer);
        self.throttledTimer = setTimeout(function(){
            console.log(self.throttled);

        },1000);
    }
*/


    self.DoSearch = function (params, callback) {
        //return self.SearchThrottle(params, callback);
        self.Error(null);
        $.getJSON(self.base + '/search', params, function (SearchResult) {
            if (SearchResult.err) return self.Error(SearchResult.err);
            return callback(SearchResult);
        })
    }

    self.SearchModel = function (model, query, callback) {
        self.DoSearch({
            model: model,
            q: query
        }, callback);
    }

    self.SearchModelExtended = function (model, query, callback) {
        self.DoSearch({
            model: model,
            q: query,
            fields: ModelChooser.Fields[model],
            extend: true
        }, callback)
    }

    self.SearchModelUnlimit = function (model, query, callback) {
        self.DoSearch({
            model: model,
            q: query,
            unlimit: true
        }, callback)
    }

    self.Get = function (model, id) {
        if (!self.References[model]) self.References[model] = {};
        if (!self.References[model][id] && self.InProgress.indexOf(model + "_" + id) == -1) {
            var P = model + "_" + id;
            self.InProgress.push(P);
            if (self.ToLoad.indexOf(P) == -1) self.ToLoad.push(P);
            return id;
        } else {
            return self.References[model][id];
        }
    }

    self.GetHtml = function (model, id) {
        var r = self.Get(model, id);
        if (!r) r = "";
        return "<span data-catalogue='" + model + "_" + id + "'>" + r + "</span>";
    }

    self.GetHtmlWithCode = function (model, id) {
        var r = self.Get(model, id);
        if (!r) r = "";
        return "<span class='label label-info'>" + id + "</span> <span data-catalogue='" + model + "_" + id + "'>" + r + "</span>";
    }

    self.Load = ko.computed(function () {
        var classesToLoad = self.ToLoad();
        self.ToLoad([]);
        if (!classesToLoad.length) return;
        setTimeout(function () {
            $.ajax({
                url: self.base + '/translate',
                type: 'post',
                data: {
                    ToLoad: classesToLoad
                },
                success: function (res) {
                    for (var modelName in res) {
                        if (!self.References[modelName]) self.References[modelName] = {};
                        self.References[modelName] = _.merge(self.References[modelName], res[modelName]);
                        var Loaded = _.keys(res[modelName]);
                        Loaded.forEach(function (L) {
                            _.pull(self.InProgress, modelName + '_' + L);
                        })
                    }
                    setTimeout(self.UpdateDom, 0);
                }
            })
        }, 0)
    }).extend({
        throttle: 500
    })

    self.UpdateDom = function () {
        $('[data-catalogue]').each(function (index, node) {
            try {
                var nod = $(node).data('catalogue');
                var tr = nod.split("_"),
                    M = tr.shift(),
                    C = tr.join("_");
                var text = self.References[M][C];
                if (text) {
                    $(node).text(self.References[M][C]);
                    $(node).removeAttr("data-catalogue");
                    $(node).removeAttr("data-bind");
                    ko.cleanNode(node);
                }
            } catch (e) {
                console.log(e);
            }
        })
    }

    self.References = {

    };

    self.GetAll = function (model) {
        if (model == 'year') {
            var R = [],
                C = Number(moment().format("YYYY"));
            for (var i = C - 5; i < C + 2; i++) {
                var str = i + '';
                R.push({
                    id: str,
                    name: str
                });
            }
            return R;
        }
        return [];
    }



    return self;
})



var ModelTableEdit = (new function () {

    var self = this;

    self.List = ko.observableArray();
    self.ModelsCount = ko.observable(0);

    self.Events = new EventEmitter();
    self.base = "/api/modules/catalogue/";
    self.ModelName = ko.observable();
    self.Search = ko.observable("").extend({
        throttle: 600
    });

    self.CodeField = ko.observable();
    self.NameField = ko.observable();
    self.IsInited = ko.observable(false);

    self.Filter = ko.observable(null);

    self.Choosed = ko.observable(null);

    self.LoadedModel = ko.observable(null);

    self.IsExtendEditor = ko.observable(false);
    self.IsOverrideList = ko.observable(false);


    self.TableFields = ko.observableArray();
    self.Links = ko.observableArray();
    self.EditFields = ko.observableArray();


    self.TableFieldsCheck = ko.observableArray();
    self.EditFieldsCheck = ko.observableArray();
    self.LinksCheck = ko.observableArray();

    self.AllTableFields = ko.observableArray();
    self.AllEditFields = ko.observableArray();
    self.AllLinks = ko.observableArray();


    self.TableFieldsModel = ko.observable(null);


    self.GetEditFields = function () {
        if (self.EditFields().length) return self.EditFields();
        return self.DefaultEditFields;
    }

    self.IsChoosed = function (data) {
        return data[self.CodeField()]() == self.Choosed();
    }

    self.NoAccess = ko.observable(true);

    self.Sort = ko.observable(null);

    self.SetChoosed = function (data) {
        self.Choosed(data[self.CodeField()]());
    }

    self.Error = ko.observable(null);
    self.IsLoading = ko.observable(false);

    self.Choosed.subscribe(function (v) {
        if (v) {
            self.LoadModel();
        } else {
            self.LoadedModel(null);
        }
    })

    self.Add = function () {
        self.Choosed(null);
        var n = MModels.Create(self.ModelName(), {});
        self.LoadedModel(n);
        self.Events.emit("modelcreated");
    }

    self.Delete = function () {
        swal({
                title: "",
                text: "Вы собираетесь удалить " + Tr(self.ModelName()),
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Да, удалить!",
                cancelButtonText: "Отменить",
                closeOnConfirm: true
            },
            function () {
                self.DeleteModel();
            });
    }

    self.Settings = function () {
        $("#catalogue_settings_modal").modal("show");
    }

    self.SaveSettings = function () {
        ModelClientConfig.Save({
            ModelName: self.ModelName(),
            TableFields: self.TableFieldsCheck(),
            EditFields: self.EditFieldsCheck(),
            Links: self.LinksCheck()
        }, function () {
            $("#catalogue_settings_modal").modal("hide");
            self.InitModel(self.ModelName(), self.Sort(), self.Filter());
        })
    }

    self.LoadModel = function () {
        self._loadModel(self.Choosed(), function () {
            self.Events.emit("modelloaded");
        })
    }
    self.ReloadModel = function (Code, done) {
        console.log("ReloadModel");
        self._loadModel(Code, done);
    }

    self._loadModel = function (Code, done) {
        self.Error(null);
        self.IsLoading(true);
        $.ajax({
            url: self.base + 'model',
            data: {
                model: self.ModelName(),
                code: Code,
                links: self.Links()
            },
            method: 'get',
            success: function (data) {
                self.IsLoading(false);
                if (data.err) return self.Error(data.err);
                self.LoadedModel(ModelEdit.Model(self.ModelName(), data));
                return done && done();
            }
        })
    }

    self.Validate = function (done) {
        if (!self.LoadedModel()) return;
        var L = self.LoadedModel(),
            CodeField = L.Code,
            CodeValue = L[CodeField](),
            _id = L._id ? L._id() : null;
        if (_.isEmpty(CodeValue)) return done(true);
        $.ajax({
            url: self.base + 'validate',
            data: {
                model: self.ModelName(),
                code: CodeValue,
                _id: _id,
            },
            success: function (data) {
                if (data.err) return self.Error(data.err);
                return done && done(data.validate);
            }
        })
    }

    self.Save = function () {
        self.Error(null);
        self.Validate(function (result) {
            if (!result) {
                self.Error(Tr("validatefailed"));
                return;
            }
            self.IsLoading(true);
            $.ajax({
                url: self.base + 'model',
                data: {
                    model: self.ModelName(),
                    code: self.Choosed(),
                    data: self.LoadedModel().toJS(),
                    isnew: self.LoadedModel()._id,
                    links: self.Links()
                },
                method: 'put',
                success: function (data) {
                    self.IsLoading(false);
                    if (data.err) return self.Error(data.err);
                    self.LoadList();
                    var Code = self.Choosed() || data.code;
                    self.ReloadModel(Code, function () {
                        setTimeout(function () {
                            self.Events.emit("modelsaved");
                        }, 0);
                    })
                }
            })
        })
    }

    self.Dependable = ko.observable(null);

    self.ForceDelete = function () {
        self.DeleteModel(true);
    }

    self.DeleteModel = function (force) {
        force = (force === true) ? true : false;
        self.Error(null);
        self.IsLoading(true);
        self.Dependable(null);
        $.ajax({
            url: self.base + 'model',
            data: {
                model: self.ModelName(),
                code: self.Choosed(),
                force: force
            },
            method: 'delete',
            success: function (data) {
                self.IsLoading(false);
                if (data.err) return self.Error(data.err);
                if (data.Depends) {
                    self.Dependable(data.Depends)
                    $("#delete_dependance").modal('show');
                    $("#delete_dependance").on('hidden.bs.modal', function () {
                        self.Dependable(null);
                    })
                } else {
                    self.Choosed(null);
                    self.Events.emit("modeldeleted");
                    self.LoadList();
                }
            }
        })
    }

    self.InitModel = function (ModelName, Sort, Filter) {
        Filter = Filter || {};
        self.Clear();
        self.ModelName(ModelName);

        var TF = ModelClientConfig.TableFields(ModelName);
        self.TableFields(TF);
        self.TableFieldsCheck(TF);
        var TL = ModelClientConfig.Links(ModelName);
        self.Links(TL);
        self.LinksCheck(TL);
        var TE = ModelClientConfig.EditFields(ModelName);
        self.EditFields(TE);
        self.EditFieldsCheck(TE);

        self.Sort(Sort);
        self.CodeField(MModels.Config[ModelName].Code);
        self.NameField(MModels.Config[ModelName].Name);

        self.AllTableFields(MModels.Config[ModelName].EditFields);
        self.AllEditFields(_.filter(MModels.Config[ModelName].EditFields, function (V) {
            return V.indexOf("Link_") == -1;
        }));
        self.AllLinks(_.uniq(MModels.Config[ModelName].Links));
        self.Filter(Filter);
        self.IsInited(true);
        self.LoadList();
        self.skip = 0;
        self.limit = 50;
        self.NoAccess(!PermChecker.ModelAccess(ModelName));
    }

    self.Clear = function () {
        self.ModelsCount(0);
        self.IsInited(false);
        self.Search("");
        self.List([]);

        self.TableFields([]);
        self.EditFields([]);
        self.Links([]);


        self.TableFieldsCheck([]);
        self.EditFieldsCheck([]);
        self.LinksCheck([]);

        self.AllTableFields([]);
        self.AllEditFields([]);
        self.AllLinks([]);

        self.CodeField(null);
        self.NameField(null);
        self.ModelName(null);
        self.Choosed(null);
        self.LoadedModel(null);
        self.skip = 0;
        self.limit = 50;
        self.Sort(null);
        self.NoAccess(true);
        self.IsExtendEditor(false);
        self.IsOverrideList(false);
        self.Filter(null);
    }



    self.LoadList = function () {
        if (!self.ModelName()) return;
        self.IsLoading(true);
        Catalogue.LoadModels(self.ModelName(), self.TableFields(), self.Sort(), self.Search(), self.limit, self.skip, self.Filter(), function (data) {
            self.IsLoading(false);
            self.List(_.map(data.models, function (M) {
                return MModels.Create(self.ModelName(), M);
            }));
            self.ModelsCount(data.count);
        })
    }

    self.LoadMore = function () {
        if ((!self.ModelName()) || (self.ModelsCount() < (self.limit + self.skip))) {
            self.pendingRequest = false;
            return;
        }
        if (!self.skip)
            self.skip = self.limit;
        else
            self.skip += self.limit;
        self.limit = 50;
        self.IsLoading(true);
        Catalogue.LoadModels(self.ModelName(), self.TableFields(), self.Sort(), self.Search(), self.limit, self.skip, self.Filter(), function (data) {
            self.IsLoading(false);
            self.List(_.union(self.List(), _.map(data.models, function (M) {
                return MModels.Create(self.ModelName(), M);
            })));
            self.pendingRequest = false;
        });
    }

    self.Search.subscribe(function (val) {
        if (self.IsInited()) {
            self.skip = 0;
            self.LoadList();
        }
    })

    self.pendingRequest = false;
    self.skip = null;
    self.limit = null;
    self.scrolled = function (data, event) {
        var elem = event.target;
        if ((elem.scrollTop > (elem.scrollHeight - elem.offsetHeight - 10)) && (!self.pendingRequest)) {
            self.pendingRequest = true;
            self.LoadMore();
        }
    }

    self.refStack = ko.observableArray([]);

    self.AddRefModel = function (field, value, Model) {
        var refmodel = MModels.Create(Model);
        var toStack = {
            depth: self.refStack().length,
            fieldName: field,
            model: refmodel
        }
        self.refStack.push(toStack);
        self.showAddModal();
    }

    self.goToStackPos = function (index) {
        if (index + 1 == self.refStack().length) return;
        self.refStack(self.refStack.slice(0, index + 1));
    }

    self.isModalShown = ko.observable(false);

    self.showAddModal = function () {
        if (!self.isModalShown()) {
            var modalElem = $('#cascadeAddModal');
            self.isModalShown(true);
            modalElem.modal('show');

            modalElem.on('hidden.bs.modal', function (e) {;
                self.isModalShown(false);
                modalElem.off('hidden.bs.modal');
                self.refStack([]);
            });
        }
    }

    self.saveRefElement = function () {
        var ref = _.last(self.refStack());
        var fieldName = ref.fieldName;
        $.ajax({
            url: self.base + 'model',
            data: {
                model: ref.model.ModelName,
                code: null,
                data: ref.model.toJS()
            },
            method: 'put',
            success: function (data) {

                var newref = null;
                var CodeValue = data.code;

                if (self.refStack().length > 1) {
                    newref = self.refStack()[self.refStack().length - 2].model;
                    newref[fieldName](data.code);
                } else {
                    if (self.LoadedModel()) {
                        var ch = self.LoadedModel().toJS();
                        self.LoadedModel()[fieldName](data.code);
                        self.refStack.pop();
                        if (self.refStack().length == 0) {
                            self.hideAddModal();
                        }
                    } else {
                        self.hideAddModal();
                        ModelChooser.SearchStr.valueHasMutated()
                    }
                }
            }
        })
    }

    self.hideAddModal = function () {
        $('#cascadeAddModal').modal('hide');
        self.refStack([]);
    }

    return self;
})




var ModelEdit = (new function () {
    var self = this;


    self.ToArr = function (ModelName, Arr) {
        var R = [];
        if (!MModels.Models[ModelName]) return R;
        Arr && Arr.forEach(function (El) {
            var M = MModels.Create(ModelName, El);
            R.push(M);
        })
        return R;
    }

    self.Model = function (ModelName, Data) {
        var D = MModels.Create(ModelName, Data);
        D = self.SwapDataToModels(D);
        return D;
    }

    self.SwapDataToModels = function (Document) {
        if (!Document) return null;
        var Doc = Document.toJS();
        for (var Field in Doc) {
            if (Field.indexOf("Link_") == 0 && !_.isEmpty(Doc[Field])) {
                var ModelName = Field.split("Link_").pop();
                var Test = _.first(Doc[Field]);
                if (typeof Test == 'object') { // populated
                    var NewArr = [];
                    Doc[Field].forEach(function (AL) {
                        var N = MModels.Create(ModelName, AL, {
                            IsEdit: false
                        });
                        NewArr.push(N);
                    })
                    Document[Field](NewArr);
                }
            }
        }
        return Document;
    }

    self.AddLink = function (LinkName, Field) {
        var Init = {};
        var ParentModel = this();
        Field = Field || ParentModel.Code;
        try {
            Init[Field] = ParentModel[ParentModel.Code]();
        } catch (e) {
            console.log(e);
        }
        var A = MModels.Create(LinkName, Init, {
            IsEdit: true
        });
        ParentModel["Link_" + LinkName].push(A);
    }

    self.RemoveLink = function (LinkName, Link) {
        this["Link_" + LinkName].remove(Link);
    }


    return self;
})

ModuleManager.Modules.Catalogue = Catalogue;
