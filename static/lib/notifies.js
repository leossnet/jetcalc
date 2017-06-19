var socket = io.connect(document.location.host);


var Notify = {
	
	
	refresh:function(data){
		if (data.type =='table'){
			tables[data.name].tableViewModel.reload();
			console.log(tables[data.name].tableViewModel);
		}
	},
	receive:function(data){
		console.log(data);
	},
	
	//gritter-error gritter-light, gritter-error,  , 
	
	createGritter:function(data,type){
		var class_name = 'gritter-light'; var sticky = false;
		if (type=='managersiterequest') {
			sticky	= true; class_name = "";
		}
		var g = {
			title: data.title,
			text: data.text,
			sticky: sticky,
			time: '',
			class_name: class_name
		};
		if (data.class_name) g.class_name = data.class_name;
		if (data.sticky) g.sticky = data.sticky;
		/*if (data.photo.length){
			g.image = data.photo;
		}*/
		$.gritter.add(g);		
	}
	
	
	
}

socket.on('notify', Notify.receive);
socket.on('refresh', Notify.refresh);
