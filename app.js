
var express = require('express'), 
http = require('http'),
ws = require('ws'),
eventProxy = require('eventProxy');

var _ = global._ = require('underscore');
global.aopFunction = require('aopFunction');

var app, routes, events, server, wsServer;

/**
 * 定义全局配置参数
 */
var appData = global.appData = {
    port: 3000,
    rootPath: __dirname + '/public',
    sessionStore: new express.session.MemoryStore(),
    sessionSecret: 'rolf',
    sessionKey: 'express.sid',
    onlinePeople: [],
    onlinePeopleStatus: {},
    messages: [],
    events: eventProxy(),//全局事件代理
    config: {
        maxPeople: 20,
        maxMessage:60,
        messageCleanThreshold:120,
        logoutTime: 3*60*1000
    }
}

/**
 * 配置Express
 */
app = express();

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
//    app.use(express.logger('dev'));
    app.use(express.cookieParser(appData.sessionSecret));
    app.use(express.session({
        store: appData.sessionStore, 
        secret: appData.sessionSecret, 
        key: appData.sessionKey
    }));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(appData.rootPath));
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

/**
 * 配置路由
 */
routes = require('./routes');
routes.configure(app);

/**
 * 配置全局事件处理
 */
events = require('./events');
events.configure(appData.events);

/**
 * 启动Server
 */
server = http.createServer(app);
server.listen(appData.port);
console.log("Express server listening on port "+appData.port);

/**
 * 配置WebSocket
 */
wsServer = new ws.Server({server: server})
routes.configureSocket(wsServer);
