var MModelExtractor = (new function () {

    var self = this;

    self.IsLoading = ko.observable(false);

    self.IsAvailable = function () {
        return true;
    }

    self.Error = ko.observable(null);

    self.Init = function () {}

    self.base = '/api/modules/modelextractor/';

    self.extractedModel = ko.observableArray([]);

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

    self.used_ids = ko.observableArray([]);

    self.ExtractModel = function (obj) {
        self.used_ids([]);
        var modelCode = obj.Code;
        var ret = obj.toJS ? obj.toJS() : obj;
        var objects_for_extract = [];
        _.keys(ret).forEach(function (k) {
            if (k.startsWith("Code") && ret[k] != modelCode) {
                var model = k.substr(4).toLowerCase();
                var query = {};
                query[k] = ret[k];
                objects_for_extract.push({
                    model: model,
                    query: query,
                    selfCode: k,
                })
            }
            if (k.startsWith("Link_")) {
                ret[k].forEach(function (lk) {
                    var model = k.substr(5).toLowerCase();
                    var query = {
                        _id: lk
                    };
                    /*objects_for_extract.push({
                        model: model,
                        query: query,
                        selfCode: 'code' + model,
                    })*/
                })
            }
        })
        var extracted = {};
        extracted[obj.ModelName] = ret;
        self.extractedModel.push(extracted);
        async.each(objects_for_extract, self._extractModel, function () {})
    }

    self._extractModel = function (el) {
        console.log(el)
        self.LoadModel(el.model, el.query, function (obj) {
            if (!obj || obj.err) {
                return;
            }
            if (self.used_ids.indexOf({id: obj._id, model: el.model.toLowerCase()}) != -1) {
                return;
            }
            self.used_ids.push({id: obj._id, model: el.model.toLowerCase()});
            var objects_for_extract = [];
            _.keys(obj).forEach(function (k) {
                if (k.startsWith("Code") && k.toLowerCase() != el.selfCode.toLowerCase()) {
                    var model = k.substr(4).toLowerCase();
                    var query = {};
                    query[k] = obj[k];
                    objects_for_extract.push({
                        model: model,
                        query: query,
                        selfCode: k,
                    })
                }
                if (k.startsWith("Link_")) {
                    obj[k].forEach(function (lk) {
                        var model = k.substr(5).toLowerCase();
                        var query = {
                            _id: lk
                        };
                        objects_for_extract.push({
                            model: model,
                            query: query,
                            selfCode: 'code' + model,
                        })
                    })
                }
            })
            var extracted = {};
            extracted[el.model] = obj;
            self.extractedModel.push(extracted);
            async.each(objects_for_extract, self._extractModel, function () {})
        })
    }

    return self;
})

ModuleManager.Modules.ModelExtractor = MModelExtractor;
