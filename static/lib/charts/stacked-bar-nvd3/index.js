
var test_data = new d3.range(0,3).map(function(d,i) {
    return {
        key: 'Stream' + i,
        values: new d3.range(0,11).map( function(f,j) {
            return {
                y: 10 + Math.random()*100,
                x: j
            }
        })
    };
});

console.log('td', test_data)

var chart;
nv.addGraph(function() {
    chart = nv.models.multiBarChart()
        .duration(300)
        .margin({bottom: 100, left: 70})
        .rotateLabels(0)
        .groupSpacing(0.5)
        .reduceXTicks(false)
        .staggerLabels(false)
        .stacked(true)
    chart.xAxis
        .axisLabel("период")
        .showMaxMin(false)
    chart.yAxis
        .axisLabel("млн. руб")
        .showMaxMin(true)
    chart.dispatch.on('renderEnd', function(){
        nv.log('Render Complete');
    });
    d3.select('svg')
        .datum(data)
        .call(chart);
    nv.utils.windowResize(chart.update);
    chart.dispatch.on('stateChange', function(e) {
        nv.log('New State:', JSON.stringify(e));
    });
    chart.state.dispatch.on('change', function(state){
        nv.log('state', JSON.stringify(state));
    });
    return chart;
});
