// Добавить информацию о ПО 
// echo "[*] Linux" && lsb_release -d && echo  "[*] Mongo" && mongod --version|grep 'db version' && echo "[*] Nginx" && nginx -v && echo '[*] Node' &&  node -v && echo '[*] Rabbit' && rabbitmqctl status|grep 'rabbit,"RabbitMQ"' && echo '[*] Reddis' &&  redis-cli --version


var m_sysLog = {

	rawlog          : '',

	cpuInfo        : ko.observableArray([]),
	memoryInfo     : ko.observableArray([]),
	ticks          : ko.observableArray([]),
	loadData       : ko.observableArray([]),
	usersCountData : ko.observableArray([]),
	calcsCountData : ko.observableArray([]),
	ramData        : ko.observableArray(),
	
	keyStrings : {
		delimiter    : '-/-',
		cpuHeader    : '*                       CPU:                              *',
		memoryHeader : '*                      Memory:                            *',
	},

	parseCpuInfo: function(cpuRawInfo,done) {
		var splittedInfo = _.compact(cpuRawInfo.split('\n'));
		var resultInfo = [];

		var coresCount = _.countBy(splittedInfo, function (n){
			return _.includes(n,'processor');
		}).true;

		var getRawCoreInfo = function (coreIndex, done) {
			var length = splittedInfo.length;

			var firstIndex  = ((splittedInfo.length * (coreIndex) ) / coresCount);
			var lastIndex   = ((splittedInfo.length * (coreIndex + 1) ) / coresCount);
			
			var rawCoreInfo = _.at(splittedInfo,_.range(firstIndex,lastIndex));
			return done(rawCoreInfo);
		}


		for (var i=0; i < coresCount; i++) {
			var coreInfo = {};
			getRawCoreInfo(i, function (rawCoreInfo) {
				rawCoreInfo.forEach(function (rawInfo) {
					var info = rawInfo.split(':');
					
					var key   = _.camelCase(_.trim(_.first(info)));
					var value = _.trim(_.last(info));

					coreInfo[key] = value;
				});
			});
			resultInfo.push(coreInfo); 
		}

		m_sysLog.cpuInfo(resultInfo);
		return done && done();
	},

	parseMemoryInfo: function(rawMemoryInfo,done) {
		var splittedInfo = rawMemoryInfo.split('\n');
		var resultInfo   = {};

		splittedInfo.forEach(function (rawInfo) {
			var info = rawInfo.split(':');
			var key   = _.trim(_.first(info));
			var value = _.trim(_.last(info));
			resultInfo[key] = value;
		});
		m_sysLog.memoryInfo([resultInfo]);
		return done && done();
	},

	parseTicks: function(rawTicksInfo,done) {
		var delimiter           = m_sysLog.keyStrings.delimiter;
		var splittedInfo        = rawTicksInfo.split('\n');

		var rawTicks = [];

		splittedInfo.forEach(function (rawTick){
			var splittedTick = rawTick.split(' '); 
			if (_.includes(splittedTick[0],'-/-')) {
				rawTicks.push({
					date        : splittedTick[1] || '',
					usersOnline : splittedTick[2] || 0,
					calcsCount  : splittedTick[3] || 0,
					rss         : splittedTick[4] || 0,
					heapTotal   : splittedTick[5] || 0,
					heapUsed    : splittedTick[6] || 0,
					load1min    : parseFloat(splittedTick[7])  || 0,
					load5min    : parseFloat(splittedTick[8])  || 0,
					load15min   : parseFloat(splittedTick[9])  || 0,
					ram         : parseFloat(splittedTick[10]) || 0,
				});
			}
		});
		m_sysLog.ticks(rawTicks);
		return done && done();
	},

	parseLog: function(done) {
		var keyStrings = m_sysLog.keyStrings;

		var cpuHeaderIndex      = m_sysLog.rawlog.indexOf(keyStrings.cpuHeader) + keyStrings.cpuHeader.length + 1;
		var memoryHeaderIndex   = m_sysLog.rawlog.indexOf(keyStrings.memoryHeader);
		var firstDelimiterIndex = m_sysLog.rawlog.indexOf(keyStrings.delimiter);

		var rawCpuInfo    = m_sysLog.rawlog.slice(cpuHeaderIndex, memoryHeaderIndex);
		var rawMemoryInfo = m_sysLog.rawlog.slice(memoryHeaderIndex + keyStrings.memoryHeader.length + 1, firstDelimiterIndex - 3);
		var rawTicksInfo  = m_sysLog.rawlog.slice(firstDelimiterIndex, m_sysLog.rawlog.length);
		m_sysLog.parseCpuInfo(rawCpuInfo);
		m_sysLog.parseMemoryInfo(rawMemoryInfo);
		m_sysLog.parseTicks(rawTicksInfo)
	},
	loadLog: function(done) {
		$.ajax({
			url:'/debugProd/log.txt',
			success: function (data) {
				m_sysLog.rawlog = data;
				m_sysLog.parseLog();
				// m_sysLog.showGraphs();
			},
			error: function(data) {
				console.log('error while loading file');
			}
		});
	}
}

m_sysLog.data = ko.computed(function(){
	var loadData       = [];
	var ramData        = [];
	var usersCountData = [];
	var calcsCountData = [];

	if (m_sysLog.ticks()) {
		
		var date       = _.map(m_sysLog.ticks(),'date');
		var load1min   = _.map(m_sysLog.ticks(),'load1min');
		var load5min   = _.map(m_sysLog.ticks(),'load5min');
		var load15min  = _.map(m_sysLog.ticks(),'load15min');
		var ram        = _.map(m_sysLog.ticks(),'ram');
		var usersCount = _.map(m_sysLog.ticks(),'usersOnline');
		var calcsCount = _.map(m_sysLog.ticks(),'calcsCount');

		for (var i=0; i<m_sysLog.ticks().length; i++) {
			var loadGraphTick  = [];
			var ramGraphTick   = [];
			var usersGraphTick = [];
			var calcsCountTick = [];

			var dateCount = new Date(date[i]);

			//load info
			loadGraphTick.push(dateCount);
			loadGraphTick.push(load1min[i]);
			loadGraphTick.push(load5min[i]);
			loadGraphTick.push(load15min[i]);
			loadData.push(loadGraphTick);

			//ram usage
			ramGraphTick.push(dateCount);
			ramGraphTick.push(ram[i]);
			ramData.push(ramGraphTick);

			//users count
			usersGraphTick.push(dateCount);
			usersGraphTick.push(usersCount[i]);
			usersCountData.push(usersGraphTick);

			//calcs count
			calcsCountTick.push(dateCount);
			calcsCountTick.push(calcsCount[i]);
			calcsCountData.push(calcsCountTick);
		}

		m_sysLog.loadData(loadData);
		m_sysLog.ramData(ramData);
		m_sysLog.usersCountData(usersCountData);
		m_sysLog.calcsCountData(calcsCountData);
		// return loadData;
	}
});



