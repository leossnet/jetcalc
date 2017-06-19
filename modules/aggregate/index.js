var MAggregate = (new function(){

    var self = new Module("aggregate");

    self.IsWrongValuta = ko.observable(false);
    
    self.Objs = ko.observableArray(); // Filtered based on current document CodeGrp
    self.AllObjs = ko.observableArray();

    self.AllGroups = ko.observable();
    self.Groups = ko.observable(); // Filtered based on current document CodeGrp


    
    self.MaxSearchResults = 10;

    self.IsPannel = ko.observable(false, { persist: 'cxAggrPanel' });

    self.TogglePannel = function(){
        self.IsPannel(!self.IsPannel());
    }

    self.SearchObj = ko.observable(''); 
    self.SearchGroups = ko.observable();

    self.FindObj = function(CodeObj){
        return _.first(_.filter(self.Objs(),{CodeObj:CodeObj}));
    }

    self.DoSearch = function(search,Obj){
        return [Obj.CodeObj,Obj.NameObj,'']
                .join("").toLowerCase()
                .replace(/[^A-Яа-яA-Za-z]/g,'')
                .indexOf(search)>=0;
    }
    

    self.SearchObjResult =  ko.computed(function() {
        var search = (self.SearchObj()+'').toLowerCase().replace(/[^A-Яа-яA-Za-z]/g,'');
        var Data = self.Objs();
        var result = [];
        try{
            Data.forEach(function(o){
                if (!search.length || self.DoSearch(search,o)){
                    result.push({type:'obj',code:o.CodeObj,name:o.NameObj});
                    if (result.length>=self.MaxSearchResults){
                        throw "MaxResults";
                    }
                }
            })
        } catch(e){
          ;
        }
        var AllGroups = self.Groups.peek();
        var GroupsResult = {}, Codes = _.map(result,"code"); 
        for (var CodeGrp in AllGroups){
            var ToShow = _.filter(AllGroups[CodeGrp],function(O){
                return Codes.indexOf(O.code)!=-1;
            })
            if (ToShow.length){
                GroupsResult[CodeGrp] = ToShow;
            }
        }
        self.SearchGroups(GroupsResult);
        return result;
    }).extend({ throttle: 800 });    

    

    self.LoadAggregates = function(done){
        self.rGet('list',{},function(data){
            self.AllObjs(data);
            var Gr = {};
            data.forEach(function(O){
                O.Groups.forEach(function(Og){
                    if (!Gr[Og]) Gr[Og] = [];
                    Gr[Og].push({code:O.CodeObj,name:O.NameObj});
                })
            })
            self.AllGroups(Gr);
            return done && done();
        })
    }

    self.GetCorrectCodeObj = function(CodeDoc,CodeObj){
        self.RebuildAvailable(CodeDoc);
        if (!_.isEmpty(self.Objs()) && !_.find(self.Objs(),{CodeObj:CodeObj})){
            return _.first(self.Objs()).CodeObj;
        }
        return CodeObj;
    }

    self.RebuildAvailable = function(CodeDoc){
        var DocGrp = MFolders.FindDocument(CodeDoc).CodeGrp;
        if (!DocGrp){
            self.Objs(self.AllObjs());
            self.Groups(self.AllGroups());
        } else {
            self.Objs(_.filter(self.AllObjs(),function(O){
                return O.Groups.indexOf(DocGrp)!=-1;
            }));
            var Grs = self.AllGroups(), R = {}; 
            R[DocGrp] = Grs[DocGrp];
            self.Groups(R);
        }        
    }

    self.Init = function(done){
        self.LoadAggregates(done);
        CxCtrl.Events.on("documentchanged",function(){
            self.RebuildAvailable(CxCtrl.CodeDoc());
        });
    }


    return self;
})





ModuleManager.Modules.Aggregate = MAggregate;






/*


            
                MSite.availableObjs(_.map(MSite.aggregates().obj,"code"));
            } else {
                if (r.result)
                MSite.availableObjs(_.uniq(_.flatten(_.map(P.roles,'obj'))));
            }

    aggregates:ko.observable(null),
    loadAggregates: function(done){
        if (MPermissions.IsGuest()) return done();
        
        $.ajax({
            url:'/api/aggregatesinfo',
            success:function(data){
                var aggregates = data;
                var cleared = {};
                for (var type in aggregates){
                   if (type=='obj'){
                       cleared[type] = aggregates[type];
                   } else {
                      cleared[type] = [];
                      aggregates[type].forEach(function(a){
                           if (_.difference(a.objs,[null,'null']).length){
                              cleared[type].push(a);
                           }
                      })
                   }
                }
                MSite.aggregates(cleared);
                MFavorites.Agregates(cleared);
                return done && done();
            }
        });
    },
    



var MObjs = (new function(){

    var self = this;
    self.base = "/api/modules/objs/";

    self.Events = new EventEmitter();
    self.Error = ko.observable(null);

    self.Init = function(done){
        self.Error(null);
        return done();
    }


    self.MaxSearchAggregateResults = 3;

    self.Agregates = ko.observable({});


    self.SearchAggregate = ko.observable('');   

    self.SearchAggregateResult =  ko.pureComputed(function() {
        var search = (self.SearchAggregate()+'').toLowerCase().replace(/[^A-Яа-яA-Za-z]/g,'');
        var Data = self.Agregates();
        var Remap = {region:"CodeRegion", div:"CodeDiv", otrasl:"CodeOtrasl", grp:"CodeGrp"};
        var result = {};
        for (var objtype in Remap){
            result[Remap[objtype]] = [];
        }
        for (var i in Data){
            if (i=='obj') continue;
            Data[i].forEach(function(o){
                if (!search.length || o.name.toLowerCase().replace(/[^A-Яа-яA-Za-z]/g,'').indexOf(search)>=0){
                    if (result[Remap[i]].length<self.MaxSearchAggregateResults){
                        result[Remap[i]].push({type:i,code:o.code,name:o.name});    
                    }                   
                }
            })
        }
        return result;
    }).extend({ throttle: 800 });    


    self.OnDocumentChange = function(){
        console.log("Changing agregates");
    }

    self.IsCurrent = function(data){
        return true;
    }

    return self;
})

CxCtrl.Events.addListener("documentchanged",MObjs.OnDocumentChange)


 */

