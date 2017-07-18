var ConditionEditor = (new function(){
	
	var self = this;
	self.editor = null;

	self.Formula = ko.observable();
	self.isOk = ko.observable(true);

	self.TestFormula = ko.computed(function(){
		var F = self.Formula()+''; var map = {};
		if (self.Formula() && F.length){
			var vars = F.match(/[A-ZА-ЯЁ0-9]+/g);
			vars.forEach(function(v){
				F = F.replace(v,' true ');
			})
			F = F.replaceAll(" and ", " && ");
			F = F.replaceAll("not ", "!");
			F = F.replaceAll(" not ", " !");
			F = F.replaceAll(" or ", " || ");
			F.replace(/\s+/g,' ');
			try{
				eval("var r ="+F);
				self.isOk(true);
			}catch(e){
				self.isOk(false);
			}
		}

	})

	self.Params = ko.observableArray();

	self.PossibleParams = function(){
		var params = [];
		try{
			var ps = _.map(SettingController.rawData.params,"ParamSets"), pks = [];
			ps.forEach(function(p){
				pks = pks.concat(_.map(_.values(p),"ParamKeys"));
			})
			pks.forEach(function(pk){
				params = params.concat(_.keys(pk));
			})
			params = _.sortBy(_.uniq(params)).reverse();
			if (_.isEmpty(params)) params = ["FACT"];
			self.Params(params);
			var regex = new RegExp("[^\\s]*(?:"+params.join("|")+")+(?=^|$|[^\\p{L}])");
			CodeMirror.defineSimpleMode("assoi-conditions", {
			  start: [
			    {regex: /[^\s]*(?:not|or|and)\b/,token: "logic"},    
			    {regex: regex,token: "validvariable"},   
			    {regex: /[\{\[\(]/, indent: true},
			    {regex: /[\}\]\)]/, dedent: true},
			  ],
			  comment: [
			  ],
			  meta: {
			  }
			});

		}catch(e){
			console.log(e,"PossibleParams FAILED");
		}
		return params;
	}

	self.registerEditor = function(editor){
		self.editor = editor; 
	}

	self.IsActive = ko.observable(false);

	
	self.ParserResult = ko.observable("");


	self.Hint = function(mirror, callback){
		var words = self.Params();
	    var cur = mirror.getCursor();
	    var range = mirror.findWordAt(cur);
	    var fragment = mirror.getRange(range.anchor, range.head);

	    console.log(words,cur,range,fragment);

	    callback({
	        list: _.filter(words,function(w){
	        	return w.indexOf(fragment) ===0;
	        }),
	        from: range.anchor,
	        to: range.head
	    });
	}

	self.removeEditor = function(){
		self.editor = null; 
	}


	return self;
})

ko.bindingHandlers.condition = {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
    	var value = valueAccessor();
		ConditionEditor.PossibleParams();
		var editor = CodeMirror.fromTextArea(element,{
	          lineNumbers: true,
	          matchBrackets: true,
	          lineWrapping:true,
	          extraKeys: {"Ctrl-Space": "autocomplete"},
	          mode: "assoi-conditions",
	          autofocus:true,
	          readOnly: false,
	          autoRefresh:true
	    });
        editor.on("change", function(cm) { 
           value(cm.getValue());
        })
        editor.setValue(value());
		editor.refresh();
		editor.execCommand('goDocEnd');
        ConditionEditor.registerEditor(editor);
        element.editor = editor;
        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
        	if (element.editor){
        		var wrapperElement = $(element.editor.getWrapperElement()); 
            	wrapperElement.remove();
        	}
        	ConditionEditor.removeEditor();
        });
    },  
    update: function (element, valueAccessor) {
        var value = valueAccessor();
        var valueUnwrapped = ko.utils.unwrapObservable(value);
        if (element.editor){
			var cur = element.editor.getCursor();
        	element.editor.setValue(valueUnwrapped);
            element.editor.setCursor(cur);        	
			element.editor.refresh();
		}
    }    
};









// Formula Editor

