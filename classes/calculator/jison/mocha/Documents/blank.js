module.exports = exports =  [
			{
				Formula: "f.If ( not rowin (\"m200240\"), { @Б1? - @Б1.P-303? } )",
				Contexts:[{Context:{row:"z25000"},Result : '@Б1? - @Б1.P-303?'},{Context:{row:"m200240"},Result : '0'}]
			},		
			{
				Formula: "f.If ( coltagin (\"/OSV:1/\"), { @Б1? - @Б1.P-303? } )",
				Contexts:[{Context:{coltags:["OSV:1"]},Result : '@Б1? - @Б1.P-303?'},{Context:{coltags:["OSV:2"]},Result : '0'}]
			},			
			{
				Formula: "f.If ( coltagin (\"/OSV:*/\"), { @Б1? - @Б1.P-303? } )",
				Contexts:[{Context:{coltags:["OSV:1"]},Result : '@Б1? - @Б1.P-303?'}]
			},				
			{
				Formula: "if ( ( ismonth and not periodin( 11 ) ) or ( periodin (42,43,44,46,444,446,416,442) ) ,{1},{2})",
				Contexts:[{Context:{ismonth:true,period:19},Result : '1'},{Context:{ismonth:false,period:442},Result : '1'},{Context:{ismonth:true,period:11},Result : '2'}]
			},				
			{
				Formula: "f.If(periodin('1',\"2\",3),{1},{2})",
				Contexts:[{Context:{period:1},Result : '1'}]
			},				
			{
				Formula: "f.If(groupin('PR_KVART',\"G1_CONS\"),{1},{2})",
				Contexts:[{Context:{grp:['G11','G1_CONS','G1_2011','G1','PR_KVART']},Result : '1'}]
			},				
			{
				Formula: "f.If(objin('1054'),{1},{2})",
				Contexts:[{Context:{obj:1054},Result : '1'}]
			},		
			{
				Formula: 'f.If(rowin("m200240","m200241"),{1},{0})',
				Contexts:[{Context:{row:"m200241"},Result : '1'}]
			},		
			{
				Formula: '2/1000*1000',
				Contexts:[{Context:{ },Result : '2'}]
			},
			{
				Formula: '100+10-100+10-20',
				Contexts:[{Context:{ },Result : '0'}]
			},
			{
				Formula: '(0*0)/(0/0)',
				Contexts:[{Context:{ },Result : '0'}]
			},
			{
				Formula: '1000/(0)*1000',
				Contexts:[{Context:{ },Result : '0'}]
			},
			{
				Formula: '1000/0+(0+1000)',
				Contexts:[{Context:{ },Result : '1000'}]
			},
			{
				Formula: 'if(5>(5-(1)/(0+1)),{4},{2})',
				Contexts:[{Context:{ },Result : '4'}]
			},
			{
				Formula: 'if((4==4) and !4==3,{4},{2})',
				Contexts:[{Context:{ },Result : '4'}]
			},
			{
				Formula: 'f.checklimit(1,0.1)',
				Contexts:[{Context:{},Result : '0'}]
			},			
			{
				Formula: 'f.checklimit(1,8)',
				Contexts:[{Context:{},Result : '8'}]
			},			
			{
				Formula: 'round (45.23583749589685349569348)',
				Contexts:[{Context:{},Result : '45'}]
			},
			{
				Formula: 'round (1/3+5)',
				Contexts:[{Context:{},Result : '5'}]
			},
			{
				Formula: '5/2',
				Contexts:[{Context:{},Result : '2.5'}]
			},
			{
				Formula: '(2-1)-(4/1000)-0*4+(1000/1000)/0+(0*4+1)/(0*6+1)',
				Contexts:[{Context:{},Result : '1.996'}]
			},
			{
				Formula: '5*2',
				Contexts:[{Context:{},Result : '10'}]
			},
			{
				Formula: 'if(5.3>3,{1},{2} )',
				Contexts:[{Context:{},Result : '1'}]
			},
			{
				Formula: 'round(if(5.3>3,{1.3},{2.6} ))',
				Contexts:[{Context:{},Result : '1'}]
			},
			{
				Formula: 'choose (0,2)',
				Contexts:[{Context:{},Result : '2'}]
			},
			{
				Formula: 'checklimit(-0.5,-0.2)',
				Contexts:[{Context:{},Result : '-0.2'}]
			},
			{
				Formula: 'checklimit(0.2,-0.2)',
				Contexts:[{Context:{},Result : '-0.2'}]
			},
			{
				Formula: 'checklimit(0.3,-0.2)',
				Contexts:[{Context:{},Result : '0'}]
			},

			{
				Formula: 'if(0.3>-0.5,{1},{2})',
				Contexts:[{Context:{},Result : '1'}]
			},
			{
				Formula: 'if(0.3>0.5,{1},{2})',
				Contexts:[{Context:{},Result : '2'}]
			},
			{
				Formula: 'if(0.3<0.5,{1},{2})',
				Contexts:[{Context:{},Result : '1'}]
			},
			{
				Formula: 'if(0.3 <0.5 and 2>3 or 4>2 and 0>-0.2,{1},{2})',
				Contexts:[{Context:{},Result : '1'}]
			},

			{
				Formula: 'forcol(Б1:10;Б2:20;Б3,Б4:30)',
				Contexts:[{Context:{col:'Б3'},Result : '30'}]
			},
			{
				Formula: 'forobj(Б1:10;473:20;Б3,555:30)',
				Contexts:[{Context:{ obj:  '555'},Result : '30'}]
			},
			{
				Formula: 'if(3==(2+1)/0,{2},{4})',
				Contexts:[{Context:{ obj:  '555'},Result : '4'}]
			},
			{
				Formula: 'if(!3==(2+1)/0,{2},{4})',
				Contexts:[{Context:{ obj:  '555'},Result : '2'}]
			},
			{
				Formula: 'if(periodin(9),{2},{5})',
				Contexts:[{Context:{ obj:  '555'},Result : '5'}]
			},
			{
				Formula: 'if( colin( "Б3" ), { 3 },{ 4 })',
				Contexts:[{Context:{ col:'Б3',},Result : '3'}]
			},
			{
				Formula: 'if( periodin( "19" ), { 3 },{ 4 })',
				Contexts:[{Context:{ period: '19'},Result : '3'}]
			},
			{
				Formula: 'if( !periodin( "19" ), { 3 },{ 4 })',
				Contexts:[{Context:{ period: '19'},Result : '4'}]
			},				
			{
				Formula: '$m203117?*0.90+$m203118?*0+$m2031191?*0.10',
				Contexts:[{Context:{},Result : '$m203117?*0.9+$m2031191?*0.1'}]
			},			
]
