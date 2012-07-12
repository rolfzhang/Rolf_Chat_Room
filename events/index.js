
var messages = appData.messages,
onlinePeople = appData.onlinePeople,
onlinePeopleStatus = appData.onlinePeopleStatus,
config = appData.config;

var eventHandler = {
    login: function(name){

        var status = {};
        onlinePeople.push(name);
        onlinePeopleStatus[name] = status;
        
        status.activeTime = (new Date).getTime();
        status.lastReceiveTime = 0;
    //        console.log('login:',name,' time:',Date());
    },
    logout: function(name){
        var index = onlinePeople.indexOf(name);
        if(index>=0){
            onlinePeople.splice(index, 1);
        }
        delete onlinePeopleStatus[name];
        console.log('logout:',name,' time:',Date());
    },
    sendMessage: function(message){
        messages.push(message);
        
        if(messages.lenght>config.messageCleanThreshold){
            messages = _.last(messages,config.maxMessage);
        }
    },
}

exports.configure = function(proxy){
    _.forEach(eventHandler, function(fn,key){
        proxy.register(key,fn);
    });
}
