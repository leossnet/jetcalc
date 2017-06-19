var MLogin = (new function(){

	var self = this;
	self.base = "/api/modules/login/";

	self.Error = ko.observable(null);
	self.Mode  = ko.observable("Login"); // Login, SetPassword, Recover, Signup, ResetEmailSent, SignupEmailSent

	self.IsLoginInProgress = ko.observable(false);

	self.Mode.subscribe(function(V){
		self.Error(null);
		if (V=="Signup" && !self.Request()){
			var R = MModels.Create("request");
			self.Request(R);
		}
	})

	self.ChangePasswordModal = function(){
		$("#passChangeModal").modal('show');
	}

	self.LoginUser = ko.observable("");
	self.Password  = ko.observable("");
	self.AlienDevice = ko.observable(false);

	self.Request = ko.observable();

	self.Init = function(done){
		MSite.Events.on("initialnavigate",self.ForceRedirect);
		$.getJSON(self.base+"me",function(data){
			if (!data || !data.me) return done();
			if (data.err) return self.Error(data.err);
			MSite.Me(MModels.Create("user",data.me));
			if (data.emulate) MUsers.IsEmulate(true);
			return done();
		})		
	}

	self.Mail = ko.observable("");

	self.Recover = function(){
		$.ajax ({
			url: self.base+"/byemail",
			type:'post',
			data:{username:self.Mail()},
			success:function(data){
				if (data.err) return self.Error(data.err);
				self.IsLoginInProgress(false);
				self.Mode("ResetEmailSent");
			}
		})	
	}

	self.Login = function(){
		$.ajax ({
			url: self.base+"bypassword",
			type:'post',
			data:{
				username:self.LoginUser(),
				password:self.Password(),
				alienDevice:self.AlienDevice()},
			success:function(data){
				if (data.err) return self.Error(data.err);
				self.LoginComplete();
			}
		})
		return false;
	}

	self.NewPasswordRepeat = ko.observable("");
	self.NewPassword       = ko.observable("");

	self._updatePassword = function(done){
		self.Error(null);
		if (self.NewPasswordRepeat().trim()!=self.NewPassword().trim()) return self.Error("passwordsaredifferent");
		//if (['p-weak','p-veryweak'].indexOf(self.PassStrength(self.NewPassword()))!=-1) return self.Error("passwordisweak");
		$.ajax ({
			url: self.base+"setpassword",
			type:'post',
			data:{
				password:self.NewPassword(),
			},
			success:function(data){
				if (data.err) return self.Error(data.err);
				self.NewPassword("");
				self.NewPasswordRepeat("");
				return done();
			}
		})
	}

	self.SetPassword = function(){
		self._updatePassword(function(){
			self.IsLoginInProgress(true);
			MSite.Init(function(){
				pager.navigate("/");
				self.Mode('Login');
				self.IsLoginInProgress(false);
			})					
		})
	}

	self.ChangePassword = function(){
		self._updatePassword(function(){
			$("#passChangeModal").modal('hide');
		})
	}

	self.LoginComplete = function(){
		self.Error(null);
		self.IsLoginInProgress(true);
		MSite.Init(function(){
			MSocket.Init(function(){});
			if (MSite.Me().DoResetPass()){
				self.IsLoginInProgress(false);
				pager.navigate("/login");
				self.Mode('SetPassword');
			} else {
				self.Mode('Login');				
				pager.navigate('/');
			}
		})		
	}

	self.Logout = function(){
		$.ajax ({
			url: self.base+"logout",
			success:function(data){
				MSite.Me(null);
				MSocket.Destroy();
				self.IsLoginInProgress(false);
				pager.navigate('/login');
			}
		})
	}

	self.RequestFields = ["NameUser","TabNum","JobTitle","Mail","MobilePhone","WorkPhone","Birthday","NameObjs","Comments"];

	self.IsSignupEmailSent = ko.observable(false);

	self.Signup = function(){
		var Request = self.Request().toJS();
		self.Error(null);
		var Missed = [];
		self.RequestFields.forEach(function(F){
			if (F !="Comments" && (!Request[F] || !Request[F].trim().length)){
				Missed.push(Tr(F));
			}
		})
		if (Missed.length){
			return self.Error("Заполните поля: "+Missed.join(", "));
		}
		$.ajax ({
			url: self.base+"signup",
			method:'post',
			data:Request,
			success:function(data){
				if (data.err) return self.Error(data.err);
				self.IsLoginInProgress(false);
				self.Mode("SignupEmailSent");
			}
		})
	}

	self.ProfileFields = ['UserPhoto','NameUser','WorkPhone','MobilePhone','Mail','Comment'];

	self.SaveImage = function(done){
		var Image = MSite.Me().UserPhoto();
		if (Image && typeof Image == 'object'){
			MModels.SaveFileToGfs(Image,function(err,id){
				if (err) return done(err);
				MSite.Me().UserPhoto(id);
				return done();
			})
		} else {
			return done();
		}
	} 

	self.UpdateProfile = function(){
		self.SaveImage(function(err){
			if (err) return self.Error(err);
			var Data = _.pick(MSite.Me().toJS(),self.ProfileFields);
			MSite.Me().UserPhoto(null);
			$.ajax ({
				url: self.base+"profile",
				method:'put',
				data: Data,
				success:function(data){
					if (data.err) return self.Error(data.err);
					self.Init(function(){
						swal("","Профиль обновлен","success");
					})
				}
			})
		})
	}

	self.PassStrength = function(Password){
        var cl = "p-none";
        if (Password.length){
	        var Weights = {
	        	Cap: Password.match(/[A-ZА-Я]/)!=null? 1:0,
	        	Low: Password.match(/[a-zа-я]/)!=null? 1:0,
	        	Num: Password.match(/[0-9]/)!=null? 1:0,
	        	Spe: Password.match(/[!,%,&,@,#,$,^,*,?,_,~]/)!=null? 2:0,
	        	Len: Password.length>8? 3:0,
	        }
	        var p = (_.sum(_.values(Weights))/8)*100;	        
	        if (p<30) cl = "p-veryweak"; 
	        else if (p<50) cl = "p-weak"; 
	        else if (p<80) cl = "p-medium";
	        else  cl = "p-strong";
	     }
	     return cl;
	}
	self.Events = new EventEmitter();

	self.ForceRedirect = function(){
		var DoRedirect = false;
		if (!MSite.Me() && MBreadCrumbs.CurrentRoute()[0]=="error"){
			;
		} else if (!MSite.Me() && MBreadCrumbs.CurrentRoute()[0]!="login" ){
			self.Mode("Login");
			DoRedirect = true;
		} else if (MSite.Me() && MBreadCrumbs.CurrentRoute()[0]=="login"){
			pager.navigate('/');
		} 
		// Установка пароля
		if (MSite.Me() && MSite.Me().DoResetPass()){
			DoRedirect = true;
			self.Mode("SetPassword");
		}
		if (DoRedirect){
			self.Events.emit("loginredirect");
			pager.navigate('/login');
		}
	}


	return self;
})

ModuleManager.Modules.Login = MLogin;

ko.bindingHandlers.PasswordStrength = {
    update: function(element, valueAccessor, allBindingsAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var Password = value+"";
        var cl = MLogin.PassStrength(Password);
        $(element).removeClass("p-none p-veryweak p-weak p-medium p-strong").addClass(cl);
    } 
};  

ko.bindingHandlers.user_avatar = {
    update: function(element, valueAccessor, allBindingsAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var img = $(element).find("img");
        if (!_.isEmpty(value)){
        	if (!img.length){
        		$(element).append("<img class='nav-user-photo'></img>");	
        		img = $(element).find("img");
        	}        	
        	img.attr("src",'/api/gfs/'+value)        	
        } else {
        	img.remove();
        }
    } 
};  
