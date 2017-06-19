var router = require('express').Router();
var HP = require(__base+'lib/helpers/lib.js').Permits; 

router.get('/current', function(req,res,next){
	return res.json(req.session.permissions||{});
})


module.exports = router;