var FormulaEditor = (new function(){
	
	var self = this;
	self.editor = null;

	self.IsSpiltted = ko.observable(false,{  persist: 'debugIsSplitted' });

	self.SplitView = function(){
		self.IsSpiltted(!self.IsSpiltted());
	}


	self.KeyWords = [];

	parser.lexer.rules.forEach(function(r){
	  if ((r+'').match(/EDITOR_/)){
	    var StrA = _.filter((r+'').replace(/[^a-zA-Z_\.|]/g,'').split("|"),function(A){
	      return (A.indexOf("EDITOR"))==-1;
	    })
	    self.KeyWords = self.KeyWords.concat(StrA);
	  }
	})

	self.Hint = function(mirror, callback){
	    var cur = mirror.getCursor();
    	var range = mirror.findWordAt(cur);
    	var fragment = mirror.getRange(range.anchor, range.head);
	    var textLine = mirror.getLine(cur.line);
	    var lastWord = textLine.substring(0,cur.ch).split(/[\s\{\(\/\*\+\-\,]/).pop();
	    var from = textLine.substring(0,cur.ch).length-lastWord.length;
	    var chars = {"$":'row',"@":'col',".P":'period',"#":'obj'};
	    var choosed = null, choosedChar = null, choosedPos = -1;

	    for (var mark in chars){
	    	var test = lastWord.indexOf(mark);
	    	if (test>choosedPos){
	    		choosedChar = mark;
	    		choosed =  chars[mark];
	    	}
	    }
	    if (choosed){
			var from = range.anchor;
	    	if (choosed=='period'){
	    		fragment = (fragment+'').substring(1);
	    		from.ch++;
	    	}
	    	Catalogue.SearchModel(choosed,fragment,function(r){
	    		 callback({
       				 list: _.map(r,function(I){
       				 	return {text:I.id,displayText:[I.id,I.name].join(". ")};
       				 }),
       				 from:from,
        			 to: range.head,
        			 completeSingle:false
    			 });
	    	})
	    } else {
    		 callback({
		        list: _.filter(self.KeyWords,function(w){
		        	return w.indexOf(fragment) ===0;
		        }),
		        from: range.anchor,
		        to: range.head
			 });
	    }
	}


	self.IsPopupShowned = ko.observable(false);

	self.isOk = ko.observable(true);
	self.ParserResult = ko.observable("");

	self.IsActive = ko.observable(false);

	self.Formula = ko.observable('');

	self.IsLoading = ko.observable(false);
	self.Error     = ko.observable(null);

	self.CurrentCell = ko.observable(null);
	self.History = ko.observableArray([]);

	self.EditField = ko.observable(null);

	self.ColFormula = ko.observable();
	self.RowFormula = ko.observable();

	self.GlobalContext = {
		CodePeriod: null,
		Year : null,
		CodeObj : null,
		CodeValuta : null,
		CodeDoc : null
	}

	self.CurrentCell.subscribe(function(CellName){
		if (CellName){
			self.SetCell(CellName);
		}
	})

	self.Navigate = function(CellName){
		var CellName = self.AfterSimplify[CellName] || CellName;
		self.CurrentCell(CellName);
		self.History.push(CellName);
		self.Do();
	}

	self.NavigateBack = function(){
		self.History.pop()
		var LastCell = _.last(self.History());
		self.CurrentCell(LastCell);
		self.Do();
	}

	self.IsLoading = ko.observable(false);

	self.Update = function(modelName,Value){
		self.EditField(null);
		var Translate = {year:'Year',period:'CodePeriod',valuta:"CodeValuta",obj:'CodeObj'};
		var Value = Value.split(".").shift().trim();
		self.CellContext[Translate[modelName]](Value);
		if (modelName=="valuta"){
			self.GlobalContext.CodeValuta = Value;
			self.Do();
		} else {
			var C = ko.toJS(self.CellContext);
			var NewCellName = "$"+C.CodeRow+"@"+C.CodeCol+".P"+C.CodePeriod+".Y"+C.Year+"#"+C.CodeObj+"?";
			self.Navigate(NewCellName);
		}
	}

	self.Info = ko.observable(null);
	self.InfoStack = ko.observableArray([]);

	self.SetTempInfo = function(data){
		var Last = _.last(self.InfoStack());
		if (Last!=data.Text()){
			self.InfoStack.push(data.Text());
			var FullName = self.AfterSimplify[data.Text()];
			self.Info(self.LoadedInfo[FullName]);
		}
	}

	self.RemoveTempInfo = function(data){
		var Last = _.last(self.InfoStack());
		if (Last==data.Text() && !data.IsSelected()){
			if (self.InfoStack().length>1){
				self.InfoStack.pop();
			}
			Last = _.last(self.InfoStack());
			var FullName = self.AfterSimplify[Last] || Last;
			self.Info(self.LoadedInfo[FullName]);
		}
	}

	self.LoadedInfo = {};
	self.AfterSimplify = {};

	self.GetNodeText = function(data,parents){
		if (self.IsSpiltted()){
			if (parents.indexOf("Text")>=0){
				return data["Text"]();	
			} else {
				return data["Value"]();	
			}
		} else {
			return (data['Text']()+' <span class="sup">'+data['Value']()+'</span>');
		}
	}
	
	self.IsAnotherDoc = function(data){
		var CellName = self.AfterSimplify[data.Text()];
		if (!self.LoadedInfo[CellName]) return false;
		var Doc = self.LoadedInfo[CellName].Doc;
		return (Doc!=CxCtrl.CodeDoc());
	}

	self.SetHovered = function(data){
		data.IsHovered(true);
		self.SetTempInfo (data);
	}

	self.SetUnHovered = function(data){
		data.IsHovered(false);
		self.RemoveTempInfo(data);
	}

	self.LoadData = function(CellName,done){
		$.ajax({
			url:'/api/cell/explain',
			method:'post',
			data:{
				Context:self.GlobalContext,
				Cell:CellName
			},
			success:function(data){
				return done (data);
			},
			error:function(err){
				console.log(err);
			}
		})
	}

	self.Nodes = {};
	self.Tree  = {};
	self.koTree = ko.observable();

	self._recursiveBuild = function(CellName){
		if (!self.Nodes[CellName]) return null;
		var Node = self.Nodes[CellName];
		var Parts = (Node.Formula+'').split(/([$@].*?\?)/);
		var Result = {
			Type:"Node",
			Text:CellName,
			Translate:CellName,
			Formula:Node.Formula,
			Value:numeral(Node.Value).format(),
			IsToggled:true,
			IsHovered:false,
			IsSelected:false,
			Children:[]
		}
		if (!Parts.length || Node.Formula == 'PRM') return Result;
		Parts.forEach(function(P){
			if (self.Nodes[P]){
				Result.Children.push(self._recursiveBuild(P));
			} else {
				Result.Children.push({
					Type:"Text",
					Text:P,
					Translate:P,
					Value:P,
					Formula:P,
					IsToggled:false,
					IsHovered:false,
					IsSelected:false,
					Children:[]
				});
			}
		})
		return Result;
	}

	self._clearContextVars = function(StringV){
		var C = ko.toJS(self.CellContext);
		var Start = StringV;
		StringV = (StringV+'')
                    .replaceAll('$'+C.CodeRow+'@','@')
                    .replaceAll('@'+C.CodeCol+'.P','.P')                                
                    .replaceAll('.P'+C.CodePeriod+'.Y','.Y')
                    .replaceAll('.Y'+C.Year+'#','#')
                    .replaceAll('#'+C.CodeObj+'?','?');
		self.AfterSimplify[StringV] = Start;
		return StringV;
	}

	self.afterLoad = function(AskCellName,Json){
		self.koTree(null);
		self.Tree = null;
		self.Nodes = {};
		var Reparsed = {};
		for (var CellName in Json.Cells){
			var Key = self._clearContextVars(CellName);
			if (Key=='?') Key = '$'+self.CellContext.CodeRow()+'?';
			var Formula = Json.Cells[CellName].FRM!=void(0) ? Json.Cells[CellName].FRM:Json.Cells[CellName].Type;
			if (Formula!='PRM'){
				 Formula = self._clearContextVars(Formula);
			}
			self.Nodes[Key] = {CellName:CellName,SCellName:Key,Formula:Formula,Value:Json.Values[CellName],IsToggled:false};
		}
		self.Tree  = self._recursiveBuild(_.first(_.keys(self.Nodes)));
		self.koTree(ko.mapping.fromJS(self.Tree));
		self.LoadedInfo = Json.CellsInfo;
		var MainInfo = self.LoadedInfo[AskCellName];
		self.Info(MainInfo);
		self.InfoStack.push(AskCellName);
		if (self.Info()){
			self.ColFormula(self.Info().ColFormula);
			self.RowFormula(self.Info().RowFormula);
			self.Formula(self.Info().FormulaParsed);
		}
	}

	self.Do = function(done){
		var AskCellName = self.UpdateCurrentCell();
		self.CurrentCell(AskCellName);
		console.log(AskCellName);
		self.IsLoading(true);
		self.LoadData(AskCellName,function(Json){
			self.afterLoad(AskCellName,Json);
			self.IsLoading(false);
			return done && done();
		})
	}

	self.nodeClick = function(data,event){
		if (event.shiftKey && event.ctrlKey){
			if (data.Formula()=='PRM') return;
			self.Navigate(data.Text());
		} else if (event.shiftKey){
			data.IsSelected(!data.IsSelected());
			if (data.IsSelected()) self.SetTempInfo(data);
			else self.RemoveTempInfo(data);
		} else if(event.ctrlKey){
			var CellName = self.AfterSimplify[data.Text()];
			window.localStorage.setItem("SelectOnOpenCell",CellName);
			var DocumentUrl = window.location.origin+'/docview/'+self.LoadedInfo[CellName].Doc+'/input';
			var win = window.open(DocumentUrl, '_blank');
  			win.focus();
		} else {
			data.IsToggled(!data.IsToggled());
			data.IsHovered(!data.IsHovered());
		}
	}

	self.Events = new EventEmitter();



	self.CellContext = {
		CodeRow:ko.observable(null),
		CodeCol:ko.observable(null),
		CodePeriod:ko.observable(null),
		Year:ko.observable(moment().format("YYYY")),
		CodeObj:ko.observable(null),
		CodeDoc:ko.observable(null),
		CodeValuta:ko.observable(null)
	}	




	self.PrintFormula = function(){
		var CM = $('.CodeMirror.cm-s-default.CodeMirror-wrap')[0];
		//domtoimage.toPng(CM).then(function(img){
	        var mywindow = window.open('', 'Отладка', 'fullscreen=true');
	        mywindow.document.write('<html><head><title>Отладка формулы</title>');
	        var Styles = ['/css/opensans.css','/css/bootstrap.min.css','/css/font-awesome.min.css','/css/ace.min.css','/css/ace-skins.min.css','/editor/editor.css','/plugins/debugformula/index.css','/index.css','/plugins/debugformula/print.css'];
	        Styles.forEach(function(S){
				mywindow.document.write('<link rel="stylesheet" href="'+S+'" type="text/css" />');
	        })
	        mywindow.document.write('</head><body >');
	        var html = $("#debugFormula").html();
	        //$(html).find(CM).html("<img src="+img+"></img>");
	        $(html).find('.context_fields').remove();
	        mywindow.document.write($(html).html());
	        mywindow.document.write('</body></html>');
	        mywindow.document.close(); 
	        mywindow.focus(); 
	        setTimeout(function(){
	        	mywindow.print();	
	        	//mywindow.close();
	        },1000);
        //})
	}

	self.SetCell = function(CellName){
		var C = CxCtrl.Context();
		if (C.ChildObj) C.CodeObj = C.ChildObj;
		self.GlobalContext = _.pick(C,["CodeDoc","CodeValuta","CodeObj","CodePeriod","Year"]);
		self.CurrentCell(CellName);
		var Set = _.clone(self.GlobalContext);
		if (CellName){
			var p = CellName.match(/\$(.*?)\@(.*?)\.P(.*?)\.Y(.*?)\#(.*?)\?/).splice(1);
			var CellSet = { CodeRow:p[0],CodeCol:p[1],CodePeriod:p[2],Year:p[3],CodeObj:p[4]};
			Set = _.merge(Set,CellSet);
		}
		for (var Field in Set){
			self.CellContext[Field](Set[Field]);
		}
	}

	self.UpdateCurrentCell = function(){
		var Result = [];
		for (var Mark in self.RegFields){
			var F = self.RegFields[Mark]
			Result.push(Mark+self.CellContext[F]());
		}
		return Result.join("")+"?";
	}

	self.RegFields =  {"$":"CodeRow","@":"CodeCol",".P":"CodePeriod",".Y":"Year","#":"CodeObj"};

	self.SetIncompleteCell = function(cellProperties){
		self.GlobalContext = _.pick(CxCtrl.Context(),["CodeDoc","CodeValuta","CodeObj","CodePeriod","Year"]);
		var Set = _.merge(_.clone(self.GlobalContext),_.pick(cellProperties,['CodeRow','CodeCol']));
		if (!Set['CodeCol']) Set['CodeCol'] = "Pd";
		if (!Set['CodeRow']) Set['CodeRow'] = "m200100";
		for (var Field in Set){
			self.CellContext[Field](Set[Field]);
		}
		var H = []; 
		for (var Mark in self.RegFields){
			var F = self.RegFields[Mark];
			H.push(Mark+self.CellContext[F]());
		}
		self.CurrentCell(H.join("")+'?');
	}

	self.CalculateFormula = function(){
		self.IsLoading(true); self.Error(null);
		$.ajax({
			url:'/api/cell/calculatebyformula',
			method:'post',
			data:{
				Context:self.GlobalContext,
				Cell:self.UpdateCurrentCell(),
				Formula:self.Formula()
			},
			success:function(Json){
				if (Json.err) return self.Error(Json.err);
				self.IsLoading(false);
				self.Events.emit("formulaloaded");
				self.afterLoad(self.CurrentCell(),Json);
			}
		})
	}	


	self.ContextModels = {
		CodeRow:"row",
		CodeCol:'col',
		CodePeriod:'period',
		Year:'year',
		CodeObj:'obj',
		CodeDoc:'doc',
		CodeValuta:'valuta'
	}

	self.ReparseError = function(msg){
		var Arr = msg.split(/\n/);
		Arr = _.filter(Arr,function(Str){
			return Str.indexOf("Parse error")==-1 && Str.indexOf("Expecting")==-1 && Str.indexOf("Lexical")==-1;
		})
		var Result = Arr.join('\n');
		return Result;
	}


	self.CheckExisted = function(done){
		var Formula = self.Formula()+"";
		if (Formula.indexOf("$")===-1) return done();
		$.ajax({
			url:'/api/cell/validateformula',
			method:'post',
			data:{
				Formula:Formula,
			},
			success:function(data){
				var ToPrint = [];
				if (data.errMsg) {
					for (var K in data.errMsg){
						ToPrint.push(Tr(K)+": "+data.errMsg[K].join(", "));
					}
					return done (Tr("notexisted")+" "+ToPrint);
				} else {
					return done();	
				}				
			}
		})
	}

	self.editorTest =  ko.computed(function() {
		var Formula = (self.Formula()+'').trim();
		if (Formula.length){
			try{
				var R = parser.parse(Formula);
				self.ParserResult(R);
				self.CheckExisted(function(errMsg){
					if (errMsg){
						self.ParserResult(errMsg);
						self.isOk(false);
					} else {
						self.isOk(true);	
					}					
				})
			} catch(e){
				self.isOk(false);
				var errMsg = self.ReparseError(e.message);
				self.ParserResult(errMsg);
			}
		} else {
			self.ParserResult('');
			self.isOk(true);
		}
	}).extend({ throttle: 1000 });    

	self.BadKeys = [37,38,39,40,//arrows
                    46,//delete
                    8];//backspace
    
    self.registerEditor = function(editor){
		self.editor = editor; 
        self.editor.on('keyup', function(ed, ev){
            if(!self.BadKeys.some(function(k){return ev.keyCode === k;})){
                CodeMirror.commands.autocomplete(self.editor);
            }
        });
	}

	self.removeEditor = function(){
		self.editor = null; 
	}
	
	return self;


})

ko.bindingHandlers.formula = {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
    	var value = valueAccessor();
		var editor = CodeMirror.fromTextArea(element,{
	          lineNumbers: true,
	          matchBrackets: true,
	          lineWrapping:true,
	          extraKeys: {"Ctrl-Space": "autocomplete"},
	          mode: "assoi",
	          autofocus:true,
	          readOnly: false,
	          autoRefresh:true
	    });
        editor.on("change", function(cm) { 
           value(cm.getValue());
        })
        editor.setValue(value());
		editor.refresh();
		editor.execCommand('goDocEnd');
        FormulaEditor.registerEditor(editor);
        element.editor = editor;
        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
        	if (element.editor){
        		var wrapperElement = $(element.editor.getWrapperElement()); 
            	wrapperElement.remove();
        	}
        	FormulaEditor.removeEditor();
        });
    },  
    update: function (element, valueAccessor) {
        var value = valueAccessor();
        var valueUnwrapped = ko.utils.unwrapObservable(value);
        if (element.editor){
			var cur = element.editor.getCursor();
        	element.editor.setValue(valueUnwrapped);
            element.editor.setCursor(cur);        	
			element.editor.refresh();
		}
    }    
};


