var _ = require("lodash");
var async = require("async");
var mongoose = require("mongoose");
var redis = require("redis");

module.exports = function(Params,done){

    var self = this;
    self.NewCache = Params.NewCache;
    self.HowToCalculate = Params.HowToCalculate;
    self.Dependable = Params.Dependable;
    self.Errors = Params.Errors;


    self._buildTree = function(){
        var AllCells = _.keys(self.HowToCalculate), Done = {};
        var Counter = 1000;
        while(!_.isEmpty(AllCells) && (--Counter)>0){
            var Remain = [];
            AllCells.forEach(function(AC){
                var Dep = self.Dependable[AC];
                if (_.isEmpty(Dep)){
                    Done[AC] = [AC];
                } else if (_.isEmpty(_.difference(Dep,_.keys(Done)))){
                    Done[AC] = [AC];
                    Dep.forEach(function(D){
                        Done[AC] = Done[AC].concat(Done[D]);
                    })                  
                } else {
                    Remain.push(AC);
                }
            })
            AllCells = Remain;
        }
        return Done;
    }
        
    var Cache = {}, Tree = self._buildTree();

    self.NewCache.forEach(function(CellName){
        Cache[CellName] = _.clone(self.HowToCalculate[CellName]);
        Cache[CellName].Dependable = _.isEmpty(self.Dependable[CellName]) ? []:self.Dependable[CellName];
        Cache[CellName].Vars = {};
        var Errors = [];
        if (!_.isEmpty(self.Errors[CellName])){
            Errors = Errors.concat(self.Errors[CellName]);
        }
        Tree[CellName].forEach(function(T){
            if (!_.isEmpty(Cache[CellName].FRM)){
                Cache[CellName].Vars[T] = self.HowToCalculate[T];
                Cache[CellName].Vars[T].Dependable = self.Dependable[T]||[];
                if (!_.isEmpty(self.Errors[T])){
                    Errors = Errors.concat(self.Errors[T]);
                }
            }
        })
        if (!_.isEmpty(Errors)){
            Cache[CellName].Error = _.uniq(Errors);
        }
    })

    self.RedisSet = function(Info,done){
		var config = require(__base+"config.js");
		var client = redis.createClient(config.redis);
		var commands = [];
		for (var CellName in Info){
			commands.push(CellName,JSON.stringify(Info[CellName]));
		}
	 	async.each(_.chunk(commands, 100), function(chunk, callback) {
	 		client.mset(chunk, callback);
	 	},done);
    }

    if (_.isEmpty(Cache)) return done();

	self.RedisSet(Cache,done);

};