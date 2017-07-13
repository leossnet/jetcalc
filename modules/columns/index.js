var MColumns = (new function() {

    var self = new Module("columns");

    self.IsAvailable = function(){
        return PermChecker.CheckPrivelegeAny(["IsColumnEditor","IsColsetEditor","IsHeaderEditor"]);
    }

    self.ColsetCols = ko.observableArray();

    self.LoadColset = function(){
        self.ColsetCols([]); 
        var CodeColset = ModelTableEdit.LoadedModel().CodeColset();
        self.rGet("colsetcol",{CodeColset:CodeColset},function(data){
            self.ColsetCols(_.map(data,function(d){
                return MModels.Create("colsetcol",d);
            }));
        })
    }

    self.RemoveColset = function(data){
        self.ColsetCols.remove(data);
    }

    self.AddColsetCol = function(){
        var CodeColset = ModelTableEdit.LoadedModel().CodeColset();
        self.ColsetCols.push(MModels.Create("colsetcol",{CodeColset:CodeColset}));
    }

    self.SaveColsetCols = function(){
        var Code = ModelTableEdit.LoadedModel().CodeColset();
        var ColsetCols = [];
        var Data = {
            CodeColset:Code,
            Cols:_.map(self.ColsetCols(),function(Model){
                return _.merge(_.pick(Model.toJS(),Model.EditFields),{CodeColset:Code});
            })   
        };
        console.log("DATA",Data);
        self.rPut("colsetcol",Data,function(){
            self.LoadColset();
        })
    }


    self.Tree = ko.observable(null);

    self.LoadHeadersTree = function(done){
        self.rGet("headerstree",{},function(data){
            self.Tree(data);
            return done && done();
        })
    }

    self.HeadersDataSource = function(options, callback){
        var Answ  = {};
        if(!("text" in options) && !("type" in options)){
            return callback({ data: self.Tree() });
        } else if("type" in options && options.type == "folder") {
            var Answ = options.additionalParameters.children;
        }
        callback({ data: Answ });
    };
 

    self.BeforeShow = function(){
        self.Subscribe();
        self.Show();
    }

    self.BeforeHide = function(){
        self.UnSubscribe();
    }

    self.ModelIsLoaded = function(){
        console.log(">>>>>>","ModelIsLoaded",">>>>>>");
        switch (self.Mode()){
            case "ColSet":
                self.ColsetCols([]);
                self.LoadColset();
            break;
        }
    }

    self.ModelIsCreated = function(){
        switch (self.Mode()){
            case "ColSet":
                self.ColsetCols([]);
            break;
        }
    }

    self.ModelIsSaved = function(){
        switch (self.Mode()){
            case 'ColSet':
                self.SaveColsetCols();
            break;             
            case 'Header':
                self.LoadHeadersTree();
            break;           
        }        
    }

    self.Show = function(done){
        if (!self.Mode())  return self.InitSetMode ("Cols");
        switch (self.Mode()){
            case "Cols":
                ModelTableEdit.InitModel("col",["IsFormula","CodeCol","NameCol"]);
            break;            
            case "Header":
                self.LoadHeadersTree(function(){
                    ModelTableEdit.InitModel("header",["CodeHeader","NameHeader"],{CodeHeader:1},{CodeParentHeader:{$in:[null,""]}});
                    ModelTableEdit.IsOverrideList(true);
                    ModelTableEdit.SetForceEditFields ([
                         "CodeHeader", "NameHeader", "IndexHeader", "Condition", "Year", "IsFixed", "CodeColset", "CodeParentHeader", "CodePeriod"
                    ]);
                })
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