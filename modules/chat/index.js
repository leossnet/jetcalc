var MChat = (new function(){

    var self = new Module("chat");

    self.IsToggled = ko.observable(true);

    self.ToggleBox = function(){
        self.IsToggled(!self.IsToggled());
        if (self.IsToggled()){
            self.Leave(self.RoomId());
            MSocket.Stop ("updateroom");
            ModuleManager.Close("Chat");
        } else {
            ModuleManager.Open("Chat");
            self.Join(self.RoomId());
            MSocket.Start ("updateroom");
        }
    }

    self.Counts = ko.observable();
    self.AllCount = ko.observable(0);

    self.UpdateCounts = function(){
        var Rooms = _.map(self.AvailableRoomTypes(),"RoomId");
        self.rGet("counts",{Rooms:Rooms},function(data){
            self.AllCount(data.All>100 ? '99+':data.All);
            var C = {};
            Rooms.forEach(function(Room){
                C[Room] = data[Room]||0;
            })
            self.Counts(C);
        })
    }

    self.CanEdit = function(comment){
        if (!MSite.Me()) return false;
        var CurrentRoom = self.ChoosedRoomType();
        if (CurrentRoom=="techsupport" && PermChecker.CheckPrivelege("IsTechSupportMember")) return true;
        if (typeof CxCtrl !='undefined'){
            if (CurrentRoom=="docchannel" && PermChecker.CheckPrivelege("IsTechDoc",{CodeDoc:CxCtrl.CodeDoc()})) return true;    
        }
        if (comment.UserCode()!=MSite.Me().CodeUser()) return false;
        if (!comment.Children().length) return true;
    }

    self.Init = function(done){
        MSite.Events.on("initialnavigate",self.FilterRoomTypes);
        MSite.Events.on("navigate",self.FilterRoomTypes);
        MSite.Events.on("unload",self.Unload);
        if (typeof CxCtrl !='undefined'){
            CxCtrl.Events.on("documentchanged",self.ChangeDocChannel)
        }
        MSocket.RegisterEvent("updateroom",self.Load);
        MSocket.RegisterEvent("newmessage",self.UpdateCounts);
        MSocket.Start ("newmessage");
        self.FilterRoomTypes();
        self.UpdateCounts();
        return done();
    }

    self.RoomTypes = {
        techsupport:"label-purple",
        orgchannel:"label-primary",
        docchannel:"label-pink"
    }

    self.AvailableRoomTypes = ko.observableArray();

    self.FilterRoomTypes = function(){
        var CodeObj = MSite.Me() && MSite.Me().CodeObj();
        var Ts = ["techsupport"];
        if (!_.isEmpty(CodeObj)) Ts.push("orgchannel");
        if (typeof CxCtrl !='undefined' && typeof MBreadCrumbs !='undefined'){
            if (MBreadCrumbs.CheckPath("docview")) Ts.push("docchannel");
        }
        var R = _.map(Ts,function(A){
            var RoomId = "techsupport";
            if (A=="orgchannel") RoomId = "orgchannel_"+MSite.Me().CodeObj();
            if (A=="docchannel") RoomId = "docchannel_"+CxCtrl.CodeDoc();
            return {
                Type:A,
                RoomId:RoomId,
                Label:self.RoomTypes[A]
            }
        })
        self.AvailableRoomTypes(R);
    }


    self.ChoosedRoomType = ko.observable("techsupport");

    self.IsChoosen = function(data){
        return data.Type == self.ChoosedRoomType();
    }

    self.RoomId = ko.observable("techsupport");

    self.ChangeDocChannel = function(){
        if (self.ChoosedRoomType()=='docchannel'){
            self.Choose(_.find(self.AvailableRoomTypes(),{Type:"docchannel"}));
        }
    }

    self.Choose = function(data){
        var RoomToLeave = self.RoomId();
        self.RoomId(data.RoomId);
        self.ChoosedRoomType (data.Type);
        if (self.RoomId()!=RoomToLeave){
            if (RoomToLeave) self.Leave(RoomToLeave);
            if (self.RoomId()) self.Join(self.RoomId());
        }
    }

    self.IsInRoom = ko.observable(false);

    self.Join = function(RoomId){
        RoomId = RoomId || self.RoomId();
        MSocket.Socket.emit('chat_join_room', RoomId);
        self.Load({UpdateCount:1});
        self.IsInRoom(true);
    }  

    self.Leave = function(RoomId){
       RoomId = RoomId || self.RoomId();
       if (!_.isEmpty(RoomId)){
           MSocket.Socket.emit('chat_leave_room', RoomId);
        }
        self.IsInRoom(false);
    }

    self.Unload = function(){
        if (self.IsInRoom()) self.Leave();
    }

    self.Load = function(params){
        params = params || {};
        $.getJSON(self.base+"load",{room:self.RoomId()},function(data){
            data = data || [];
            self.Comments(_.map(data,function(d){
                var C = new Comment(d);
                return C;
            }));
            if (params.UpdateCount) self.UpdateCounts();
        })
    }

    self.LoadMore = function(){
        console.log("Loading more room ",self.RoomId());
    }

    self.MyComment = ko.observable('');
    self.Comments = ko.observableArray();
    self.RootComments = ko.observableArray();

    self.Comments.subscribe(function(Comments){
        self.RootComments(Comments.filter(function(c){return !c.Parent()}));
    })

    self.SubmitComment = function() {
        var that = this;
        MSocket.Socket.emit('chat_message', {
            body: that.MyComment(),
            parent: (that instanceof Comment && that._id()) || null,
            room:MChat.RoomId()
        });
        that.MyComment("");
    };

    self.UpdateComment = function() {
        var that = this;
        MSocket.Socket.emit('chat_updatecomment', {
            body: that.Body(),
            id: (that instanceof Comment && that._id()) || null,
            room:MChat.RoomId()
        });
        that.EditMode(false);
    };

    self.SubmitVote = function(vote){
        var that = this;
        MSocket.Socket.emit('chat_vote', {
            _id: that._id(),
            vote: vote,
            room:MChat.RoomId()
        });
    };

    self.Reply = function(){
        return self.SubmitComment.call(self) || self.ToggleReply && self.ToggleReply();
    }

    return self;
})

