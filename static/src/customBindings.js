var HEditor = function(dom,params,ResultObservable,ChangesCount,DiscretChangesLink){
    var self = this;

    self.Dom = dom;
    self.Params = params;

    self.ChangesCount = ChangesCount;
    self.ResultObservable = ResultObservable;
    self.DiscretChanges = {};

    self.AddChange = function(changes, source){
        if (!_.isEmpty(changes)){
            changes.forEach(function(change){
                var ind = change[0], col = change[1], oldv = change[2], newv = change[3], index = [ind,col].join("_");
                  if (self.DiscretChanges[index] && _.isEqual(self.DiscretChanges[index].old,newv)){
                      delete self.DiscretChanges[index];
                  } else {
                      if (self.DiscretChanges[index]){
                          self.DiscretChanges[index].new = newv;
                      } else {
                          self.DiscretChanges[index] = {old:oldv,new:newv}
                      }                      
                  }
            })
            if (!self.DiscretChanges) self.DiscretChanges = {};
            self.ChangesCount(_.keys(self.DiscretChanges).length);
            DiscretChangesLink(self.DiscretChanges);
        }
    }

    self.FlushChangesTimer = null;
    self.FlushChanges = function(){
        if (self.FlushChangesTimer) {
            clearTimeout(self.FlushChangesTimer);
            self.FlushChangesTimer = null;
        }
        self.FlushChangesTimer = setTimeout(function(){
            self.FlushChangesTimer = null;
            self._flushChanges();
        },100);
    }

    self._flushChanges = function(){
        self.DiscretChanges = {};
        DiscretChangesLink(self.DiscretChanges);
        self.ChangesCount(0);
    }

    self.BaseConfig ={
        rowHeaders:true,
        colHeaders:true,
        autoRowSize:true,
        minSpareRows: 0,
        minSpareCols: 0,
        currentColClassName: 'currentCol',
        currentRowClassName: 'currentRow',
        autoRowSize: true,
        fixedRowsTop: 0,
        fixedColumnsLeft: 1,
        manualColumnResize: true,
        afterChange: self.AddChange,
        trimDropdown: false,
        afterLoadData:self.FlushChanges,
        fillHandle: {
          autoInsertRow: false,
        },
        data:[]
    };

    self.Table = null;

    self.RenderTimeout = null;
    self.Render = function(){
        if (self.RenderTimeout) {
            clearTimeout(self.RenderTimeout);
            self.RenderTimeout = null;
        }
        self.RenderTimeout = setTimeout(function(){
            self.RenderTimeout = null;
            self.Table && self.Table.render();
        },100);
    }

    self.Config = function(Params){
        Params = Params || self.Params;
        var Result = _.clone(self.BaseConfig);
        if (_.isEmpty(Params)) return Result;
        if (!_.isEmpty(Params.CFG)) Result = _.merge(Result,Params.CFG);
        Result.columns = Params.Columns;
        Result.data = _.values(Params.Rows);
        if (!_.isEmpty(Params.Header)){
          Result.headers = Params.Header;
        }
        return Result;
    }
    
    self.Init = function(){
        var CFG = self.Config();
        if (CFG.GetData) CFG.GetData = self.GetData;
        self.Table  =  new Handsontable(self.Dom, CFG);
        if (!_.isEmpty(CFG.headers)){
            new HandsonTableHelper.HeaderGenerator(self.Table);  
        }        
        if (!_.isEmpty(CFG.tree)){
            new HandsonTableHelper.TreeView(self.Table);
        }
        new HandsonTableHelper.DiscretScroll(self.Table);
    }

    self.Dispose = function(){
        self.Table.destroy();
        self.Table = null;
    }

    self.Update = function(params){
        var CFG = self.Config(params);
        self.Table.loadData(CFG.data);
        self.ResultObservable(CFG.data);
        self.Render();        
    }
    
    return self;
}


