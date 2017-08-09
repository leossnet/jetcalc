var mongoose   = require('mongoose');
var router     = require('express').Router();
var _          = require('lodash');
var async      = require('async');
var socket     = require(__base+'/src/socket.js');
var moment     = require('moment');
var RabbitMQClient = require(__base + "src/rabbitmq_wc.js").client;
var config = require(__base+"config.js");
var LIB        = require(__base+'lib/helpers/lib.js');
var HP = LIB.Permits;


var rabbitPrefix = config.rabbitPrefix;

var PDFClient = new RabbitMQClient({
    queue_id: rabbitPrefix+"pdf_convert"
})

PDFClient.connect(function(err) {
	if (err) console.log("pdf_convert connect error",err);
})

var FileManagerHelper = (new function(){
	var self = this;

	self.ConvertToPDF = function(HashCode,done){
        PDFClient.sendMessage({ file_id: HashCode },done);
	}

	self.LoadInfo = function(done){
		var NeedToLoad = ["Period","Div"];
		var Form = require(__base+'/classes/calculator/Form.js');
		var Tasks = {};
		NeedToLoad.forEach(function(HelperName){
			Tasks[HelperName] = function(HelperName){
				return function(cb){
					var Helper = new Form[HelperName]({UseCache:true});
					Helper.get(cb);
				}
			}(HelperName);
		})
		async.parallel(Tasks,function(err,Helper){
			return done(err,Helper);
		})
	}

	self.Tree = {};

	self.BuildTree = function(Files,done){
		self.LoadInfo(function(err,Helper){
			if (err) return done(err);
			var TreeHelper = require(__base+'/lib/helpers/tree.js');
			var Tree = TreeHelper.Tree;
			self.Tree = new Tree("ROOT",{});
			// Группировка Дивизион -> Объект учета -> Период -> File			
			var Objs = _.map(Files,"CodeObj");
			var Periods = _.map(Files,"CodePeriod");
			var ObjInfo = {}, DivInfo = {}, ObjByDiv = {};
			Objs.forEach(function(CodeObj){
				var I = Helper.Div[CodeObj];
				ObjInfo[CodeObj] = _.pick(I,["CodeObj","NameObj"]);
				DivInfo[CodeObj] = _.pick(I,["CodeDiv","NameDiv","IndexDiv"]);
				ObjByDiv[CodeObj] = I.CodeDiv;
			})
			var Divs = _.sortBy(_.values(DivInfo),"IndexDiv");
			var Objs = _.sortBy(_.values(ObjInfo),"NameObj");
			var AddedDivs = [];
			Divs.forEach(function(D){ 
				if (AddedDivs.indexOf(D.CodeDiv)==-1){
					self.Tree.add (D.CodeDiv, {Name:D.NameDiv,Type:'Div'}, 'ROOT', self.Tree.traverseBF); 
					AddedDivs.push(D.CodeDiv);
				}				
			});
			Objs.forEach(function(O){ 
				self.Tree.add (O.CodeObj, {Name:O.NameObj,Type:'Obj'}, ObjByDiv[O.CodeObj], self.Tree.traverseBF);
			});
			var PeriodsInfo = {}; 
			Periods.forEach(function(P){
				var I = Helper.Period[P];
				PeriodsInfo[I.CodePeriod] = _.pick(I,["Name","EndDate","MCount"]);
				PeriodsInfo[I.CodePeriod].Index = parseInt(moment(I.EndDate).format("MMDD"));
			}) 
			var Indexed = {};
			Files.forEach(function(F){
				if (!Indexed[F.CodeObj])Indexed[F.CodeObj] = [];
				F.Name = F.NameFile;
				F.I1 = PeriodsInfo[F.CodePeriod].Index;
				F.I2 = PeriodsInfo[F.CodePeriod].MCount;
				Indexed[F.CodeObj].push(F);
			})
			for (var CodeObj in Indexed){
				Indexed[CodeObj] = _.sortBy(Indexed[CodeObj],["I1","I2"]);
				var UsedPeriods = [];
				Indexed[CodeObj].forEach(function(File){
					var PeriodCode = [CodeObj,File.CodePeriod].join("_");
					if (UsedPeriods.indexOf(PeriodCode)==-1){
						self.Tree.add (PeriodCode, {Name:[File.CodePeriod,PeriodsInfo[File.CodePeriod].Name].join(". "),Type:'Period'}, CodeObj, self.Tree.traverseBF);
						UsedPeriods.push(PeriodCode);
					}
					var FInf = _.omit(File,["I1","I2"]);
					FInf.DateDoc = moment(FInf.DateDoc).format('DD.MM.YYYY HH:mm');

					self.Tree.add (File.CodeFile, _.merge(FInf,{Type:'File'}), PeriodCode, self.Tree.traverseBF);
				})
			}
			return done(err,self.Tree.getFlat());
		})
	}
	return self;
})


