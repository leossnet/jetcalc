var TreeReparser = (new function(){
  var self = this;

  self.ResultTreeCodes = [];
  self.ResultTreeObjs = [];

  self.ModFields = ["IsHidden","IsToggled","IsShowOlap","IsShowWithParent","IsShowWithChildren"];
  self.IsHidden = [];
  self.IsToggled = [];

  self.IsShowOlap = [];
  self.IsShowWithParent = [];
  self.IsShowWithChildren = [];		

  self.ReportType = function(){
		if (_.sum([self.IsShowOlap.length,self.IsShowWithParent.length,self.IsShowWithChildren.length])){
			return "SingleView";
		} 
		return "ModifyView";
  }


  self._children = function(CodeRow,Rows){
      var Row = _.find(Rows,{CodeRow:CodeRow});
      Rows = Rows.filter(function(R){
        return Row.lft<R.lft && Row.rgt > R.rgt;
      })
      return _.map(Rows,"CodeRow");
  }

  self._parents = function(CodeRow,Rows){
      var Row = _.find(Rows,{CodeRow:CodeRow});
      Rows = Rows.filter(function(R){
        return Row.lft>R.lft && Row.rgt < R.rgt;
      })
      return _.map(Rows,"CodeRow");
  }   

  self.ResultTree = function(Rows,Emulate){
      self.ModFields.forEach(function(Field){
        self[Field] = [];
      })
      var Report = SettingController.ChoosedReport();
      var InitialRows = _.clone(Rows), Rows = _.clone(Rows);
      var AllHidden = [], NewTreeCodes = [];
      if (Emulate){
      		for (var Field in Emulate){
      			self[Field] = Emulate[Field];
      		}
      } else {
      		if (Report && Report.CodeReport!='default'){
      			self.ModFields.forEach(function(Field){
      				var F = {}; F[Field] = true;
      				self[Field] = _.map(_.filter(Report.Link_reportrow,F),"CodeRow");
      			})
      		}
      }
      var Mode = self.ReportType();
      if (Mode=='ModifyView'){
        	var CodesToHide = [];
        	self.IsHidden.forEach(function(HC){
          		CodesToHide = CodesToHide.concat([HC]).concat(self._children(HC,Rows));
        	})
        	self.IsToggled.forEach(function(CC){
          		CodesToHide = CodesToHide.concat(self._children(CC,Rows));
        	})
        	AllHidden = _.uniq(CodesToHide);
        	Rows = _.filter(Rows,function(R){
          		return AllHidden.indexOf(R.CodeRow)==-1;
        	})
      } else {
        var Codes = [];
        self.IsShowOlap.forEach(function(RS){
          Codes.push(RS);
        })
        self.IsShowWithParent.forEach(function(RP){
          Codes.push(RP);
          Codes = Codes.concat(self._parents(RP,Rows));
        })
        self.IsShowWithChildren.forEach(function(RC){
          Codes.push(RC);
          Codes = Codes.concat(self._children(RC,Rows));
        })
        NewTreeCodes = _.uniq(Codes);
        Rows = _.filter(Rows,function(R){
          return NewTreeCodes.indexOf(R.CodeRow)!=-1;
        })
      }
      if (!Rows.length) {
        Rows = InitialRows; 
        self.ResultTreeCodes = [];
        self.ResultTreeObjs = Rows;
      } else {
        var T = new TypeTree("ROOT",{});
        Rows.forEach(function(R){
            var Parents  = self._parents(R.CodeRow,Rows);
            T.add (R.CodeRow, R, _.last(Parents) || "ROOT", T.traverseBF);
        })
        var Result = T.getFlat();
        delete T;
        self.ResultTreeCodes = _.map(Result,"CodeRow");
        self.ResultTreeObjs = Result;
        return Result;
      }
  }

  return self;
})