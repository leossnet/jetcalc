var LeftMenu = (new function () {
    var self = this;

    self.IsMenuToggled = ko.observable(false, {
        persist: "IsLeftMenuToggled"
    });
    self.ToggleMenu = function () {
        self.IsMenuToggled(!self.IsMenuToggled());
    }

    return self;
})

var RightMenu = (new function () {
    var self = this;

    self.IsShow = ko.observable(false);

    self.IsMenuToggled = ko.observable(true, {
        persist: "IsRightMenuToggled"
    });

    self.ToggleMenu = function () {
        self.IsMenuToggled(!self.IsMenuToggled());
    }

    return self;
})

var MSite = (new function () {

    var self = this;

    self.Events = new EventEmitter();

    self.FlashButton = function (icon) {
        var marks = $("i." + icon + ":visible").parent();
        marks.addClass("marked");
        setTimeout(function () {
            marks.removeClass("marked");
        }, 500)
    }

    self.Init = function (done) {
        ModuleManager.Load(function () {
            ModuleManager.Init(function () {
                self.Events.emit("initauth");
                return done && done();
            })
        })
    }

    self.Me = ko.observable(null);

    self.ReOpenUrl = function () {
        var CurrentUrl = window.location.href;
        var Host1 = 'http://jetcalc.jt.jetstyle.ru';
        var Host2 = 'http://dev.jetcalc.com';
        CurrentUrl = (CurrentUrl.indexOf(Host2) === 0) ? CurrentUrl.replace(Host2, Host1) : CurrentUrl.replace(Host1, Host2);
        console.log(CurrentUrl);
    }

    self.AnnounceTimeout = {
        ctrls: null,
        scroll: null,
        addrecord: null,
        addrecordtemplate: null,
        refresh: null
    };

    self.AnnounceRefresh = function (noCache) {
        self.FlashButton("fa-refresh");
        if (self.AnnounceTimeout.refresh) clearTimeout(self.AnnounceTimeout.refresh);
        self.AnnounceTimeout.refresh = setTimeout(function () {
            self.Events.emit("refresh", noCache);
            self.AnnounceTimeout.refresh = null;
        }, 500);
    }

    self.AnnounceNew = function () {
        self.FlashButton("fa-file-o");
        if (self.AnnounceTimeout.addrecord) clearTimeout(self.AnnounceTimeout.addrecord);
        self.AnnounceTimeout.addrecord = setTimeout(function () {
            self.Events.emit("addrecord");
            self.AnnounceTimeout.addrecord = null;
        }, 500);
    }

    self.AnnounceNewTemplate = function () {
        self.FlashButton("fa-file-text-o");
        if (self.AnnounceTimeout.addrecordtemplate) clearTimeout(self.AnnounceTimeout.addrecordtemplate);
        self.AnnounceTimeout.addrecordtemplate = setTimeout(function () {
            self.Events.emit("addrecordtemplate");
            self.AnnounceTimeout.addrecordtemplate = null;
        }, 500);
    }

    self.AnnounceCtrS = function () {
        self.FlashButton("fa-save");
        if (self.AnnounceTimeout.ctrls) clearTimeout(self.AnnounceTimeout.ctrls);
        self.AnnounceTimeout.ctrls = setTimeout(function () {
            self.Events.emit("save");
            self.AnnounceTimeout.ctrls = null;
        }, 500);
    }

    self.AnnounceScrollBottom = function () {
        if (ModuleManager.IsLoading()) return;
        self.FlashButton("fa-angle-double-up");
        if (self.AnnounceTimeout.scroll) clearTimeout(self.AnnounceTimeout.scroll);
        self.AnnounceTimeout.scroll = setTimeout(function () {
            self.Events.emit("scroll-bottom");
            self.AnnounceTimeout.scroll = null;
        }, 500);
    }

    self.Start = function () {
        ko.options.deferUpdates = true;
        self.Init(function () {
            self.Events.emit("inited");
            pager.useHTML5history = true;
            pager.Href5.history = History;
            pager.extendWithPage(self);
            ko.applyBindings(self, $('html')[0]);
            pager.startHistoryJs();
            pager.onBindingError.add(function (event) {
                if (window.console && window.console.error) {
                    window.console.error(event);
                }
            })
            self.Events.emit("initialnavigate", window.location.search ? window.location.search.queryObj() : {});
            $("body").removeClass("loading");
            document.addEventListener("keydown", function (e) {
                if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
                    e.preventDefault();
                    self.AnnounceCtrS();
                }
                if (e.keyCode == 120) {
                    e.preventDefault();
                    self.AnnounceRefresh((navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey));
                }
                if (e.keyCode == 45 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
                    if (e.shiftKey) {
                        e.preventDefault();
                        self.AnnounceNewTemplate();
                    } else {
                        e.preventDefault();
                        self.AnnounceNew();
                    }
                }
            }, false);
            $(window).scroll(function () {
                if ($(window).scrollTop() == $(document).height() - $(window).height()) {
                    self.AnnounceScrollBottom();
                }
            });
            MSocket.RegisterEvent('reinit', ModuleManager.Init);
            MSocket.Start('reinit');
            moment.locale('ru');
        });
        History.Adapter.bind(window, 'statechange', function () {
            self.Events.emit("navigate");
            window.scrollTo(0, 0);
        });
        window.onbeforeunload = function () {
            self.Events.emit("unload");
        };
    }
})


$(document).includeReady(function () {
    MSite.Start();
});
