/*======================================================================================================================================
UTILS
======================================================================================================================================*/
var setSlideLayout = function setSlideLayout(name) {
    var old = this.data.info.slots();
    var slots = new Array(PresentationOptions.layouts[name] || 1).fill(0).map(function (f, i) {
        return old[i] || new SlotStructure();
    });
    this.data.info.slots(slots);
};

var getSlotConfigDocumentType = function () {
    var curCodeDoc = CxCtrl.CodeDoc();
    try {
        curCodeDoc = MPresentation.CurrentSlotModel().CodeDoc();
    } catch (e) {
        return "none"
    }
    try {
        var curDoc = MFolders.FindDocument(curCodeDoc);
    } catch (e) {
        return "none"
    }
    if (curDoc.IsChart) {
        return "chart";
    }
    return "table";
}

var scalePresentTable = function () {
    var wtHiders = document.getElementsByClassName('wtHider');
    var containers = document.getElementsByClassName('handsonContainer');
    for (var i = 0; i < wtHiders.length; i++) {
        var wtHiderWidth = $(document.getElementsByClassName('wtHider')[i]).width()
        var wtHiderHeight = $(document.getElementsByClassName('wtHider')[i]).height()
        var containerHeight = $(document.getElementsByClassName('handsonContainer')[i]).height() - 10
        var containerWidth = $(document.getElementsByClassName('handsonContainer')[i]).width()
        var wr = 1;
        var hr = 1;
        if (containerWidth < wtHiderWidth) {
            wr = ((containerWidth) / wtHiderWidth)
        } else {
            $(document.getElementsByClassName('wtHider')[i]).css("margin-left", (containerWidth - wtHiderWidth) / 2 + "px")
        }
        if (containerHeight < wtHiderHeight * wr) {
            hr = ((containerHeight) / wtHiderHeight)
            if (wr > hr) {
                $(document.getElementsByClassName('wtHider')[i]).css("margin-left", (containerWidth - wtHiderWidth * hr) / 2 + "px")
            }
        } else {
            $(document.getElementsByClassName('wtHider')[i]).css("margin-top", ((containerHeight) - wtHiderHeight * wr) / 2 + "px")
        }
        wr = Math.min(wr, hr);
        hr = wr;
        $(document.getElementsByClassName('wtHider')[i]).css("transform-origin", "top left")
        $(document.getElementsByClassName('wtHider')[i]).css("transform", "scale(" + wr + "," + hr + ")")
    }
}

var scalePresentChart = function () {
    var charts = document.getElementsByClassName('present-chart');
    var containers = document.getElementsByClassName('chart-container');
    for (var i = 0; i < charts.length; i++) {
        var chartWidth = 800
        var chartHeight = 600
        var containerHeight = $(document.getElementsByClassName('chart-container')[i]).height() - 10
        var containerWidth = $(document.getElementsByClassName('chart-container')[i]).width()
        var wr = 1;
        var hr = 1;
        if (containerWidth < chartWidth) {
            wr = ((containerWidth) / chartWidth)
        } else {
            $(document.getElementsByClassName('present-chart')[i]).css("margin-left", (containerWidth - chartWidth) / 2 + "px")
        }
        if (containerHeight < chartHeight * wr) {
            hr = ((containerHeight - 10) / chartHeight)
            if (wr > hr) {
                $(document.getElementsByClassName('present-chart')[i]).css("margin-left", (containerWidth - chartWidth * hr) / 2 + "px")
            }
        } else {
            $(document.getElementsByClassName('present-chart')[i]).css("margin-top", ((containerHeight) - chartHeight * wr) / 2 + "px")
        }
        wr = Math.min(wr, hr);
        hr = wr;
        $(document.getElementsByClassName('present-chart')[i]).css("transform-origin", "top left")
        $(document.getElementsByClassName('present-chart')[i]).css("transform", "scale(" + wr + "," + hr + ")")
    }
}

