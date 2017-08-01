(function(){
window.HandsonTableRenders = {

    RenderController:function(){
        var self = this;
        self.Renders = {};
        self.RegisterRender = function(Name,Mask,Render){
            if(!self.Renders[Name]) {
                self.Renders[Name] = {Mask:Mask,Render:Render};
            }
        }
        self.UniversalRender = function(row, col, prop){
            var cellProperties = {};
            cellProperties.renderer = self.ApplyRenders;
            return cellProperties;
        }
        self.ApplyRenders = function(instance, td, row, col, prop, value, cellProperties){
            var TestString = [row,col].join(','), _this = this;
            for (var Name in self.Renders){
                var Info = self.Renders[Name];
                var DoApply = false;
                Info.Mask.forEach(function(M){
                    DoApply = DoApply || M.test(TestString);
                })
                if (DoApply){
                    Info.Render.apply(_this, arguments);
                }
            }
        }
        return self;
    },

    CellRender:function(instance, td, row, col, prop, value, CellInfo){
        CellInfo.type = 'numeric';
        CellInfo.allowInvalid = false;
        Handsontable.renderers.NumericRenderer.apply(this, arguments);
        CellInfo.readOnly = true;
        var TestArr = (CxCtrl.PageName()=='report') ? MStyles.IsReport():MStyles.IsForm();
        if (!_.isEmpty(CellInfo.Style)) {
            var Add = _.intersection(CellInfo.Style,TestArr);
            if (!_.isEmpty(Add)){
                //console.log(">>>",CellInfo.Style,TestArr,Add);
                $(td).addClass(Add.join(" "));    
            }            
        }
        if (CellInfo.Cell){
            $(td).addClass("IsCell");
            var PropToMap = ["IsControlPoint","IsEditablePrimary","IsPrimary","IsSum","IsLocked","IsChangedBySave","IsChanged","IsChangedBySave"];
            PropToMap.forEach(function(Prop){
                if (CellInfo[Prop]) {
                    $(td).addClass(Prop);   
                }
            })
        }
        if (CellInfo.IsEditablePrimary && !CellInfo.IsLocked){
            CellInfo.readOnly = false;
        }
        if (CellInfo.IsPrimary && CellInfo.Comment){
            CellInfo.comment = {value:CellInfo.Comment};
        }
        // Формульные выражения
        if ((value+'').trim().indexOf('=')===0){
            try{
                eval("var Calc"+value);
                value = Calc;
            } catch(e){
                td.innerHTML ="Ошибка";
            }
        }
        // Показ полных значений без округлений
        if ((value+'')!=0 && (value+'')!='NaN'){
            var Formated = numeral(value).format(CellInfo.Formatter);
            if (Formated!=0 && Formated!='NaN'){
                td.innerHTML = Formated;
                if (Number(Formated.replace(/\s/g,''))!=Number(value)){
                    if (!BlankDocument.ModeRound()){
                        td = HandsonTableRenders.ToolTip(td,value);
                    } else {
                         $(td).tooltip('destroy');
                    }
                }
            }
        } else {
            if (!CellInfo.IsRealNull){
                td.innerHTML = CellInfo.Value!=void(0) && CellInfo.Value!=0? CellInfo.Value:'';
            } else {
                td.innerHTML = CellInfo.Value!=void(0)? CellInfo.Value:'';
            }
        }        
    },    

    ToolTip:function(td,realValue){
        $(td).tooltip({
            trigger: 'hover active',
            title: numeral(realValue).format('#.#####'),
            placement: 'auto',
            container: 'body',
            template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
        });
        $(td).addClass('htCommentCell');
        return td;
    },

    ReadOnlyText:function(instance, td, row, col, prop, value, cellProperties){
        Handsontable.renderers.TextRenderer.apply(this, arguments);
        cellProperties.readOnly = true;
    },

    TreeRender:function(instance, td, row, col, prop, value, cellProperties){
        Handsontable.renderers.HtmlRenderer.apply(this, arguments);
        var T = instance.getSettings().tree.data;
        if (T){
            row  =  Handsontable.hooks.run(instance, 'modifyRow', row);
            var Info = instance.getSettings().tree.data[row];
            if (!Info) return;
            var I = instance.getSettings().tree.icon(row);
            if (value)
            $(td).prepend(I);
            td.className = 'simplecell treeCell';
            switch (Info.level) {
                case 1 : $(td).toggleClass('topLevel'); break;
                case 2 : $(td).toggleClass('subLevel'); break;
                default:
                    $(td).css("padding-left", (Info.level-1)*20 + 'px');
                break;
            }
        }
        cellProperties.readOnly = true;
    }

   
}


Handsontable.NumericCell.validator = function(value, callback) {
  if (value === null) {
    value = '';
  }
  if ((value+'').trim().indexOf("=")===0){
    value = value.replace(/[\=\s\-\+\*\/\(\)]/g,'')
  }
  var result = /^-?\d*(\.|\,)?\d*$/.test((value));
  callback(result);  
};

window.numeral.languageData().delimiters.thousands = ' ';

Handsontable.editors.NumericEditor.prototype.getValue = function(e){
    return (this.TEXTAREA.value+'').replace(",",".");
}


window.EditorRegistrator = new function(){
    var self = this; 
    
    self.Table = ko.observable();
    
    self.EditRow = ko.observable();
    self.EditField = ko.observable();
    self.IsActive  = ko.observable(false);
    self.CurrentEditor = ko.observable();


    self.Apply = function(){
        self.save();
        $(self.popupId).modal("hide");
    }


    self.Cancel = function(){
        $(self.popupId).modal("hide");
    }   



    self.Register = function(){
        
        var PopupEditor = Handsontable.editors.BaseEditor.prototype.extend();

        PopupEditor.prototype = _.merge(PopupEditor.prototype,{
            init:function(){
                self = this;
                $(self.popupId).on('hidden.bs.modal', function(){
                    if (self.hide) self.hide();
                    self.close();
                });
            },
            prepare:function() {
                Handsontable.editors.BaseEditor.prototype.prepare.apply(this, arguments);
            },
            open:function() {        
                $(this.popupId).modal('show');
            },
            close:function() {},
            focus:function() {},
            getValue:function() {},
            setValue:function() {},
            saveValue:function() {}
        })    

        Handsontable.editors.registerEditor('popup', PopupEditor);

        var SelectEditor = Handsontable.editors.PopupEditor.prototype.extend();
        SelectEditor.prototype = _.merge(SelectEditor.prototype,{
            popupId:"#select_table_modal",
            hide:function(){
                ModelChooser.ModelName(null);
                ModelChooser.SearchStr("");
                ModelChooser.SearchResults([]);
                ModelChooser.Choosed(null);
            },
            open:function(){
                EditorRegistrator.CurrentEditor('select_table');
                var ModelName = this.cellProperties.Model;
                var Property = this.prop;
                var Obj = {}; Obj[Property] = this.originalValue;
                var Model = ModelEdit.Model(ModelName, Obj);
                
                EditorRegistrator.Table(ModelName);
                EditorRegistrator.EditRow(Model);
                EditorRegistrator.EditField(Property);



                var ColInd = this.cellProperties.col;
                var Settings = this.cellProperties.instance.getSettings();
                var ColInfo = Settings.columns[ColInd];
                ModelChooser.ModelName(ColInfo.model);
                var Current = EditorRegistrator.EditRow()[EditorRegistrator.EditField()]();
                if (Current && (Current+'').length){
                    ModelChooser.SearchStr(Current);
                }


                Handsontable.editors.PopupEditor.prototype.open.apply(this, arguments);
            },
            save:function(){

                var CodeF = ModelChooser.ModelInfo().Code;
                var NewV  = ModelChooser.Choosed()[CodeF]();
                var Row   = EditorRegistrator.EditRow();
                var Prop  = EditorRegistrator.EditField();
                Row[Prop](NewV);
                this.instance.setDataAtCell(this.row, this.col, NewV);
                return;
            }
        })
        Handsontable.editors.registerEditor('select_table', SelectEditor);


        var LinkEditor = Handsontable.editors.PopupEditor.prototype.extend();
        LinkEditor.prototype = _.merge(LinkEditor.prototype,{
            popupId:"#link_editor_modal",
            prevLength:-1,
            open:function(){
                EditorRegistrator.CurrentEditor('link');
                var ModelName = this.cellProperties.Model;
                var Property = this.prop;
                var Obj = {}; Obj[Property] = this.originalValue;
                var Model = ModelEdit.Model(ModelName, Obj);
                EditorRegistrator.Table(ModelName);
                EditorRegistrator.EditRow(Model);
                EditorRegistrator.EditField(Property);
                self.prevLength = Obj[Property].length;
                Handsontable.editors.PopupEditor.prototype.open.apply(this, arguments);
            },
            save:function(){
                var Obj = EditorRegistrator.EditRow().toJS();
                if(Obj[this.prop].some(function(o){return o.IsEdit}) || Obj[this.prop].length != self.prevLength){
                    Obj[this.prop].forEach(function(v,i,a){a[i].IsEdit = false;})
                    this.instance.setDataAtCell(this.row, this.col, Obj[this.prop]);
                }
            }
        })
        Handsontable.editors.registerEditor('link', LinkEditor);

        var FormulaHandson = Handsontable.editors.PopupEditor.prototype.extend();
        FormulaHandson.prototype = _.merge(FormulaHandson.prototype,{
            popupId:"#formula_editor_modal",
            prevFormula: "",
            open:function(){
                EditorRegistrator.CurrentEditor('formula');
                var In = this.originalValue;
                if (!In) In = "";
                self.prevFormula = In;
                var Property = this.prop;
                EditorRegistrator.EditField(Property);
                FormulaEditor.Formula(In);
                Handsontable.editors.PopupEditor.prototype.open.apply(this, arguments);
                FormulaEditor.SetIncompleteCell(this.cellProperties);
                FormulaEditor.koTree(null);
                this.instance.deselectCell();
                setTimeout(function(){
                    EditorRegistrator.IsActive(true);
                    FormulaEditor.editor && FormulaEditor.editor.refresh();
                    FormulaEditor.editor.focus();
                },500);
            },
            save:function(){
                if(self.prevFormula != FormulaEditor.Formula()){
                    this.instance.setDataAtCell(this.row, this.col, FormulaEditor.Formula());
                }
                if(!this._opened){
                    EditorRegistrator.IsActive(false);
                }                
            }
        })
        Handsontable.editors.registerEditor('formula', FormulaHandson);        

        var ConditionHandson = Handsontable.editors.PopupEditor.prototype.extend();
        ConditionHandson.prototype = _.merge(ConditionHandson.prototype,{
            popupId:"#condition_editor_modal",
            prevFormula: "",
            open:function(){
                EditorRegistrator.CurrentEditor('condition');
                var In = this.originalValue;
                if (!In) In = "";
                self.prevFormula = In;
                var Property = this.prop;
                EditorRegistrator.EditField(Property);
                ConditionEditor.Formula(In);
                Handsontable.editors.PopupEditor.prototype.open.apply(this, arguments);
                setTimeout(function(){
                    EditorRegistrator.IsActive(true);
                    ConditionEditor.editor && ConditionEditor.editor.refresh();
                },500);
            },
            save:function(){
                if(self.prevFormula != ConditionEditor.Formula()){
                    this.instance.setDataAtCell(this.row, this.col, ConditionEditor.Formula());
                }
                if(!this._opened){
                    EditorRegistrator.IsActive(false);
                }                
            }
        })
        Handsontable.editors.registerEditor('condition', ConditionHandson);
    }
    return self;
}



window.EditorRegistrator.Register();

window.HandsonTableHelper = {

    HeaderGenerator : function(table){
        var self = this;
        self.settings = [];
        self.columnHeaderLevelCount = 0;
        self.colspanArray = [];
        self.table = table;
        self.settings = self.table.getSettings().headers;
        if (!self.settings || !self.settings.length) return;
        self.table.addHook('afterGetColumnHeaderRenderers', function(array) {
            self.onAfterGetColumnHeaderRenderers(array)
        });
        self.table.addHook('afterOnCellMouseDown', function(event, coords, TD) {
            self.onAfterOnCellMouseDown(event, coords, TD)
        });
        self.table.addHook('beforeOnCellMouseOver', function(event, coords, TD, blockCalculations) {
          self.onBeforeOnCellMouseOver(event, coords, TD, blockCalculations)
        });
        self.table.addHook('afterViewportColumnCalculatorOverride', function(calc) {
            self.onAfterViewportColumnCalculatorOverride(calc)
        });
        self.fillColspanArrayWithDummies = function(colspan, level) {
            Handsontable.helper.rangeEach(0, colspan - 2, function(i) {
                self.colspanArray[level].push({
                    label: '',
                    colspan: 1,
                    hidden: true,
                });
            });
        }
        self.headerRendererFactory = function(headerRow) {
            return function(index, TH) {
              TH.removeAttribute('colspan');
              Handsontable.Dom.removeClass(TH, 'hiddenHeader');
              Handsontable.Dom.addClass(TH,'headerCell');
              if (self.colspanArray[headerRow][index] && self.colspanArray[headerRow][index].colspan) {
                var colspan = self.colspanArray[headerRow][index].colspan;
                var fixedColumnsLeft = self.table.getSettings().fixedColumnsLeft || 0;
                var topLeftCornerOverlay = self.table.view.wt.wtOverlays.topLeftCornerOverlay;
                var leftOverlay = self.table.view.wt.wtOverlays.leftOverlay;
                var isInTopLeftCornerOverlay = topLeftCornerOverlay ? topLeftCornerOverlay.clone.wtTable.THEAD.contains(TH) : false;
                var isInLeftOverlay = leftOverlay ? leftOverlay.clone.wtTable.THEAD.contains(TH) : false;
                if (colspan > 1) {
                  var cs = isInTopLeftCornerOverlay || isInLeftOverlay ? Math.min(colspan, fixedColumnsLeft - index) : colspan;
                  TH.setAttribute('colspan', cs);
                }
                if (isInTopLeftCornerOverlay || isInLeftOverlay && index === fixedColumnsLeft - 1) {
                  Handsontable.Dom.addClass(TH, 'overlayEdge');
                }
              }
              if (self.colspanArray[headerRow][index] && self.colspanArray[headerRow][index].hidden) {
                  Handsontable.Dom.addClass(TH, 'hiddenHeader');
              }
              Handsontable.Dom.empty(TH);
              var divEl = document.createElement('DIV');
              Handsontable.Dom.addClass(divEl, 'relative');
              var spanEl = document.createElement('SPAN');
              Handsontable.Dom.addClass(spanEl, 'colHeader');
              Handsontable.Dom.fastInnerHTML(spanEl, self.colspanArray[headerRow][index] ? self.colspanArray[headerRow][index].label || '' : '');
              divEl.appendChild(spanEl);
              TH.appendChild(divEl);
              self.table.runHooks('afterGetColHeader', index, TH);
            };
        }
        self.getColspan = function(row, column) {
            return self.colspanArray[self.rowCoordsToLevel(row)][column].colspan;
        }
        self.levelToRowCoords = function(level) {
            return level - self.columnHeaderLevelCount;
        }
        self.rowCoordsToLevel = function(row) {
            return row + self.columnHeaderLevelCount;
        }
        self.getNestedParent = function(level, column) {
            var colspan = self.colspanArray[level][column] ? self.colspanArray[level][column].colspan : 1;
            var hidden = self.colspanArray[level][column] ? self.colspanArray[level][column].hidden : false;
            if (colspan > 1 || (colspan === 1 && hidden === false)) {
              return column;
            } else {
              var parentCol = column - 1;
              do {
                if (self.colspanArray[level][parentCol].colspan > 1) {
                  break;
                }
                parentCol--;
              } while (column >= 0);
              return parentCol;
            }
        }
        self.fillTheRemainingColspans = function() {
            Handsontable.helper.objectEach(self.settings, function(levelValue, level) {
              Handsontable.helper.rangeEach(self.colspanArray[level].length - 1, self.table.countCols() - 1, function(col)  {
                self.colspanArray[level].push({
                  label: levelValue[col] || '',
                  colspan: 1,
                  hidden: false
                });

              }, true);
            });
        }
        self.onAfterViewportColumnCalculatorOverride = function(calc) {
            var newStartColumn = calc.startColumn;
            Handsontable.helper.rangeEach(0, Math.max(self.columnHeaderLevelCount - 1, 0), function (l)  {
              var startColumnNestedParent = self.getNestedParent(l, calc.startColumn);
              if (startColumnNestedParent < calc.startColumn) {
                var earlierColumn = Math.min(newStartColumn, startColumnNestedParent);
                newStartColumn = earlierColumn;
              }
            });
            calc.startColumn = newStartColumn;
            var base = self.table.getSettings()['headersColspan'];
            if (base){
                calc.startColumn = calc.startColumn+calc.startColumn%base;
                calc.endColumn = calc.endColumn-calc.endColumn%base;
            }
        }
        self.onAfterOnCellMouseDown = function(event, coords, TD) {
            if (coords.row < 0) {
              var colspan = self.getColspan(coords.row, coords.col);
              var lastColIndex = coords.col + colspan - 1;

              if (colspan > 1) {
                var lastRowIndex = self.table.countRows() - 1;
                self.table.selection.setRangeEnd(new WalkontableCellCoords(lastRowIndex, lastColIndex));
              }
            }
        }
        self.onBeforeOnCellMouseOver = function(event, coords, TD, blockCalculations) {
            if (coords.row < 0 && coords.col >= 0 && self.table.view.isMouseDown()) {
                var z = self.table.getSelectedRange();
              var from = z.from, to = z.to;
              var colspan = self.getColspan(coords.row, coords.col);
              var lastColIndex = coords.col + colspan - 1;
              var changeDirection = false;
              if (from.col <= to.col) {
                if ((coords.col < from.col && lastColIndex === to.col) ||
                    (coords.col < from.col && lastColIndex < from.col) ||
                    (coords.col < from.col && lastColIndex >= from.col && lastColIndex < to.col)) {
                  changeDirection = true;
                }
              } else {
                if ((coords.col < to.col && lastColIndex > from.col) ||
                    (coords.col > from.col) ||
                    (coords.col <= to.col && lastColIndex > from.col) ||
                    (coords.col > to.col && lastColIndex > from.col)) {
                  changeDirection = true;
                }
              }
              if (changeDirection) {
                    var z = from.col;
                    from.col = to.col;
                    to.col = z; 
              }
              if (colspan > 1) {
                blockCalculations.column = true;
                self.table.selection.setSelectedHeaders(false, true);
                if (from.col === to.col) {
                  if (lastColIndex <= from.col && coords.col < from.col) {
                    self.table.selection.setRangeStartOnly(new WalkontableCellCoords(from.row, to.col));
                    self.table.selection.setRangeEnd(new WalkontableCellCoords(to.row, coords.col));
                  } else {
                    self.table.selection.setRangeStartOnly(new WalkontableCellCoords(from.row, coords.col < from.col ? coords.col : from.col));
                    self.table.selection.setRangeEnd(new WalkontableCellCoords(to.row, lastColIndex > to.col ? lastColIndex : to.col));
                  }
                }
                if (from.col < to.col) {
                  self.table.selection.setRangeStartOnly(new WalkontableCellCoords(from.row, coords.col < from.col ? coords.col : from.col));
                  self.table.selection.setRangeEnd(new WalkontableCellCoords(to.row, lastColIndex));

                }
                if (from.col > to.col) {
                  self.table.selection.setRangeStartOnly(new WalkontableCellCoords(from.row, from.col));
                  self.table.selection.setRangeEnd(new WalkontableCellCoords(to.row, coords.col));
                }
              }
            }
        }
        self.onAfterGetColumnHeaderRenderers = function (renderersArray) {
            if (renderersArray) {
              renderersArray.length = 0;
              for (var headersCount = self.colspanArray.length, i = headersCount - 1; i >= 0; i--) {
                renderersArray.push(self.headerRendererFactory(i));
              }
              renderersArray.reverse();
            }
        }
        self.getChildHeaders = function (row, column) {
            var level = self.rowCoordsToLevel(row);
            var childColspanLevel = self.colspanArray[level + 1];
            var nestedParentCol = self.getNestedParent(level, column);
            var colspan = self.colspanArray[level][column].colspan;
            var childHeaderRange = [];
            if (!childColspanLevel) {
              return childHeaderRange;
            }
            Handsontable.helper.rangeEach(nestedParentCol, nestedParentCol + colspan - 1, function(i)  {
              if (childColspanLevel[i] && childColspanLevel[i].colspan > 1) {
                colspan -= childColspanLevel[i].colspan - 1;
              }
              if (childColspanLevel[i] && !childColspanLevel[i].hidden && childHeaderRange.indexOf(i) === -1) {
                childHeaderRange.push(i);
              }
            });
            return childHeaderRange;
        }
        self.setupColspanArray = function () {
            function checkIfExists(array, index) {
              if (!array[index]) {
                array[index] = [];
              }
            }
            Handsontable.helper.objectEach(self.settings, function(levelValue, level)  {
              Handsontable.helper.objectEach(levelValue, function(val, col, levelValue)  {
                checkIfExists(self.colspanArray, level);
                if (levelValue[col].colspan === void 0) {
                  self.colspanArray[level].push({
                    label: levelValue[col] || '',
                    colspan: 1,
                    hidden: false
                  });
                } else {
                  var colspan = levelValue[col].colspan || 1;
                  self.colspanArray[level].push({
                    label: levelValue[col].label || '',
                    colspan: colspan,
                    hidden: false
                  });
                  self.fillColspanArrayWithDummies(colspan, level);
                }
              });
            });
        }
        self.setupColspanArray();
        self.columnHeaderLevelCount = self.table.view.wt.getSetting('columnHeaders').length;
        self.fillTheRemainingColspans();
        return self;
    },

    RegisterKeys: function(table){
      table.updateSettings({
        beforeKeyDown: function (e) {
            var selection = table.getSelected();
            var isControlPressed = (e.ctrlKey || e.metaKey);
            BlankDocument.Events.emit('key',e);
            switch (e.keyCode) {
                case 46: // Del
                Handsontable.Dom.stopImmediatePropagation(e);
                try{
                  if (table.getDataAtCell(selection[0],selection[1])) {
                      var rowIndex = selection[0]
                      var colIndex = selection[1] - table.getSettings().fixedColumnsLeft;
                      table.setDataAtCell(selection[0],selection[1],0);
                  }
                } catch(e){;}
                break;
              case 38: // Вверх
                if (isControlPressed){
                    e.preventDefault();
                    setTimeout(function(){table.selectCell(0, selection[1]);},0);
                    e.stopImmediatePropagation();
                }
                break;
              case 40: // Вниз
                if (isControlPressed){
                    e.preventDefault();
                    //setTimeout(function(){table.selectCell(DocumentForm.LoadedData.Row.length-1, selection[1]);},0);
                    e.stopImmediatePropagation();
                }
                break;
              case 35: //PgUp
                if (isControlPressed){
                    e.preventDefault();
                    //setTimeout(function(){table.selectCell(DocumentForm.LoadedData.Row.length-1, DocumentForm.LoadedData.Col.length+table.getSettings().fixedColumnsLeft-1);},0)
                    e.stopImmediatePropagation();
                }
                break;
              case 36: //PgDn
                if (isControlPressed){
                    e.preventDefault();
                    setTimeout(function(){ table.selectCell(0, table.getSettings().fixedColumnsLeft);},0)
                    e.stopImmediatePropagation();
                }
                break;
              case 120: // Ctrl + F9 или F9
                e.preventDefault();
                if (isControlPressed){
                    CxCtrl.UseCache(false);
                    _.delay(CxCtrl.UseCache.bind(null,true),500);
                } else {
                    CxCtrl.UseCache(true);
                }
                CxCtrl.Update("cells");
                e.stopImmediatePropagation();
              break;
            }
            if (isControlPressed && !e.shiftKey && e.keyCode == 'Z'.charCodeAt(0)) {
                e.preventDefault();
                //DocumentForm.Undo(false);
                e.stopImmediatePropagation();
            } // Ctrl + Z
            if (isControlPressed  && e.shiftKey && e.keyCode == 'Z'.charCodeAt(0)) {
                e.preventDefault();
                //DocumentForm.SuperUndo(false);
                e.stopImmediatePropagation();
            }
            if (isControlPressed && e.keyCode == 'S'.charCodeAt(0)) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        },
        afterSelectionEnd: function(sx,sy,ex,ey){
            BlankDocument.UpdateLastCell();
        },
        beforeOnCellMouseDown: function(event,xy) {
          BlankDocument.UpdateLastCell();
          return;




          DocumentForm.SetCurrentCellInfo(xy.row,xy.col);
          var Info = DocumentForm.LastCellMeta();
          DocumentForm.Events.emit('click',event);
          if (Info && Info.Code){
              if (event.altKey){
                if (!Info.ReadOnly){
                    DocumentForm.LoadHistory(Info.Code);
                }
              }
              if (event.ctrlKey){
                if (DocumentForm.SelectedCells.indexOf(Info)==-1){
                    DocumentForm.SelectedCells.push(Info);
                    table.setCellMeta(Info.row,Info.col,'Selected',true);
                } else {
                    DocumentForm.SelectedCells.remove(Info);
                    table.setCellMeta(Info.row,Info.col,'Selected',false);
                }
                table.render();
              } else {
                var NeedRefresh = DocumentForm.SelectedCells().length!=0;
                if (NeedRefresh){
                    DocumentForm.SelectedCells().forEach(function(I){
                        table.setCellMeta(I.row,I.col,'Selected',false);
                    })
                    DocumentForm.SelectedCells([]);
                    table.render();
                }
              }
            }
        }
      });
    },

    WidthFix : function(table,defaultWidth,maxWidth,fixed){
        var defaultWidth = defaultWidth, fixed = fixed ||[]; 
        var _wc = function(table,colIndex){
            var texts = table.getDataAtCol(colIndex);
            var value = defaultWidth; 
            texts && texts.forEach(function(T,I){
                if (I){
                    var Text = table.getCopyableText(I,colIndex,I,colIndex).trim();
                    value = Math.max(value,(9*Text.length));
                }
            })
            return value;
        }
        var widths = [];
        var RealCols = table.countCols();
        for (var i = 0; i<RealCols; i++){
            if (fixed[i]) {
              widths.push(fixed[i]); 
            } else {
              var w2c = _wc(table,i);
              if (maxWidth){
                w2c = Math.min(w2c,maxWidth);
              }
              widths.push(w2c);
            }
        }
        table.updateSettings({colWidths:widths});
        table.render();
    },

    DiscretScroll : function(table){
        var self = this;
        self.lastV = 0;
        self.ScrollFixVertical = function(){
            var FixedRows = self.table.getSettings().fixedRowsTop;
            var ScrollPosition = self.table.view.activeWt.wtOverlays.topOverlay.getScrollPosition();
            var RowsToPass = 0, breakPoint = self.table.countRows();
            while (ScrollPosition>0 && (breakPoint--)>0 ){
               ScrollPosition-= self.table.getRowHeight(FixedRows+(RowsToPass++));
            }
            if (Math.abs(ScrollPosition)>self.table.getRowHeight(FixedRows+RowsToPass)/2){
                RowsToPass --;
            }
            var V = FixedRows+RowsToPass;
            if (self.lastV != V){
                self.lastV = V;
                self.table.view.activeWt.scrollVertical(V);
            }
        }
        self.lastH = 0;
        self.ScrollFixHorizontal = function(){
            var FixedCols = self.table.getSettings().fixedColumnsLeft;
            var ScrollPosition = self.table.view.activeWt.wtOverlays.leftOverlay.getScrollPosition();
            var ColsToPass = 0, breakPoint = self.table.countCols();
            while (ScrollPosition>0 && (breakPoint--)>0 ){
               ScrollPosition-= self.table.getColWidth(FixedCols+(ColsToPass++));
            }
            if (Math.abs(ScrollPosition)>self.table.getColWidth(FixedCols+ColsToPass)/2){
                ColsToPass --;
            }
            var H = FixedCols+ColsToPass;
            if ( self.lastH != H){
                self.lastH = H;
                self.table.view.activeWt.scrollHorizontal(H);
            }
        }
        self.table = table;
        self.table.updateSettings({
            afterScrollVertically : _.throttle(self.ScrollFixVertical,500),
            afterScrollHorizontally : _.throttle(self.ScrollFixHorizontal,500)
        });
    },

    TreeView :  function(table){
        var self = this;
        self.table = table;
        self.treeData  = self.table.getSettings().tree.data;
        self.colapsedName = self.table.getSettings().tree.colapsed;
        if (!self.treeData) return;
        self.maxLen = _.keys(self.treeData).length;
        self.table.collapsedRows = ko.observableArray([]);
        self.hiddenRows = ko.observable();
        self.table.ToggleRow = function(Row){
            var I = self.table.collapsedRows.indexOf(Row);
            if (I>=0){
                self.table.collapsedRows.remove(Row);
            } else {
                self.table.collapsedRows.push(Row);
            }
        }
        self.visibleRowOffset = function(row){
            var Excl = self.hiddenRows(),rowOffset = 0;
            for (var Ind in Excl){
                if (row>(Ind-rowOffset)) rowOffset+=Excl[Ind].length;
            }
            return rowOffset;
        }
        self.table.addHook('modifyRow',function(row){
            row =  row+self.visibleRowOffset(row);
            return row<self.maxLen ? row:null;
        })
        self.updateCollapsed = function(){
            var Exclude = {}, ChoosedCollapse = self.table.collapsedRows() || [];
            try{
              ChoosedCollapse.forEach(function(Ind){
                  var Cur = self.treeData[Ind];
                  Exclude[Ind] = _.filter(self.treeData,function(v,i){
                      v.Index = i;
                      return (v.lft>Cur.lft && v.rgt<Cur.rgt);
                  });
                  Exclude[Ind] = _.map(Exclude[Ind],'Index');
              })
            } catch(e){
              
            }
            var RealExclude = {};
            for (var i in Exclude){
                var ArrToTest = Exclude[i], doInsert = true;
                for (var j in Exclude){
                    if (j!=i && !_.difference(ArrToTest,Exclude[j]).length) {
                        doInsert = false;
                    }
                }
                if (doInsert) RealExclude[i] = Exclude[i];
            }
            self.hiddenRows(RealExclude);
            table.render();
        }

        self.table.collapsedRows.subscribe(function(ChoosedCollapse){
            self.updateCollapsed();
        })

        self.isLeaf = function(index){
            var Info = self.treeData[index];
            if (Info){
                return ((Info.rgt - Info.lft)==1);
            } else {
                return true;
            }
        }

        self.getToggleIcon = function(index){
            var isLeaf = self.isLeaf(index);
            var iconElem = $(document.createElement('i'));
            iconElem.addClass('fa treeButton treeButton');
            iconElem.data("index",index);
            if (!isLeaf){
                if (self.table.collapsedRows.indexOf(index)==-1){
                    iconElem.addClass('fa-minus-square-o');
                } else {
                    iconElem.addClass('fa-plus-square-o');
                }
                iconElem.on('click',function(){
                    var Ind = $(this).data().index;
                    $(this).toggleClass('fa-minus-square-o');
                    $(this).toggleClass('fa-plus-square-o');
                    if (self.table.collapsedRows.indexOf(Ind)==-1) {
                        self.table.collapsedRows.push(Ind);
                    } else {
                        self.table.collapsedRows.remove(Ind);
                    }
                });
            }

            return iconElem;
        }

        self.table.updateSettings({
            tree:{
                data:self.treeData,
                icon:self.getToggleIcon,
                colapsed:self.colapsedName
            }
        })
        self.updateCollapsed();
    }
}

})();