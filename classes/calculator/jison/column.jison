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
|year                                          return 'CONSTANTA';

___KMULT
|___[A-Z]*                                     return 'U_CONSTANTA';

'q.Column.Period'                              return 'OLD';

periodin
|colin
|objin
|grpin
|divin
|coltagin
|objtagin
|rowtagin
|groupin                                       return 'BOOLFUNC';

treetagin
|pathin
|rowin
|rowgroupin
|rowsumgrpin                                   return 'U_BOOLFUNC';

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