var highlightPresentTable = function () {
    for (var index = 1; index < 20; index++) {
        $(".present-table-highlight-column-" + index).find("td:nth-child(" + index + ")").css("background-color", "#dcf2ff");
        $(".present-table-highlight-column-" + index).find("th:nth-child(" + index + ")").css("background-color", "#004eb6");
        $(".present-table-highlight-column-" + index).find("th:nth-child(" + index + ")").css("color", "white");
    }
}
/*======================================================================================================================================
PRESENTATION OPTIONS
======================================================================================================================================*/
var PresentationOptions = {
    layouts: {
        single: 1,
        "one-v-one": 2,
        "one-h-one": 2,
        "two-v-one": 3,
        "one-v-two": 3,
        "two-h-one": 3,
        "one-h-two": 3,
        four: 4
    },
    transition: ["none", "fade", "slide", "convex", "concave", "zoom", "default"],
    theme: ["black", "white", "league", "beige", "sky", "night", "serif", "simple", "solarized"]
}
/*======================================================================================================================================
DEFAULT CONFIGS
======================================================================================================================================*/
var DefaultPresentModelData = {
    'IsLoop': false,
    'IsShowNavigation': true,
    'IsAutoPlay': false,
    'AutoPlayInterval': 0,
    'CodePresentThema': 'white',
    'CodePresentTransitType': 'default'
}

var DefaultSlotStructure = function () {
    return new Object({
        enumerable: true,
        info: {
            document: ko.observable(''),
            year: ko.observable('0'),
            period: ko.observable(''),
            valuta: ko.observable(''),
            report: ko.observable(''),
            title: ko.observable(''),
            img: ko.observable(''),
            html: ko.observable(''),
            loading: ko.observable(true)
        }
    });
}

var DefaultSlideStructure = function () {
    return new Object({
        enumerable: true,
        info: {
            attr: {
                class: ko.observable('single'),
                "data-autoslide": ko.observable('0'),
                "data-transition": ko.observable('default')
            },
            slots: ko.observableArray([new SlotStructure()]),
            title: ko.observable(''),
            useLocalAS: ko.observable(false),
            header: {
                enabled: ko.observable(true),
                text: ko.observable('')
            },
            footer: {
                enabled: ko.observable(true),
                text: ko.observable('')
            }
        }
    });
}
var DefaultPresentationStructure = function () {
    return new Object({
        enumerable: true,
        info: {
            reveal: {
                config: {
                    transition: 'default',
                    loop: false,
                    controls: true,
                    autoSlide: false,
                    autoSlideInterval: 0
                },
                theme: 'white',
                title: ko.observable('')
            },
            header: '',
            footer: '',
            slides: ko.observableArray([new SlideStructure()])
        }
    });
}

/*======================================================================================================================================
PLUGIN LOGIC
======================================================================================================================================*/

