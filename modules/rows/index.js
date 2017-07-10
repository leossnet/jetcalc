var MRows = (new function() {
    
    var self = new Module("rows");

    self.IsAvailable = function(){
        return PermChecker.CheckPrivelege("IsRowEditor");
    }

    self.BeforeShow = function(){
        self.Show();
    }


    self.SaveChanges = function(){

    }


    self.Show = function(done){
        if (!self.Mode()) return self.InitSetMode("Root");
        switch (self.Mode()){
            case "Root":
                ModelTableEdit.InitModel("row",["CodeRow","NameRow"],{CodeRow:1},{CodeParentRow:{$in:[null,""]}});
                ModelTableEdit.SetForceEditFields ([
                    "CodeRow","NameRow","HasFilteredChild","NoFiltered","CodeValuta","CodeMeasure","CodeFormat","CodeParentRow"
                ]);
            break;            
            case "Measure":
                ModelTableEdit.InitModel("measure",["IsExchange","CodeMeasure","SNameMeasure","NameMeasure"],{NumMeasure:1});
            break;            
            case "Format":
                ModelTableEdit.InitModel("format",["CodeFormat", "NameFormat","FormatValue"]);
                ModelTableEdit.SetForceEditFields ([
                    "CodeFormat", "NameFormat","FormatValue"
                ]);
            break;             
            case "Style":
                ModelTableEdit.InitModel("style",["CodeStyle", "NameStyle","CSS"]);
                ModelTableEdit.SetForceEditFields ([
                    "CodeStyle", "NameStyle", "CSS"
                ]);
            break;             
            case "Tags":
                ModelTableEdit.InitModel("tag",["CodeTag", "NameTag","SNameTag"]);
                ModelTableEdit.SetForceEditFields ([
                    "CodeTag", "NameTag", "SNameTag", "IsList", "IsObj", "IsRow", "IsCol", "IsObjType"
                ]);
            break;            
        }
        return done && done()
    }  

    
    return self;
})

ModuleManager.Modules.Rows = MRows;
