var HandsonComponent = function(dataobjects, columns, selector){
    var self = this;


    self.table = null;
    self.data = dataobjects;
    self.columns = columns;
    self.selector = selector;
    self.FixedWidths = [];
    self.Editable = [];

    self.AddChange = function(changes, source){
        switch(source) {
            case 'edit':
            case 'autofill':
            case 'paste':
            case 'undo':
                changes.forEach(function(Change){
                    self.data[Change[0]][Change[1]](Change[3]);
                })
            default:
                console.log(">>>",changes, source);
            break;
        }
    }

    self.config = {
        rowHeaders:true,
        colHeaders:true,
        autoRowSize:true,
        minSpareRows: 0,
        minSpareCols: 0,
        currentColClassName: 'currentCol',
        currentRowClassName: 'currentRow',
        fixedRowsTop: 1,
        fixedColumnsLeft: 1,
        manualColumnResize: true,
        afterChange: self.AddChange,
        trimDropdown: false,
    }

    self.GetSelectRender = function(Template){
        var Model = Template.Model;
        return  function(instance, td, row, col, prop, value, cellProperties) {
            $(td).html(Catalogue.GetHtmlWithCode(Model,value));
        };
    }


    self.RenderTries = 0;
    self.RenderTimeout = null;
    self.Render = function(){
        if ((++self.RenderTries)>10) return;
        if (self.RenderTimeout) clearTimeout(self.RenderTimeout);
        if (_.isEmpty($(self.selector))){            
            self.RenderTimeout = setTimeout(self.Render,50);
        } else {
            self._render();
            self.RenderTries = 0;
        }
    }

    self._render = function(){
        var Columns = [], Template = _.first(self.data), Fields = _.keys(self.columns);
        Fields.forEach(function(Field){
            var Type = Template.Types[Field].Type, D = {data:Field,type:'text',readOnly:self.Editable.indexOf(Field)==-1 ? true:false};
            switch (Type){
                case "Number":
                    D.type = 'numeric';
                    if (Template.Mask[Field]){
                        D.format = Template.Mask[Field];
                    }
                break;
                case "Select":
                    delete (D.type);
                    D.renderer = self.GetSelectRender(Template.Types[Field]);
                    if (Template.Mask[Field]){
                        D.format = Template.Mask[Field];
                    }
                break;
                default:
                    console.log("Unknown type:",Type);
            }
            Columns.push(D);
        })
        MModels.Create("valutarate").Types.Value1
        var settings = _.merge(_.clone(self.config),{
            data:_.map(self.data,function(d){
                return d.toJS();
            }),
            columns:Columns,
            maxRows:self.data.length,
            colHeaders:_.values(self.columns)
        })
        if (self.table){
            console.log("self.table");
            self.table.updateSettings({data:settings.data});
        } else {
            console.log("! self.table = Generate new");
            self.table =  new Handsontable($(self.selector)[0], settings);
            new HandsonTableHelper.WidthFix(self.table,200,300,self.FixedWidths);
        }
        

        
    }


    return self;
}
































String.prototype.replaceAll = function(what,forwhat){
  return this.replace(new RegExp(_.escapeRegExp(what), 'g'), forwhat);
}

String.prototype.queryObj = function(){
    return (this).replace(/(^\?)/,'').split("&").map(function(n){return n = n.split("="),this[n[0]] = decodeURIComponent(n[1]),this}.bind({}))[0];  
}

var toQueryString = function(obj){
    return '?'+decodeURIComponent( $.param( obj) );
}

function dec(a, b, c, s) {
    var variants = [a, b, c];
    var index = s % 100;
    if (index >=11 && index <= 14) {
        index = 0;
    }
    else {
        index = (index %= 10) < 5 ? (index > 2 ? 2 : index): 0;
    }
    return(variants[index]);
}

var aggr_makeShort = function(name){
   var parts = _.difference(name.replace(/\s+/g," ").replace(/['"«]/g,"").split(/[\s]/),["ООО","ПАО","АО","Ф-л","ДПО","ЗАО","ОАО","(юр. лицо)","ЧУ"]);
   return _.map(parts,function(p){
      return (_.first(p)+'').toUpperCase();
   }).join("")
}

String.prototype.replaceAll = function(what,forwhat){
    return (this+'').split(what).join(forwhat);//(new RegExp(_.escapeRegExp(what), 'g'), forwhat);
    return this.replace(new RegExp(_.escapeRegExp(what), 'g'), forwhat);
}

String.prototype.repeat = function( num ) {
    return new Array( num + 1 ).join( this );
}

String.prototype.padleft = function( length, symbol ) {
    return (symbol+'').repeat(length-this.length)+this;
}

Array.prototype.remove = function(el){
	return this.splice(this.indexOf(el),1);
}

var parseBoolean = function (test){
	return (test===true || test==="true");
}
var isArray = function  (arr){
	return _.isArray(arr);
}


var guid = function(){
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    	var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    	return v.toString(16);
	});
}

function ucfirst(text){
	var text = text+'';
	return text.substring(0,1).toUpperCase()+text.substring(1).toLowerCase();
}



function toggleFullscreenOn(elem) {
    elem = elem || document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
    try{
    	setTimeout(function(){
    		if (m_htable.table) m_htable.refreshTable();
    	},500);
    } catch(e){console.log(e);}

}

function userAvatar(data){
	try{
		var name = data.NameUser();
		var photo = data.Photo();
		var lastL = name.substring(name.length-1,name.length);
		if (photo) return photo;
		if (lastL=='а'){
			return '/media/fempty.png';
		} else {
			return '/media/mempty.png';
		}
	} catch(e){
		console.log(e);
	}
}

