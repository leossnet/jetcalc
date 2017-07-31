var MTranslate = (new function () {

    var self = this;

    self.IsLoading = ko.observable(false);

    self.IsAvailable = function () {
        return true;
    }

    self.Error = ko.observable(null);

    self.Init = function () {}

    self.Translations = ko.observable({});

    self.OpenTranslateTab = function () {
        var translations = {};
        _.keys(Lang.OnPage).forEach(function (k) {
            //if (k.split('.').length >= 1 && k.split('.')[k.split('.').length - 1] === Lang.OnPage[k]) {
            translations[k] = Lang.OnPage[k];
            //}
        })
        self.Translations(translations);
        $("#translate_modal").modal('show');
    }

    self.SaveTranslateTab = function () {
        var Update = {};
        _.keys(self.Translations()).forEach(function (k) {
            if (k.split('.').length > 1) {
                var module = k.split('.')[0] // + 's';
            } else {
                var module = 'default';
            }
            if (k.split('.')[k.split('.').length - 1] != self.Translations()[k]) {
                if (!Update[module]) {
                    Update[module] = {};
                }
                Update[module][k.split('.')[k.split('.').length - 1]] = self.Translations()[k];
            }
        })
        $("#translate_modal").modal('hide');
        self.SendTranslations(Update);
    }

    self.base = '/api/modules/translate/';

    self.LoadTranslations = function (done) {
        $.getJSON(self.base + "clientsettings", function (data) {
            Lang.Strs = _.merge(Lang.Strs, data);
            return done && done();
        })
    }

    self.SendTranslations = function (data, done) {
        $.ajax({
            url: self.base + "clientsettings",
            method: 'post',
            data: data,
            success: function () {
                self.LoadTranslations(done);
            }
        })
    }

    return self;
})

ModuleManager.Modules.Translate = MTranslate;
