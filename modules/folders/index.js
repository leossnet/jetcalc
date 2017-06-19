var MFolders = (new function(){

    var self = new Module("folders");

    self.Icons = {};
    
    self.FolderIcon = function(data){
        if (self.Icons[data]) return self.Icons[data];
        return "fa-folder";

        //console.log(data);
/*        var icons = {
            "Графики":"fa-bar-chart",
            "Дирекция":"fa-suitcase",
            "Контроллинг":"fa-calendar",
            "Отчеты":"fa-pie-chart",
            "Персонал":"fa-address-card-o",
            "Производство":"fa-cogs",
            "Процессы":"fa-recycle",
            "Финансы":"fa-rub",
            "Инвестиции":"fa-money",
            "Экономика":"fa-line-chart",
        }       
*/
    }

    self.Navigate = function(){
        // Открытие папок при выборе документа
        var Ind = self.DocumentLocation(CxCtrl.CodeDoc());
        $('.nav-list ul').hide();
        $('.nav-list li').removeClass("highlight open");
        $('li[data-folder="'+Ind[0]+'"]').addClass("highlight open");
        $('li[data-folder="'+Ind[0]+'"]>ul.submenu').show();
        $('li[data-folder="'+Ind[1]+'"]').addClass("highlight open");
        $('li[data-folder="'+Ind[1]+'"]>ul.submenu').show();        
    }

    self.DocTree       = ko.observable();
    self.DocTreeCounts = ko.observable();

    self.Init = function(done){
        self.LoadTree(function(){
            CxCtrl.Events.addListener("documentchanged",function(){
                self.Navigate();
            })
            return done && done();
        })
    }

    self.LoadTree = function(done){
        self.rGet ('tree', {}, function(dataRaw){
            self.Icons = dataRaw.Icons;
            var data = dataRaw.Tree;
            var counts = {}, realData = data;
            for (var i in data){
                var arrs = _.values(data[i]);
                var s = 0;
                arrs.forEach(function(a){
                    s+=a.length;
                })
                if (s==0) realData = _.omit(realData,i);
                counts[i] = s;
            }
            self.DocTree(realData); self.DocTreeCounts(counts);
            return done && done();            
        })     
    }

    self.DocumentLocation = function(CodeDoc){
        var Tree = self.DocTree(), K1 = null, K2 = null;
        for (var F1 in Tree){
            for (var F2 in Tree[F1]){
                Tree[F1][F2].forEach(function(D){
                    if (D.CodeDoc == CodeDoc) {
                        K1 = F1; K2 = F2;
                    }
                })
            }
        }
        return [K1,K2];
    }

    self.IsCurrent = function(data){
        return MBreadCrumbs.CurrentPath().indexOf("docview")!=-1 && CxCtrl.CodeDoc()==data;
    }

    self.FindDocument = function(CodeDoc){
        var Tree = self.DocTree(), Result = null;
        var Index = self.DocumentLocation(CodeDoc);
        if (!_.isEmpty(_.max(Index)));
            Result = _.find(Tree[Index[0]][Index[1]],{CodeDoc:CodeDoc});
        return Result;
    }


    return self;
})


ko.bindingHandlers.resize = {
    update: function(element, valueAccessor, allBindingsAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var params = ko.utils.unwrapObservable(allBindingsAccessor());
        setTimeout(function(){$(window).resize()},0);
    } 
};




ModuleManager.Modules.Folders = MFolders;