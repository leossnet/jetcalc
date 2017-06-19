"use strict";

// documentation: http://c3js.org/reference.html

var chart = c3.generate( {
	bindto: '#chart',
	size: {
		width: 800,
		height: 900
	},
	interaction: {
		enabled: true // показывать всплывашки по ховеру
	},
	data: {
		json: data,
		groups: [ // для stacked
			[ "Здания", "Сооружения", "Машини и оборудование", "Транспортные средства", "Прочие осн. средства" ]
		],
		keys: {
			x: 'name',
			value: [ "Здания", "Сооружения", "Машини и оборудование", "Транспортные средства", "Прочие осн. средства" ],
		},
		type: 'bar'
	},
	axis: {
		x: {
			type: 'category'
		},
        y:{
			tick:{
				values: new Array(100).fill(0).map(function(v,i){ return i*2}) // шаги задаются массивом
			}
        }
	},
    grid:{
        y:{
            show: true // показывать грид
        }
    },
	legend:{
		position: 'bottom' // bottom || right || inset
	}
} );
