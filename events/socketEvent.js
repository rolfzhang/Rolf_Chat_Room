
/**
 * Socket事件监听器
 */
var SocketListener = function(socket, eventHandlers){
    this.socket = socket;
    this.eventHandlers = eventHandlers;
}
SocketListener.prototype = {
    register: function(proxy){
        var scope = this;
        _.forEach(this.eventHandlers, function(handler,eventName){
            proxy.register(eventName,handler,scope);
        });
    },
    remove: function(proxy){
        var scope = this;
        _.forEach(this.eventHandlers, function(handler,eventName){
            proxy.remove(eventName,handler,scope);
        });
    },
    socketSend: function(obj){
        this.socket.send(JSON.stringify(obj));
    }
}

/**
 * socket响应事件
 */
var socketEventHandler = {
    'login': function(name){
        if(this.socket.session.nickname==name){
            return
        }
        
        this.socketSend({
            method: 'login',
            name: name
        });
    },
    'logout': function(name){
        this.socketSend({
            method: 'logout',
            name: name
        });
    },
    'sendMessage': function(message){
        this.socketSend({
            method: 'receiveMessage',
            message: message
        });
    }
}

exports.configure = function(socket){
    return new SocketListener(socket,socketEventHandler);
}
