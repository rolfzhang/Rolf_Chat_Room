
/**
 * 长连接事件监听器
 */
var PollListener = function(request, eventHandlers){
    this.result = [];
    this.request = request;
    this.eventHandlers = eventHandlers;
}
PollListener.prototype = {
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
    }
}

/**
 * 长连接响应事件
 * 有事件更新则不断添加到流中，一次性返回
 */
var pollEventHandler = {
    'login': function(name){
        if(this.request.session.nickname==name){
            return
        }
        
        this.result.push({
            method: 'login',
            name: name
        });
    },
    'logout': function(name){
        this.result.push({
            method: 'logout',
            name: name
        });
    },
    'sendMessage': function(message){
        if(message.user==this.request.session.nickname){
            return
        }
        console.log('poll receiveMessage');
        this.result.push({
            method: 'receiveMessage',
            message: message
        });
    }
}

exports.configure = function(request){
    return new PollListener(request,pollEventHandler);
}