var MPresentation = (new function () {

    var self = this;

    self.base = '/api/modules/presentation';

    self.Error = ko.observable(null);

    self.CurrentSlotModel = ko.observable(ModelEdit.Model("presetslot", {}));
    self.CurrentSlotTitle = ko.observable("");

    self.CurrentSlideLayout = ko.observable("single");

    self.PresentModel = ko.observable(ModelEdit.Model("present", DefaultPresentModelData));
    self.Present = {
        CodeDoc: CxCtrl.CodeDoc(),
        slides: []
    };
    self.Presentation = ko.observable(new PresentationStructure());

    self.isChanged = false;
    self.canSave = true;

    self.Warning = ko.observable('');

    self.PresentEditableFields = ['IsLoop', 'IsShowNavigation', 'IsAutoPlay', 'AutoPlayInterval', 'CodePresentThema', 'CodePresentTransitType', 'PresentHeader', 'PresenFooter'];

    self.SlotEditableFields = ['CodeDoc', 'CodeReport', 'YearData', 'CodePeriod', 'CodeValuta'];

    self.IsAvailable = function (CodeDoc) {
        var Doc = null;
        if (CxCtrl.CodeDoc()) {
            var Doc = MFolders.FindDocument(CxCtrl.CodeDoc());
        }
        return Doc && Doc.IsPresent;
    }

    self.ContextChange = function () {
        self.Init();
    }

    self.LoadData = function () {
        MPresentation.Warning('');
        return self.LoadPresent(function () {});
    }

    self.LoadSlideContent = function (slide, done, sind) {
        var chartSlots = [];
        var tableSlots = [];
        var computeWidth = function (ind, slide) {
            var layout = slide.data.info.attr.class();
            var slideWidth = $("#main-slide").css("width");
            var wd = ['four', 'one-v-one', 'one-v-two', 'two-v-one']
            if (wd.some(function (N) {
                    return N == layout || (layout == 'one-h-two' && ind != 0) || (layout == 'two-h-one' && ind != 2);
                })) {
                return parseInt(parseInt(slideWidth) / 2);
            }
            return slideWidth;
        }
        var computeHeight = function (ind, slide) {
            var layout = slide.data.info.attr.class();
            var slideHeight = $("#main-slide").css("height");
            var hd = ['four', 'one-h-one', 'one-h-two', 'two-h-one']
            if (hd.some(function (N) {
                    return N == layout || (layout == 'one-v-two' && ind != 0) || (layout == 'two-v-one' && ind != 2);
                })) {
                return parseInt(parseInt(slideHeight) / 2);
            }
            return slideHeight;
        }
        slide.data.info.slots().forEach(function (slot, ind) {
            try {
                if (slot.data.info.html() === '' && slot.data.info.img() === '') {
                    var curDoc = MFolders.FindDocument(slot.data.info.document());
                    if (slot.data.info.document() != '' && slot.data.info.period() != '' && slot.data.info.valuta() != '' &&
                        slot.data.info.year() != '') {
                        if (curDoc.IsChart) {
                            chartSlots.push({
                                slot: slot,
                                width: (parseInt(computeWidth(ind, slide)) - 10) + "px",
                                height: (parseInt(computeHeight(ind, slide)) - 10) + "px"
                            });
                        } else {
                            if (slot.data.info.report != '') {
                                tableSlots.push({
                                    slot: slot
                                })
                            }
                        }
                        slot.data.info.img('');
                        slot.data.info.loading(true);
                        slot.data.info.html('<div class="preview-img-container"><img style="width:' + (Math.min(parseInt(computeWidth(ind, slide)), parseInt(computeHeight(ind, slide))) - 80) + 'px" src="/css/trobber_48_gray.svg"></div>')
                    }
                }
            } catch (e) {}
        })
        var getQuery = function (slot) {
            var query = '?'
            var adapter = {
                CodeReport: '.data.info.report()',
                CodePeriod: '.data.info.period()',
                CodeValuta: '.data.info.valuta()',
                CodeDoc: '.data.info.document()',
                YearData: '.data.info.year()',
            }
            Object.keys(adapter).forEach(function (K) {
                query += K + '=' + eval('slot.slot' + adapter[K]) + '&';
            })
            query += 'width=' + 800;
            query += '&height=' + 600;
            query += '&CodeObj=' + CxCtrl.Context().CodeObj;
            query += '&CodeGrp=' + CxCtrl.Context().CodeGrp;
            query += '&GroupType=' + CxCtrl.Context().GroupType;
            query += '&CodePresent=' + CxCtrl.CodeDoc() + "_presentation";
            return query;
        }
        var loadChartSlotHtml = function (index) {
            if (index >= chartSlots.length) {
                return loadTableSlotHtml(0);
            }
            loadChartSlotHtml(index + 1);
            var url = '/api/modules/chart/chartpng/' + getQuery(chartSlots[index]);
            var imghtml = $("<img />").attr('src', url + '?cache=' + Math.random().toString(36).substring(2)).on('load', function () {
                chartSlots[index].slot.data.info.img('');
                chartSlots[index].slot.data.info.loading(false);
                var placeImg = function () {
                    if ($("#tmp-img-div")[0].childNodes.length == 0) {
                        $("#tmp-img-div").append(imghtml);
                        setTimeout(function () {
                            chartSlots[index].slot.data.info.html('<div class="chart-container" style="width:100%;height:100%"><div class="present-chart" id="present-chart-' + index + '">' + $("#tmp-img-div")[0].innerHTML + '</div></div>');
                            $("#tmp-img-div")[0].innerHTML = '';
                            setTimeout(scalePresentChart, 0)
                        }, 0)
                    } else {
                        setTimeout(placeImg, 100);
                    }
                }
                setTimeout(placeImg, 0);
            })
        }
        var loadTableSlotHtml = function (index) {
            if (index >= tableSlots.length) {
                return done()
            }
            loadTableSlotHtml(index + 1);
            $.getJSON('/api/modules/report/reporthtml/' + getQuery(tableSlots[index]), {}, function (data) {
                tableSlots[index].slot.data.info.img('');
                tableSlots[index].slot.data.info.loading(false);
                tableSlots[index].slot.data.info.html('<div class="present-table-highlight-column-' + 3 + '">' + data.html + '</div>')
                setTimeout(highlightPresentTable, 0);
                setTimeout(scalePresentTable, 0);
            })
        }
        return loadChartSlotHtml(0);
    }

    self.LoadPresent = function (done) {
        self.Error(null)
        var updatePresentation = function () {
            self.Presentation().update(self.Present);
            return done();
        }
        $.getJSON(self.base + "/presentbydoc/" + CxCtrl.Context().CodeDoc, CxCtrl.Context(), function (data) {
            var P = ModelEdit.Model("present", data.Present || DefaultPresentModelData);
            self.PresentModel(P);
            self.Present = data.Present || {
                slides: []
            };
            if (!data.Present) return done();
            $.getJSON(self.base + "/slides/" + self.Present.CodePresent, CxCtrl.Context(), function (data) {
                if (data.err) {
                    self.Error(data.err);
                }
                self.Present.slides = data.Slides;
                var loadNextSlots = function (slideIndex) {
                    try {
                        if (slideIndex >= self.Present.slides.length) {
                            return updatePresentation();
                        }
                        $.getJSON(self.base + "/slots/" + self.Present.slides[slideIndex].CodePresentSlide, CxCtrl.Context(), function (data) {
                            if (data.err) {
                                self.Error(data.Err);
                            }
                            try {
                                self.Present.slides[slideIndex].slots = data.Slots;
                            } catch (e) {}
                            loadNextSlots(slideIndex + 1);
                        })
                    } catch (e) {}
                }
                loadNextSlots(0);
            })
        })
    }

    self.SaveChanges = function () {
        if (!self.canSave) {
            return
        }
        self.canSave = false;
        self.Error(null);
        DataConverter.convertPresentFromStructureToObject()
        if (self.isChanged) {
            $.ajax({
                url: self.base + '/present',
                method: 'put',
                data: {
                    'present': JSON.stringify(self.Present)
                },
                success: function (data) {
                    if (data.err) {
                        return self.Error(data.err);
                    }
                    self.isChanged = false;
                    MPresentation.Warning('');
                    self.LoadPresent(function () {
                        self.canSave = true;
                        swal("изменения сохранены", "Изменения презентации успешно сохранены на сервере", "success");
                    });
                }
            })
        }
    }

    self.ToWeb = function () {
        mw = window.open(self.base + '/presenthtml/' + CxCtrl.CodeDoc() + "_presentation?CodeObj=" + CxCtrl.Context().CodeObj +
            '&CodeGrp=' + CxCtrl.Context().CodeGrp + '&GroupType=' + CxCtrl.Context().GroupType);
    }

    self.ToPdf = function () {
        mw = window.open(self.base + '/presentpdf/' + CxCtrl.CodeDoc() + "_presentation?CodeObj=" + CxCtrl.Context().CodeObj);
    }

    self.ClearCache = function () {
        $.getJSON(self.base + "/clearpresentcache/" + CxCtrl.Context().CodeDoc, {}, function (data) {
            swal("кэш очищен", "Файловый кэш успешно очищен", "success");
        });
    }

    self.ChangeSettings = function () {
        $("#presentation_settings_modal").modal('show');
    }

    self.SaveSettings = function () {
        $("#presentation_settings_modal").modal('hide');
        DataConverter.convertPresentFromModelToStructure();
        MPresentation.Warning('Есть несохраненные изменения');
    }

    self.SlideSettings = function () {
        MPresentation.CurrentSlideLayout(MPresentation.Presentation().getSlide().data.info.attr.class());
        $("#slide_settings_modal").modal('show');
    }

    self.SaveSlideSettings = function () {
        MPresentation.Presentation().getSlide().data.info.attr.class(MPresentation.CurrentSlideLayout());
        MPresentation.LoadSlideContent(MPresentation.Presentation().getSlide(), function () {
            setTimeout(highlightPresentTable, 0);
            setTimeout(scalePresentTable, 0);
            setTimeout(scalePresentChart, 0);
        }, MPresentation.Presentation().activeSlideI());
        MPresentation.Warning('Есть несохраненные изменения');
        $("#slide_settings_modal").modal('hide');
    }

    self.Init = function () {
        self.LoadData();
        $(window).resize(function () {
            try {
                if (MBreadCrumbs.CurrentRoute()[MBreadCrumbs.CurrentRoute().length - 1] === "presentation") {
                    scalePresentTable();
                    scalePresentChart();
                }
            } catch (e) {}
        })
    }


    return self;
})

