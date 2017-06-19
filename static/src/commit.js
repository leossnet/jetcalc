var m_commit_debug = '';
var m_commit = {

	objects2save:ko.observable(),
	comment:ko.observable(m_commit_debug),

	load:function(){
		$.ajax({
			url:'/api/sandboxobjects',
			success:function(data){
				m_commit.objects2save(data);
			}
		})
	},

	clearChanges:function(){
		$.ajax({
			url:'/api/sandbox',
			type:'delete',
			success:function(data){
				
			}
		});
	},


	applyChanges:function(){
		$.ajax({
			url:'/api/sandbox',
			data:{
				comment:m_commit.comment()
			},
			type:'put',
			success:function(data){
				m_commit.comment(m_commit_debug);
				
			}
		});
	}




}