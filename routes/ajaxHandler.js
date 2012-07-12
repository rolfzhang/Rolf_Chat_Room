
var messages = appData.messages,
onlinePeople = appData.onlinePeople,
onlinePeopleStatus = appData.onlinePeopleStatus,
events = appData.events,
config = appData.config;

var ajaxHandler = {
    'post:login': function(req, res){
        var name = req.body.name,
        result = {};
        
        if(req.session.nickname){
            events.trigger('logout',[req.session.nickname])
        }
        
        if(onlinePeople.length>=config.maxPeople){
            result.result = 'failure';
            result.reason = 'too many people online, please login later';
        }else if(name && onlinePeople.indexOf(name)<0){
            req.session.nickname = name;
            events.trigger('login',[name]);
            result.result= 'success';
        }else{
            result.result = 'failure';
            result.reason = name?'name allready existed':'no name';
        }
        res.json(result);
    },
    'post:sendMessage': function(req, res){
        var message = {
            content: req.body.message,
            user: req.session.nickname,
            time: (new Date).getTime()
        };
        
        events.trigger('sendMessage',[message]);
        res.json({
            result: 'success'
        });
    },
    'getMessages': function(req, res){
        var num = req.query.num || 30,
        msgsLen = messages.length,
        name = req.session.nickname,
        msgs;
        num = Math.max(num, msgsLen, config.maxMessage),
        msgs = _.last(messages, num);
        res.json({
            result: 'success',
            data: msgs
        });
        
        onlinePeopleStatus[name].lastReceiveTime = (new Date).getTime();
    },
    'getOnlinePeople':  function(req, res){
        res.json({
            result: 'success',
            data: onlinePeople
        });
    },
    'receiveMessages': function(req, res){
        var name = req.session.nickname,
        last = onlinePeopleStatus[name].lastReceiveTime,
        msgs = _.filter(messages,function(msg){
            return msg.time>last && msg.user != name
        });
        res.json({
            result: 'success',
            data: msgs
        });
        
        onlinePeopleStatus[name].lastReceiveTime = (new Date).getTime();
    }
}

/**
 * AOP方法, 登陆判断
 */
function checkLogin(req, res){
    var name = req.session.nickname;
    if(!name || onlinePeople.indexOf(name)<0){
        res.json({
            result:'failure',
            reason: 'please login'
        });
        return false;
    }
}

_.forEach(ajaxHandler, function(fn,key){
    if(key!='post:login'){
        ajaxHandler[key] = aopFunction(fn,checkLogin);
    }
})

module.exports = ajaxHandler;