/*======================================================================================================================================
PRESENTATION OBJECT
======================================================================================================================================*/

function PresentationStructure(data) {
    this.data = data || DefaultPresentationStructure();
    this.activeSlideI = ko.observable(0);
    this.activeSlideI.subscribe(function () {
        MPresentation.LoadSlideContent(MPresentation.Presentation().getSlide(), function () {
            setTimeout(highlightPresentTable, 0);
            setTimeout(scalePresentTable, 0);
            setTimeout(scalePresentChart, 0);
        });
    });
};

PresentationStructure.prototype.update = function (data) {
    this.data.info.reveal.config.transition = data.CodePresentTransitType;
    this.data.info.reveal.config.loop = data.IsLoop;
    this.data.info.reveal.config.controls = data.IsShowNavigation;
    this.data.info.reveal.config.autoSlide = data.IsAutoPlay;
    this.data.info.reveal.config.autoSlideInterval = data.AutoPlayInterval;
    this.data.info.reveal.theme = data.CodePresentThema;
    this.data.info.header = data.PresentHeader;
    this.data.info.footer = data.PresenFooter;
    if (data.slides.length > 0) {
        newSlides = [];
        data.slides.forEach(function (e) {
            newSlides.push(DataConverter.convertSlideFromObjectToStructure(e));
        })
        this.data.info.slides(newSlides);
    }
    MPresentation.Presentation().data.info.slides().forEach(function (slide, sind) {
        MPresentation.LoadSlideContent(slide, function () {
            setTimeout(highlightPresentTable, 0);
            setTimeout(scalePresentTable, 0);
            setTimeout(scalePresentChart, 0);
        }, sind);
    })
}

