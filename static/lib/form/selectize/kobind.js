var inject_binding = function (allBindings, key, value){
	return {
		has: function (bindingKey) {
			return (bindingKey == key) || allBindings.has(bindingKey);
		},
		get: function (bindingKey) {
			var binding = allBindings.get(bindingKey);
			if (bindingKey == key) {
				binding = binding ? [].concat(binding, value) : value;
			}
			return binding;
		}
	};	
}

ko.bindingHandlers.selectize = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

        if (!allBindingsAccessor.has('optionsText'))
            allBindingsAccessor = inject_binding(allBindingsAccessor, 'optionsText', 'name');
        if (!allBindingsAccessor.has('optionsValue'))
            allBindingsAccessor = inject_binding(allBindingsAccessor, 'optionsValue', 'id');
        if (typeof allBindingsAccessor.get('optionsCaption') == 'undefined')
            allBindingsAccessor = inject_binding(allBindingsAccessor, 'optionsCaption', 'Поиск...');
        ko.bindingHandlers.options.update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        var MainModel = allBindingsAccessor.get('mainModel');
        var FieldName = allBindingsAccessor.get('fieldName');
        var Restrict = ModelRestrict.Get(MainModel,FieldName);
        var Model = allBindingsAccessor.get('modelName');
        if(Model){
            AllValues= Catalogue.GetAll(Model);
        }
        var Initial = allBindingsAccessor.get('initial');
        var options = {
            items:[Initial],
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
                if (Restrict){
                    searchW = {
                        word:searchW,
                        filter:JSON.stringify(Restrict)
                    }
                }
                Catalogue.SearchModel(Model,searchW,callback);
            },
            maxOptions:10
        }
        $(element).selectize(options);
    },
    update: function (element, valueAccessor, allBindingsAccessor) {
        var selected_obj = allBindingsAccessor.get('value')();
        if (selected_obj) {
            var selectize = $(element)[0].selectize;
            var Model = allBindingsAccessor.get('modelName');
            selectize.addOption({id: selected_obj, name: Catalogue.Get(Model,selected_obj)})
            selectize.setValue(selected_obj);
        }
    }
}
