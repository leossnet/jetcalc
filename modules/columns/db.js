var mongoose = require('mongoose');
var _ = require('lodash');

module.exports = {
    models: {},
    schema: {
        header: function(schema) {
            schema.pre('save', function(next, CodeUser, done) {
                var self = this;
                mongoose.model("header").find({}).isactive().lean().exec(function(err, Headers) {
                    var max = 20,
                        indexed = {};
                    Headers.forEach(function(H) {
                        indexed[H.CodeHeader] = H.CodeParentHeader;
                    })
                    indexed[self.CodeHeader] = self.CodeParentHeader;
                    var _p = function(CodeHeader) {
                        console.log("Cheking", CodeHeader);
                        if ((--max) <= 0) return false;
                        if (indexed[CodeHeader]) return _p(indexed[CodeHeader]);
                        return true;
                    }
                    console.log(">>>>>>>>", _p(self.CodeHeader))
                    if (!_p(self.CodeHeader)) {
                        return done("Рекурсия в дереве заголовков");
                    }
                    return next();
                })

            });
            return schema;
        }
    }
}