ko.bindingHandlers['handson-table'] = {
    init: function(element, valueAccessor, allBindings, data, context) {
        var params = ko.utils.unwrapObservable(valueAccessor());
        var result = allBindings()['handson-table-result'];
        var count = allBindings()['handson-table-changes-count'];
        var changes = allBindings()['handson-table-changes'];
        var Editor = new HEditor(element,params,result,count,changes);                
        element.HTable = Editor;
        element.HTable.Init();
        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            element.HTable.Dispose()
            delete element.HTable;
        });
    },
    update: function (element, valueAccessor, allBindingsAccessor) {
        var params = ko.utils.unwrapObservable(valueAccessor());
        element.HTable.Update(params);
    }
};









ko.bindingHandlers.treeSelector = {
    init: function(element, valueAccessor, allBindingsAccessor) {
      var unwrValue = ko.unwrap(valueAccessor());
      $(element).ace_tree({
          dataSource: unwrValue.dataSource,
          multiSelect: false,
          cacheItems: false,
          'open-icon' : 'ace-icon tree-minus',
          'close-icon' : 'ace-icon tree-plus',
          'itemSelect' : true,
          'folderSelect': true,
          'selected-icon' : 'ace-icon fa fa-check',
          'unselected-icon' : 'ace-icon fa fa-check',
        });
        $(element).on('selected.fu.tree', function (evt, data) {
            unwrValue.selected(data.target.code);
        })
    }
};



ko.bindingHandlers.model_autocomplete = {
  init: function(element, valueAccessor, allBindingsAccessor) {
    var value = ko.utils.unwrapObservable(valueAccessor());
    var set = allBindingsAccessor().value, model = value.model;
    $(element).typeahead({hint: false, highlight: true, minLength: 1},{name: 'list',limit:20,
      source: function (query, sunc, async) {
      Catalogue.SearchModel(model,query,function(r){
        async(r);
      })
      },
      display: 'id',
      val:function(item){
        return item.id;
      }
    });
    $(element).bind('typeahead:select', function(set){
      return function(ev, suggestion) {
        set(suggestion.id);
    }       
  }(set));
  }
}




























ko.bindingHandlers.draggable = {
  init: function(element, valueAccessor, allBindingsAccessor) {
    var value     = valueAccessor();
    var unwrValue = ko.unwrap(valueAccessor());
    $(element).nestable();
  }
}





ko.bindingHandlers.slimScroll = {
  update: function(element, valueAccessor, allBindingsAccessor) {
    var value = ko.utils.unwrapObservable(valueAccessor());
    if (value.height!='auto') {
      var height = (value.height+'').replace(/[^0-9]/g,'')+'px';    
    } else {
      height = value.height;
    }

    var bind = undefined;
    if (value.bind) bind = value.bind;
    setTimeout(function(){
      $(element).slimScroll({
          height: height,
          // alwaysVisible: true,
          // allowPageScroll: true
        }).bind('slimscroll',bind);
    },0)
  }, 
};


ko.bindingHandlers.aceScroll = {
  update: function(element, valueAccessor, allBindingsAccessor) {
    var value = ko.utils.unwrapObservable(valueAccessor());
    if (value.height!='auto') {
      var height = (value.height+'').replace(/[^0-9]/g,'');    
    } else {
      var height = ($(window).height()-$(element).offset().top);
    }
    var bind = undefined;
    if (value.bind) bind = value.bind;
    setTimeout(function(){
      $(element).ace_scroll(_.merge($.fn.ace_scroll.defaults,{size:height}))
    },0)
  }, 
};





ko.bindingHandlers.imageUpload = {
  init: function(element, accessor, bindings) {
    // FileAPI.event.on(element, "change", function(evt) {
    //   var image = FileAPI.getFiles(element)[0]
    //   FileAPI.upload({
    //     url: "/api/image",
    //     files: { file: image },
    //     complete: function(err, xhr) {
    //       var res = JSON.parse(xhr.response)
    //       if (typeof accessor()=='function'){
    //         return accessor()(res.path)
    //       } else {
    //         console.log(accessor,accessor(),res.path);
    //       }          
    //     }
    //   })
    // })
  }
}


