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
    loginAlert = $('#loginAlert');
    
    var nickname = null, 
    key,
    recieveInterval,
    getOnlineInterval,
    onlinePeople = [];
    
    /**
     * 配置全局事件响应
     */
    var globalEventHandler = {
        //请求事件
        login: function(name){
            $.post('/ajax/login', {
                name: name
            }, function(data){
                myEvents.trigger('loginResult',[name,data]);
            }, 'json');
        },
        sendMsg: function(message){
            $.post('/ajax/sendMessage', {
                message: message
            }, function(data){
                if(data.result=='success'){
                    myEvents.trigger('showMsg',[{
                        content: message,
                        user: nickname,
                        time: (new Date).getTime()
                    }]);
                    msgInput.val('');
                }else{
                    myEvents.trigger('errorHandle',['sendMsg',data]);
                }
            }, 'json');
        },
        getMsgs: function(){
            $.getJSON('/ajax/getMessages', function(data){
                if(data.result=='success'){
                    msgShow.html('');
                    $.each(data.data, function(i,msg){
                        myEvents.trigger('showMsg',[msg]);
                    })
                }else{
                    myEvents.trigger('errorHandle',['getMsgs',data]);
                }
            });
        },
        //定时事件
        receiveMsgs: function(){
            $.getJSON('/ajax/receiveMessages', function(data){
                if(data.result=='success'){
                    $.each(data.data, function(i,msg){
                        myEvents.trigger('showMsg',[msg,true]);
                    })
                }else{
                    myEvents.trigger('errorHandle',['receiveMsgs',data]);
                }
            });
        },
        getOnlinePeople: function(){
            $.getJSON('/ajax/getOnlinePeople', function(data){
                if(data.result=='success'){
                    onlinePeople = data.data;
                    onlineList.html('');
                    myEvents.trigger('addOnlinePeople',[nickname,true]);
                    $.each(onlinePeople, function(i,name){
                        if(name!=nickname)
                            myEvents.trigger('addOnlinePeople',[name]);
                    })
                }else{
                    myEvents.trigger('errorHandle',['getOnlinePeople',data]);
                }
            });
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
        showMsg: function(data,addPeople){
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
            
            if(addPeople && onlinePeople.indexOf(data.user)<0){
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
    loginPanel.modal()
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
    
})(window)