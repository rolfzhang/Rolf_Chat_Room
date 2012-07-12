(function(exports){
    
    var myEvents = eventProxy(); //全局事件代理
    
    exports.myEvents = myEvents;
    
    var loginPanel = $('#loginPanel'),
    onlineList = $('#onlineList'),
    msgShowWraper = $('#msgShowWraper'),
    msgShow = $('#msgShow'),
    msgSendBtn = $('#msgSendBtn'),
    msgInput = $('#msgInput'),
    msgInputAlert = $('#msgInputAlert'),
    nicknameInput = $('#nicknameInput'),
    loginBtn = $('#loginBtn'),
    loginAlert = $('#loginAlert'),
    
    postForm = $('#postForm');
    
    var nickname = $('#nickname').val(), 
    key,
    recieveInterval,
    getOnlineInterval,
    onlinePeople = [],
    queryPart;
    
    var getQueryPart = function(){
        var loc = window.top.location.search;
        var queryIndex = loc.indexOf('?');
        var queryArr = {};
        if(queryIndex>=0){
            var queryPart = loc.substr(queryIndex+1);
            var queryList = queryPart.split('&');
            for(var i = 0, item; item = queryList[i]; i++){
                var tmp = item.split('=');
                queryArr[tmp[0]] = tmp[1];
            }
        }
        return queryArr;
    }
    
    queryPart = getQueryPart();
    
    /**
     * 配置全局事件响应
     */
    var globalEventHandler = {
        //请求事件
        login: function(name){
            postForm.attr('action', '/iframe/login')
            .append('<input name="name" value="'+name+'">')
            .submit();
        },
        sendMsg: function(message){
            postForm.attr('action', '/iframe/sendMessage')
            .append('<input name="message" value="'+message+'">')
            .submit();
        },
        getMsgs: function(){
            msgShowWraper[0].src = '/iframe/getMessages';
        },
        //定时事件
        receiveMsgs: function(){
            msgShowWraper[0].src = '/iframe/getMessages?time='+(new Date).getTime();
        },
        getOnlinePeople: function(){
            onlineList[0].src = '/iframe/getOnlinePeople?time='+(new Date).getTime();
        },
        //响应事件
        loginResult: function(name,data){
            if(data.result=='success'){
                nickname = name;
                myEvents.trigger('appStart');
            }else{
                loginAlert.html(data.reason).fadeIn('fast',function(){
                    setTimeout(function(){
                        loginAlert.fadeOut('fast');
                    },2000);
                });
            }
        },
        addOnlinePeople: function(name,you){
            var el = $('<li><span></span>'+name+'</li>');
            el.appendTo(onlineList);
            
            if(you){
                el.addClass('me')
            }
        },
        showMsg: function(data){
            var time = new Date(data.time),
            h = time.getHours(),
            m = time.getMinutes(),
            s = time.getSeconds();
            
            var el = $('<div class="msg">\
                            <div class="msgInfo">' +
                data.user +' (' + [h,m,s].join(':') + '):\
                            </div><br class="clear"/>\
                            <div class="msgDecorate"></div>\
                            <div class="msgContent">'+ 
                data.content +
                '</div><br class="clear"/>\
                        </div>');
            el.appendTo(msgShow);
            
            if(data.user==nickname){
                el.addClass('myMsg');
            }
            
            msgShowWraper.scrollTop(msgShow.height());
            
            if(onlinePeople.indexOf(data.user)<0){
                onlinePeople.push(data.user);
                myEvents.trigger('addOnlinePeople',[data.user]);
            }
        },
        logout: function(msg){
            nickname = null;
            loginPanel.modal('show');

            clearInterval(recieveInterval);
            clearInterval(getOnlineInterval);
            
            if(msg){
                loginAlert.html(msg).fadeIn('fast');
            }
            
            console.log('logout');
        },
        errorHandle: function(fnName,data){
            if(data.reason=='please login'){
                myEvents.trigger('logout',['好久没说话了，要休息下不？']);
            }
        },
        appStart: function(){
            recieveInterval = setInterval(function(){
                myEvents.trigger('receiveMsgs');
            },5000);
    
            getOnlineInterval = setInterval(function(){
                myEvents.trigger('getOnlinePeople');
            },3*60*1000);
            
            loginPanel.modal('hide');
            msgInput.focus();
            
            myEvents.trigger('getOnlinePeople');
            myEvents.trigger('getMsgs');
            
            console.log('appStart');
        }
    }
    
    for(key in globalEventHandler){
        myEvents.register(key,globalEventHandler[key]);
    }

    /**
     * 页面各元素事件绑定
     */
    loginPanel.modal({
        show:!nickname
    })
    .on('show',function(){
        nicknameInput.focus();
    })
    .on('hide', function () {
        if(!nickname){
            return false;
        }else{
            return true;
        }
    });
        
    $('.alert').click(function(e){
        $(this).fadeOut('fast');
    });
    
    msgInput.keypress(function(e){
        if(e.ctrlKey && (e.keyCode==10 || e.keyCode==13)){
            msgSendBtn.click();
        }
    });
        
    msgSendBtn.click(function(e){
        var text = msgInput.val();
        if(text && text.length<=140){
            myEvents.trigger('sendMsg',[text]);
        }else{
            msgInputAlert.html(text.length>140 ? 
                '您发送的字数太多了~o(╯□╰)o':
                '您是不是忘记输入内容了?').
            fadeIn('fast',function(){
                setTimeout(function(){
                    msgInputAlert.fadeOut('fast');
                },2000);
            });
        }
    });
    
    loginBtn.click(function(){
        var name = nicknameInput.val();
        if(name && name.length<=20){
            myEvents.trigger('login',[name]);
        }else{
            loginAlert.html(name.length>20 ? 
                '名字太长不好记耶~o(╯□╰)o':
                '起个响亮点的名字吧~').
            fadeIn('fast',function(){
                setTimeout(function(){
                    loginAlert.fadeOut('fast');
                },2000);
            });
        }
    });
    
    nicknameInput
    .focus()
    .keypress(function(e){
        if(e.keyCode==13){
            loginBtn.click();
        }
    });
    
    if(nickname){
        myEvents.trigger('appStart')
    }else if(queryPart.login){
        loginAlert.html(queryPart.login).fadeIn('fast');
    }
        
})(window)