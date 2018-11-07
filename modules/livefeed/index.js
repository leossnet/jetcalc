var MLiveFeed = (new function(){

    var self = new Module("livefeed");

    self.NewFeed = ko.observable(null);

    self.IsWriting = ko.observable(false);

    self.Groups = ko.observableArray();
    self.Roles = ko.observableArray();

    self.RemoveVariant = function(index){
        this.Options.splice(index,1);
    }

    self.SkipMessages = ko.observable(0);

    self.MessageTypes = {
        "Critical":"fa-bug btn-danger",
        "Announcement":"fa-star btn-warning",
        "Message":"fa-newspaper-o btn-success",
        "CalendarOpen":"fa-newspaper-o btn-success",
        "WorkflowMessage":"fa-newspaper-o btn-success"
    };

    self.AddVariant = function(){
        this.Options.push("");
    }

    self.Icon = function(Type){
        Type = Type||self.NewFeed().MessageType();
        return self.MessageTypes[Type];
    }

    self.EditMessage = function(data){
        self.NewFeed(MModels.Create("lfmessage",data));
        self.OpenModal();
    }

    self.HighLight = ko.observable(false);

    self.Read = function(){
        pager.navigate("/");
        self.HighLight(true);
        setTimeout(self.HighLight.bind(self,false),1000);
    }

    self.Init = function(done){
        self.LoadLiveFeed();
        MSocket.RegisterEvent("livefeedupdate",self.UpdateFeed);
        MSocket.Start ("livefeedupdate");
        MSite.Events.on("scroll-bottom",self.LoadMore);
        return done();
    }


    self.UpdateFeed = function(data){
        switch(data.type){
            case 'added':
                self.SkipMessages(0);
                self.LoadLiveFeed();
            break;
            case 'update':
            case 'delete':
                var Feeds = self.Feeds(), doUpdate = false;
                for (var K in Feeds){
                    var i = _.findIndex(Feeds[K],{_id:data.id});
                    if (i!=-1){
                        if (data.type=='delete'){
                            Feeds[K].splice(i,1);
                        } else {
                            Feeds[K][i] = data.feed;
                        }
                        doUpdate = true;
                    }
                }
                if (doUpdate) self.Feeds(Feeds);
            break;
        }
    }

    self.Feeds = ko.observable(null);
    self.Total = ko.observable(0);

    self.LoadLiveFeed = function(){
        self.rGet("list",{skip:self.SkipMessages()},function(data){
            if (self.SkipMessages()){
                var Old = self.Feeds() || {};
                for (var K in data.feeds){
                    if (Old[K]) Old[K] = Old[K].concat(data.feeds[K]);
                    else Old[K] = data.feeds[K];
                }
                self.Feeds(Old);
            } else {
                self.Feeds(data.feeds);
            }
            self.Total(data.total);
        })
    }

    self.LoadMore = function(){
        var LoadedCount = _.flatMap(MLiveFeed.Feeds()).length;
        if (self.Total()>LoadedCount){
            self.SkipMessages(LoadedCount);
            self.LoadLiveFeed();
        }
    }

    self.StartNewMessage = function(){
        self.NewFeed(MModels.Create("lfmessage"));
        self.OpenModal();
    }

    self.OpenModal = function(){
        self.Error(null);
        setTimeout(self.IsWriting.bind(self,true),500);         // починить биндинг
        $("#newFeedModal").modal('show');
        $("#newFeedModal").on('hidden.bs.modal', function(){
            $("#newFeedModal").off('hidden.bs.modal');
            self.IsWriting(false);
        })  
    }

    self.ConfirmRead = function(data){
        if (typeof data.toJS == 'function') data = data.toJS();
        if (MSite.Me().InAttentive() &&  data.HasQuestion){
            self.ShowQuestion(data);
        } else {
            self.DoConfirm(data);
        }
    }

    self.DoConfirm = function(data){
        self.rPut("confirm/"+data._id,{},function(){
            self.SkipMessages(0);
            self.LoadLiveFeed();
        })
    }

    self.UserAnswer = ko.observableArray();
    self.QuestionFeed = ko.observable(null);

    self.ShowQuestion = function(data){
        self.QuestionFeed(MModels.Create("lfmessage",data));
        self.UserAnswer([]);
        $("#feedQuestionModal").modal('show');
        $("#feedQuestionModal").on('hidden.bs.modal', function(){
            $("#feedQuestionModal").off('hidden.bs.modal');
            self.UserAnswer([]);
            self.QuestionFeed(null);
        })  
    }

    self.Answer = function(){
        self.Error(null);
        var rawAnswered = self.UserAnswer(), Correct = self.QuestionFeed().Correct();
        var Answered = _.map(self.QuestionFeed().Options(),function(a,i){
            return rawAnswered[i] ===true;
        })
        var Correct = _.map(self.QuestionFeed().Options(),function(a,i){
            return Correct[i] ===true;
        })
        if (_.isEqual(Answered,Correct)){
            self.DoConfirm(self.QuestionFeed().toJS());
            $("#feedQuestionModal").modal('hide');
        } else {
            self.Error(Lang.Tr("wronganswer"));
        }
    }

    self.PostPone = function(){
        $("#feedQuestionModal").modal('hide');
    }


    self.ShowUserList = ko.observable(null); 

    self.UsersToShow = function(data){
        self.ShowUserList(data);
        $("#feedApproversList").modal('show');
        $("#feedApproversList").on('hidden.bs.modal', function(){
            $("#feedApproversList").off('hidden.bs.modal');
            self.ShowUserList(null);
        })  
    }

    self.DeleteMessage = function(data){
        swal({
            title: "",
            text: "Вы собираетесь удалить сообщение из ленты",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            cancelButtonText: "Оставить",
            confirmButtonText: "Удалить",
            closeOnConfirm: false
        },function(){
            self.rDelete("feed/"+data._id,{},function(){
                swal("", "Сообщение удалено.", "success");      
            })          
        });
    }

    self.Publish = function(){
        var Feed = self.NewFeed().toJS();
        if (_.isEmpty(Feed.MarkDown.replace(/\s*/g,''))){
            return self.Error("Заполните текст сообщения");
        }
        Feed.HTML = SimpleMDE.prototype.markdown(Feed.MarkDown);
        self.rPost("feed",{feed:Feed},function(){
            $("#newFeedModal").modal('hide');
            self.SkipMessages(0);
            self.LoadLiveFeed();
        })
    }

    self.IsAvailable = function(){
    	return true;
    }

    return self;
})

ModuleManager.Modules.LiveFeed = MLiveFeed;


