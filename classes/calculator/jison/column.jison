round
|choose
|lt
|gt
|le
|ge
|min
|max
|limit			                              return 'U_FUNC';

monthInKvart								  return 'FUNC';

MCOUNT
|DCOUNT
|year                                         return 'CONSTANTA';

\{[A-Za-z]+\}
|_{2,3}[A-Za-z]+                              return 'U_CONSTANTA';


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
|'fortype'
|'fordiv'
|'forperiod'                                   return 'SWITCH_FUNC';

'u_sw'                                         return 'U_SWITCH_FUNC';
