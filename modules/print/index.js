var MPrint = (new function(){
    var self = this;

    self.ChartHtml = "";

    self.IsPrint = ko.observable(false);


    self.SendToPrinter = function(){
        self.PrintInterface().PrintDocument();
    }

    self.DownloadPDF = function(){
        self.PrintInterface().DownloadPDF();
    }

    self.Finish = function(){
        self.PrintInterface(null);
        self.IsPrint(false);
        setTimeout(function(){
            BlankDocument.table.updateSettings({
                viewportRowRenderingOffset: 'auto',
                viewportColumnRenderingOffset: 'auto',
                rowHeaders:true
            })
            BlankDocument.Refresh();
        },1000);

    }

    self.PrintInterface = ko.observable();
    
    self.Init = function (done){
        return done();
    }

    self.IsLoading = ko.observable(false);
    self.Error = ko.observable(false);

    self.PrintPage = function(){
        if (self.PrintInterface()){
            $("#printPreviewContainer").html('');
            self.PrintInterface(null);
        }
        BlankDocument.table.updateSettings({
            viewportRowRenderingOffset: 10000,
            viewportColumnRenderingOffset: 10000,
            rowHeaders:false
        })
        if (CxCtrl.PageName()=='chart'){
            self.ChartHtml = $("#graphPreviewContainer").parent().html();
        } else {
            self.ChartHtml = "";
        }            
        BlankDocument.table.render();
        var P = new PrintInterface();
        self.PrintInterface(P);
        P.setFormat('A4');
        P.PrintName();
        P.Init();
        self.PrintInterface(P);
        self.IsPrint(true);
        setTimeout(function(){
           self.PrintInterface().reDraw();
        },1000)
    }

    return self;
})



