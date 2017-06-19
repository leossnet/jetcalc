var MWorkFlowSettings = (new function() {
   
    var self = new Module("workflowsettings");

    self.IsAvailable = function(){
        return PermChecker.CheckPrivelege("IsWorkFlowTunner");
    }

    self.BeforeShow = function(){
        self.Show();
    }

    self.SaveChanges = function(){
        self.IsLoading(true);
        self.IsLoading(false);
    }


    self.Show = function(done){
        if (!self.Mode()) return self.InitSetMode("States");
        switch (self.Mode()){
            case "States":
                ModelTableEdit.InitModel("state");
            break;
            case "Routes":
                ModelTableEdit.InitModel("route");
            break;
            case "CheckPeriods":
                ModelTableEdit.InitModel("routecheckperiod",["NoGrp","CodeGrp","CodeDocType","CodeRoute","CodePeriod","CodeCheckPeriod"]);
            break;             
            case "RefPeriods":
                ModelTableEdit.InitModel("routerefperiod",["CodeRoute","CodePeriod","CodeRefPeriod"]);
            break;              
            case "AvPeriods":
                ModelTableEdit.InitModel("routeperiod",["NoGrp","CodeGrp","CodeDocType","CodeRoute","CodePeriod"]);
            break;            
            case "Attaches":
                ModelTableEdit.InitModel("routefiletype",["CodeDoc","CodeRoute","CodeFileType","CodePeriod"]);
            break;
            case "FileTypes":
                ModelTableEdit.InitModel("filetype",["CodeFileType","NameFileType"]);
            break;
        }
    	return done && done()
    }
    
    return self;
})





ModuleManager.Modules.WorkFlowSettings = MWorkFlowSettings;