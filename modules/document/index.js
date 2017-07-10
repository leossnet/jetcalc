var MDocument = (new function() {
    
    var self = new Module("document"); 


    self.IsAvailable = function(){
        return PermChecker.CheckPrivelege("IsDocumentCreator");
    }


    self.BeforeHide = function(){
        self.UnSubscribe()
    }

    self.BeforeShow = function(){
        self.Subscribe();
        self.Show();
    }        

    self.ModelIsLoaded = function(){
        
    }

    self.ModelIsSaved = function(){
        if (self.Mode()=="Folders"){
            self.LoadFolders();
        }
    }

    self.ModelIsCreated = function(){
        
    }

    self.ModelIsDeleted = function(){
        if (self.Mode()=="Folders"){
            self.LoadFolders();
        }
    }


    self.FolderStructure = ko.observable(null);

    self.FoldersDataSource = function(options, callback){
        var Answ  = {};
        if(!("text" in options) && !("type" in options)){
            console.log("Answ:",self.FolderStructure);
            return callback({ data: self.FolderStructure() });
        } else if("type" in options && options.type == "folder") {
            var Answ = options.additionalParameters.children;
            console.log("Answ:",Answ);
        }
        callback({ data: Answ });
    };

    self.LoadFolders = function(done){
        self.rGet("folders",{},function(List){
            var Tree = {};
            var FirstLevel = _.filter(List,{CodeParentDocFolder:""});
            FirstLevel.forEach(function(FL){
                Tree[FL.CodeDocFolder] = {text:"<i class='ace-icon fa "+FL.Icon+" orange'></i> "+FL.NameDocFolder, model:"docfolder",code:FL.CodeDocFolder,type: 'folder','icon-class':'red',additionalParameters:{children:{}}};
            })
            List.forEach(function(F){
                if (F.CodeParentDocFolder!=""){
                    Tree[F.CodeParentDocFolder]['additionalParameters'].children[F.CodeDocFolder] =  {text:"<i class='ace-icon fa "+F.Icon+" green'></i> "+F.NameDocFolder,type: 'folder','icon-class':'green',model:"docfolder",code:F.CodeDocFolder,additionalParameters:{children:{}}};
                }
            })
            self.FolderStructure(Tree);
            return done && done();
        })
    }

    self.SaveChanges = function(){
        self.IsLoading(true);
        self.IsLoading(false); 
    }

    self.Show = function(done){
        if (!self.Mode()) return self.InitSetMode("Docs");
        switch (self.Mode()){
            case "Roles":
                ModelTableEdit.InitModel("role",["IsExtended","CodeRole","NameRole"],{IsExtended:1,CodeRole:1});
                /*ModelTableEdit.ForceEditFields = [
                        "CodeRole","NameRole","SNameRole","IsExtended"
                ];*/
            break;            
            case "Folders":
                self.LoadFolders(function(){
                    ModelTableEdit.InitModel("docfolder");    
                    ModelTableEdit.IsOverrideList(true);
                    /*ModelTableEdit.ForceEditFields = [
                        "CodeDocFolder", "NameDocFolder", "IndexDocFolder", "CodeParentDocFolder", "Icon"
                    ]*/
                })                
            break;            
            case "Labels":
                ModelTableEdit.InitModel("label");
            break;             
            case "DocTypes":
                ModelTableEdit.InitModel("doctype");
            break;   
            case "Docs":
                ModelTableEdit.InitModel("doc",["CodeDoc","NameDoc","CodeRole","CodeGrp"],{IndexDoc:1});
                /*ModelTableEdit.ForceEditFields = [
					"CodeDoc","NameDoc","IsOlap","IsInput","IsChart","IsPresent","IsShowMeasure","CodeDocType","CodeRole","CodeGrp","CodeMeasure"
                ];
                ModelTableEdit.EditLinks(["docfolderdoc","docrow"]);*/                
            break;            
        }
        return done && done()
    }  

    
    return self;
})





ModuleManager.Modules.Document = MDocument;