ko.bindingHandlers.colorpicker = {
    init: function(element, valueAccessor, allBindingsAccessor) {
      var value = ko.utils.unwrapObservable(valueAccessor());
      var bind = allBindingsAccessor().selected;
      var currentValue = bind();
      $(element).find('option[value='+currentValue+']').attr('selected','selected');
      $(element).ace_colorpicker(value);
      $(element).next().find('.dropdown-toggle').on('click',function(v){
        $(element).next().find('.dropdown-toggle').toggleClass('open');
      });
      $(element).on('change.color',function(v){
        bind($(v.target).find('option:selected').attr('data-skin'));
      });
    }
};

ko.bindingHandlers.sortable = {
    init: function(element, valueAccessor, allBindingsAccessor) {
    var value = ko.utils.unwrapObservable(valueAccessor());
    $(element).sortable({placeholder: "ui-state-highlight",stop: function( event, ui ) {
      value.update($(element).sortable( "toArray",{attribute:'_id'}))
    }});
      $(element).disableSelection();
    }, 
};



ko.bindingHandlers.fromtag = {
    update: function(element, valueAccessor, allBindingsAccessor) {
    var value = ko.utils.unwrapObservable(valueAccessor());
        $(element).text(value.split(':').pop().split('/').shift().trim());
    }, 
};

ko.bindingHandlers.data = {
    update: function(element, valueAccessor, allBindingsAccessor) {
    var value = ko.utils.unwrapObservable(valueAccessor());
        $(element).data(value);
    }, 
};

ko.bindingHandlers.date = {
    update: function(element, valueAccessor, allBindingsAccessor) {
        var value = ko.unwrap(valueAccessor());
        if (typeof(value) =='string'){
          $(element).text(moment(value).format('LLL'));
        } else {
          $(element).text(moment(value.value).format(value.format));
        }
    }, 
};


//**jquery datepicker redefine
Date.parseDate = function(input, format){
  return moment(input,format).toDate();
};
Date.prototype.dateFormat = function(format){
  return moment(this).format(format);
};
//**

ko.bindingHandlers.datetimepicker = {
    init: function(element, valueAccessor, allBindingsAccessor) {
        var config = allBindingsAccessor().config;
        element.onblur = function(){
          $(element).datetimepicker("destroy");  
        }
        element.onfocus = function(){
          $(element).datetimepicker(config);
          $(element).datetimepicker('show');
        }
        element.onchange = function(){
            var value = valueAccessor();
            value(moment(element.value, config.format).toISOString());
        };
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var value = valueAccessor();
        var config = allBindingsAccessor().config;
        var valueUnwrapped = ko.utils.unwrapObservable(value);
        if (valueUnwrapped) {
             element.value = moment(valueUnwrapped).format(config.format);
        }
    }
};

ko.bindingHandlers.datepicker = {
    init: function(element, valueAccessor, allBindingsAccessor) {
        var config = allBindingsAccessor().config;
        element.onblur = function(){
          $(element).datetimepicker("destroy");  
        }
        element.onfocus = function(){
          $(element).datetimepicker(config);
          $(element).datetimepicker('show');
        }
        element.onchange = function(){
            var value = valueAccessor();
            value(moment(element.value, config.format).toISOString());
        };
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var value = valueAccessor();
        var config = allBindingsAccessor().config;
        var valueUnwrapped = ko.utils.unwrapObservable(value);
        if (valueUnwrapped) {
             element.value = moment(valueUnwrapped).format(config.format);
        }
    }
};


