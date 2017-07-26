var Calculator = require('./classes/calculator/Calculator.js');
var config = require('./config.js');
var mongoose = require('mongoose');
var async = require('async');
var _ = require('lodash');





/*
var Context = {
  "CodePeriod":"19",
  "Year":2014,
  "CodeValuta":"RUB",
  "IsInput":true,
  "IsOlap":false,
  "UseCache":false,
  "IsDebug":false,
  "CodeDoc":"test_formula",
  "CodeUser":"1923",
  "CodeObj":'473'
  //"Agregate":['362','471'],
}*/

var Context = {
  "CodePeriod":"19",
  "Year":2014,
  "CodeValuta":"RUB",
  "IsInput":false,
  "IsOlap":false,
  "UseCache":false,
  "IsDebug":false,
  "CodeDoc":"test_formula",
  "CodeUser":"1923",
  "CodeObj":'473'
}

setTimeout(function(){

  //var  Cells = ["$z1001112@SUMMAEDFACTCALC.P3.Y2014#3272?"];
  var  Cells = ["$z1003105@KOL.P3.Y2014#3272?"];
  var  Context =   {IsExplain:true,"CodePeriod":"3","Year":2014,"CodeValuta":"RUB","IsInput":false,"IsOlap":false,"UseCache":false,"IsDebug":true,"CodeDoc":"nalog","CodeObj":"3272","ChildObj":"","CodeReport":"default","CodeGrp":"CA_STRUCT2000","GroupType":"CodeDiv","SandBox":null,"CodeUser":"1923"};

  Calculator.CalculateCells(Context,Cells,function(err,Result){
      console.log(Result);
  })

 
 
},1000) 









 





























//Context = {"CodePeriod":"19","Year":2014,"CodeValuta":"RUB","IsInput":false,"IsOlap":false,"UseCache":false,"IsDebug":false,"CodeDoc":"anprot","CodeObj":"473","CodeReport":"default","CodeGrp":"BANK","GroupType":"CodeDiv","Filter":{}};
//Context = {"CodePeriod":"19","Year":2014,"CodeValuta":"RUB","IsInput":false,"IsOlap":false,"UseCache":false,"IsDebug":false,"CodeDoc":"calc_chernmed","CodeObj":"3272","CodeReport":"default","CodeGrp":"BANK","GroupType":"CodeDiv","Filter":{}};
//Context = {"CodePeriod":"19","Year":2014,"CodeValuta":"RUB","IsInput":false,"IsOlap":false,"UseCache":false,"IsDebug":false,"CodeDoc":"osnparambudget","CodeObj":"473","CodeReport":"default","CodeGrp":"BANK","GroupType":"CodeDiv","Filter":{}};


/*
CodePeriod:19
Year:2014
CodeValuta:RUB
IsInput:true
IsOlap:false
UseCache:true
IsDebug:false
CodeDoc:
CodeObj:473
ChildObj:
CodeReport:default
CodeGrp:CA_STRUCT2000
GroupType:CodeRegion



Context = {
  "CodePeriod":"19",
  "Year":2014,
  "CodeValuta":"RUB",
  "IsInput":true,
  "IsOlap":false,
  "UseCache":true,
  "IsDebug":false,
  "CodeDoc":"osnpok",
  "CodeObj":"473",
  "CodeReport":"default",
  "CodeGrp":"BANK",
  "GroupType":"CodeDiv",
  "Filter":{}
};



setTimeout(function(){
 
 Calculator.CalculateDocument(Context,function(err,Result){
      if (Result){
        console.log(Result);  
        process.exit();
      }
  }); 
 

},1000) */