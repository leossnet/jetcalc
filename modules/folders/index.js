var MFolders = (new function() {

  var self = new Module("folders");

  self.Icons = {};

  self.FolderIcon = function(data) {
    if (self.Icons[data]) return self.Icons[data];
    return "fa-folder";
  }

  self.Navigate = function() {
    return;
    var Ind = self.DocumentLocation(CxCtrl.CodeDoc());
    self.CloseAll()
    self.OpenFolder(Ind[0]);
    self.OpenFolder(Ind[1]);
  }

  self.Lvl0Open = ko.observable(null, {
    persist: 'lvl0'
  });
  self.Lvl1Open = ko.observable(null, {
    persist: 'lvl1'
  });
  self.AllOpened = ko.observableArray([], {
    persist: 'openfolders'
  });


  self.Remember = function(data) {
    /*var lvl = 0;
    if (_.keys(self.DocTree()).indexOf(data)==-1){
        lvl = 1;
    }
    if (lvl==0){
        self.Lvl0Open(data);
    } else {
        self.Lvl1Open(data);
    }
    */
    if (!self.IsOpen(data)) {
      self.OpenFolder(data);
    } else {
      self.CloseFolder(data);
    }
  }

  self.DocTree = ko.observable();
  self.DocTreeCounts = ko.observable();

  self.OpenFolder = function(Id) {
    self.AllOpened.push(Id);
    $('li[data-folder="' + Id + '"]').addClass("open");
    $('li[data-folder="' + Id + '"]>ul.submenu').show();
  }

  self.CloseFolder = function(Id) {
    self.AllOpened.remove(Id);
    $('li[data-folder="' + Id + '"]').removeClass("open");
    $('li[data-folder="' + Id + '"]>ul.submenu').hide();
  }

  self.CloseAll = function() {
    return;
    $('.nav-list ul').hide();
    $('.nav-list li').removeClass("highlight open");
  }

  self.IsOpen = function(data) {
    return self.AllOpened().indexOf(data) != -1;
  }

  self.Reopen = function() {
    return;
    if (self.Lvl0Open()) self.OpenFolder(self.Lvl0Open());
    if (self.Lvl1Open()) self.OpenFolder(self.Lvl1Open());
  }

  self.Events = new EventEmitter();

  self.Init = function(done) {
    self.LoadTree(function() {
      CxCtrl.Events.on("contextchanged", self.LoadStates);
      Workflow.Events.on("statuschange", self.LoadStates);
      return done && done();
    })
  }

  self.states = ko.observable({});
  self.default_state = ko.observable('');

  self.LoadTree = function(done) {
    self.rGet('tree', {}, function(dataRaw) {
      self.Icons = dataRaw.Icons;
      var data = dataRaw.Tree;
      var counts = {},
        realData = data;
      for (var i in data) {
        var arrs = _.values(data[i]);
        var s = 0;
        arrs.forEach(function(a) {
          s += a.length;
        })
        if (s == 0) realData = _.omit(realData, i);
        counts[i] = s;
      }
      self.DocTree(realData);
      self.DocTreeCounts(counts);
      self.LoadStates(done);
    })
  }

  self.LoadStates = function(done) {
    self.rGet('blocks', CxCtrl.Context(), function(data) {
      var t = {};
      data.states.forEach(function(s) {
        t[s.CodeDoc] = s.CodeState;
      })
      self.states(t);
      self.default_state(data.default.CodeState);
      return done && typeof done == "function" && done();
    })
  }

  self.block_circle_classes = {
    'opened': 'red',
    'agreed': 'green',
    'closed': 'orange',
  }

  self.GetBlockStateClass = function(CodeDoc) {
    if (self.states()[CodeDoc]) {
      return self.block_circle_classes[self.states()[CodeDoc]];
    } else {
      return self.block_circle_classes[self.default_state()];
    }
  }

  self.DocumentLocation = function(CodeDoc) {
    var Tree = self.DocTree(),
      K1 = null,
      K2 = null;
    for (var F1 in Tree) {
      for (var F2 in Tree[F1]) {
        Tree[F1][F2].forEach(function(D) {
          if (D.CodeDoc == CodeDoc) {
            K1 = F1;
            K2 = F2;
          }
        })
      }
    }
    return [K1, K2];
  }

  self.IsCurrent = function(data) {
    return MBreadCrumbs.CurrentPath().indexOf("docview") != -1 && CxCtrl.CodeDoc() == data;
  }

  self.FindDocument = function(CodeDoc) {
    var Tree = self.DocTree(),
      Result = null;
    var Index = self.DocumentLocation(CodeDoc);
    if (!_.isEmpty(_.max(Index)));
    Result = _.find(Tree[Index[0]][Index[1]], {
      CodeDoc: CodeDoc
    });
    return Result;
  }


  return self;
})


ko.bindingHandlers.resize = {
  update: function(element, valueAccessor, allBindingsAccessor) {
    var value = ko.utils.unwrapObservable(valueAccessor());
    var params = ko.utils.unwrapObservable(allBindingsAccessor());
    setTimeout(function() {
      $(window).resize()
    }, 0);
  }
};




ModuleManager.Modules.Folders = MFolders;