router.get('/filebycode',  function(req,res,next){
	mongoose.model("file").findOne({CodeFile:req.query.CodeFile}).isactive().lean().exec(function(err,File){
		if (!File) err = err || "Файл не найден";
		if (err) return next(err);
		return res.json(File);
	})
})



router.get('/count', function(req,res,next){
	mongoose.model("file").count({CodeDoc:req.query.Context.CodeDoc,YearData:parseInt(req.query.Context.Year)}).isactive().exec(function(err,Counter){
		return res.json(Counter);
	})
})


router.get('/:CodeDoc',  function(req,res,next){
	var Objs = HP.AvObj(req.session.permissions); 
	if (_.isEmpty(Objs)) return next("NoPermissionObjs");
	mongoose.model("file").find({CodeDoc:req.params.CodeDoc,CodeObj:{$in:Objs},YearData:parseInt(req.query.Context.Year)}).isactive().lean().exec(function(err,Files){
		if (err) return next(err);
		if (!Files.length) return res.json([]);
		FileManagerHelper.BuildTree(Files,function(err,TreeArr){
			if (err) return next(err);
			return res.json(TreeArr);
		})
	})
})



router.delete('/:id',  HP.TaskAccess("IsFileRemover") ,function(req,res,next){
	mongoose.model("file").findOne({_id:req.params.id}).isactive().exec(function(err,File){
		if (err) return next(err);
		if (!File) return next("FileNotFound");
		File.remove(req.user.CodeUser,function(err){
			if (err) return next(err);
			return res.json({});
		})
	})
})



router.post('/',  function(req,res,next){
	var UserCode = req.user.CodeUser;
	var GetFile = function(Info,done){
		var FileModel = mongoose.model('file');
		if (!Info._id){
			var F = new FileModel(Info);
			return done(null,F);
		} else {
			FileModel.findOne({_id:Info._id}).isactive().exec(function(err,F){
				if (!F) {
					F = new FileModel(Info);
				} else {
					for (var K in Info) F[K] = Info[K];
				}
				return done(err,F);
			})			
		}
	}
	GetFile(_.merge(req.body.File,{DateDoc:Date.now(),CodeUser:UserCode}),function(err,F){
		if (err) return next(err);
		var NeedToConvert = true;
		if (F.NameFile.indexOf(".pdf")>=0){
			F.PDF = F.HashCode;
			NeedToConvert = false;
		}
		F.save(UserCode,function(err){
			if (err) return next(err);
			if (!NeedToConvert) return res.json({});
			FileManagerHelper.ConvertToPDF(F.HashCode,function(err,PDF){
				if (err){
					console.log("PDF GOT",err,PDF);
				}
				if (err) return next(err);
				FileModel.findByIdAndUpdate(F._id,{PDF:PDF}).exec(function(err){	
					if (err) return next(err);
					return res.json({});
				})
			})
		})
	})
})



module.exports = router