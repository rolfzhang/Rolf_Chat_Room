
//模块加载
var ajaxHandler = require('./ajaxHandler'),
iframeHandler = require('./iframeHandler'),
pollHandler = require('./pollHandler'),
socketHandler = require('./socketHandler');

//全局参数加载
var onlinePeople = appData.onlinePeople,
onlinePeopleStatus = appData.onlinePeopleStatus,
events = appData.events,
config = appData.config;

/**
 * 定义路由表
 */
var routes = {
    '/': function(req, res){
        res.send({
            session: req.session,
            sessionID: req.sessionID
        });
    },
    '/ajax': function(req, res){
        res.render('index', { 
            title: 'Rolf的聊天室 - Ajax版',
            type: 'ajax'
        });
    },
    '/iframe': function(req, res){
        var name = req.session.nickname;
        res.render('iframe/index',{
            title: 'Rolf的聊天室 - iframe版',
            nickname:name
        });
    },
    '/poll': function(req, res){
        res.render('index', { 
            title: 'Rolf的聊天室 - LongPoll版',
            type: 'poll'
        });
    },
    '/socket': function(req, res){
        res.render('index', { 
            title: 'Rolf的聊天室 - WebSocket版',
            type: 'socket'
        });
    },
    '/checkOnline': function(req,res){
        res.send({
            onlinePeople: onlinePeople,
            onlinePeopleStatus: onlinePeopleStatus
        });
    },
    
    ajax: ajaxHandler,
    iframe: iframeHandler,
    poll: pollHandler
}

/**
 * 定时让不活跃的用户下线
 */
function checkLogout(name){
    var time = (new Date).getTime(),
    activeTime = onlinePeopleStatus[name].activeTime;
    if(!activeTime){
        return
    }else if((time-activeTime)>config.logoutTime){
        events.trigger('logout',[name]);
    }
}

setInterval(function(){
    _.forEach(onlinePeople, checkLogout);
},config.logoutTime);

/**
 * 路由表解释方法, 按照约定格式指定请求对应的控制器方法
 */
function setAppHandler(app,key,fn,prefix){
    var type = 'get',
    method,split;
    if(!_.isFunction(fn)){
        return
    }
    
    split = key.split(':');
    
    if(split.length==1){
        method = split[0];
    }else if(split.length==2 &&
        (split[0]=='post' || split[0]=='get')){
        type = split[0];
        method = split[1] || '/';
    }else{
        return;
    }
    
    if(method.charAt(0)!='/'){
        method = '/'+method;
    }
    if(prefix){
        if(prefix.charAt(0)!='/'){
            prefix = '/'+prefix;
        }
        method = prefix + method;
    }
    console.log('setAppHandler:',type,method);
    app[type](method,fn);
}

exports.configure = function(app){
    
    _.forEach(routes, function(fn,key){
        if(_.isFunction(fn)){
            setAppHandler(app,key,fn);
        }else{
            _.forEach(fn, function(fn2,key2){
                setAppHandler(app,key2,fn2,key);
            });
        }
    })
}
exports.configureSocket = function(wsServer){
    wsServer.on('connection', function (socket) {
        //配置socket响应
        socketHandler.configure(socket);
    });
}
