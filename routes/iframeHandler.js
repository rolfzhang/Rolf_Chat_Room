
var messages = appData.messages,
onlinePeople = appData.onlinePeople,
onlinePeopleStatus = appData.onlinePeopleStatus,
events = appData.events,
config = appData.config;

var title = 'Rolf的聊天室 - iframe版';

var iframeHandler = {
    'post:login': function(req, res){
        var name = req.body.name,
        query = '?login=';
        
        if(req.session.nickname){
            events.trigger('logout',[req.session.nickname])
        }
        
        if(onlinePeople.length>=config.maxPeople){
            query += 'tooManyOnline'
        }else if(name && onlinePeople.indexOf(name)<0){
            req.session.nickname = name;
            events.trigger('login',[name]);
            query = '';
        }else{
            query += name?'nameExisted':'noName';
        }
        res.redirect('/iframe'+query);
    },
    'post:sendMessage': function(req, res){
        var message = {
            content: req.body.message,
            user: req.session.nickname,
            time: (new Date).getTime()
        };
        
        events.trigger('sendMessage',[message]);
        res.redirect('/iframe');
    },
    'getMessages': function(req, res){
        var num = req.query.num || 30,
        msgsLen = messages.length,
        name = req.session.nickname,
        msgs;
        num = Math.max(num, msgsLen, config.maxMessage),
        msgs = _.last(messages, num);
        res.render('iframe/showMsg',{
            title:title,
            messages:msgs,
            nickname:name
        });
    },
    'getOnlinePeople':  function(req, res){
        var name = req.session.nickname;
        res.render('iframe/showOnline',{
            title:title,
            online:onlinePeople,
            nickname:name
        });
    }
}

/**
 * AOP方法, 登陆判断
 */
function checkLogin(req, res){
    var name = req.session.nickname;
    if(!name || onlinePeople.indexOf(name)<0){
        delete req.session.nickname;
        res.send('<script type="text/javascript">parent.location.reload()</script>');
        return false;
    }
}

function checkLoginPost(req, res){
    var name = req.session.nickname;
    if(!name || onlinePeople.indexOf(name)<0){
        delete req.session.nickname;
        res.redirect('/iframe?login=pleaseLogin');
        return false;
    }
}

_.forEach(iframeHandler, function(fn,key){
    if(key.indexOf('post:')<0){
        iframeHandler[key] = aopFunction(fn,checkLogin);
    }else if(key!='post:login'){
        iframeHandler[key] = aopFunction(fn,checkLoginPost);
    }
})

module.exports = iframeHandler;
