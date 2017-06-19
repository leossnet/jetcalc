var config = require('../config.js'),
	mailer = require('nodemailer'),
	providers = require('nodemailer-wellknown'),
	transport = mailer.createTransport({
     	service: 'Yandex',
     	auth: {
        	user: config.mailer.user,
        	pass: config.mailer.pass
    	}
	});

exports = module.exports = {

	sendEmail:function(email, subject, text, done){
		var mailOptions = {
   			from: config.mailer.from.name+'<'+config.mailer.from.email+'>',
    		to: email,
    		subject:subject,
    		html: text
		};
		transport.sendMail(mailOptions, done);
	}

}