PresentationStructure.prototype.getSlide = function getSlide(i) {
    if (i === null || i === undefined) {
        i = this.activeSlideI();
    }
    return this.data.info.slides()[i];
};

PresentationStructure.prototype.getFooter = function getFooter(j) {
    var j = typeof (j) === 'number' ? j : this.activeSlideI();
    var all = this.data.info.slides();
    var excluded = all.reduce(function (carry, s, i) {
        if (!s.data.info.footer.enabled) carry.push(i);
        return carry;
    }, []);
    all = all.length;
    j++;
    excluded.map(function (i) {
        if (i < j) j--;
    });
    excluded = excluded.length;
    return 'Слайд ' + (j) + '/' + (all - excluded);
};

PresentationStructure.prototype.addSlide = function addSlide(data) {
    if (data) {
        this.data.info.slides.push(new SlideStructure(data));
    } else {
        var defaultStruct = DefaultSlideStructure()
        defaultStruct.info.header.text(this.data.info.header)
        defaultStruct.info.footer.text(this.data.info.footer)
        this.data.info.slides.push(new SlideStructure(defaultStruct));
    }
};

PresentationStructure.prototype.removeSlide = function removeSlide(i) {
    this.data.info.slides.splice(i, 1);
    var l = this.data.info.slides().length;
    var i = this.activeSlideI();
    if (i >= l) this.activeSlideI(l - 1);
};

PresentationStructure.prototype.moveSlide = function moveSlide(i, up) {
    var slides = this.data.info.slides;
    var s = slides.splice(i, 1)[0];
    slides.splice(i + (up ? -1 : 1), 0, s);
};

PresentationStructure.prototype.getContentsHTML = function getContentsHTML() {
    var slides = this.data.info.slides();
    return "<div class='deck-contents'>\n" +
        slides.map(function (s) {
            return s.getContentsHTML() || '';
        }).filter(function (v) {
            return v
        }).join("\n") +
        "\n</div>";
};
/*======================================================================================================================================
SLIDE OBJECT
======================================================================================================================================*/
function SlideStructure(data) {
    this.data = data || DefaultSlideStructure();
    this.activeFragment = ko.observable();
    this.data.info.attr.class.subscribe(setSlideLayout.bind(this));
};

SlideStructure.prototype.openConfig = function openConfig(fragment) {
    this.activeFragment(fragment);
    MPresentation.CurrentSlotModel(DataConverter.convertSlotFromStructureToModel(this.activeFragment()));
    MPresentation.CurrentSlotTitle(this.activeFragment().data.info.title());
    $('#slot_config_modal').modal('show');
};

SlideStructure.prototype.getContentsHTML = function getContentsHTML() {
    if (!this.data.info.header.enabled()) return;
    var title = "<span>" + this.data.info.title() + "</span>";
    var slots = this.data.info.slots().map(function (f) {
        return f.getContentsHTML();
    }).filter(function (v) {
        return v
    }).join('\n');
    return "<div>\n" + title + (
        slots ?
        "\n<div>\n" + slots + "\n</div>" :
        ""
    ) + "\n</div>";
};

