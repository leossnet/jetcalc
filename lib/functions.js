var mongoose = require('mongoose');
var _ = require('lodash');

_.ucfirst = function(V){
    var R = (V+'')
    if (!R.length) return R;
    R = R.substring(0,1).toUpperCase()+R.substring(1);
    return R;
}

String.prototype.repeat = function( num ) {
    return new Array( num + 1 ).join( this );
}    
String.prototype.replaceAll = function(what,forwhat){
  return this.replace(new RegExp(_.escapeRegExp(what), 'g'), forwhat);
}

String.prototype.ucfirst = function() {
  return (this+'').substring(0,1).toUpperCase()+(this+'').substring(1).toLowerCase();
}

String.prototype.toSearchString = function() {
  var search = this;
  var replacer = {
      "й":"q","ц":"w","у":"e","к":"r","е":"t","н":"y","г":"u","ш":"i","щ":"o","з":"p","х":"[","ъ":"]",
      "ф":"a","ы":"s","в":"d","а":"f","п":"g","р":"h","о":"j","л":"k","д":"l","ж":";","э":"'","я":"z",
      "ч":"x","с":"c","м":"v","и":"b","т":"n","ь":"m","б":",","ю":".",".":"/"
  };  // Ввод маленьких букв
  search +=  search.toLowerCase().replace(/[А-яЁё]/g, function (x){ return replacer[x];});
  replacer = {
      "й":"q","ц":"w","у":"e","к":"r","е":"t","н":"y","г":"u","ш":"i","щ":"o","з":"p","х":"{","ъ":"}",
      "ф":"a","ы":"s","в":"d","а":"f","п":"g","р":"h","о":"j","л":"k","д":"l","ж":":","э":'"',"я":"z",
      "ч":"x","с":"c","м":"v","и":"b","т":"n","ь":"m","б":"<","ю":">",".":"?"
  };  // Ввод больших букв
  search +=  search.toLowerCase().replace(/[А-яЁё]/g, function (x){return replacer[x];});
  search = search+' '+search.replace(/[^0-9]/g,''); //  достаем все цифровые последовательности - для телефонов
  return search;
}



module.exports = {
  m:function(name){ return mongoose.model(name);},
  remap: function (objects,key,value,isArr){
    var R = {}, isArr = isArr||false;
    objects.forEach(function(O){
      if (value){
        if (R[O[key]]){
          isArr = true;
          if (!_.isArray(R[O[key]])) R[O[key]] = [R[O[key]]];
          R[O[key]].push(O[value]);
        } else {
          R[O[key]] = O[value];	
        }              
      } else {
        if (R[O[key]]){
          isArr = true;
          R[O[key]] = [R[O[key]]];
          R[O[key]].push(O);
        } else {
          R[O[key]] = O;	
        }              
      }            
    });
    if (isArr) for (var i in R) if (!_.isArray(R[i])) R[i] = [R[i]];
    return R;
  }
}