ModuleManager.Modules.Chat = MChat;

var Comment = function (data){

    var self  = this;

    self._id = ko.observable();
    self.Body = ko.observable("");
    self.Room = ko.observable("");
    self.Modified = ko.observable();
    self.Created = ko.observable();
    self.Parent = ko.observable();
    self.Downs = ko.observableArray();
    self.Ups = ko.observableArray(0);
    self.CollapsedReply = ko.observable(true);
    self.EditMode = ko.observable(false);
    self.MyComment = ko.observable('');

    self.UserCode = ko.observable("");
    self.UserPhoto = ko.observable('');
    self.UserName = ko.observable('');

    for (var k in data) {
        var setter = data[k];
        if (k=='body') setter = setter.replace(/\n/g, '</br>')
        if (self[k]) self[k](data[k]);   
    }

    self.UserSmName = function(){
        var UA = self.UserName().split(" ");
        if (!_.isEmpty(UA[0]) && !_.isEmpty(UA[1])){
            return UA[0].substring(0,1)+UA[1].substring(0,1);
        }
        return "??";
    }

    self.Children = function(){
        return _.filter(MChat.Comments(),function(c){
            return self._id() === c.Parent();
        })
    }

    self.Points = function(){
        return self.Ups().length - self.Downs().length;
    }


    self.GetCreated = function(){
        return new Date(self.created()).toLocaleString('ru');
    }

    self.Reply = function(){
        return MChat.SubmitComment.call(self) || self.ToggleReply();
    }

    self.ToggleReply = function(){
        self.CollapsedReply(!self.CollapsedReply());
    }    

    self.ToggleEdit = function(){
        self.EditMode(!self.EditMode());
    }

    self.UpVote = function(){
        MChat.SubmitVote.call(self, 'up');
    }

    self.DownVote = function(){
        MChat.SubmitVote.call(self, 'down');
    }

    self.Edit = function(){
        MChat.UpdateComment.call(self);
    }

    return self;
}

ko.bindingHandlers['background-image'] = {
    update: function(element, valueAccessor, allBindingsAccessor) {
        var value = valueAccessor();
        var url = ko.unwrap(value);
        if (url && url.length){
            $(element).css('background-image','url("'+url+'")');
        }
    },
}

var HtmlToText = function (str) {
    return (str+'')
        .replace(/\s+/gi, " ")
        .replace(/<h[0-9].*?>/gi, '\n')
        .replace(/<br>/gi, '\n')
        .replace(/<div.*?>/gi, '\n')
        .replace(/<li.*?>/gi, '\n')
        .replace(/<p.*?>/gi, '\n')
        .replace(/\&nbsp\;/gi, " ")
        .replace(/\n\s*\n/g, '\n')
        .replace(/<a.*href="(.*?)".*>(.*?)<\/a>/gi, " $2 [$1] ")
        .replace(/<(?:.|\s)*?>/g, "");
}

ko.bindingHandlers.contentEditable = {
    init: function(element, valueAccessor) {
        var val =  valueAccessor();
        $(element).text(val());
        element.onkeyup = function() {
            val(HtmlToText($(element).html().trim()));
        };
    },
    update: function(element, valueAccessor) {
        var val = ko.utils.unwrapObservable(valueAccessor());
        if (val == "") $(element).text(val);
    }
};

ko.bindingHandlers.enterkey = {
    init: function (element, valueAccessor, allBindings, viewModel) {
        var callback = valueAccessor();
        $(element).keypress(function (event) {
            var keyCode = (event.which ? event.which : event.keyCode);
            if (keyCode === 10 && event.ctrlKey) {
                callback.call(viewModel);
                return false;
            }
            return true;
        });
    }
};
