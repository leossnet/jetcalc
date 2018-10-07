var MModels = (new function(){

    var self = this;

    self.base = "/api/modules/models/";
    
    self.Events = new EventEmitter();

    self.Config = {};

    self.Init = function(done){ 
    	$.getJSON(self.base,function(data){
    		self.Config = data;
    		self.InitModels();
        	return done && done();
    	})
    }


    self.Models = {};

    self.InitModels = function(){
    	for (var modelName in self.Config){
    		var Fields = self.Config[modelName].fields;
    		var Config = {EditFields:[],Code:"",Name:"",Types:{},Default:{},Links:self.Config[modelName].Links,ModelName:modelName,EditTemplate:{}, Mask:{}};
    		for (var FieldName in Fields){
    			var FInfo = Fields[FieldName];
    			if (FInfo.role=="code") Config.Code = FieldName;
    			if (FInfo.role=="name") Config.Name = FieldName;
    			if (FInfo.refmodel){
    				Config.Types[FieldName] = {Type:"Select",Model:FInfo.refmodel};
                    Config.EditTemplate[FieldName] = "form_ref";
    			} else {
    				Config.Types[FieldName] = {Type:FInfo.type}
                    if (FInfo.template){
                        Config.EditTemplate[FieldName] = FInfo.template;
                    } else {
                        switch(FInfo.type){
                            case "Boolean":
                                Config.EditTemplate[FieldName] = "form_checkbox";
                            break;                        
                            case "Number":
                                Config.EditTemplate[FieldName] = "form_number";
                            break;                        
                            case "String":
                                Config.EditTemplate[FieldName] = "form_text";
                            break;                       
                            case "Date":
                                Config.EditTemplate[FieldName] = "form_date";
                            break;
                            case "Array":
                                Config.EditTemplate[FieldName] = "form_array";
                            break;
                        }        
                    }

                    if (FInfo.mask) Config.Mask[FieldName] = FInfo.mask;
    			}    			
   				if (FieldName.substring(0,2)=='Id' && Fields['Code'+FieldName.substring(2)] || FieldName.substring(0,3)=='Old'  || Fields[FieldName].select===false){
   					;
   				} else {
   					Config.EditFields.push(FieldName);
   					Config.Default[FieldName] = FInfo.default;
   				}
    		}
            Config.Links && Config.Links.forEach(function(L){
                Config.Default["Link_"+L] = [];
            })
    		self.Models[modelName]  = function(Config){
    			return function(){
					var self = this;
					for (var Key in Config){
						self[Key] = function(C){
							return C;
						}(Config[Key]);
					}
                    self.Template = function(FieldName){
                        if (FieldName==Config.Code) return "form_code_text";
                        return Config.EditTemplate[FieldName] || "form_text";
                    }
                    self.IsEdit = ko.observable(false);
					ko.mapping.fromJS(Config.Default, this.mapping || {}, this);
				}
    		}(Config);
    	}
    }

    self.Create = function(modelName, props, const_props) {
		if(!modelName || !self.Models[modelName]) return null;
        var inst = new self.Models[modelName](const_props);
        props = _.merge(const_props,props);
        if (props) {
            var mapping = inst.mapping || {};
            if (typeof props === "string") {
                ko.mapping.fromJSON(props, mapping, inst);
            } else {
                ko.mapping.fromJS(props, mapping, inst);
            }
        }
        inst.toJSON = function() {
			return ko.mapping.toJSON(this);
		}
        inst.toJS = function() {
			return ko.mapping.toJS(this);
		}
        inst.fromJS = function(js) { 
        	return ko.mapping.fromJS(js, this.mapping || {}, this);
        }
        inst.fromJSON = function(json) {
			return ko.mapping.fromJSON(json, this.mapping || {}, this);
		}
        return inst;
	}
 
    self.SaveFileToGfs = function(File2Save,done){
        if (typeof File2Save!='object') return done(null, null);
        FileAPI.upload({
            url: "/api/gfs",
            files: { file: File2Save },
            complete: function(err, xhr) {
                if (err) return done(err);
                var res = JSON.parse(xhr.response)
                if (!res.id) return done("Ошибка добавления файла");
                return done(null, res.id);
            }
        })
    }


    return self;
});

ModuleManager.Modules.Models = MModels;


var LinkEditorHelper = (new function(){
    
    var self = this;

    self.FilterEditFields = function(mainmodelname,linkmodel,params,MainField){ 
        var AllFields = _.clone(MModels.Create(linkmodel,{}).EditFields);
        var UselessField = "";
        if (params!='ALL'){
            UselessField = ("code"+mainmodelname).toLowerCase();
            if (_.isEmpty(UselessField) && !_.isEmpty(MainField)){
                UselessField = MainField.toLowerCase();
            }
        }
        var CodeField = 'code'+linkmodel;
        AllFields = _.filter(AllFields,function(F){
            var T = F.toLowerCase();
            return T!=CodeField && T!=UselessField;
        })
        return AllFields;
    }



    return self;
})



