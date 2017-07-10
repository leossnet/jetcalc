%{

  var IfThen =  function (ifExpr, thenExpr) {
     if (ifExpr) return thenExpr;
  };

  var IfThenElse =  function (ifExpr, thenExpr, elseExpr) {
     if (ifExpr) return thenExpr; else return elseExpr;
  };

  var Switch = function(funcName,Cases){
    var Indexed = {};
    var MatchFuncs = {
        forcol:'colin',
        forobj:'objin',
        fordiv:'divin',
        forperiod:'periodin'
    }
    Cases.forEach(function(Case){
        Indexed[Case[0]] = Case[1];
    })
    var Result = 0;
    for (var Args in Indexed){
        var Value = Indexed[Args];
        if (LIB[MatchFuncs[funcName]](Args.split(','))){
            Result = Value;
            break;
        }
    }
    return Result;
  }

var CONTEXT = {};

var LIB = {
    get:function(field){
      var Check = CONTEXT[field];
      if (Check) {
        if (Object.prototype.toString.call(Check)=="[object Array]"){
            return LIB._args(Check);
        } else {
            return Check+'';
        }
      }
      return 0;
    },
    _args:function(args){
      var result = [];
      args && args.forEach(function(a){
        result.push((a+'').replace(/["']/g,''));
      })
      return result;
    },
    _argsNumeric:function(args){
      var result = LIB._args(args);
      result && result.forEach(function(a,i){
        result[i] = Number(a);
      })
      return result;
    },
    _simpleCheck:function(key,args){
        args = LIB._args(args);
        var isOpposite = false;
        if (args[0]=="!"){
            args = args.splice(1);
            isOpposite = true;
        }
        var test = LIB.get(key);
        if (!isOpposite){
            return args.indexOf(test) !=-1;
        } else {
            return args.indexOf(test) ==-1;
        }
    },
    _arrCheck:function(key,args){
        args = LIB._args(args);
        var grps = LIB.get(key);
        if (!Array.isArray(grps)) grps = [grps];
        var intersect = grps.filter(function(n) {
            return args.indexOf(n) != -1;
        });
        return intersect.length>0;
    },
    _tagsCheck:function(key,args){
        args = LIB._args(args)||[];
        var tags = LIB.get(key)||[];
        var Result = false;
        tags.forEach(function(T){
            args.forEach(function(S){
                if (('/'+T+'/').match(new RegExp(S.replace('*','.*?')))){
                    Result = true;
                }
            })
        })
        return Result;
    },
    // Проверка перечислений
    periodin: function(args) {
        return LIB._arrCheck('period',args);
    },
    rowin:function(args){
        return LIB._simpleCheck('row',args);
    },
    rowgroupin:function(args){
      return LIB.rowsumgrpin(args)
    },
    rowsumgrpin:function(args){
      return LIB._arrCheck('rowsums',args);
    },
    colin: function(args) {
        return LIB._simpleCheck('col',args);
    },
    divin: function(args) {
        return LIB._simpleCheck('div',args);
    },
    objin: function(args) {
        return LIB._simpleCheck('obj',args);
    },
    groupin: function(args) {
        return LIB.grpin(args);
    },
    grpin: function(args) {
        return LIB._arrCheck('grp',args);
    },
    pathin:function(args){
        args = LIB._args(args);
        var path = (LIB.get('path')+'').split("/");
        var intersect = path.filter(function(n) {
            return args.indexOf(n) != -1;
        });
        return intersect.length>0;
    },
    // Проверка тэгов
    rowtagin:function(args){
        return LIB._tagsCheck('rowtags',args);
    },
    coltagin: function(args) {
        return LIB._tagsCheck('coltags',args);
    },
    objtagin: function(args) {
        return LIB._tagsCheck('objtags',args);
    },
    treetagin:function(args){
        return LIB._tagsCheck('treetags',args);
    },
    // Расчетные функции
    'monthInKvart':function() {
        var mC = parseInt(LIB.get("MCOUNT"));
        if (!mC) mC = 0;
        var r = mC%3;
        if (r==0) r = 3;
        return  r;
    },
    'choose':function(args) {
        args = LIB._argsNumeric(args);
        if (args.length<2) return 0;
        return args[0]||args[1]||0;
    },
    'round':function(args) {
      args = LIB._argsNumeric(args);
      var result = Math.round(args[0]);
      return result;
    },
    'checklimit':function(args) {
      args = LIB._argsNumeric(args);
      if (args[0] > Math.abs(args[1])) return 0;
      return args[1];
    },
    'f.checklimit':function(args) {
        return LIB['checklimit'](args);
    },
    'f.round':function(args) {
      return LIB['round'](args);
    },
    'System.Math.Round':function(args) {
      return LIB['round'](args);
    },
    'f.choose':function(args) {
        return LIB['choose'](args);
    },
    'f.monthInKvart':function(args) {
        return LIB['monthInKvart'](args);
    }
  };
  try{
    module.exports.setContext = function (myContext) {
        CONTEXT = myContext;
    };
    module.exports.setLib = function (myLib) {
        LIB = myLib;
    };
  } catch(e){
    
  }

%}

%lex
%parse-param CONTEXT
%%

/* start: can't have U_ prefix */

\s+                                            return '';
\+\s\+                                         return '+';
"*"                                            return '*';
"/"                                            return '/';
"-"                                            return '-';
"+"                                            return '+';
"^"                                            return '^';
"("                                            return '(';
")"                                            return ')';
"}"                                            return '}';
","                                            return ',';
"{"                                            return '{';
"AND"|"and"                                    return 'AND';
"OR"|"or"                                      return 'OR';
"!="|"<>"                                      return 'NE';
"NOT"|"not"|"!"                                return 'NOT';
"<="                                           return 'LTE';
">="                                           return 'GTE';
">"                                            return 'GT';
"<"                                            return 'LT';
"=="                                           return 'EQ';
"true"|"TRUE"                                  return 'TRUE';
"false"|"FALSE"                                return 'FALSE'
"NULL"|"null"                                  return 'NULL';

[0-9]*[1-9]+[0-9]*("."[0-9]+)?\b
|[0]+"."[0-9]*[1-9]+[0-9]*?\b                  return 'NUMBER';

[0]+("."[0]*)?\b                               return 'ZNUMBER';

\".*?\"
|\'.*?\'                                       return 'LITERAL';

'f.If'
|'if'                                          return 'IF';

[$@.].*?\?                                     return 'VARIABLE';


':'                                            return  'CASEDELIM';
';'                                            return  'EOC';

/* For non cyrillic symbols (?=^|$|[^\p{L}]) = \b */

/* end: can't have U_ prefix */

/* start: can have U_ prefix */

<% CAN_HAVE_U_PREFIX_LEXES %>

/* end: can have U_ prefix */


[A-ZА-Я0-9]+(?=^|$|[^\p{L}])                   return 'MIXED';

<<EOF>>                                        return 'EOF';


/lex

%left '+' '-'
%left '*' '/'
%left '^'
%left UMINUS
%left OR
%left AND
%left NOT

%%


Program: RESULT EOF { return $1; };

/* RETURN RESULT */


RESULT:
  MATH                             -> $1;
  | U_MATH                     -> $1;
;


/* NUMBERS */
NUMERIC:
  ZERO                            -> 0;
  | '('NUMBER')'                  -> $2;
  | NUMBER                        -> Number($1);
  | CONSTANTA                     -> Number(CONTEXT[$1]);
  | FUNC '(' ARGS ')'             -> Number(LIB[$FUNC]($ARGS));
;

ZERO:
  ZNUMBER                      -> $1;
  | ZERO '-' '-' MATH          -> 0+Number($4);
  | MATH '-' '-' ZERO          -> Number($1)+0;
  | U_MATH '*' ZERO            -> $3;
  | ZERO '*' U_MATH            -> $1;
  | U_MATH '/' ZERO            -> $3;
  | ZERO '/' U_MATH            -> $1;
  | MATH '*' ZERO              -> $3;
  | ZERO '*' MATH              -> $3;
  | MATH '/' ZERO              -> $3;
  | ZERO '/' MATH              -> $1;
  | ZERO '/' ZERO              -> $1;
  | ZERO '*' ZERO              -> $1;
  | ZERO '+' ZERO              -> $1;
  | ZERO '-' ZERO              -> $1;
  | '('ZERO')'                 -> $2;
;


MATH:
  NUMERIC                         -> $1;
  | IF_THEN                       -> $1;
  | IF_THEN_ELSE                  -> $1;
  | SWITCH                        -> $1;
  | MATH '+' MATH                 -> Number($1)+Number($3);
  | MATH '-' MATH                 -> Number($1)-Number($3);
  | MATH '*' MATH                 -> Number($1)*Number($3);
  | MATH '/' MATH                 -> Number($1)/Number($3);
  | MATH '+' ZERO                 -> Number($1);
  | ZERO '+' MATH                 -> Number($3);
  | MATH '-' ZERO                 -> Number($1);
  | ZERO '-' MATH                 -> 0-Number($3);
  | '-' MATH %prec UMINUS         -> -Number($2);
  | '('MATH')'                    -> $2;
;

U_NUMBER:
  VARIABLE                         -> $1;
  | U_FUNC '(' ARGS ')'            -> $U_FUNC+'('+$ARGS.join(',')+')';
  | U_CONSTANTA                    -> $1;
  | '('U_NUMBER')'                 -> '('+String($2)+')';
;


U_MATH:
  U_NUMBER                         -> $1;
  | U_SWITCH                       -> $1;
  | U2_SWITCH                      -> $1;
  | U3_SWITCH                      -> $1;
  | U_IF_THEN                      -> $1;
  | U_IF_THEN_ELSE                 -> $1;
  | IF_THEN_U                      -> $1;
  | IF_THEN_ELSE_U1                -> $1;
  | IF_THEN_ELSE_U2                -> $1;
  | IF_THEN_ELSE_U3                -> $1;
  | '-' U_MATH %prec UMINUS        -> '-'+String($2);
  | U_MATH '+' U_MATH              -> String($1)+'+'+String($3);
  | U_MATH '+' MATH                -> String($1)+'+'+String($3);
  | MATH '+' U_MATH                -> String($1)+'+'+String($3);
  | U_MATH '-' U_MATH              -> String($1)+'-'+String($3);
  | U_MATH '-' MATH                -> String($1)+'-'+String($3);
  | MATH '-' U_MATH                -> String($1)+'-'+String($3);
  | U_MATH '*' U_MATH              -> String($1)+'*'+String($3);
  | U_MATH '*' MATH                -> String($1)+'*'+String($3);
  | MATH '*' U_MATH                -> String($1)+'*'+String($3);
  | U_MATH '/' U_MATH              -> String($1)+'/'+String($3);
  | U_MATH '/' MATH                -> String($1)+'/'+String($3);
  | MATH '/' U_MATH                -> String($1)+'/'+String($3);
  | '('U_MATH')'                   -> '('+$2+')';
  | U_MATH '+' ZERO                -> String($1);
  | ZERO '+' U_MATH                -> String($3);
  | U_MATH '-' ZERO                -> String($1);
  | ZERO '-' U_MATH                -> '0 - '+String($3);
  | '('U_MATH')'                   -> '('+String($2)+')';
;


/* BOOLS */
BOOL:
  TRUE                                -> true;
  | FALSE                             -> false;
  | BOOLFUNC '(' ARGS ')'             -> Boolean(LIB[$BOOLFUNC]($ARGS));
  | BOOLCONSTANTA                     -> Boolean(CONTEXT[$1]);
  | BOOLOPERATION                     -> $1;
  | '('BOOL')'                        -> $2;
;

BOOLOPERATION:
  BOOL                               -> $1;
  | MATH 'LTE' MATH                  -> $1 <= $3;
  | MATH 'GTE' MATH                  -> $1 >= $3;
  | MATH 'GT'  MATH                  -> $1 > $3;
  | MATH 'LT'  MATH                  -> $1 < $3;
  | MATH 'EQ'  MATH                  -> $1 == $3;
  | MATH 'NE'  MATH                  -> $1 != $3;
  | BOOL 'OR' BOOL                   -> $1 || $3;
  | BOOL 'AND' BOOL                  -> $1 && $3;
  | BOOL 'NE' BOOL                   -> $1 != $3;
  | 'NOT' BOOL %prec NOT             -> !$2;
  | '('BOOLOPERATION')'              -> $2;
;

U_BOOL:
  U_BOOLCONSTANTA                   -> $U_BOOLCONSTANTA;
  | U_BOOLFUNC '(' ARGS ')'         -> $U_BOOLFUNC+'('+$ARGS.join(',')+')';
  | U_BOOLOPERATION                 -> $1;
  | '('U_BOOL')'                   -> '('+String($2)+')';
;

U_BOOLOPERATION:
  | U_MATH 'LTE' U_MATH     -> String($1)+' <= '+String($3);
  | MATH 'LTE' U_MATH           -> String($1)+' <= '+String($3);
  | U_MATH 'LTE' MATH           -> String($1)+' <= '+String($3);
  | U_MATH 'GTE' U_MATH     -> String($1)+' >= '+String($3);
  | MATH 'GTE' U_MATH           -> String($1)+' >= '+String($3);
  | U_MATH 'GTE' MATH           -> String($1)+' >= '+String($3);
  | U_MATH 'GT'  U_MATH     -> String($1)+' > '+String($3);
  | MATH 'GT'  U_MATH           -> String($1)+' > '+String($3);
  | U_MATH 'GT'  MATH           -> String($1)+' > '+String($3);
  | U_MATH 'LT'  U_MATH     -> String($1)+' < '+String($3);
  | MATH 'LT'  U_MATH           -> String($1)+' < '+String($3);
  | U_MATH 'LT'  MATH           -> String($1)+' < '+String($3);
  | U_MATH 'EQ'  U_MATH     -> String($1)+' == '+String($3);
  | MATH 'EQ'  U_MATH           -> String($1)+' == '+String($3);
  | U_MATH 'EQ'  MATH           -> String($1)+' == '+String($3);
  | U_MATH 'NE'  U_MATH     -> String($1)+' != '+String($3);
  | MATH 'NE'  U_MATH           -> String($1)+' != '+String($3);
  | U_MATH 'NE'  MATH           -> String($1)+' != '+String($3);
  | U_BOOL 'OR' U_BOOL      -> String($1)+' or '+String($3);
  | BOOL 'OR' U_BOOL            -> String($1)+' or '+String($3);
  | U_BOOL 'OR' BOOL            -> String($1)+' or '+String($3);
  | U_BOOL 'AND' U_BOOL     -> String($1)+' and '+String($3);
  | BOOL 'AND' U_BOOL           -> String($1)+' and '+String($3);
  | U_BOOL 'AND' BOOL           -> String($1)+' and '+String($3);
  | 'NOT' U_BOOL %prec NOT      -> 'not '+String($2);
  | '('U_BOOLOPERATION')'       -> '('+String($2)+')';
;


ARG:
  RESULT                               -> [$1];
  | MIXED                              -> [$1];
  | OLD                                -> [0];
  | LITERAL                            -> [$1];
;

ARGS:
  ARG                                 -> $1;
  | ARGS ',' ARG                      { $$ = $1; $1.push($3[0]);}
  | NOT '(' ARGS ')'                  { $$ = $3; $3.unshift($1);}
;


CASE:
  ARGS CASEDELIM MATH                 { $$ = []; $$.push([$1,$3]);}
;

U_CASE:
  ARGS CASEDELIM U_MATH           { $$ = []; $$.push([$1,$3]);}
;

CASES:
 CASE                                 -> $1;
| CASES EOC CASE                      { $$ = $1; $1.push($3[0]);}
;

U_CASES:
 U_CASE                                 -> $1;
| CASES EOC U_CASE                      { $$ = $1; $1.push($3[0]);}
| U_CASES EOC U_CASE                   { $$ = $1; $1.push($3[0]);}
| U_CASES EOC CASE                      { $$ = $1; $1.push($3[0]);}
;

SWITCH:
  SWITCH_FUNC '(' CASES ')' -> Switch($1,$3);
;

U_SWITCH:
  SWITCH_FUNC '(' U_CASES ')' -> Switch($1,$3);
;

U2_SWITCH:
  U_SWITCH_FUNC '(' CASES ')'  {$$=$1+' ('; var Arr = []; $3.forEach(function(A){Arr.push(A[0]+":"+A[1]);}); $$+= Arr.join("; ")+" )"; }
;

U3_SWITCH:
  U_SWITCH_FUNC '(' U_CASES ')'  {$$=$1+' ('; var Arr = []; $3.forEach(function(A){Arr.push(A[0]+":"+A[1]);}); $$+= Arr.join("; ")+" )"; }
;

IF_THEN:
    IF '(' BOOL ',' '{' MATH '}' ')'                          -> IfThenElse ($3,$6,0);
;
IF_THEN_U:
    IF '(' BOOL ',' '{' U_MATH '}' ')'                        -> IfThenElse ($3,$6,0);
;
U_IF_THEN:
    IF '(' U_BOOL ',' '{' RESULT '}' ')'                      ->  $IF+' ('+ $3+ ',{' +$6 +'}) ';
;
IF_THEN_ELSE:
   IF '(' BOOL ',' '{' MATH '}' ',' '{' MATH '}' ')'          -> IfThenElse ($3,$6,$10);
;
IF_THEN_ELSE_U1:
   IF '(' BOOL ',' '{' MATH '}' ',' '{' U_MATH '}' ')'        -> IfThenElse ($3,$6,$10);
;
IF_THEN_ELSE_U2:
   IF '(' BOOL ',' '{' U_MATH '}' ',' '{' MATH '}' ')'        -> IfThenElse ($3,$6,$10);
;
IF_THEN_ELSE_U3:
   IF '(' BOOL ',' '{' U_MATH '}' ',' '{' U_MATH '}' ')'      -> IfThenElse ($3,$6,$10);
;
U_IF_THEN_ELSE:
   IF '(' U_BOOL ',' '{' RESULT '}' ',' '{' RESULT '}' ')'    -> $IF+' ('+ $3+ ',{' +$6 +'},{'+ $10+ '})';
;