SlideStructure.prototype.saveActiveFragment = function () {
    $('#slot_config_modal').modal('hide');
    DataConverter.convertSlotFromModelToStructure();
    MPresentation.Presentation().getSlide().activeFragment().data.info.title(MPresentation.CurrentSlotTitle());
    MPresentation.LoadSlideContent(MPresentation.Presentation().getSlide(), function () {
        setTimeout(highlightPresentTable, 0);
        setTimeout(scalePresentTable, 0);
        setTimeout(scalePresentChart, 0);
    }, MPresentation.Presentation().activeSlideI());
    MPresentation.Warning('Есть несохраненные изменения');
};

/*======================================================================================================================================
SLOT OBJECT
======================================================================================================================================*/
function SlotStructure(data) {
    this.data = data || DefaultSlotStructure();
}

SlotStructure.prototype.getBGStyle = function getBGStyle() {
    var src = this.data.info.img();
    if (src) return 'background-image: url(' + src + '); background-position: center; background-size: contain; background-origin: content-box; background-repeat: no-repeat;';
};

SlotStructure.prototype.getContentsHTML = function getContentsHTML() {
    var title = this.data.info.title() || this.data.info.document();
    if (title) return "<div>" + title + "</div>";
    return '';
};

SlotStructure.prototype.getFragmentPreviewHtml = function getFragmentPreviewHtml() {
    if (!this.data.info.document()) {
        return '';
    }
    var curDoc = MFolders.FindDocument(this.data.info.document());
    if (curDoc.IsChart) {
        return '<div class="preview-img-container"><img src="/img/line.png"></img></div>';
    } else {
        return '<div class="preview-img-container"><img src="/img/table.png"></img></div>';
    }
}

SlotStructure.prototype.getPreviewStyle = function getPreviewStyle() {
    if (!this.data.info.document()) {
        return '';
    }
    var curDoc = MFolders.FindDocument(this.data.info.document());
    if (curDoc.IsChart) {
        return 'transform-origin:top left;transform:scale(1,1)';
    } else {
        return 'transform-origin:top left;transform:scale(1,1)';
    }
}

SlotStructure.prototype.getLoading = function getLoading() {
    if (!this.data.info.document()) {
        return '';
    }
    return '<div class="preview-img-container"><img src="/css/trobber_48_gray.svg"></div>'
}

