var MModelExtractor = (new function () {

    var self = this;

    self.IsLoading = ko.observable(false);

    self.IsAvailable = function () {
        return true;
    }

    self.Error = ko.observable(null);

    self.Init = function () {}

    self.base = '/api/modules/modelextractor/';

    self.LoadModel = function (model, query, done) {
        $.ajax({
            url: self.base + "search",
            method: 'post',
            data: {
                model: model,
                query: query,
            },
            success: function (response) {
                if (!response.err) {
                    done && done(response);
                } else {
                    done && done();
                }
            },
            error: function (err) {
                done && done();
            }
        })
    }

    self.ExtractModel = function (model, query) {
        $.ajax({
            url: self.base + "extract",
            method: 'get',
            data: {
                model: model,
                query: query,
            },
            success: function (response) {},
            error: function (err) {}
        })
    }

    return self;
})

ModuleManager.Modules.ModelExtractor = MModelExtractor;