ko.components.register('combobox-editor', {
    viewModel: function(params) {
        var self = this;
        self.EditField = params.field;
        if (!self.InitialValue){
            self.InitialValue = self.EditField();
        }
        self.Model = params.refmodel;
        self.MainModel = params.mainmodel;
        self.FieldName = params.fieldname;
        self.Show = ko.observableArray([{id:self.InitialValue,name:Catalogue.Get(self.Model,self.InitialValue)}]);
    },
    template: '<select data-bind="valueAllowUnset: true, value:EditField,optionsText:\'name\',optionsValue:\'id\',initial:InitialValue,modelName:Model,mainModel:MainModel,fieldName:FieldName,selectize:Show"></select>',
});

ko.bindingHandlers.mask = {
    init: function(element, valueAccessor, allBindingsAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (value){
            $(element).mask(value);
        }
    }, 
};

ko.bindingHandlers.codemask = {
    init: function(element, valueAccessor, allBindingsAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var valold = "";
        $(element).keypress(function(key) {
            var input = key.key;
            if (!input.match(/[A-Za-z0-9\-_]/)) return false;
        });

    }
};

ko.bindingHandlers.FileUpload = {
  init: function(element, valueAccessor, allBindingsAccessor) {
    var Field = allBindingsAccessor().FileUpload.FilePlace;
    $(element).ace_file_input({
          style:'well',
          btn_choose:'Нажмите для выбора',
          btn_change:'Нажмите для изменения',
          no_file:'Файл не выбран',
          no_icon:'ace-icon fa fa-picture-o',
          thumbnail:'large',
          before_remove:function(){
              Field("");
              var Pl = $(element).parent().find(".ace-file-container");
              Pl.css("background-image","");
              Pl.css("background-size","");
              return true;
          },
          before_change:function(){
            var Pl = $(element).parent().find(".ace-file-container");
            Pl.css("background-image","");
            Pl.css("background-size","");
            return true;
          }
    }).on('change', function(){
        Field(FileAPI.getFiles(element)[0]);
        return;
    })
    var ChoosedFile = Field();
    if ( ChoosedFile){
       $(element).ace_file_input('show_file_list', [ChoosedFile]);
       var Pl = $(element).parent().find(".ace-file-container");
       Pl.css("background-image","url('/api/gfs/"+ChoosedFile+"')");
       Pl.css("background-size","cover");
    }
  }
}

ko.bindingHandlers.title = {
  update: function(element, valueAccessor) {
    var text = ko.utils.unwrapObservable(valueAccessor());
    if (text && text!='null') {
        $(element).attr("data-rel","tooltip");
        $(element).attr("data-placement","bottom");
        $(element).attr("data-original-title",(text+'').replace(/ /g,'&nbsp;'));
        $(element).tooltip({html:true,animation:true,delay:{ show: 1000, hide: 100 }});
    }
  }
};


ko.bindingHandlers.selectize_tags = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var Params = ko.utils.unwrapObservable(valueAccessor());
        var Sel = allBindingsAccessor.get('selectedOptions')();
        var Model = allBindingsAccessor.get('modelName');
        var EM = MModels.Create(Model); var Code = EM.Code;
        var In = [];
        if (!_.isEmpty(Sel)) In = _.map(Sel,function(CC){
            return {id:CC,name:CC};
        })
        var options = _.merge({
            items:[],
            preload:true,
            valueField: allBindingsAccessor.get('optionsValue'),
            labelField: allBindingsAccessor.get('optionsText'),
            searchField: [allBindingsAccessor.get('optionsValue'),allBindingsAccessor.get('optionsText')],
            render: {
                item: function(item, escape) {
                    return '<div class="selectize_item_choosed">' +
                        (item.id ? '<span  class="label label-info ">' + escape(item.id) + '</span>' : '') +
                        (item.name ? ' <span class="name">' + Catalogue.GetHtml(Model,item.id) + '</span>' : '') +
                    '</div>';
                },
                option: function(item, escape) {
                    var label = item.id;
                    var caption = item.name;
                    return '<div>' +
                        '<span class="label label-info ">' + escape(label) + '</span>&nbsp;' +
                        (caption ? '<span class="caption">' + escape(caption) + '</span>' : '') +
                    '</div>';
                }
            },
            load: function(query, callback) {
                var Result = [], searchW = (query+'').toLowerCase();
                Catalogue.SearchModel(Model,searchW,callback);
            },
            maxOptions:10
        },Params);
        $(element).selectize(options);
        if (!_.isEmpty(In)){
            var selectize = $(element)[0].selectize;
            In.forEach(function(I){
                selectize.addOption(I);
            })
            selectize.setValue(_.map(In,"id"));
        }
    },
    update: function (element, valueAccessor, allBindingsAccessor) {

    }

}
