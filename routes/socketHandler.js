
var express = require('express'),
socketEvent = require('../events/socketEvent'),
Session = express.session.Session;

var onlinePeople = appData.onlinePeople,
events = appData.events,
sessionStore = appData.sessionStore;

/**
 * socket消息处理
 */
var socketMessageHandler = {
    sendMessage: function(socket,data){
        var message = {
            content: data.message,
            user: socket.session.nickname,
            time: (new Date).getTime()
        }
        events.trigger('sendMessage',[message]);
    }
}

function cookieParser(req){
    var fn = express.cookieParser(appData.sessionSecret);
    //方法重定义
    cookieParser = function(request){
        fn(request,null,function(){});
        return request.signedCookies;
    }
    return cookieParser(req);
}

function addSessionToSocket(socket){
    var req = socket.upgradeReq;
    if(!req.headers.cookie){
        socket.close('no cookie');
        return;
    }

    // 通过请求中的cookie字符串来获取其session数据
    var cookies = cookieParser(req),
    sid = cookies[appData.sessionKey];

    if (sid) {
        req.sessionID = sid;
        req.sessionStore = sessionStore;
        sessionStore.get(sid, function(error, session){
            if (error) {
                console.log(error.message);
            }else{
                //给socket加上session信息
                socket.session = new Session(socket, session);
            }
        });
    } else {
        socket.close('no session');
    }
}

exports.configure = function(socket){
    
    //通过socket中的upgradeReq取得cookie信息, 
    //再通过cookie中的sessionID取得session
    addSessionToSocket(socket);
    
    socket.eventListener = socketEvent.configure(socket);
    socket.eventListener.register(events);
    
    socket.on('message',function(data){
        var name = socket.session.nickname;
        if(!name || onlinePeople.indexOf(name)<0){
            socket.close();
            return false;
        }
        
        data = JSON.parse(data);
        
        var method = data.method;
        
        if(method && socketMessageHandler[method]){
            socketMessageHandler[method](socket,data);
        }
    });
    
    socket.onclose = function(){
        console.log('socket close');
        socket.eventListener.remove(events);
        events.trigger('logout',[socket.session.nickname])
        delete socket.eventListener;
    };
}
