var colorscale = d3.scale.category10();

//Legend titles
var LegendOptions = [ 'Smartphone', 'Tablet' ];

//Options for the Radar chart, other than default
var cfg = {
	radius: 3, // радиус точек
	w: 700,
	h: 700,
	maxValue: 1,
	factor: 1, // скаляр паутинки
	factorLegend: 1, // скаляр легенды
	levels: 10, // рисочки
	guidelevels: [5, 10], // рисочки пожирнее
	format: d3.format( ),
	outerLine: true, // внешняя линия
	radians: 2 * Math.PI, // зависит от кол-ва лучей?
	opacityArea: 0.2, // зональная прозрачность
	ToRight: 5, // смещение шкалы
	TranslateX: 120,
	TranslateY: 30,
	ExtraWidth: 500,
	ExtraHeight: 100,
	color: colorscale,
	labels: true
}

//Call function to draw the Radar chart
//Will expect that data is in %'s
RadarChart.draw( "#chart", data, cfg );

////////////////////////////////////////////
/////////// Initiate legend ////////////////
////////////////////////////////////////////

var svg = d3.select( '#body' )
	.selectAll( 'svg' )
	.append( 'svg' )
	.attr( "width", cfg.w + cfg.ExtraWidth )
	.attr( "height", cfg.h )

//Create the title for the legend
var text = svg.append( "text" )
	.attr( "class", "title" )
	.attr( 'transform', 'translate(90,0)' )
	.attr( "x", cfg.w - 70 )
	.attr( "y", 10 )
	.attr( "font-size", "1.2em" )
	.attr( "fill", "#404040" )
	.text( "What % of owners use a specific service in a week" );

//Initiate Legend
var legend = svg.append( "g" )
	.attr( "class", "legend" )
	.attr( "height", 100 )
	.attr( "width", 200 )
	.attr( 'transform', 'translate(90,20)' );
//Create colour squares
legend.selectAll( 'rect' )
	.data( LegendOptions )
	.enter()
	.append( "rect" )
	.attr( "x", cfg.w - 65 )
	.attr( "y", function ( d, i ) {
		return i * 20;
	} )
	.attr( "width", 10 )
	.attr( "height", 10 )
	.style( "fill", function ( d, i ) {
		return colorscale( i );
	} );
//Create text next to squares
legend.selectAll( 'text' )
	.data( LegendOptions )
	.enter()
	.append( "text" )
	.attr( "x", cfg.w - 52 )
	.attr( "y", function ( d, i ) {
		return i * 20 + 9;
	} )
	.attr( "font-size", "1.1em" )
	.attr( "fill", "#737373" )
	.text( function ( d ) {
		return d;
	} );