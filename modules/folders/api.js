var mongoose = require('mongoose');
var _ = require('lodash');
var DocFolder = require(__base + 'classes/jetcalc/Helpers/DocFolder.js');
var router = require('express').Router();
var api = require(__base + '/lib/helper.js');
var lib = require(__base + 'lib/helpers/lib.js');
var HP = require(__base + 'lib/helpers/lib.js').Permits;
var Bus = require(__base+"src/bus.js");
var SocketManager = require(__base + "src/socket.js");


var FilterHelper = (new function() {
  var self = this;

  self.TreeEachFilter = function(Tree, filter_function) {
    var Result = {};
    for (var K1 in Tree) {
      for (var K2 in Tree[K1]) {
        var Filtered = filter_function(Tree[K1][K2]);
        if (Filtered.length) {
          if (!Result[K1]) Result[K1] = {};
          Result[K1][K2] = Filtered;
        }
      }
    }
    return Result;
  }

  self.Filter = function(req, Data, done) {
    var AvDocs = HP.AvDoc(req.session.permissions);
    Data.Tree = self.TreeEachFilter(Data.Tree, function(AllDocs) {
      return _.filter(AllDocs, function(O) {
        return O && AvDocs.indexOf(O.CodeDoc) != -1;
      })
    })
    self.FilterDesignTest(req, Data, done);
  }

  self.FilterDesignTest = function(req, Tree, done) {
    return done(null, Tree);
    var FilteredTree = self.TreeEachFilter(Tree, function(AllDocs) {
      return _.filter(AllDocs, function(O) {
        return !(O.IsTester || O.IsDesigner) ||
          (O.IsTester && permit.CheckTask("IsTester", {
            CodeDoc: O.CodeDoc
          })) ||
          (O.IsDesigner && permit.CheckTask("IsDesigner", {
            CodeDoc: O.CodeDoc
          }))
      })
    })
    return done(null, FilteredTree);
  }


  return self;
})


router.get('/tree', api.requireAuth, function(req, res, next) {
  DocFolder.get(function(err, Data) {
    FilterHelper.Filter(req, Data, function(err, Filtered) {
      if (err) return next(err);
      return res.json(Filtered);
    })
  })
})

router.get('/blocks', api.requireAuth, function(req, res, next) {
  var Context = lib.ReqContext(req);
  mongoose.model("data").find({
    CodeObj: Context.CodeObj,
    CodePeriod: Context.CodePeriod,
    YearData: Context.Year
  }, "-_id CodeDoc CodeState").exec(function(err, data) {
    mongoose.model("state").findOne({
      IsDefault: true
    }, '-_id CodeState').exec(function(err, ds) {
      return res.json({
        states: data,
        default: ds
      });
    })
  })
})


Bus.On("FLUSH:JDOCFOLDER",SocketManager.emitEventAll.bind(SocketManager,"docfolder_refresh"));
Bus.On("FLUSH:JDOC",SocketManager.emitEventAll.bind(SocketManager,"docfolder_refresh"));



module.exports = router;
