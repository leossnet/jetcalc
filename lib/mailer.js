var config = require('../config.js'),
	mailer = require('nodemailer'),
	providers = require('nodemailer-wellknown'),
	transport = mailer.createTransport(config.mailer.transport);

exports = module.exports = {

	sendEmail:function(email, subject, text, done){
        if (process.env.NODE_ENV!='production') {
            email = config.adminmail;
        }
		var mailOptions = {
   			from: config.mailer.from.name+'<'+config.mailer.from.email+'>',
    		to: email,
    		bcc: config.adminmail,
    		subject:subject,
    		html: text
		};
		transport.sendMail(mailOptions, done);
	}

}

