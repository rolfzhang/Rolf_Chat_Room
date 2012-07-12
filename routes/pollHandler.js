
var pollEvent = require('../events/pollEvent');

var onlinePeople = appData.onlinePeople,
events = appData.events;

/**
 * 长连接消息处理
 */
var pollHandler = {
    'stream': function(req, res){
        //checkLogin
        var name = req.session.nickname;
        if(!name || onlinePeople.indexOf(name)<0){
            res.json({result:'failure',reason:'please login'});
            return;
        }
        //添加流事件监听
        req.streamListener = pollEvent.configure(req);
        req.streamListener.register(events);
        //记录连接开始时间
        req.startTime = new Date;
        setTimeout(function(){longPolling(req, res)}, 1000);
    },
}

/**
 * 递归调用的长连接方法
 */
function longPolling(req, res){
    var listener = req.streamListener;
    if(parseInt((new Date) - req.startTime) >= 40000) {
        //40秒超时重连
        listener.remove(events);
        res.send({result:'overtime'});
    }else if(listener.result.length>0){
        //如果有结果，则返回
        listener.remove(events);
        res.send({result:'success',data:listener.result});
    }else{        
        //1秒后递归执行longPolling
        setTimeout(function(){longPolling(req, res)}, 1000);
    }
}

module.exports = pollHandler;