// Documentation Editor
var MdeEditor = (new function(){

	var self = this;
	self.controls = ko.observableArray();
	self.editor = null;
	self.enabledToolbar = ["bold","italic","link","heading","quote","unordered-list","ordered-list","preview"];

	self.insertImage = function(path){
	    var cm = MdeEditor.editor.codemirror;
	    var output = '';
	    var selectedText = cm.getSelection();
	    var text = selectedText || 'placeholder';
	    var httpPath = document.location.protocol+'//'+document.location.host;
	    var Link = '![]('+httpPath+path+')';
	    cm.replaceSelection(Link);
	}

	self.insertTable = function(){
		var cm = MdeEditor.editor.codemirror;
	    var output = '';
	    var selectedText = cm.getSelection();
	    var text = selectedText || 'placeholder';
	    var Table = '\n\n| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Text     | Text      | Text     |\n\n';
	    cm.replaceSelection(Table);
	}


	self.registerEditor = function(editor){
		self.editor = editor; 
		var controls = [];
		self.editor.toolbar.forEach(function(A){
			if (A!='|' && A.name && self.enabledToolbar.indexOf(A.name)!=-1){
				controls.push(A);
			}
		})
		self.controls(controls);
		self.editor.codemirror.refresh();
	}

	self.removeEditor = function(){
		self.editor = null; 
		self.controls ([]);
	}
	
	return self;
})

