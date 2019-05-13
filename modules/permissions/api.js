var router = require('express').Router();
var HP = require(__base + 'lib/helpers/lib.js').Permits;
var Bus = require(__base + "src/bus.js");
var SocketManager = require(__base + "src/socket.js");

Bus.On("FLUSH:JPERMISSIONS", SocketManager.emitEventAll.bind(SocketManager, "permissions_refresh"));

router.get('/current', function(req, res, next) {
    return res.json(req.session.permissions || {});
})

router.post('/refresh', function(req, res, next) {
     var PL = require(__base + '/src/permloader.js');
     var P = new PL(req.user.CodeUser);
     P.Load(function (err, Perms) {
        req.session.permissions = Perms;
        req.session.save(function (err) {
            return res.json({});
        });
     })
})


module.exports = router;