/*======================================================================================================================================
DATA CONVERTER
======================================================================================================================================*/
var DataConverter = (new function () {
    var self = this;

    self.PresentationAdapter = {
        IsLoop: '.data.info.reveal.config.loop',
        IsShowNavigation: '.data.info.reveal.config.controls',
        IsAutoPlay: '.data.info.reveal.config.autoSlide',
        AutoPlayInterval: '.data.info.reveal.config.autoSlideInterval',
        CodePresentThema: '.data.info.reveal.theme',
        CodePresentTransitType: '.data.info.reveal.config.transition',
        PresentHeader: '.data.info.header',
        PresenFooter: '.data.info.footer'
    }


    self.SlideAdapter = {
        CodePresentSlideLayout: '.data.info.attr.class',
        PresentSlideHeder: '.data.info.header.text',
        PresentSlideFooter: '.data.info.footer.text',
        NamePresentSlide: '.data.info.title'
    }

    self.SlideLayoutAdapter = {
        'single': '1x1',
        'one-v-one': '2x1',
        'one-h-one': '1x2',
        'two-v-one': '2x1_1',
        'one-v-two': '2x1_2',
        'two-h-one': '1_2x2',
        'one-h-two': '1_1x2',
        'four': '2x2'
    }

    self.SlotAdapter = {
        CodeReport: '.data.info.report',
        CodePeriod: '.data.info.period',
        CodeValuta: '.data.info.valuta',
        CodeDoc: '.data.info.document',
        YearData: '.data.info.year',
        NamePresentSlot: '.data.info.title'
    }

    self.setObjectProperty = function (obj, property, value) {
        if (obj[property] != value) {
            MPresentation.isChanged = true;
        }
        obj[property] = value;
    }

    self.convertPresentFromModelToStructure = function () {
        Object.keys(self.PresentationAdapter).forEach(function (k) {
            eval('MPresentation.Presentation()' + self.PresentationAdapter[k] + '=MPresentation.PresentModel().toJS()["' + k + '"]')
        })
    }

    self.convertSlotFromModelToStructure = function () {
        Object.keys(self.SlotAdapter).forEach(function (k) {
            eval('MPresentation.Presentation().getSlide().activeFragment()' + self.SlotAdapter[k] + '(MPresentation.CurrentSlotModel().toJS()["' + k + '"])')
        })
        MPresentation.Presentation().getSlide().activeFragment().data.info.html('');
    }

    self.convertSlotFromStructureToModel = function (slotStruct) {
        var slotObj = {}
        Object.keys(self.SlotAdapter).forEach(function (k) {
            slotObj[k] = eval('slotStruct' + eval('DataConverter.SlotAdapter.' + k));
        })
        return ModelEdit.Model("presetslot", slotObj);
    }

    self.convertSlotFromObjectToStructure = function (data) {
        var newSlot = DefaultSlotStructure();
        newSlot.info.report(data.CodeReport);
        newSlot.info.period(data.CodePeriod);
        newSlot.info.valuta(data.CodeValuta);
        newSlot.info.document(data.CodeDoc);
        newSlot.info.year(data.YearData);
        newSlot.info.title(data.NamePresentSlot);
        return new SlotStructure(newSlot);
    }

    self.convertSlideFromObjectToStructure = function (data) {
        var getLoadedSlots = function (datas) {
            if (datas.length > 0) {
                var rslots = [];
                datas.forEach(function (e) {
                    rslots.push(DataConverter.convertSlotFromObjectToStructure(e))
                });
                return rslots;
            } else {
                return [DefaultSlotStructure(), DefaultSlotStructure(), DefaultSlotStructure(), DefaultSlotStructure()];
            }
        }
        var newSlide = DefaultSlideStructure();
        newSlide.info.attr.class(_.findKey(self.SlideLayoutAdapter, function (K) {
            return K == data.CodePresentSlideLayout;
        }))
        newSlide.info.header.text(data.PresentSlideHeder);
        newSlide.info.footer.text(data.PresentSlideFooter);
        newSlide.info.title(data.NamePresentSlide);
        newSlide.info.slots(getLoadedSlots(data.slots));
        return new SlideStructure(newSlide);
    }

    self.compareSlideProperty = function (property, propertyName, i) {
        if (property != MPresentation.Present.slides[i][propertyName]) {
            MPresentation.isChanged = true;
        }
        return property;
    }

    self.compareSlotProperty = function (property, propertyName, i, j) {
        if (property != MPresentation.Present.slides[i].slots[j][propertyName]) {
            MPresentation.isChanged = true;
        }
        return property;
    }

    self.getSlots = function (slideIndex, slide) {
        var oldSlots = [];
        try {
            oldSlots = MPresentation.Present.slides[slideIndex].slots;
        } catch (e) {}
        var newSlots = MPresentation.Presentation().data.info.slides()[slideIndex].data.info.slots();
        if (oldSlots.length != newSlots.length) {
            MPresentation.isChanged = true;
        }
        var toUpdate = [];
        var toRemove = [];
        var toAdd = [];
        for (var i = 0; i < oldSlots.length; i++) {
            if (i >= newSlots.length) {
                break;
            }
            toUpdate.push({
                CodePresentSlot: oldSlots[i].CodePresentSlot,
                NamePresentSlot: self.compareSlotProperty(newSlots[i].data.info.title(), "NamePresentSlot", slideIndex, i),
                SNamePresentSlot: self.compareSlotProperty(newSlots[i].data.info.title(), "SNamePresentSlot", slideIndex, i),
                YearData: self.compareSlotProperty(newSlots[i].data.info.year(), "YearData", slideIndex, i),
                CodeDoc: self.compareSlotProperty(newSlots[i].data.info.document(), "CodeDoc", slideIndex, i),
                CodeReport: self.compareSlotProperty(newSlots[i].data.info.report(), "CodeReport", slideIndex, i),
                CodePeriod: self.compareSlotProperty(newSlots[i].data.info.period(), "CodePeriod", slideIndex, i),
                CodeValuta: self.compareSlotProperty(newSlots[i].data.info.valuta(), "CodeValuta", slideIndex, i),
                CodePresentSlide: slide
            });
        }
        if (oldSlots.length >= newSlots.length) {
            while (i < oldSlots.length) {
                toRemove.push(oldSlots[i]);
                i++;
            }
        } else {
            while (i < newSlots.length) {
                var genCode = slide + "_slot_" + Math.random().toString(36).substring(2);
                toAdd.push({
                    CodePresentSlot: genCode,
                    NamePresentSlot: newSlots[i].data.info.title(),
                    SNamePresentSlot: newSlots[i].data.info.title(),
                    YearData: newSlots[i].data.info.year(),
                    CodeDoc: newSlots[i].data.info.document(),
                    CodeReport: newSlots[i].data.info.report(),
                    CodePeriod: newSlots[i].data.info.period(),
                    CodeValuta: newSlots[i].data.info.valuta(),
                    CodePresentSlide: slide
                });
                i++;
            }
        }
        return {
            toRemove: toRemove,
            toUpdate: toUpdate,
            toAdd: toAdd
        }
    }

    self.convertPresentFromStructureToObject = function () {
        Object.keys(self.PresentationAdapter).forEach(function (k) {
            self.setObjectProperty(MPresentation.Present, k, eval("MPresentation.Presentation()" + self.PresentationAdapter[k]))
        })
        self.setObjectProperty(MPresentation.Present, 'CodeDoc', CxCtrl.CodeDoc())
        if (!MPresentation.Present.NamePresent) {
            self.setObjectProperty(MPresentation.Present, 'NamePresent', CxCtrl.CodeDoc() + "_presentation")
            self.setObjectProperty(MPresentation.Present, 'SNamePresent', CxCtrl.CodeDoc() + "_presentation")
        }
        if (!MPresentation.Present.CodePresent) {
            self.setObjectProperty(MPresentation.Present, 'CodePresent', CxCtrl.CodeDoc() + "_presentation")
        }
        var toUpdate = [];
        var toRemove = [];
        var toAdd = [];
        var oldSlides = MPresentation.Present.slides;
        var newSlides = MPresentation.Presentation().data.info.slides();
        if (oldSlides.length != newSlides.length) {
            MPresentation.isChanged = true;
        }
        for (var i = 0; i < oldSlides.length; i++) {
            if (i >= newSlides.length) {
                break;
            }
            toUpdate.push({
                CodePresentSlide: oldSlides[i].CodePresentSlide,
                NamePresentSlide: self.compareSlideProperty(newSlides[i].data.info.title(), "NamePresentSlide", i),
                SNamePresentSlide: self.compareSlideProperty(newSlides[i].data.info.title(), "SNamePresentSlide", i),
                PresentSlideFooter: self.compareSlideProperty(newSlides[i].data.info.footer.text(), "PresentSlideFooter", i),
                PresentSlideHeder: self.compareSlideProperty(newSlides[i].data.info.header.text(), "PresentSlideHeder", i),
                IdxPresent: i,
                CodePresent: MPresentation.Present.CodePresent,
                CodePresentTransitType: MPresentation.Present.CodePresentTransitType,
                CodePresentSlideLayout: self.SlideLayoutAdapter[self.compareSlideProperty(newSlides[i].data.info.attr.class(), "CodePresentSlideLayout", i)],
                slots: self.getSlots(i, oldSlides[i].CodePresentSlide)
            });
        }
        if (oldSlides.length >= newSlides.length) {
            while (i < oldSlides.length) {
                var oldSlide = oldSlides[i];
                oldSlide.slots = {
                    toRemove: oldSlide.slots,
                    toUpdate: [],
                    toAdd: []
                }
                toRemove.push(oldSlide);
                i++;
            }
        } else {
            while (i < newSlides.length) {
                var genCode = MPresentation.Present.CodePresent + "_slide_" + Math.random().toString(36).substring(2);
                toAdd.push({
                    CodePresentSlide: genCode,
                    NamePresentSlide: newSlides[i].data.info.title(),
                    SNamePresentSlide: newSlides[i].data.info.title(),
                    PresentSlideFooter: newSlides[i].data.info.footer.text(),
                    PresentSlideHeder: newSlides[i].data.info.header.text(),
                    IdxPresent: i,
                    CodePresent: MPresentation.Present.CodePresent,
                    CodePresentTransitType: MPresentation.Present.CodePresentTransitType,
                    CodePresentSlideLayout: self.SlideLayoutAdapter[newSlides[i].data.info.attr.class()],
                    slots: self.getSlots(i, genCode)
                });
                i++;
            }
        }
        var slides = {
            toRemove: toRemove,
            toUpdate: toUpdate,
            toAdd: toAdd
        }
        MPresentation.Present.slides = slides;
    }

    return self;
})

ModuleManager.Modules.Presentation = MPresentation;
