var m_admin = {

	startWatchCalcLog:function(){
		setTimeout(function(){
			m_socket.start('calcsInfo');
			$.getJSON('/api/calcinfo');
		},2000)
	},

	stopWatchCalcLog:function(){
		m_socket.stop('calcsInfo');		
	},

	commitsInfo:ko.observable(''),
	commitsInfoLoaded:ko.observable(false),

	isClearCache:ko.observable(false),
	

	clearCelllCache:function(){
		m_admin.isClearCache(true);
		$.ajax({
			url:'/api/clearcellcache',
			success:function(answ){
				setTimeout(function(){
					m_admin.isClearCache(false);
				},1000);
			}
		})
	},

	showCommits:function(){
		if (m_admin.commitsInfoLoaded()){
			m_admin.commitsInfoLoaded(false);
			m_admin.commitsInfo	('');
			return;
		}
		$.ajax({
			url:'/api/sandbox/getallupdates',
			success:function(data){
				if (_.isArray(data)){
					m_admin.commitsInfo	(data);
					m_admin.commitsInfoLoaded(true);
				}
			}
		})
	},

	isSyncMs:ko.observable(false),

	sqlProgress:ko.observable(),

	isEmulating:ko.observable(false),
	isReseting:ko.observable(false),

	syncMs:function(){
		m_admin.isSyncMs(true);
		$.ajax({
			url:'/api/resyncmssql',
			success:function(answ){
				m_admin.sqlProgress({
					step:ko.observable(0),
					task:ko.observable(0),
					text:ko.observable(''),
					IsFinished:ko.observable(),
				});
				console.log("ANSW",answ.progressbar);
				iface.progressBars[answ.progressbar] = m_admin.sqlProgress;				
				m_admin.sqlProgress().IsFinished.subscribe(function(v){
					if (v){
						m_admin.isSyncMs(false);
						m_admin.sqlProgress().step(100);
						m_admin.sqlProgress().task(100);
						m_admin.sqlProgress().text('Задание завершено нажмите F5');
					}
				})				
			}
		})
	},

	permitTranslates:ko.observable(null),
	
	userpermits :ko.observable(null),
	info : {
		Channels    :ko.observableArray([]),
		Log         :ko.observableArray([]),
		Queues      :ko.observable(0),
	}


}
