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
                MModelConnector.Init({
                    source_model: 'period',
                    target_model: 'routecheckperiod'
                })
                break;
            case "RefPeriods":
                MModelConnector.Init({
                    source_model: 'period',
                    target_model: 'routerefperiod'
                })
                break;
            case "AvPeriods":
                MModelConnector.Init({
                    source_model: 'period',
                    target_model: 'routeperiod'
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