ko.bindingHandlers.simplemde = {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
         var value = valueAccessor();
         var valueUnwrapped = ko.utils.unwrapObservable(value);
         element.editor = new SimpleMDE({
              autofocus: true,           
              element: element,            
              forceSync:true,
              hideIcons:['guide','fullscreen','side-by-side'],
              spellChecker: false, 
              autoDownloadFontAwesome:false,
              initialValue: value()     
        });		
		element.editor.codemirror.on('change', function(cm) {
            var value = valueAccessor();
            value(cm.getValue());
            cm.refresh();
        });
        element.editor.codemirror.setValue(value());
        element.editor.codemirror.refresh();
        element.editor.codemirror.execCommand('goDocEnd');
        MdeEditor.registerEditor(element.editor);
        var wrapperElement = $(element.editor.codemirror.getWrapperElement()); 
        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            MdeEditor.removeEditor();
            wrapperElement.remove();
        });
    },  
    update: function (element, valueAccessor) {
        var value = valueAccessor();
        var valueUnwrapped = ko.utils.unwrapObservable(value);
        if (element.editor){
			var cur = element.editor.codemirror.getCursor();
        	element.editor.codemirror.setValue(valueUnwrapped);
            element.editor.codemirror.setCursor(cur);        	
			element.editor.codemirror.refresh();
		}
    }    
};

