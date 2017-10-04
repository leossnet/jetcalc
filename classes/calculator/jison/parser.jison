monthInKvart
|round
|choose
|limit
|lt
|gt
|le
|ge
|min
|max
|EDITOR_FUNCTION                               return 'U_FUNC';

d_u_func                                       return 'FUNC';

MCOUNT
|DCOUNT
|___[A-Z]*
|year
|EDITOR_CONSTANTA                              return 'U_CONSTANTA';


d_u_constanta                                  return 'CONSTANTA';


treetagin
|pathin
|periodin
|colin
|rowin
|rowgroupin
|rowsumgrpin
|objin
|grpin
|divin
|rowtagin
|coltagin
|objtagin
|groupin
|EDITOR_BOOLFUNCTION                           return 'U_BOOLFUNC';

d_u_boolfunc                                   return 'BOOLFUNC';

iskorrperiod
|isplanperiod
|ismonth
|isozhidperiod
|issumperiod
|BOOL_CONST[0-9]*
|EDITOR_BOOLCONSTANTA                          return 'U_BOOLCONSTANTA';

d_u_boolconst                                  return 'BOOLCONSTANTA';



'forcol'
|'forobj'
|'fordiv'
|'forperiod'
|EDITOR_SWITCH                                 return 'U_SWITCH_FUNC';


'u_sw'                                         return 'SWITCH_FUNC';
