var MWorkFlowSettings = (new function () {

    var self = new Module("workflowsettings");

    self.IsAvailable = function () {
        return PermChecker.CheckPrivelege("IsWorkFlowTunner");
    }

    self.BeforeShow = function () {
        self.Show();
    }

    self.SaveChanges = function () {
        self.IsLoading(true);
        self.IsLoading(false);
    }


    self.Show = function (done) {
        if (!self.Mode()) return self.InitSetMode("States");
        switch (self.Mode()) {
            case "States":
                ModelTableEdit.InitModel("state");
                break;
            case "Routes":
                ModelTableEdit.InitModel("route");
                break;
            case "CheckPeriods":
                ModelTableEdit.InitModel("routecheckperiod");
                break;
            case "RefPeriods":
                ModelTableEdit.InitModel("routerefperiod");
                break;
            case "AvPeriods":
                //ModelTableEdit.InitModel("routeperiod");
                MModelConnector.Init({
                    source_model: 'period',
                    target_model: 'routeperiod',
                    code_source_model: 'CodePeriod',
                    name_source_model: 'NamePeriod',
                    code_target_model: 'CodeRoutePeriod',
                    source_model_field_name: 'CodePeriod',
                    target_model_field_name: 'CodeRoute',
                    source_index_field_name: null,
                    get_query: {},
                    get_sort: {},
                    get_fields: '-_id CodePeriod NamePeriod',
                    model_edit_fields: [
                        {
                            class: '',
                            wrapper: function (x) {
                                var ret = "<input type='checkbox' onclick='return false;' class='ace ace-checkbox-2'";
                                if (x()) {
                                    ret += 'checked';
                                }
                                ret += "><span class='lbl'></span></input>";
                                return ret;
                            },
                            field_name: 'NoGrp',
                            editor: 'check',
                            name: 'Не в группе',
                            target_model: ''

                        },
                        {
                            class: '',
                            wrapper: function (x) {
                                return Catalogue.GetHtmlWithCode("roteperiod", x())
                            },
                            field_name: 'CodeRoute',
                            editor: 'combobox',
                            name: 'Маршрут',
                            target_model: 'route'
                        },
                        {
                            class: '',
                            wrapper: function (x) {
                                return Catalogue.GetHtmlWithCode("doctype", x())
                            },
                            field_name: 'CodeDocType',
                            editor: 'combobox',
                            name: 'Тип документа',
                            target_model: 'doctype'
                        },
                        {
                            class: '',
                            wrapper: function (x) {
                                return Catalogue.GetHtmlWithCode("grp", x())
                            },
                            field_name: 'CodeGrp',
                            editor: 'combobox',
                            name: 'Группа',
                            target_model: 'grp'
                        }
                    ],
                })
                break;
            case "Attaches":
                ModelTableEdit.InitModel("routefiletype");
                break;
            case "FileTypes":
                ModelTableEdit.InitModel("filetype");
                break;
        }
        return done && done()
    }

    return self;
})





ModuleManager.Modules.WorkFlowSettings = MWorkFlowSettings;