ko.bindingHandlers.link_text = {
    update: function(element, valueAccessor, allBindingsAccessor) {
      var value = ko.utils.unwrapObservable(valueAccessor());
      var data = value.data, parent = value.parent.toJS(), fieldName = data.name, v = parent[fieldName];
      if (!v.length) return;
      var result = [], namedResult = [], mode = 'complex'; 
      v.forEach(function(el){
          var pusher = []; var testPusher = {};
          for (var F in el){
              var FV = el[F];
              if (F.toLowerCase()=='id'+fieldName.replace('Link_','') || F=='__v' ||  F=='IsActive'){
                  ;
              } else {
                if (F.substring(0,2)=='Id') {
                    pusher.push(F+':'+list.get(F.substring(2).toLowerCase(),FV));
                    testPusher[F] = list.get(F.substring(2).toLowerCase(),FV);
                } else {
                    pusher.push(F+':'+FV);
                    testPusher[F] = FV;
                }
              }
          }
          namedResult.push(testPusher);
          if (Object.keys(testPusher).length==1){
              mode = 'tags';
          } else if (Object.keys(testPusher).length==2 && testPusher['Value']){
              mode = 'tagsvalues';
          }
      })
      var html = "";
      if (mode =='tags'){
          namedResult.forEach(function(tag){
              var values = _.values(tag);
              html +='<span class="label label-info label-white middle" style="margin-left:2px;margin-bottom:2px;">'+values[0]+'</span>';
          })
      } else if (mode=='tagsvalues'){
          namedResult.forEach(function(tag){
              var value = tag['Value'];
              var values = _.values(_.omit(tag,'Value'));
              html +='<span class="label label-success label-white middle" style="margin-left:2px;margin-bottom:2px;">'+values[0]+':'+value+'</span>';
          })
      } else {
          namedResult.forEach(function(tag){
            var realTag = [];
            for (var i in tag){
                realTag.push(i+':'+tag[i]);
            }
            html +='<span class="label label-warning  label-white middle" style="margin-left:2px;margin-bottom:2px;">'+realTag.join(',')+'</span>';
          })
      }
      $(element).html(html);
    }
};

ko.bindingHandlers.JSON = {
    update: function(element, valueAccessor, allBindingsAccessor) {
    var value = ko.utils.unwrapObservable(valueAccessor());

    if (value){
      if (value.toJS) value = value.toJS();
          $(element).text(JSON.stringify(value));
      } else {
          $(element).text(JSON.stringify(value));
      }
    }, 
};

ko.bindingHandlers.debug = {
    update: function(element, valueAccessor, allBindingsAccessor) {
    var value = ko.utils.unwrapObservable(valueAccessor());
    if (value){
      if (value.toJS) value = value.toJS();
          console.log("DEBUG:",value);
      }   
    }, 
};

ko.bindingHandlers.nestable = {
    update: function(element, valueAccessor, allBindingsAccessor) {
    var value = valueAccessor();
        $(element).nestable({});
        $(element).on('change', function() {
          value($(element).nestable('serialize'));
        })
    }, 
};


ko.bindingHandlers.initEditable = {
    init: function(element, valueAccessor, allBindingsAccessor) {
      var val = allBindingsAccessor().value;
      var width = 150;
      if (allBindingsAccessor().style){
        width = parseInt(allBindingsAccessor().style.width.replace(/[^0-9]/g,''))
      }
      var params = ko.utils.unwrapObservable(valueAccessor());
    if (params.type=='image'){
      $(element).editable({
        type: 'image',
        name:'editable',
        value: null,
        image: {
          btn_choose: 'Изменить картинку',
          droppable: true,
          max_size: 5242880,
          width:width,
          on_error : function(code) {},
          on_success : function() {}
        },
        url: function(params) {
          $(element).get(0).src = "";
          var thumb = "";
          if("FileReader" in window) {
            $(element).next().find('img').css({width:'600px',height:'340px;'})
            thumb = $(element).next().find('img').data('thumb');
          }      
              val(thumb);
          $(element).get(0).src = thumb;
          $(element).show();
          $('.editableform-loading').remove();
         },
      })
    } else if(params.type=='date') {
      var value = valueAccessor().value;
      var config = {
        format:'DD-MM-YYYY HH:mm',
        formatDate:'DD-MM-YYYY',
        formatTime:'HH:mm',
        lang:'ru'
      };
      $(element).editable({type: 'text',value: moment(value()).format(config.format)});
      $(element).on('shown', function(e, editable) {
        var element = editable.input.$input['0'];
        $(element).datetimepicker(config);
        element.onblur = function(){
          $(element).datetimepicker("destroy");  
        }
        element.onfocus = function(){
          $(element).datetimepicker('show');
        }
        element.onchange = function(){
            value(moment(element.value, config.format).toISOString());
        };
      });
    } else {
      $(element).editable(params);
    }
    }
};

