round
|choose
|checklimit
|'f.round'
|'f.choose'
|'System.Math.Round'
|'f.checklimit'                                return 'U_FUNC';

monthInKvart
|'f.monthInKvart'                              return 'FUNC';

MCOUNT
|___KMULT
|___[A-Z]*
|year                                          return 'CONSTANTA';

'q.Column.Period'                              return 'OLD';

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
|coltagin
|objtagin
|rowtagin
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
