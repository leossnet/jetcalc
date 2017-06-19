var passport = require('passport');
var LocalStrategy  = require('passport-local').Strategy;
var mongoose = require('mongoose');
var event = require('events').EventEmitter;

passport.Events = new event();

passport.use(new LocalStrategy(
  function(username, password, done) {
    username = (username+'').toLowerCase().trim(); 
    mongoose.model('user').findOne({ LoginUser: username }, 'LoginUser name PassHash PassSalt socket IsActive IsConfirmed Link_userpermit').isactive().exec(function (err, user) {
      if (err) { 
        passport.Events.emit('localauth',{status:"error",message:err,username:username});
        return done(err); 
      }
      if (!user) {
        passport.Events.emit('localauth',{status:"error",message:"wrongusername",username:username});
        return done(null, false, { message: 'wrongusername' });
      }
      if (!user.IsConfirmed) {
        passport.Events.emit('localauth',{status:"error",message:"notconfirmed",username:username});
        return done(null, false, { message: 'notconfirmed' });
      }
      if (!user.checkPassword(password)) {//
        passport.Events.emit('localauth',{status:"error",message:"wrongpassword",username:username});
        return done(null, user.id, { message: 'wrongpassword' });
      }
      passport.Events.emit('localauth',{status:"success",user:user._id,username:username});
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
	done(null, user._id);
});

passport.deserializeUser(function(id, done) {
	mongoose.model('user').findById(id, function(err, user) {
		done(err, user);
	});
});


module.exports = passport;