CodeMirror.defineSimpleMode("assoi", {
  start: [
    {regex: /\s+(?:not|or|and)\b/,token: "logic"},    
    {regex: /\b(?:>|<|<>|<=|>=|!=)\b/,token: "logic"},    
    {regex: /\".*?\"/, token: "string"},
    {regex: /\'.*?\'/, token: "string"},
    {regex: /[0-9]+("."[0-9]+)?\b/, token: "number"},
    {regex: /[$@].*?\?/, token: "variable"},    
    {regex: new RegExp("\(\?\:"+FormulaEditor.KeyWords.join("|").replace(/\./g,'\.')+"\)\\b"),token: "keyword"},
    {regex: /[\{\[\(]/, indent: true},
    {regex: /[\}\]\)]/, dedent: true},
  ],
  comment: [
  ],
  meta: {
  }
});
CodeMirror.registerHelper("hint", "assoi", FormulaEditor.Hint);
CodeMirror.hint.assoi.async = true;


CodeMirror.defineSimpleMode("assoi-conditions", {
  start: [
    {regex: /(?:not|or|and)\b/,token: "logic"},    
    {regex: /[\{\[\(]/, indent: true},
    {regex: /[\}\]\)]/, dedent: true},
  ],
  comment: [
  ],
  meta: {
  }
});
CodeMirror.registerHelper("hint", "assoi-conditions", ConditionEditor.Hint);
CodeMirror.hint['assoi-conditions'].async = true;



