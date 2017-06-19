var mongoose   = require('mongoose');
var _          = require('lodash');
var async      = require('async');

var router   = require('express').Router();
var config   = require(__base+'/config.js');
var rabbitPrefix = config.rabbitPrefix;



var RabbitMQClient = require(__base + "src/rabbitmq_wc.js").client;
var HP = require(__base+'lib/helpers/lib.js').Permits;  



var Md_Helper = (new function(){

	var self = this;

	self.bookPath = config.dir+'/gitbook/';

	self.defaultSummary = '# Оглавление\n\n'+
						'* [Общие положения системы](README.md)\n'+
						'* [Документы JETCALC]()\n';


	self.getSummaryPage = function(done){
		var DocPage = mongoose.model('docpage');
		DocPage.findOne({Code:"SUMMARY"}).exec(function(err,Page){
			if (!Page){
				Page = new DocPage({Code:"SUMMARY",Name:"SUMMARY",Text:self.defaultSummary});
				Page.save(function(err){
					return done(err,Page);
				})
			} else {
				return done(err,Page);
			}
		})
	}

	self.UpdateToc = function(done){
		self.getSummaryPage(function(err,SummaryPage){
			var DocPage = mongoose.model('docpage');
			DocPage.find({Code:{$nin:["SUMMARY","README"]}}).lean().exec(function(err,Pages){
				SummaryPage.Text = self.defaultSummary;
				Pages.forEach(function(P){
					SummaryPage.Text +=  '\n\t* ['+P.Name+']('+P.Code+'.md)';
				})
				rebuildManual();
				SummaryPage.save(done);
			})
		})
	}

	return self;
})

var gitbook_generator_client = new RabbitMQClient({
    queue_id: rabbitPrefix+"gitbook"
})

gitbook_generator_client.connect(function(err) {
 	if (err) console.log(err);
})

var rebuildTimer = null;
var rebuildManual = function(){
	if (rebuildTimer) return;
	rebuildTimer = setTimeout(function(){
        gitbook_generator_client.sendMessage(
            { book_path: Md_Helper.bookPath },
            function(err, result) {
                if(err) {
                    return console.error(err);
                }
            }
        )
        clearTimeout(rebuildTimer);
        rebuildTimer = null;
	},5000);
}



// Получение страницы документации по коду документа
router.get('/page/:code', function(req, res) {
	var DocPage = mongoose.model('docpage');
	DocPage.findOne({Code:req.params.code},'-_id Code Name Text').lean().exec(function(err,P){
		if (P){
			return res.json({status:'ok',page:P});
		} else {
			return res.json({status:'er'});
		}
	})
})

// Сохранение страницы
router.post('/page/:code',  HP.TaskAccess("IsDocumentationWriter"),  function(req, res, next) {
	var DocPage = mongoose.model('docpage');
	DocPage.findOne({Code:req.params.code},'Code Name Text').exec(function(err,P){
		var DoToc = false;
		if (!P) {
			P = new DocPage();
			DoToc = true;
		}
		P.Code = req.params.code;
		P.Name = req.body.Name;
		P.Text = req.body.Text;
		P.save(function(err){
			if (err) return next(err);
			Md_Helper.UpdateToc(function(err){
				if (err) return next(err);
				return res.json({});
			})
		})
	})
})


// Download Manual in Selected format
router.get('/pdf', function(req, res) {
	var file = config.dir + '/gitbook/book.pdf';
  	res.download(file);
});

router.get('/epub', function(req, res) {
	var file = config.dir + '/gitbook/book.epub';
  	res.download(file);
});


module.exports = router;