ko.bindingHandlers.dygraph = {
  update: function(element, valueAccessor, allBindingsAccessor) {
    var data = ko.utils.unwrapObservable(valueAccessor());
    if (data.value().length) {
      g = new Dygraph(
        element,
        data.value(),
        {
          labels: data.labels
        }
      );
    }
  }
}


var  bytesToSize =  function (bytes, precision) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    var posttxt = 0;
    if (bytes == 0) return 'n/a';
    while( bytes >= 1024 ) {
        posttxt++;
        bytes = bytes / 1024;
    }
    return parseInt(bytes).toFixed(precision) + " " + sizes[posttxt];
}

ko.bindingHandlers.memoryString = {
  update: function(element, valueAccessor, allBindingsAccessor) {
    var value = ko.utils.unwrapObservable(valueAccessor());
    try{
      value = value.replace(/([a-z])/g,function(letter){return letter.toUpperCase()});
      value = bytesToSize(numeral().unformat(value),2);      
    } catch(e){
      console.log("Err Formating Memory",e);
    }
    $(element).text(value);
  }
}


ko.bindingHandlers.summernote = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        var options = valueAccessor();
        var binding = ko.utils.unwrapObservable(allBindingsAccessor()).value;
        var updateObservable = function(e) {
            if (typeof binding  == 'function') binding(e.currentTarget.innerHTML);
        };
        options.lineHeights = ['1.0', '1.2', '1.4', '1.0', '1.6', '1.8', '2.0', '3.0'],
        options.onKeydown = options.onKeyup = options.onFocus = options.onBlur = updateObservable;
        options.onPaste =  function(e) {
            var thisNote = $(this);
            var updatePastedText = function(someNote){
                var original = someNote.code();
                var cleaned = CleanPastedHTML(original); //this is where to call whatever clean function you want. I have mine in a different file, called CleanPastedHTML.
                someNote.code(cleaned).html(cleaned); //this sets the displayed content editor to the cleaned pasted code.
            };
            setTimeout(function () {
                updatePastedText(thisNote);
            }, 10);
        }
        options.lang = 'ru-RU';
        options.toolbar =  [
          ['style', ['bold', 'italic', 'underline', 'clear']],
          ['font', ['strikethrough', 'superscript', 'subscript']],
          ['para', ['ul', 'ol']],
          ['img', ['img']]
        ];
        $(element).summernote(options);
    }
  
};

ko.bindingHandlers.moment = {
    update: function(element, valueAccessor, allBindingsAccessor) {
        var value = valueAccessor();
        var params = ko.unwrap(value);
        var date = ko.unwrap(params.date);
        try{
            if (params.format=='fromNow'){
              $(element).text(moment(date).fromNow());
            } else {
              $(element).text(moment(date).format(params.format));
            }
        } catch(e){
            console.log(e);    
        }
    }, 
}


ko.bindingHandlers.doubleClick= {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var handler = valueAccessor(),
            delay = 200,
            clickTimeout = false;

        $(element).click(function() {
            if(clickTimeout !== false) {
                handler.call(viewModel);
                clickTimeout = false;
            } else {        
                clickTimeout = setTimeout(function() {
                    clickTimeout = false;
                }, delay);
            }
        });
    }
};

ko.bindingHandlers.mask = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (value) {
            $(element).mask(value);
        }
    },
};





