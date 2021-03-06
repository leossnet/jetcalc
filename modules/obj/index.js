var MObj = (new function() {
    
    var self = new Module("obj"); 

    self.IsAvailable = function(){
        return PermChecker.CheckPrivelegeAny(["IsObjTunner","IsOrgTunner","IsLocationTunner"]);
    }
    
    self.SubMode = ko.observable(null);

    self.ByType = {
        Objs:["Objs","ObjClasses","ObjTypes","Grps"],
        Location:["Cities","Regions","Countries"],
        Orgs:["Orgs","Otrasls","Divs","Department","Grps"]
    };

    self.Icons = {
        Orgs:'fa-building-o',
        Objs:'fa-hospital-o',
        Cities:'fa-map-marker',
        Countries:'fa-globe',
        Regions:'fa-flag-o',
        Location:'fa-globe'
    }

    self.Icon = function(data){
        return self.Icons[data] || 'fa-folder-open';
    }

    self.SubMode.subscribe(function(NewValue){
        var ToSet = _.first(self.ByType[NewValue]);
        if (self.Mode()!=ToSet){
            self.Mode(ToSet);
        }
    })
    self.SubMode("Objs");

    self.BeforeShow = function(){
        self.Subscribe();
        self.Show();
    }

    self.BeforeHide = function(){
        self.UnSubscribe();
    } 

    self.Update = function(){
    	self.Show();
    }

    self.ModelIsSaved = function(){
        self.Update();
    }
    self.ModelIsDeleted = function(){
        self.Update();
    }

    self.SaveChanges = function(){
        self.IsLoading(true);
        self.IsLoading(false);
    }


    self.Show = function(done){ 
        if (!self.Mode()) return self.InitSetMode("Objs");
        switch (self.Mode()){
            case "ObjTypes":
                ModelTableEdit.InitModel("objtype");
            break;                 
            case "ObjClasses":
                ModelTableEdit.InitModel("objclass");
            break;            
            case "Objs":
                ModelTreeEdit.Init({
                    model: "obj",
                    parent_code_field: "CodeParentObj",
                })
             break;
            case "Grps":
                ModelTableEdit.InitModel("grp");
            break;
            case "Cities":
                ModelTableEdit.InitModel("city");
            break;
            case "Regions":
                ModelTableEdit.InitModel("region");
            break;            
            case "Countries":
                ModelTableEdit.InitModel("country");
            break;
            case "Otrasls":
                ModelTableEdit.InitModel("otrasl");
            break;            
            case "Orgs":
                ModelTableEdit.InitModel("org");
            break;            
            case "Divs":
                ModelTableEdit.InitModel("div",{Idx:1});
            break;
            case "Department":
                ModelTableEdit.InitModel("depart");
            break; 
        }
        return done && done()
    }  


    
    return self;
})







ModuleManager.Modules.Obj = MObj;