var PrintInterface = function() {
    var self = this;

    self.Finish = function(){
         pager.navigate(self.BackUrl);
    }

	self.Init = function(done){
        self.table = $(BlankDocument.table.rootElement).find('.ht_master.handsontable').find('table').clone();
        self.table.removeAttr('id');
        self.PrintName(CxCtrl.PrintNameDoc());
        self.FormName (CxCtrl.PrintNumDoc());
        orig_table = self.table.clone()
        is_column_popup_inited = false;
    }    
	
    self.table  = null;

    var renderAggregate = function() {
        var orgs = _.keys(DocumentForm.CellsByObj)
        var agr_code = "[" + DocumentForm.Context.Agregate.join(",") + "]"
        var print_container = $("#printPreviewContainer").children().clone();
        for(var i = 0; i < orgs.length; i++) {
            var org_code = orgs[i]
            var org_table = print_container.clone();
            org_table.find("tbody td").each(function(td) {
                var cell_code = $(this).attr("cell-code");
                if(!cell_code) {
                    return;
                }
                cell_code = cell_code.replace(agr_code, org_code);
                var cell_val = DocumentForm.CellsByObj[org_code][cell_code].Value;
                $(this).text(cell_val == 0 ? "" : numeral(cell_val).format());
            })
            $("#printPreviewContainer").append(org_table);
        }
        $("#printPreviewContainer").find(".DocContext").each(function(i, item) {
            if(i === 0) {
                $(this).html($(this).text().replace(agr_code, Catalogue.GetHtml(CxCtrl.AgregateType(), CxCtrl.Agregate())));
            } else {
                $(this).html($(this).text().replace(agr_code, Catalogue.GetHtml("obj", orgs[i - 1])));
            }
        })
    }

    self.scale = ko.observable(1);
    self.interfaceShrink = 1;
    self.excellBorders = ko.observable(false);
    self.orientation = ko.observable('portrait');
    self.x_size = ko.observable(0);
    self.y_size = ko.observable(0);
    self.format = ko.observable('A4');
    self.PrintName = ko.observable('');

    self.ContextText = ko.pureComputed(function(){
        var CX = {};
        ["CodePeriod","Year"].forEach(function(F){
            CX[F] = CxCtrl.Override[F]() || CxCtrl[F]();
        })
        CX["CodeObj"] = CxCtrl.ChildObj()||CxCtrl.CodeObj();
        var period = {
            planperiods       : {
                title  : ' план',
                values : ['301','303','306','309','251','252','253','254'],
            },
            ozhidperiods      : {
                title  : ' ожидаемое',
                values : ['401','403','406','409'],
            },
            korrektiveperiods : {
                title  : ' корректив',
                values : ['31', '32','33','34','311','312','313','314','321','322','323','324','331','332','333','334','341','342','343','344']
            }
        }
        var periodTitle = ' факт';
        if (CX.CodeObj) {
            _.keys(period).forEach(function (name,index){
                if (_.includes(period[name].values,CX.CodePeriod))
                    periodTitle = period[name].title;
            });
            return Catalogue.GetHtml("obj",CX.CodeObj)+ periodTitle + ' за ' + Catalogue.GetHtml('period',CX.CodePeriod) + ' ' + CX.Year;
        }
    });

    self.FormName = ko.observable('');

    self.signatures = ko.observableArray([
        {
            Post:'________________________________',
            Fio:'__________________________________'
        },
        {
            Post:'________________________________',
            Fio:'__________________________________'
        }
    ]);

    self.approval = ko.observable({
        Post:'________________________________',
        Fio:'__________________________________',
        Date:'____.____.________'
    });

    self.documentStatus = ko.observable("Черновой");
    self.marginL = ko.observable(10);
    self.marginR = ko.observable(10);
    self.marginT = ko.observable(10);
    self.marginB = ko.observable(10);
    self.showApproval = ko.observable(false);
    self.showSignatures = ko.observable(false);
    self.showSignaturesOnEveryPage = ko.observable(false);
    self.showPageNumbers = ko.observable(true);
    self.showNumbersOnFirstPage = ko.observable(false);

    self.setFormat = function(format){
        if (format=='A4'){ self.x_size(1100);self.y_size(1555);}
        if (format=='A3'){ self.x_size(1555);self.y_size(2200);}
        self.setOrientation('portrait');
    }

    self.userInfo = function(){
        if ((MSite.Me())&&(MSite.Me().NameUser())) {
            var nameComponents = MSite.Me().NameUser().split(' ');
            var nameArr = [];
            if (nameComponents[0]) nameArr.push(nameComponents[0]);
            if (nameComponents[1]) nameArr.push(nameComponents[1].substring(0,1)+'.');
            if (nameComponents[2]) nameArr.push(nameComponents[2].substring(0,1)+'.');
            var requiztes = [nameArr.join(' ')];
            if (MSite.Me().WorkPhone().length){
                requiztes.push('тел. '+MSite.Me().WorkPhone())
            }
            return requiztes.join(', ');
        } else {
            return '';
        }
    }

    self.setOrientation  = function(orientation){
        var x = self.x_size();
        var y = self.y_size();
        if (orientation=='portrait'){
            if (x>y){
                self.x_size(y);
                self.y_size(x);
            }
        }
        if (orientation=='landscape'){
            if (x<y){
                self.x_size(y);
                self.y_size(x);
            }
        }
    }

    self.layout_css = "@page { size: A4; margin: 0; }\n"

    self.setParam = function(param,value){
        if (!isNaN(Number(value))) value = Number(value);
        if (param=='orientation'){
            self.layout_css = '@media print {@page {size:'+value+';margin: 0;}}'
            self.setOrientation(value);
        }
        if (param=='scale'){
            value = Math.max(0.5,Math.min(value,2));
        }
        if (['marginL','marginR','marginT','marginB'].indexOf(param)>=0){
            value = Math.max(0,Math.min(value,400));
        }
        if (self[param]){
            self[param](value);
        }
        self.reDraw();
    }

    self.headerHeight = ko.observable(0);
    self.FP_footerHeight = ko.observable(0);
    self.LP_footerHeight = ko.observable(0);
    self.footerHeight    = ko.observable(0);
    self.FP_Header = "";
    self.FP_Footer = "";
    self.Footer = "";
    self.LP_Footer = "";
    self.allPages = ko.observable(0);

    self.reDraw = function(){
        if (!self.table) {
            return;
        }

        $('#printPreviewContainer').html('');
        $('#printPreviewContainer').width(self.x_size());

        self.setTableStyle();

        var TempId = 'page--shablon';
        $('#printPreviewContainer').append($("<div id='"+TempId+"' class='tableOnPage ht_master handsontable' style='position: relative;margin:0px;padding:0px;page-break-after: always; page-break-inside: avoid;page-break-before: avoid;height:100%;display: table;"+self.pageStyle()+"'></div>"));

        var container = $('#'+TempId);
        self.drawHeader(container);
        container.append(self.table);
        self.drawFooter(container);
        self.calculatePages();

        $('#printPreviewContainer').html('');

        var PagesByRows = _.keys(self.pages.rows).length;
        var PagesByCols = _.keys(self.pages.cols).length;

        self.allPages(PagesByRows*PagesByCols);
        // self.render_progress(0)
        // self.is_progress_bar_visible(true)

        var current = 0;
        for (var i=0; i<PagesByRows; i++){
            for (var j=0; j<PagesByCols; j++){
                // self.render_progress(current / (PagesByRows * PagesByCols))
                self.renderPage(i,j,++current);
            }
        }

        if(CxCtrl.IsAgregate()) {
            //renderAggregate()
        }
        
        // self.is_progress_bar_visible(false)
    }

    self.pages = {};
    self.rowSize = {};
    self.colSize = {};
    self._s = function(s){ return Math.ceil(s*self.scale());}

    self.renderPage = function(IndexRow,IndexCol,Num){
        var table = self.table.clone();
        var rows = self.pages.rows[IndexRow];
        var cols = self.pages.cols[IndexCol];

        table.find('tr').each(function(Index){
            if (rows.indexOf(Index+'')==-1) {
                $( this ).remove();
            }
        })

        var toRemove = [];

        var tr_idx = (CxCtrl.PageName()=='olap') ? 0 : 1

        table.find('tr:eq(' + tr_idx + ')').find('th,td').each(function(Index){
            if (cols.indexOf(Index+'')==-1) {
                toRemove.push(table.find('tr').find('th:eq('+Index+'),td:eq('+Index+')'));
            }
        })

        toRemove.forEach(function(R){
            R.remove();
        })

        var pageId = "page-"+IndexRow+'-'+IndexCol;
        //var pageContainer = $('<div class="pageContainerShrink" id="page-container-'+pageId+'"></div>');
        var pageToAdd = $("<div id='"+pageId+"' class='tableOnPage ht_master handsontable' style='position: relative;margin:0px;padding:0px;height:100%;d1isplay: table;"+self.pageStyle()+"'></div>");
        $('#printPreviewContainer').append(pageToAdd);
        //pageContainer.append(pageToAdd);

        var Header = "<div style=' display : table-row;vertical-align : top;height : "+self.marginT()+"px;'></div>";
        if (IndexRow==0 && IndexCol==0) {
            Header += self.FP_Header;
        }

        $('#'+pageId).append($(Header));

        if (MPrint.ChartHtml){
            $('#'+pageId).append(MPrint.ChartHtml);
        }


        var tableContainer = $('<div id="table-container-'+pageId+'"></div>');
        $('#'+pageId).append(tableContainer);
        tableContainer.append(table);

        var Footer = "";

        if (Num==self.allPages()) {
            Footer = self.LP_Footer;
        } else if (Num==1) {
            Footer = self.FP_Footer;
        } else  {
            Footer = self.Footer;
        }
        Footer = "<div style='position:absolute;bottom:0'>"+(Footer+'').replace('[PN]',Num)+"</div>";


        $('#'+pageId).append($(Footer).removeAttr('id').clone());

        if (self.scale()<1){
            tableContainer.height(tableContainer.height()*self.scale());
        }
    }

    self._pageHeight = function(pageIndex){
        var H = self.y_size() - self.marginT()-self.marginB()-self.footerHeight();
        if (pageIndex==self.allPages().length-1){
            H -= self.LP_footerHeight();
        } else if (pageIndex==0){
            H -= self.headerHeight();
            H -= self.FP_footerHeight();
        }  else {
            H -= self.footerHeight();
        }
        return H;
    }

    self.calculatePages = function(){
        self.colSize = []
        self.rowSize = []

        var table = self.table;
        var Settings = BlankDocument.table.getSettings();

        var fixedRows = Settings.headers.length;
        var fixedCols = Settings.fixedColumnsLeft;

        var workingHeight = 0;
        var workingWidth  = self.x_size() - self.marginR()-self.marginL();

        table.find('tr').each(function(Index){
            self.rowSize[Index] = self._s($( this ).outerHeight());
        })

        var getCellSelector = function(cell_idx) {
            if(CxCtrl.PageName()=='olap') {
                return table.find('thead > tr:eq(0)').find('th:eq('+cell_idx+')')
            }

            return table.find('tr:eq(1)').find('td:eq('+cell_idx+')');
        }

        var start = 0, max = 100500;
        var nextCol = getCellSelector(start)

        while (nextCol.length){
            if (--max==0) break;
            nextCol = getCellSelector(start)
            if (nextCol.length){
                self.colSize[start] = self._s(nextCol.outerWidth());
            }
            start++;
        }

        var allRows  = _.keys(self.rowSize);
        var allColls = _.keys(self.colSize);

        var fixedWidth = 0;
        var fixedHeight = 0;

        for (var i=0; i<fixedRows; i++) fixedHeight+=self.rowSize[i];
        for (var i=0; i<fixedCols; i++) fixedWidth+=self.colSize[i];

        workingWidth -= fixedWidth;

        var addRows = allRows.splice(0,fixedRows);
        var addColls = allColls.splice(0,fixedCols);

        var colsOnPages = {}, currentColPage = 0;
        var tWidth = workingWidth;

        allColls.forEach(function(Index){
            if (tWidth<=self.colSize[Index]){
                currentColPage++;
                tWidth = workingWidth;
            }

            tWidth -= self.colSize[Index];

            if (!colsOnPages[currentColPage]) {
                colsOnPages[currentColPage] = _.clone(addColls);
            }

            colsOnPages[currentColPage].push(Index);
        })

        var rowsOnPages = {}, currentRowPage = 0;
        var tHeight = self._pageHeight(currentRowPage)-fixedHeight;

        allRows.forEach(function(Index){
            if (tHeight<=self.rowSize[Index]){
                currentRowPage++;
                tHeight =  self._pageHeight(currentRowPage)-fixedHeight;
            }
            tHeight -= self.rowSize[Index];
            if (!rowsOnPages[currentRowPage]) rowsOnPages[currentRowPage] = _.clone(addRows);
            rowsOnPages[currentRowPage].push(Index);
        })
        self.pages = {rows:rowsOnPages,cols:colsOnPages};
    }

    // Вынести в шаблоны
    self.drawHeader = function(where2add){
        $("#PrintDocumentHeader").remove();
        var Header =
        "<table class='layoutTable' style='width:100%;margin:0px;padding:0px;border:0px;'>"+
            "<tr>"+
                "<td colspan=2></td>"+
                "<td style='width:10%'><div style='float: right;margin-right: 45px;white-space: nowrap;'>"+self.FormName()+"</div></td>"+
            "</tr>";
        if (self.showApproval()){
            var fio = '__________________________________'
            var post = '________________________________'
            var date = moment().format("DD.MM.YYYY")
            var org_id = CxCtrl.CodeObj();

            var label = _.find(CxCtrl.Doc().toJS().Labels, function(label) {
                return label.IsApproval
            })
			
            if(label) {
                post = label.NameLabel
                var users = label.Users[org_id]
                if(!users) return;
                var user = users[_.keys(users)[0]]
                if(user) {
                    post = user.JobTitle;
                    var fio = user.NameUser;
                }
            }

            Header +=
            "<tr>"+
                "<td style='width:80%'></td>"+
                "<td colspan=2 style='width:20%'>"+
                    "<div class='ApprovalBlock' id='ApprovalBlock'><div class='Approve'>УТВЕРЖДАЮ</div><div class='ApprovePost'>"+post+"</div><div class='ApproveFio'>"+fio+"</div><div class='ApproveDate'>"+date+"</div></div>"+
                "</td>"+
            "</tr>";
        }

        var doc_context_text = (CxCtrl.PageName()=='olap')
            ? Catalogue.GetHtml("grp", CxCtrl.CodeGrp()) + " / Группировка: " + Tr("olapgroup",CxCtrl.GroupType())
            : self.ContextText()

        Header +=
            "<tr>"+
                "<td colspan=3>"+
                "<div class='TopDocument'><div class='DocName'>"+self.PrintName()+"</div><div class='DocContext'>"+ doc_context_text +"</div></div>"+
                "</td>"+
            "</tr>"+
        "</table>";
        if (!_.isEmpty(CxCtrl.KolEd())){
            Header += "<div class='koled'><span class='kol'>"+CxCtrl.KolEd()+"</span></div>";
        }
        $(where2add).append(
            $('<div id="PrintDocumentHeader" class="PrintDocumentHeader">'+Header+"</div>")
        );
        self.FP_Header = $("#PrintDocumentHeader").html();
        self.headerHeight($("#PrintDocumentHeader").outerHeight());
        $("#PrintDocumentHeader").remove();
    }

    // Вынести в шаблоны
    self.drawFooter = function(where2add){
        $("#PrintDocumentFooterFP").remove();
        $("#PrintDocumentFooter").remove();
        $("#PrintDocumentFooterLP").remove();
        var FP_Footer = Footer = LPFooter = "<div style=' display : table-row;vertical-align : bottom;height : 1px;'><table class='layoutTable' style='width:"+self.x_size()+"px;margin:0px;padding:0px;border:0px;'>";
        var signsTR = "";
        var Status = '<div class="DocumentStatus"><div>Статус отчета: '+self.documentStatus()+'</div>'+
                     '<div>Отчет сформирован в Jetcalc при поддержке JetTeam'+
                     '<div>Дата формирования документа: '+moment().format('DD.M.YYYY HH:mm')+'</div>'+
                     '<div>исп. ' + self.userInfo()+'</div></div>';
        if (self.showSignatures()){
            var Sigs = "<table class=SignatureBlock>";
            var labels = CxCtrl.Doc().toJS().Labels.filter(function(label) {
                return label.IsSignature
            })
            var org_id = CxCtrl.CodeObj();

            if(labels.length === 0) {
                labels = [{
                    NameLabel:'________________________________',
                    Users: []
                },
                {
                    NameLabel:'________________________________',
                    Users: []
                }]
            }
            labels.forEach(function(label) {
                var post = label.NameLabel
                var fio = "__________________________________"

                var users = label.Users[org_id]

                if(users) {
                    var user = users[_.keys(users)[0]]

                    if(user) {
                        post = user.JobTitle

                        var user_fio = user.NameUser.split(" ")

                        var f = user_fio[0]
                        var i = user_fio[1]
                        var o = user_fio[2]

                        fio = ""
						if(i){
							fio += i[0] + ". "
						}
                        if(o){
							fio += o[0] + ". "
						}
						if(f){
							fio += f
						}
                    }
                }

                Sigs +=
                    '<tr class="SignatureBlock">'+
                        '<td class="SignaturePost">'+post+'</td>'+
                        '<td class="SignatureSignature">_____________________</td>'+
                        '<td class="SignatureFio">'+fio+'</td>'+
                    '</tr>';
            })

            Sigs += "</table>";

            signsTR = "<tr><td style='width:30%'>[INFO]</td><td>"+Sigs+"</td>"+"<td style='width:10%'></td></tr>";
            if (self.showSignaturesOnEveryPage()){
                FP_Footer += signsTR.replace('[INFO]','&nbsp;');
                Footer += signsTR.replace('[INFO]','&nbsp;');
                LPFooter += signsTR.replace('[INFO]',Status);
            } else {
                LPFooter += signsTR.replace('[INFO]',Status);
            }
        } else {
            LPFooter += "<tr><td style='width:30%'>"+Status+"</td><td></td><td style='width:10%'></td></tr>";
        }
        if (self.showPageNumbers()){
            var PN = "<tr><td colspan=2></td>"+"<td class='PageNum' style='width:10%'><div style='float: right;margin-right: 15px;'>Стр. [PN]</div></td></tr>";
            Footer +=   PN;
            LPFooter += PN;
            if (self.showNumbersOnFirstPage()){
                FP_Footer += PN;
            }
        }
        FP_Footer += "</table></div>";
        Footer += "</table></div>";
        LPFooter += "</table></div>";

        where2add.append($('<div id="PrintDocumentFooterFP">'+FP_Footer+"</div>"));
        where2add.append($('<div id="PrintDocumentFooter" >'+Footer+"</div>"));
        where2add.append($('<div id="PrintDocumentFooterLP">'+LPFooter+"</div>"));

        self.FP_Footer = $("#PrintDocumentFooterFP").html();
        self.FP_footerHeight($("#PrintDocumentFooterFP").outerHeight());
        $("#PrintDocumentFooterFP").remove();

        self.Footer = $("#PrintDocumentFooter").html();
        self.footerHeight($("#PrintDocumentFooter").outerHeight());
        $("#PrintDocumentFooter").remove();

        self.LP_Footer = $("#PrintDocumentFooterLP").html();
        self.LP_footerHeight($("#PrintDocumentFooterLP").outerHeight());
        $("#PrintDocumentFooterLP").remove();
    }

    self.editMode = ko.observable('');

    self.setEditMode = function(data){
        if (self.editMode()==data){
            self.editMode('');
        } else {
            self.editMode(data);
        }
    }

    self.pageStyle = ko.computed(function(){
        var CL = 10,CT = 10, CB = 10, CR = 10;
        var R = [];
        R.push("width:"+self.x_size()+'px');
        R.push("height:"+self.y_size()+'px');
        R.push("border:2px outset #CFCFCF");
        R.push("padding-top:"+self.marginT()+'px');
        R.push("padding-bottom:"+self.marginB()+'px');

        R.push("margin-bottom:"+CB+"px");
        R.push("margin-top:"+CT+"px");
        R.push("margin-left:"+CL+"px");
        R.push("margin-right:"+CR+"px");

        R.push("-webkit-transform:scale("+self.interfaceShrink+","+self.interfaceShrink+")");
        R.push("-webkit-transform-origin:top left");
        return R.join(';');
    })

    self.setTableStyle = function(){
        var S = self.scale();
        if (self.table){
            self.table.css("-webkit-transform","scale("+S+','+S+')');
            self.table.css("-webkit-transform-origin","top left");
            self.table.css("left","0");
            self.table.css("right","0");
            self.table.css("margin","0");
            self.table.css("padding","0");
            self.table.css("margin-left",self.marginL());
            self.table.css("margin-right",self.marginR());
            setTimeout(function(){
                self.table.find('.wtHolder').height(self.table.find('table').height())
            },0)
        }
    }

    self.columns = ko.observableArray();
    var is_column_popup_inited = false;
    var orig_table = null;

    self.render_progress = ko.observable()
    self.is_progress_bar_visible = ko.observable(false)

    self.ApplyColumnChange = function(){
        var table = orig_table.clone();
        var active_columns = [];

        self.columns().forEach(function(item, i) {
            if(item.is_active()) {
                active_columns.push(i);
            }
        })

        if(CxCtrl.PageName()=='olap') {
            var col_count = self.columns().length
            var active_col_count = active_columns.length

            var filter = function(i) {
                if(i === 0) {
                    return false
                }

                return active_columns.indexOf((i - 1) % col_count) === -1
            }

            var hidden_th_filter = function(i) {
                if(active_col_count === col_count) {
                    return false
                }

                return i % active_col_count === 0
            }

            table.find("colgroup > col")
                .filter(filter)
                .remove()

            table.find("thead > tr:eq(0)").each(function() {
                $(this).find("th.hiddenHeader")
                    .filter(hidden_th_filter)
                    .remove()

                $(this).find("th").each(function() {
                    if($(this)[0].hasAttribute("colspan")) {
                        $(this).attr("colspan", active_col_count)
                    }
                })
            })

            table.find("thead > tr:eq(1)").each(function() {
                $(this).find("th")
                    .filter(filter)
                    .remove()
                })

            table.find("tbody > tr").each(function() {
                $(this).find("td")
                    .filter(filter)
                    .remove()
            })
        }
        else {
            var filter = function(i) {
                if(i === 0 || i === 1) {
                    return false
                }

                return active_columns.indexOf(i - 2) === -1
            }

            table.find("colgroup > col")
                .filter(filter)
                .remove()

            table.find("thead > tr > th")
                .filter(filter)
                .remove()

            table.find("tbody > tr").each(function() {
                $(this).find("td")
                    .filter(filter)
                    .remove()
            })
        }

        self.table = table
        self.reDraw()

        $('#columnsPopup').modal('hide');
    }


    self.openColumnSelectPopup = function() {
        if(!is_column_popup_inited) {
            self.columns.removeAll()

            BlankDocument.TableInterface().Columns().forEach(function(item) {
                self.columns.push({
                    name: item.NameColsetCol,
                    is_active: ko.observable(true)
                })
            })

            is_column_popup_inited = true
        }
        $('#columnsPopup').modal('show');
    }

    self.PrintDocument = function(){
        var mywindow = window.open('', 'Печать отчета', 'fullscreen=true');
        mywindow.document.write('<html><head><title>Печать отчета</title>');

        var Styles = [
            '/css/opensans.css',
            '/css/bootstrap.min.css',
            '/css/font-awesome.min.css',
            '/css/ace.min.css',
            '/css/ace-skins.min.css',
            '/editor/editor.css',
            '/index.css',
            '/css/printTable.css',
            "/css/handsontable.full.min.css",
            "/css/handsontable.custom.css",
            "/lib/charts/c3/c3.min.css",
            "/modules/print/index.css"
        ];

        Styles.forEach(function(S){
            mywindow.document.write('<link rel="stylesheet" href="'+S+'" type="text/css" />');
        })

        mywindow.document.write("<style>" + self.layout_css + "</style>")

        mywindow.document.write('</head><body >');

        var preview_container = $("#printPreviewContainer").clone()
        mywindow.document.write(preview_container.html());
        mywindow.document.write('</body></html>');

        mywindow.document.close(); // necessary for IE >= 10
        mywindow.focus(); // necessary for IE >= 10

        setTimeout(function(){
            mywindow.print();
            // mywindow.close();
        },1000);
    }

    self.DownloadPDF = function(){
        var html = '<html><head><title>Печать отчета</title>'

        var Styles = [
            '/css/opensans.css',
            '/css/bootstrap.min.css',
            '/css/font-awesome.min.css',
            '/css/ace.min.css',
            '/css/ace-skins.min.css',
            '/editor/editor.css',
            '/index.css',
            '/css/printTable.css',
            "/css/handsontable.full.min.css",
            "/css/handsontable.custom.css"
        ];
        Styles.forEach(function(S){
            html += '<link rel="stylesheet" href="root_url'+S+'" type="text/css" />'
        })

        html += "<style>" + self.layout_css + "</style>"

        html += '</head><body>'
        html += $("#printPreviewContainer").html()
        html += '</body></html>'

        self.downloadFileUsingAJAX(
            "/api/modules/print/html2pdf",
            { html: base64.encode(utf8.encode(html)) }
        )
    }

    self.downloadFileUsingAJAX = function(url, data) {
        var form = $("<form></form>").attr("action", url).attr("method", "post")
        for(var key in data) {
            form.append($("<input></input>")
                .attr("type", "hidden")
                .attr("name", key)
                .attr("value", JSON.stringify(data[key])))
        }
        form.appendTo("body").submit().remove()
    }

	return self;
}

ModuleManager.Modules.Print = MPrint;