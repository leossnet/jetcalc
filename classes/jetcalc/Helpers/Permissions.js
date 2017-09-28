var async = require('async');
var mongoose = require('mongoose');
var moment = require('moment');
var _ = require('lodash');
var Base = require(__base + 'classes/jetcalc/Helpers/Base.js');


var PermissionsHelper = (new function() {

    var self = new Base("JPERMISSIONS");

    self.Fields = {
        role: ["-_id", ],
        task: ["-_id", ],
    }

    self.SubscribeChanges(_.keys(self.Fields));

    return self;
})



module.exports = PermissionsHelper;
