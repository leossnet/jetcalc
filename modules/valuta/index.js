var MValuta = (new function() {

    var self = new Module("valuta");

    self.IsAvailable = function(){
        return PermChecker.CheckPrivelegeAny(["IsValutaRateOperator","IsValutaTuner"]);
    }

    self.Sync = function(){
        self.rPost("synccbrf",{
            CodeValuta:self.RateValuta(),
            Year:self.Year()
        },function(data){
            var Current = self.Rates();
            Current.forEach(function(C){
                var Vls = data[C.CodePeriod()];
                ["Value","Value1","Value2"].forEach(function(V){
                    C[V](Vls[V]);
                })
            })
            self.Rates(Current);
            self.Editor.data = self.Rates();
            self.Editor.Render();            
        })

    }

    self.ReportValutas = ko.observableArray();

    self.ReportValuta  = ko.observable();
    self.ReportValuta1  = ko.observable();
    self.ReportValuta2  = ko.observable();


    self.GetValutas = function(){
        //[_.find(MAggregate.AllObjs(),{CodeObj:CxCtrl.CodeObj()}).CodeValuta,
        return _.compact(_.uniq([self.ReportValuta(),self.ReportValuta1(),self.ReportValuta2()]));
    }

    self.Valutas = ko.observableArray();

    self.RateValuta = ko.observable();

    self.UpdateRateValuta = function(Code){
        self.RateValuta(Code);
        self.LoadValutaRates();
    }

    self.Year = ko.observable((new Date()).getFullYear());

    self.UpdateYear = function(Year){
        self.Year(Year);
        self.LoadValutaRates();
    }

    self.Init = function(done){
        self.rGet("valuta",{},function(data){
            var Vs = [], Choose = ["IsReportValuta","IsReportValuta1","IsReportValuta2"], RVS = [];
            self.Valutas(_.map(data,function(V){
                return _.pick(V,["CodeValuta","SNameValuta"]);
            }));
            Choose.forEach(function(C){
                var Q = {}; Q[C] = true, F = _.find(data,Q);
                if (F) {
                    self[C.substring(2)](F.CodeValuta);
                    RVS.push({Code:F.CodeValuta,Name:F.SNameValuta});   
                }
            })
            self.ReportValutas(RVS);
            self.RateValuta(_.first(RVS).Code);
            return done();
        })
    }

    self.Rates = ko.observableArray();
    self.Editor = null;

    self.LoadValutaRates = function(){
        self.rGet("valutarates",{Year:self.Year(),CodeValuta:self.RateValuta()},function(data){
            self.Rates(_.map(data,function(D){
                return MModels.Create("valutarate",D);
            }));
            if (!self.Editor){
                self.Editor = new HandsonComponent(self.Rates(),{
                    CodePeriod:Tr("Period"),
                    Value: self.ReportValuta(),
                    Value1:self.ReportValuta1(),
                    Value2:self.ReportValuta2()
                },".valutarate");
                self.Editor.FixedWidths = [400,100,100,100];
                self.Editor.Editable = ["Value2","Value1","Value"];
            } else {
                self.Editor.data = self.Rates();
            }
            self.Editor.Render();   
        })
    }

    self.BeforeShow = function(){
        self.Subscribe();
        MSite.Events.off("save",self.SaveChanges);
        MSite.Events.on("save",self.SaveChanges);
        self.Show();
    }

    self.BeforeHide = function(){
        if (self.Editor) delete self.Editor;
        MSite.Events.off("save",self.SaveChanges);        
        self.UnSubscribe();
    }

    self.SaveChanges = function(){
        if (self.Mode()=='ValutaRates'){
            self.rPut("valutarates",{
              CodeValuta:self.RateValuta(),
              Year:self.Year(),
              Rates:_.map(self.Rates(),function(R){
                return _.pick(R.toJS(),["CodeValutaRate","CodePeriod","Value","Value1","Value2"])
              })  
            },function(){

            })    
        }        
    }

    


    self.Show = function(done){
        if (!self.Mode()) return self.InitSetMode("Valutas");
        switch (self.Mode()){
            case "Valutas":
                if (self.Editor) delete self.Editor;
                ModelTableEdit.InitModel("valuta");
            break;
            case "ValutaRates":
                self.LoadValutaRates();

                //ModelTableEdit.InitModel("valutarate",["CodeValutaRate","Year","CodePeriod"],{Year:-1});
            break;
        }
    	return done && done()
    }
    
    return self;
})





ModuleManager.Modules.Valuta = MValuta;