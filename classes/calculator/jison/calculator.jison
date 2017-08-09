monthInKvart
|round
|choose
|lt
|gt
|le
|ge
|min
|max
|limit			                               return 'FUNC';

d_u_func                                       return 'U_FUNC';

MCOUNT
|DCOUNT
|___KMULT
|year                                          return 'CONSTANTA';


d_u_constanta                                  return 'U_CONSTANTA';

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
|groupin                                       return 'BOOLFUNC';

d_u_boolfunc                                   return 'U_BOOLFUNC';

iskorrperiod
|isplanperiod
|ismonth
|isozhidperiod
|issumperiod                                   return 'BOOLCONSTANTA';

d_u_boolconst                                  return 'U_BOOLCONSTANTA';

'forcol'
|'forobj'
|'fordiv'
|'forperiod'                                   return 'SWITCH_FUNC';


'u_sw'                                         return 'U_SWITCH_FUNC';
