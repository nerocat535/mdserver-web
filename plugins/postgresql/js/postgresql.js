function str2Obj(str){
    var data = {};
    kv = str.split('&');
    for(i in kv){
        v = kv[i].split('=');
        data[v[0]] = v[1];
    }
    return data;
}

function myPost(method,args,callback, title){

    var _args = null; 
    if (typeof(args) == 'string'){
        _args = JSON.stringify(str2Obj(args));
    } else {
        _args = JSON.stringify(args);
    }

    var _title = '正在获取...';
    if (typeof(title) != 'undefined'){
        _title = title;
    }

    var loadT = layer.msg(_title, { icon: 16, time: 0, shade: 0.3 });
    $.post('/plugins/run', {name:'postgresql', func:method, args:_args}, function(data) {
        layer.close(loadT);
        if (!data.status){
            layer.msg(data.msg,{icon:0,time:2000,shade: [0.3, '#000']});
            return;
        }

        if(typeof(callback) == 'function'){
            callback(data);
        }
    },'json'); 
}

function myPostN(method,args,callback, title){

    var _args = null; 
    if (typeof(args) == 'string'){
        _args = JSON.stringify(str2Obj(args));
    } else {
        _args = JSON.stringify(args);
    }

    var _title = '正在获取...';
    if (typeof(title) != 'undefined'){
        _title = title;
    }
    $.post('/plugins/run', {name:'postgresql', func:method, args:_args}, function(data) {
        if(typeof(callback) == 'function'){
            callback(data);
        }
    },'json'); 
}

function myAsyncPost(method,args){
    var _args = null; 
    if (typeof(args) == 'string'){
        _args = JSON.stringify(str2Obj(args));
    } else {
        _args = JSON.stringify(args);
    }

    var loadT = layer.msg('正在获取...', { icon: 16, time: 0, shade: 0.3 });
    return syncPost('/plugins/run', {name:'mysql', func:method, args:_args}); 
}

function runInfo(){
    myPost('run_info','',function(data){

        var rdata = $.parseJSON(data.data);
        if (typeof(rdata['status']) != 'undefined'){
            layer.msg(rdata['msg'],{icon:0,time:2000,shade: [0.3, '#000']});
            return;
        }

        var con = '<div class="divtable"><table class="table table-hover table-bordered" style="margin-bottom:10px;background-color:#fafafa">\
                    <tbody>\
                        <tr><th>启动时间</th><td>' + rdata.uptime + '</td><th>进程数</th><td>' +rdata.progress_num+ '</td></tr>\
                        <tr><th>总连接次数</th><td>' + rdata.connections + '</td><th>PID</th><td>' +rdata.pid+ '</td></tr>\
                        <tr><th>占用空间</th><td>' + rdata.pg_size + '</td><th>占用内存</th><td>' +rdata.pg_mem+ '</td></tr>\
                    </tbody>\
                    </table>\
                    <table class="table table-hover table-bordered">\
                    <thead style="display:none;"><th></th><th></th><th></th><th></th></thead>\
                    <tbody>\
                        <tr><th>表进程已经锁住的物理内存的大小</th><td>' + rdata.pg_vm_lock + '</td></tr>\
                        <tr><th>数据库分配到物理内存的峰值</th><td>' + rdata.pg_vm_high + '</td></tr>\
                        <tr><th>进程数据段的大小</th><td>' + rdata.pg_vm_data_size + '</td></tr>\
                        <tr><th>进程堆栈段的大小</th><td>' + rdata.pg_vm_sk_size + '</td></tr>\
                        <tr><th>进程代码的大小</th><td>' + rdata.pg_vm_code_size + '</td></tr>\
                        <tr><th>进程所使用LIB库的大小</th><td>' + rdata.pg_vm_lib_size + '</td></tr>\
                        <tr><th>进程占用Swap的大小</th><td>' + rdata.pg_vm_swap_size + '</td></tr>\
                        <tr><th>占用的页表的大小</th><td>' + rdata.pg_vm_page_size + '</td></tr>\
                        <tr><th>当前待处理信号的个数</th><td>' + rdata.pg_sigq + '</td></tr>\
                    <tbody>\
            </table></div>';
        $(".soft-man-con").html(con);
    });
}


function pgPort(){
    myPost('pg_port','',function(data){
        var con = '<div class="line ">\
            <div class="info-r  ml0">\
            <input name="port" class="bt-input-text mr5 port" type="text" style="width:100px" value="'+data.data+'">\
            <button id="btn_change_port" name="btn_change_port" class="btn btn-success btn-sm mr5 ml5 btn_change_port">修改</button>\
            </div></div>';
        $(".soft-man-con").html(con);

        $('#btn_change_port').click(function(){
            var port = $("input[name='port']").val();
            myPost('set_pg_port','port='+port,function(data){
                var rdata = $.parseJSON(data.data);
                if (rdata.status){
                    layer.msg('修改成功!',{icon:1,time:2000,shade: [0.3, '#000']});
                } else {
                    layer.msg(rdata.msg,{icon:1,time:2000,shade: [0.3, '#000']});
                }
            });
        });
    });
}


//数据库存储信置
function changePgDataPath(act) {
    if (act != undefined) {
        layer.confirm(lan.soft.mysql_to_msg, { closeBtn: 2, icon: 3 }, function() {
            var datadir = $("#datadir").val();
            var data = 'datadir=' + datadir;
            var loadT = layer.msg(lan.soft.mysql_to_msg1, { icon: 16, time: 0, shade: [0.3, '#000'] });
            $.post('/database?action=SetDataDir', data, function(rdata) {
                layer.close(loadT)
                layer.msg(rdata.msg, { icon: rdata.status ? 1 : 5 });
            });
        });
        return;
    }

    $.post('/database?action=GetMySQLInfo', '', function(rdata) {
        var LimitCon = '<p class="conf_p">\
                            <input id="datadir" class="phpUploadLimit bt-input-text mr5" style="width:350px;" type="text" value="' + rdata.datadir + '" name="datadir">\
                            <span onclick="ChangePath(\'datadir\')" class="glyphicon glyphicon-folder-open cursor mr20" style="width:auto"></span><button class="btn btn-success btn-sm" onclick="changeMySQLDataPath(1)">' + lan.soft.mysql_to + '</button>\
                        </p>';
        $(".soft-man-con").html(LimitCon);
    });
}

//数据库配置状态
function pgPerfOpt() {
    //获取MySQL配置
    myPost('db_status','',function(data){
        var rdata = $.parseJSON(data.data);
        var html_p = '';
        for (i in rdata){
            if (i != 'status' ){
                var v = rdata[i];
                html_p += '<p><span>'+i+'</span><input style="width: 70px;" class="bt-input-text mr5" unit="'+v[1]+'" name="'+i+'" value="' + v[0] + '" type="number" >'+v[1] +', <font>' + v[2] + '</font></p>'
            }
        }

        var memCon = '<form class="bt-form" id="pg_conf"><div class="conf_p" style="margin-bottom:0">'+html_p
            +'<div style="margin-top:10px; padding-right:15px" class="text-right">\
            <div>\
                <button class="btn btn-success btn-sm mr5" onclick="reBootMySqld()">重启数据库</button>\
                <button class="btn btn-success btn-sm" onclick="setPgConf()">保存</button></div>\
            </div>'
            +'</div></form>'

        $(".soft-man-con").html(memCon);

        $("#pg_conf").change(function (e) {
        　　e.preventDefault();
            var data = {};
            $('#pg_conf p input').each(function (index, element) {
                data[$(this).attr('name')] = $(this).val() + ($(this).attr('unit') || '');
            })
            // console.log(data);
            myPost('set_db_status', data, function(data){
                var rdata = $.parseJSON(data.data);
                showMsg(rdata.msg,function(){
                },{ icon: rdata.status ? 1 : 2 });
            });
            return false;
        });
    });
}

function reBootPgSqld(){
    pluginOpService('postgresql','restart','');
}

//设置PG配置参数
function setPgConf() {
    return false;
}

function syncGetDatabase(){
    myPost('sync_get_databases', null, function(data){
        var rdata = $.parseJSON(data.data);
        showMsg(rdata.msg,function(){
            dbList();
        },{ icon: rdata.status ? 1 : 2 });
    });
}

function syncToDatabase(type){
    var data = [];
    $('input[type="checkbox"].check:checked').each(function () {
        if (!isNaN($(this).val())) data.push($(this).val());
    });
    var postData = 'type='+type+'&ids='+JSON.stringify(data); 
    myPost('sync_to_databases', postData, function(data){
        var rdata = $.parseJSON(data.data);
        // console.log(rdata);
        showMsg(rdata.msg,function(){
            dbList();
        },{ icon: rdata.status ? 1 : 2 });
    });
}

function setRootPwd(type, pwd){
    if (type==1){
        var data = $("#mod_pwd").serialize();
        myPost('set_root_pwd', data, function(data){
            var rdata = $.parseJSON(data.data);
            // console.log(rdata);
            showMsg(rdata.msg,function(){
                dbList();
                $('.layui-layer-close1').click();
            },{icon: rdata.status ? 1 : 2});
        });
        return;
    }

    var index = layer.open({
        type: 1,
        area: '500px',
        title: '修改数据库密码',
        closeBtn: 1,
        shift: 5,
        shadeClose: true,
        btn:["取消","提交"],
        content: "<form class='bt-form pd20' id='mod_pwd'>\
                    <div class='line'>\
                    <span class='tname'>root密码</span>\
                    <div class='info-r'><input class='bt-input-text mr5' type='text' name='password' id='MyPassword' style='width:330px' value='"+pwd+"' /><span title='随机密码' class='glyphicon glyphicon-repeat cursor' onclick='repeatPwd(16)'></span></div>\
                    </div>\
                </form>",
        yes:function(){
            setRootPwd(1);
        }
    });
}

function showHidePass(obj){
    var a = "glyphicon-eye-open";
    var b = "glyphicon-eye-close";
    
    if($(obj).hasClass(a)){
        $(obj).removeClass(a).addClass(b);
        $(obj).prev().text($(obj).prev().attr('data-pw'))
    }
    else{
        $(obj).removeClass(b).addClass(a);
        $(obj).prev().text('***');
    }
}

function copyPass(password){
    var clipboard = new ClipboardJS('#bt_copys');
    clipboard.on('success', function (e) {
        layer.msg('复制成功',{icon:1,time:2000});
    });

    clipboard.on('error', function (e) {
        layer.msg('复制失败，浏览器不兼容!',{icon:2,time:2000});
    });
    $("#bt_copys").attr('data-clipboard-text',password);
    $("#bt_copys").click();
}

function checkSelect(){
    setTimeout(function () {
        var num = $('input[type="checkbox"].check:checked').length;
        // console.log(num);
        if (num == 1) {
            $('button[batch="true"]').hide();
            $('button[batch="false"]').show();
        }else if (num>1){
            $('button[batch="true"]').show();
            $('button[batch="false"]').show();
        }else{
            $('button[batch="true"]').hide();
            $('button[batch="false"]').hide();
        }
    },5)
}

function setDbRw(id,username,val){
    myPost('get_db_rw',{id:id,username:username,rw:val}, function(data){
        var rdata = $.parseJSON(data.data);
        // layer.msg(rdata.msg,{icon:rdata.status ? 1 : 5,shade: [0.3, '#000']});
        showMsg(rdata.msg, function(){
            dbList();
        },{icon:rdata.status ? 1 : 5,shade: [0.3, '#000']}, 2000);

    });
}

function setDbAccess(username){
    myPost('get_db_access','username='+username, function(data){
        var rdata = $.parseJSON(data.data);
        if (!rdata.status){
            layer.msg(rdata.msg,{icon:2,shade: [0.3, '#000']});
            return;
        }
        
        var index = layer.open({
            type: 1,
            area: '500px',
            title: '设置数据库权限',
            closeBtn: 1,
            shift: 5,
            btn:["提交","取消"],
            shadeClose: true,
            content: "<form class='bt-form pd20' id='set_db_access'>\
                        <div class='line'>\
                            <span class='tname'>访问权限</span>\
                            <div class='info-r '>\
                                <select class='bt-input-text mr5' name='dataAccess' style='width:100px'>\
                                <option value='127.0.0.1'>本地服务器</option>\
                                <option value=\"%\">所有人</option>\
                                <option value='ip'>指定IP</option>\
                                </select>\
                            </div>\
                        </div>\
                      </form>",
            success:function(){
                if (rdata.msg == '127.0.0.1'){
                    $('select[name="dataAccess"]').find("option[value='127.0.0.1']").attr("selected",true);
                } else if (rdata.msg == '%'){
                    $('select[name="dataAccess"]').find('option[value="%"]').attr("selected",true);
                } else if ( rdata.msg == 'ip' ){
                    $('select[name="dataAccess"]').find('option[value="ip"]').attr("selected",true);
                    $('select[name="dataAccess"]').after("<input id='dataAccess_subid' class='bt-input-text mr5' type='text' name='address' placeholder='多个IP使用逗号(,)分隔' style='width: 230px; display: inline-block;'>");
                } else {
                    $('select[name="dataAccess"]').find('option[value="ip"]').attr("selected",true);
                    $('select[name="dataAccess"]').after("<input value='"+rdata.msg+"' id='dataAccess_subid' class='bt-input-text mr5' type='text' name='address' placeholder='多个IP使用逗号(,)分隔' style='width: 230px; display: inline-block;'>");
                }

                 $('select[name="dataAccess"]').change(function(){
                    var v = $(this).val();
                    if (v == 'ip'){
                        $(this).after("<input id='dataAccess_subid' class='bt-input-text mr5' type='text' name='address' placeholder='多个IP使用逗号(,)分隔' style='width: 230px; display: inline-block;'>");
                    } else {
                        $('#dataAccess_subid').remove();
                    }
                });
            },
            yes:function(index){
                var data = $("#set_db_access").serialize();
                data = decodeURIComponent(data);
                var dataObj = str2Obj(data);
                if(!dataObj['access']){
                    dataObj['access'] = dataObj['dataAccess'];
                    if ( dataObj['dataAccess'] == 'ip'){
                        if (dataObj['address']==''){
                            layer.msg('IP地址不能空!',{icon:2,shade: [0.3, '#000']});
                            return;
                        }
                        dataObj['access'] = dataObj['address'];
                    }
                }
                dataObj['username'] = username;
                myPost('set_db_access', dataObj, function(data){
                    var rdata = $.parseJSON(data.data);
                    showMsg(rdata.msg,function(){
                        layer.close(index);
                        dbList();
                    },{icon: rdata.status ? 1 : 2});   
                });
            }
        });

    });
}

function setDbPass(id, username, password){

    var index = layer.open({
        type: 1,
        area: '500px',
        title: '修改数据库密码',
        closeBtn: 1,
        shift: 5,
        shadeClose: true,
        btn:["提交","关闭"],
        content: "<form class='bt-form pd20' id='mod_pwd'>\
                    <div class='line'>\
                        <span class='tname'>用户名</span>\
                        <div class='info-r'><input readonly='readonly' name=\"name\" class='bt-input-text mr5' type='text' style='width:330px;outline:none;' value='"+username+"' /></div>\
                    </div>\
                    <div class='line'>\
                    <span class='tname'>密码</span>\
                    <div class='info-r'><input class='bt-input-text mr5' type='text' name='password' id='MyPassword' style='width:330px' value='"+password+"' /><span title='随机密码' class='glyphicon glyphicon-repeat cursor' onclick='repeatPwd(16)'></span></div>\
                    </div>\
                    <input type='hidden' name='id' value='"+id+"'>\
                  </form>",
        yes:function(index){
            var data = $("#mod_pwd").serialize();
            myPost('set_user_pwd', data, function(data){
                var rdata = $.parseJSON(data.data);
                showMsg(rdata.msg,function(){
                    layer.close(index);
                    dbList();
                },{icon: rdata.status ? 1 : 2});   
            });
        }
    });
}

function addDatabase(type,layer_index){
    if (type == 1){
        var data = $("#add_db").serialize();
        data = decodeURIComponent(data);
        var dataObj = str2Obj(data);
        if(!dataObj['address']){
            dataObj['address'] = dataObj['dataAccess'];
        }
        
        var ip_segment = $('[name="dataAccess"]').val();
        if ($('[name="dataAccess"]').val() == 'ip'){
            dataObj['listen_ip'] = ip_segment;
        }
        myPost('add_db', dataObj, function(data){
            var rdata = $.parseJSON(data.data);
            showMsg(rdata.msg,function(){
                layer.close(layer_index);
                if (rdata.status){
                    dbList();
                }
            },{icon: rdata.status ? 1 : 2},2000);
        });
        return;
    }
    
    layer.open({
        type: 1,
        area: '450px',
        title: '添加数据库',
        closeBtn: 1,
        shift: 5,
        shadeClose: true,
        btn:["提交","取消"],
        content: "<form class='bt-form pd20' id='add_db'>\
                    <div class='line'>\
                        <span class='tname'>数据库名</span>\
                        <div class='info-r'>\
                            <input name='name' class='bt-input-text mr5' placeholder='新的数据库名称' type='text' style='width:270px' value=''>\
                        </div>\
                    </div>\
                    <div class='line'><span class='tname'>用户名</span><div class='info-r'><input name='db_user' class='bt-input-text mr5' placeholder='数据库用户' type='text' style='width:270px' value=''></div></div>\
                    <div class='line'>\
                    <span class='tname'>密码</span>\
                    <div class='info-r'><input class='bt-input-text mr5' type='text' name='password' id='MyPassword' style='width:270px' value='"+(randomStrPwd(16))+"' />\
                        <span title='随机密码' class='glyphicon glyphicon-repeat cursor' onclick='repeatPwd(16)'></span></div>\
                    </div>\
                    <div class='line'>\
                        <span class='tname'>访问权限</span>\
                        <div class='info-r'>\
                            <select class='bt-input-text mr5' name='dataAccess' style='width:100px'>\
                            <option value='127.0.0.1'>本地服务器</option>\
                            <option value=\"%\">所有人</option>\
                            <option value='ip'>指定网段</option>\
                            </select>\
                            <input class='bt-input-text' style='width: 162px;display:none;' placeholder='如: 192.168.1.0/24' name='ip_segment' value='' />\
                        </div>\
                    </div>\
                  </form>",
        success:function(){

            $("input[name='name']").keyup(function(){
                var v = $(this).val();
                $("input[name='db_user']").val(v);
            });

            $('select[name="dataAccess"]').change(function(){
                var v = $(this).val();
                if (v == 'ip'){
                    $('input[name="ip_segment"]').show();
                } else {
                    $('input[name="ip_segment"]').hide();
                    
                }
            });
        },
        yes:function(index){
            addDatabase(1,index);
        }
    });

}

function delDb(id, name){
    safeMessage('删除['+name+']','您真的要删除['+name+']吗？',function(){
        var data='id='+id+'&name='+name
        myPost('del_db', data, function(data){
            var rdata = $.parseJSON(data.data);
            showMsg(rdata.msg,function(){
                dbList();
                $('.layui-layer-close1').click();
            },{icon: rdata.status ? 1 : 2}, 600);
        });
    });
}

function delDbBatch(){
    var arr = [];
    $('input[type="checkbox"].check:checked').each(function () {
        var _val = $(this).val();
        var _name = $(this).parent().next().text();
        if (!isNaN(_val)) {
            arr.push({'id':_val,'name':_name});
        }
    });

    safeMessage('批量删除数据库','<a style="color:red;">您共选择了[2]个数据库,删除后将无法恢复,真的要删除吗?</a>',function(){
        var i = 0;
        $(arr).each(function(){
            var data  = myAsyncPost('del_db', this);
            var rdata = $.parseJSON(data.data);
            if (!rdata.status){
                layer.msg(rdata.msg,{icon:2,time:2000,shade: [0.3, '#000']});
            }
            i++;
        });
        
        var msg = '成功删除['+i+']个数据库!';
        showMsg(msg,function(){
            dbList();
        },{icon: 1}, 600);
    });
}


function setDbPs(id, name, obj) {
    var _span = $(obj);
    var _input = $("<input class='baktext' value=\""+_span.text()+"\" type='text' placeholder='备注信息' />");
    _span.hide().after(_input);
    _input.focus();
    _input.blur(function(){
        $(this).remove();
        var ps = _input.val();
        _span.text(ps).show();
        var data = {name:name,id:id,ps:ps};
        myPost('set_db_ps', data, function(data){
            var rdata = $.parseJSON(data.data);
            layer.msg(rdata.msg, { icon: rdata.status ? 1 : 2 });
        });
    });
    _input.keyup(function(){
        if(event.keyCode == 13){
            _input.trigger('blur');
        }
    });
}

function openPhpmyadmin(name,username,password){

    data = syncPost('/plugins/check',{'name':'phpmyadmin'});


    if (!data.status){
        layer.msg(data.msg,{icon:2,shade: [0.3, '#000']});
        return;
    }

    data = syncPost('/plugins/run',{'name':'phpmyadmin','func':'status'});
    if (data.data != 'start'){
        layer.msg('phpMyAdmin未启动',{icon:2,shade: [0.3, '#000']});
        return;
    }
    // console.log(data);
    data = syncPost('/plugins/run',{'name':'phpmyadmin','func':'get_home_page'});
    var rdata = $.parseJSON(data.data);
    if (!rdata.status){
        layer.msg(rdata.msg,{icon:2,shade: [0.3, '#000']});
        return;
    }
    $("#toPHPMyAdmin").attr('action',rdata.data);

    if($("#toPHPMyAdmin").attr('action').indexOf('phpmyadmin') == -1){
        layer.msg('请先安装phpMyAdmin',{icon:2,shade: [0.3, '#000']});
        setTimeout(function(){ window.location.href = '/soft'; },3000);
        return;
    }

    //检查版本
    data = syncPost('/plugins/run',{'name':'phpmyadmin','func':'version'});
    bigVer = data.data.split('.')[0]
    if (bigVer>=4.5){

        setTimeout(function(){
            $("#toPHPMyAdmin").submit();
        },3000);
        layer.msg('phpMyAdmin['+data.data+']需要手动登录😭',{icon:16,shade: [0.3, '#000'],time:4000});
        
    } else{
        var murl = $("#toPHPMyAdmin").attr('action');
        $("#pma_username").val(username);
        $("#pma_password").val(password);
        $("#db").val(name);

        layer.msg('正在打开phpMyAdmin',{icon:16,shade: [0.3, '#000'],time:2000});

        setTimeout(function(){
            $("#toPHPMyAdmin").submit();
        },3000);
    }    
}

function delBackup(filename,name){
    myPost('delete_db_backup',{filename:filename},function(){
        layer.msg('执行成功!');
        setTimeout(function(){
            $('.layui-layer-close2').click();
            setBackup(name);
        },2000);
    });
}

function downloadBackup(file){
    window.open('/files/download?filename='+encodeURIComponent(file));
}

function importBackup(file,name){
    myPost('import_db_backup',{file:file,name:name}, function(data){
        // console.log(data);
        layer.msg('执行成功!');
    });
}

function setBackup(db_name,obj){
     myPost('get_db_backup_list', {name:db_name}, function(data){

        var rdata = $.parseJSON(data.data);
        var tbody = '';
        for (var i = 0; i < rdata.data.length; i++) {
            tbody += '<tr>\
                    <td><span> ' + rdata.data[i]['name'] + '</span></td>\
                    <td><span> ' + rdata.data[i]['size'] + '</span></td>\
                    <td><span> ' + rdata.data[i]['time'] + '</span></td>\
                    <td style="text-align: right;">\
                        <a class="btlink" onclick="importBackup(\'' + rdata.data[i]['name'] + '\',\'' +db_name+ '\')">导入</a> | \
                        <a class="btlink" onclick="downloadBackup(\'' + rdata.data[i]['file'] + '\')">下载</a> | \
                        <a class="btlink" onclick="delBackup(\'' + rdata.data[i]['name'] + '\',\'' +db_name+ '\')">删除</a>\
                    </td>\
                </tr> ';
        }

        var s = layer.open({
            type: 1,
            title: "数据库备份详情",
            area: ['600px', '280px'],
            closeBtn: 2,
            shadeClose: false,
            content: '<div class="pd15">\
                        <div class="db_list">\
                            <button id="btn_backup" class="btn btn-success btn-sm" type="button">备份</button>\
                        </div >\
                        <div class="divtable">\
                        <div  id="database_fix"  style="height:150px;overflow:auto;border:#ddd 1px solid">\
                        <table class="table table-hover "style="border:none">\
                            <thead>\
                                <tr>\
                                    <th>文件名称</th>\
                                    <th>文件大小</th>\
                                    <th>备份时间</th>\
                                    <th style="text-align: right;">操作</th>\
                                </tr>\
                            </thead>\
                            <tbody class="gztr">' + tbody + '</tbody>\
                        </table>\
                        </div>\
                    </div>\
            </div>'
        });

        $('#btn_backup').click(function(){
            myPost('set_db_backup',{name:db_name}, function(data){
                layer.msg('执行成功!');

                setTimeout(function(){
                    layer.close(s);
                    setBackup(db_name,obj);
                },2000);
            });
        });
    });
}


function dbList(page, search){
    var _data = {};
    if (typeof(page) =='undefined'){
        var page = 1;
    }
    
    _data['page'] = page;
    _data['page_size'] = 10;
    if(typeof(search) != 'undefined'){
        _data['search'] = search;
    }
    myPost('get_db_list', _data, function(data){
        var rdata = $.parseJSON(data.data);
        var list = '';
        for(i in rdata.data){
            list += '<tr>';
            list +='<td><input value="'+rdata.data[i]['id']+'" class="check" onclick="checkSelect();" type="checkbox"></td>';
            list += '<td>' + rdata.data[i]['name'] +'</td>';
            list += '<td>' + rdata.data[i]['username'] +'</td>';
            list += '<td>' + 
                        '<span class="password" data-pw="'+rdata.data[i]['password']+'">***</span>' +
                        '<span onclick="showHidePass(this)" class="glyphicon glyphicon-eye-open cursor pw-ico" style="margin-left:10px"></span>'+
                        '<span class="ico-copy cursor btcopy" style="margin-left:10px" title="复制密码" onclick="copyPass(\''+rdata.data[i]['password']+'\')"></span>'+
                    '</td>';
        

            list += '<td><span class="c9 input-edit" onclick="setDbPs(\''+rdata.data[i]['id']+'\',\''+rdata.data[i]['name']+'\',this)" style="display: inline-block;">'+rdata.data[i]['ps']+'</span></td>';
            list += '<td style="text-align:right">';

            list += '<a href="javascript:;" class="btlink" class="btlink" onclick="setBackup(\''+rdata.data[i]['name']+'\',this)" title="数据库备份">'+(rdata.data[i]['is_backup']?'备份':'未备份') +'</a> | ';

            var rw = '';
            var rw_change = 'all';
            if (typeof(rdata.data[i]['rw'])!='undefined'){
                var rw_val = '读写';
                if (rdata.data[i]['rw'] == 'all'){
                    rw_val = "所有";
                    rw_change = 'rw';
                } else if (rdata.data[i]['rw'] == 'rw'){
                    rw_val = "读写";
                    rw_change = 'r';
                } else if (rdata.data[i]['rw'] == 'r'){
                    rw_val = "只读";
                    rw_change = 'all';
                }
                rw = '<a href="javascript:;" class="btlink" onclick="setDbRw(\''+rdata.data[i]['id']+'\',\''+rdata.data[i]['name']+'\',\''+rw_change+'\')" title="设置读写">'+rw_val+'</a> | ';
            }


            list += '<a href="javascript:;" class="btlink" onclick="setDbAccess(\''+rdata.data[i]['username']+'\')" title="设置数据库权限">权限</a> | ' +
                        rw +
                        '<a href="javascript:;" class="btlink" onclick="setDbPass('+rdata.data[i]['id']+',\''+ rdata.data[i]['username'] +'\',\'' + rdata.data[i]['password'] + '\')">改密</a> | ' +
                        '<a href="javascript:;" class="btlink" onclick="delDb(\''+rdata.data[i]['id']+'\',\''+rdata.data[i]['name']+'\')" title="删除数据库">删除</a>' +
                    '</td>';
            list += '</tr>';
        }

        //<button onclick="" id="dataRecycle" title="删除选中项" class="btn btn-default btn-sm" style="margin-left: 5px;"><span class="glyphicon glyphicon-trash" style="margin-right: 5px;"></span>回收站</button>
        var con = '<div class="safe bgw">\
            <button onclick="addDatabase()" title="添加数据库" class="btn btn-success btn-sm" type="button" style="margin-right: 5px;">添加数据库</button>\
            <button onclick="setRootPwd(0,\''+rdata.info['root_pwd']+'\')" title="设置MySQL管理员密码" class="btn btn-default btn-sm" type="button" style="margin-right: 5px;">root密码</button>\
            <button onclick="setDbAccess(\'root\')" title="ROOT权限" class="btn btn-default btn-sm" type="button" style="margin-right: 5px;">ROOT权限</button>\
            <span style="float:right">              \
                <button batch="true" style="float: right;display: none;margin-left:10px;" onclick="delDbBatch();" title="删除选中项" class="btn btn-default btn-sm">删除选中</button>\
            </span>\
            <div class="divtable mtb10">\
                <div class="tablescroll">\
                    <table id="DataBody" class="table table-hover" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 0 none;">\
                    <thead><tr><th width="30"><input class="check" onclick="checkSelect();" type="checkbox"></th>\
                    <th>数据库名</th>\
                    <th>用户名</th>\
                    <th>密码</th>\
                    '+
                    // '<th>备份</th>'+
                    '<th>备注</th>\
                    <th style="text-align:right;">操作</th></tr></thead>\
                    <tbody>\
                    '+ list +'\
                    </tbody></table>\
                </div>\
                <div id="databasePage" class="dataTables_paginate paging_bootstrap page"></div>\
                <div class="table_toolbar" style="left:0px;">\
                    <span class="sync btn btn-default btn-sm" style="margin-right:5px" onclick="syncToDatabase(1)" title="将选中数据库信息同步到服务器">同步选中</span>\
                    <span class="sync btn btn-default btn-sm" style="margin-right:5px" onclick="syncToDatabase(0)" title="将所有数据库信息同步到服务器">同步所有</span>\
                    <span class="sync btn btn-default btn-sm" onclick="syncGetDatabase()" title="从服务器获取数据库列表">从服务器获取</span>\
                </div>\
            </div>\
        </div>';

        con += '<form id="toPHPMyAdmin" action="" method="post" style="display: none;" target="_blank">\
            <input type="text" name="pma_username" id="pma_username" value="">\
            <input type="password" name="pma_password" id="pma_password" value="">\
            <input type="text" name="server" value="1">\
            <input type="text" name="target" value="index.php">\
            <input type="text" name="db" id="db" value="">\
        </form>';

        $(".soft-man-con").html(con);
        $('#databasePage').html(rdata.page);

        readerTableChecked();
    });
}

function repCheckeds(tables) {
    var dbs = []
    if (tables) {
        dbs.push(tables)
    } else {
        var db_tools = $("input[value^='dbtools_']");
        for (var i = 0; i < db_tools.length; i++) {
            if (db_tools[i].checked) dbs.push(db_tools[i].value.replace('dbtools_', ''));
        }
    }

    if (dbs.length < 1) {
        layer.msg('请至少选择一张表!', { icon: 2 });
        return false;
    }
    return dbs;
}

function repDatabase(db_name, tables) {
    dbs = repCheckeds(tables);
    
    myPost('repair_table', { db_name: db_name, tables: JSON.stringify(dbs) }, function(data){
        var rdata = $.parseJSON(data.data);
        layer.msg(rdata.msg, { icon: rdata.status ? 1 : 2 });
        repTools(db_name, true);
    },'已送修复指令,请稍候...');
}


function optDatabase(db_name, tables) {
    dbs = repCheckeds(tables);
    
    myPost('opt_table', { db_name: db_name, tables: JSON.stringify(dbs) }, function(data){
        var rdata = $.parseJSON(data.data);
        layer.msg(rdata.msg, { icon: rdata.status ? 1 : 2 });
        repTools(db_name, true);
    },'已送优化指令,请稍候...');
}

function toDatabaseType(db_name, tables, type){
    dbs = repCheckeds(tables);
    myPost('alter_table', { db_name: db_name, tables: JSON.stringify(dbs),table_type: type }, function(data){
        var rdata = $.parseJSON(data.data);
        layer.msg(rdata.msg, { icon: rdata.status ? 1 : 2 });
        repTools(db_name, true);
    }, '已送引擎转换指令,请稍候...');
}


function selectedTools(my_obj, db_name) {
    var is_checked = false

    if (my_obj) is_checked = my_obj.checked;
    var db_tools = $("input[value^='dbtools_']");
    var n = 0;
    for (var i = 0; i < db_tools.length; i++) {
        if (my_obj) db_tools[i].checked = is_checked;
        if (db_tools[i].checked) n++;
    }
    if (n > 0) {
        var my_btns = '<button class="btn btn-default btn-sm" onclick="repDatabase(\'' + db_name + '\',null)">修复</button>\
            <button class="btn btn-default btn-sm" onclick="optDatabase(\'' + db_name + '\',null)">优化</button>\
            <button class="btn btn-default btn-sm" onclick="toDatabaseType(\'' + db_name + '\',null,\'InnoDB\')">转为InnoDB</button></button>\
            <button class="btn btn-default btn-sm" onclick="toDatabaseType(\'' + db_name + '\',null,\'MyISAM\')">转为MyISAM</button>'
        $("#db_tools").html(my_btns);
    } else {
        $("#db_tools").html('');
    }
}

function repTools(db_name, res){
    myPost('get_db_info', {name:db_name}, function(data){
        var rdata = $.parseJSON(data.data);
        var types = { InnoDB: "MyISAM", MyISAM: "InnoDB" };
        var tbody = '';
        for (var i = 0; i < rdata.tables.length; i++) {
            if (!types[rdata.tables[i].type]) continue;
            tbody += '<tr>\
                    <td><input value="dbtools_' + rdata.tables[i].table_name + '" class="check" onclick="selectedTools(null,\'' + db_name + '\');" type="checkbox"></td>\
                    <td><span style="width:220px;"> ' + rdata.tables[i].table_name + '</span></td>\
                    <td>' + rdata.tables[i].type + '</td>\
                    <td><span style="width:90px;"> ' + rdata.tables[i].collation + '</span></td>\
                    <td>' + rdata.tables[i].rows_count + '</td>\
                    <td>' + rdata.tables[i].data_size + '</td>\
                    <td style="text-align: right;">\
                        <a class="btlink" onclick="repDatabase(\''+ db_name + '\',\'' + rdata.tables[i].table_name + '\')">修复</a> |\
                        <a class="btlink" onclick="optDatabase(\''+ db_name + '\',\'' + rdata.tables[i].table_name + '\')">优化</a> |\
                        <a class="btlink" onclick="toDatabaseType(\''+ db_name + '\',\'' + rdata.tables[i].table_name + '\',\'' + types[rdata.tables[i].type] + '\')">转为' + types[rdata.tables[i].type] + '</a>\
                    </td>\
                </tr> '
        }

        if (res) {
            $(".gztr").html(tbody);
            $("#db_tools").html('');
            $("input[type='checkbox']").attr("checked", false);
            $(".tools_size").html('大小：' + rdata.data_size);
            return;
        }

        layer.open({
            type: 1,
            title: "MySQL工具箱【" + db_name + "】",
            area: ['780px', '580px'],
            closeBtn: 2,
            shadeClose: false,
            content: '<div class="pd15">\
                            <div class="db_list">\
                                <span><a>数据库名称：'+ db_name + '</a>\
                                <a class="tools_size">大小：'+ rdata.data_size + '</a></span>\
                                <span id="db_tools" style="float: right;"></span>\
                            </div >\
                            <div class="divtable">\
                            <div  id="database_fix"  style="height:360px;overflow:auto;border:#ddd 1px solid">\
                            <table class="table table-hover "style="border:none">\
                                <thead>\
                                    <tr>\
                                        <th><input class="check" onclick="selectedTools(this,\''+ db_name + '\');" type="checkbox"></th>\
                                        <th>表名</th>\
                                        <th>引擎</th>\
                                        <th>字符集</th>\
                                        <th>行数</th>\
                                        <th>大小</th>\
                                        <th style="text-align: right;">操作</th>\
                                    </tr>\
                                </thead>\
                                <tbody class="gztr">' + tbody + '</tbody>\
                            </table>\
                            </div>\
                        </div>\
                        <ul class="help-info-text c7">\
                            <li>【修复】尝试使用REPAIR命令修复损坏的表，仅能做简单修复，若修复不成功请考虑使用myisamchk工具</li>\
                            <li>【优化】执行OPTIMIZE命令，可回收未释放的磁盘空间，建议每月执行一次</li>\
                            <li>【转为InnoDB/MyISAM】转换数据表引擎，建议将所有表转为InnoDB</li>\
                        </ul></div>'
        });
        tableFixed('database_fix');
    });
}


function setDbMaster(name){
    myPost('set_db_master', {name:name}, function(data){
        var rdata = $.parseJSON(data.data);
        layer.msg(rdata.msg, { icon: rdata.status ? 1 : 5 });
        setTimeout(function(){
            masterOrSlaveConf();
        }, 2000);
    });
}


function setDbSlave(name){
    myPost('set_db_slave', {name:name}, function(data){
        var rdata = $.parseJSON(data.data);
        layer.msg(rdata.msg, { icon: rdata.status ? 1 : 5 });
        setTimeout(function(){
            masterOrSlaveConf();
        }, 2000);
    });
}


function addMasterRepSlaveUser(){
    layer.open({
        type: 1,
        area: '500px',
        title: '添加同步账户',
        closeBtn: 1,
        shift: 5,
        shadeClose: true,
        btn:["提交","取消"],
        content: "<form class='bt-form pd20' id='add_master'>\
            <div class='line'><span class='tname'>用户名</span><div class='info-r'><input name='username' class='bt-input-text mr5' placeholder='用户名' type='text' style='width:330px;' value='"+(randomStrPwd(6))+"'></div></div>\
            <div class='line'>\
            <span class='tname'>密码</span>\
            <div class='info-r'><input class='bt-input-text mr5' type='text' name='password' id='MyPassword' style='width:330px' value='"+(randomStrPwd(16))+"' /><span title='随机密码' class='glyphicon glyphicon-repeat cursor' onclick='repeatPwd(16)'></span></div>\
            </div>\
            <input type='hidden' name='ps' value='' />\
          </form>",
        success:function(){
            $("input[name='name']").keyup(function(){
                var v = $(this).val();
                $("input[name='db_user']").val(v);
                $("input[name='ps']").val(v);
            });

            $('select[name="dataAccess"]').change(function(){
                var v = $(this).val();
                if (v == 'ip'){
                    $(this).after("<input id='dataAccess_subid' class='bt-input-text mr5' type='text' name='address' placeholder='多个IP使用逗号(,)分隔' style='width: 230px; display: inline-block;'>");
                } else {
                    $('#dataAccess_subid').remove();
                }
            });
        },
        yes:function(index){
            var data = $("#add_master").serialize();
            data = decodeURIComponent(data);
            var dataObj = str2Obj(data);
            if(!dataObj['address']){
                dataObj['address'] = dataObj['dataAccess'];
            }

            myPost('add_master_rep_slave_user', dataObj, function(data){
                var rdata = $.parseJSON(data.data);
                showMsg(rdata.msg,function(){
                    layer.close(index);
                    if (rdata.status){
                        getMasterRepSlaveList();
                    }
                },{icon: rdata.status ? 1 : 2},600);
            });
        }
    });
}



function updateMasterRepSlaveUser(username){
  
    var index = layer.open({
        type: 1,
        area: '500px',
        title: '更新账户',
        closeBtn: 1,
        shift: 5,
        shadeClose: true,
        content: "<form class='bt-form pd20 pb70' id='update_master'>\
            <div class='line'><span class='tname'>用户名</span><div class='info-r'><input name='username' readonly='readonly' class='bt-input-text mr5' placeholder='用户名' type='text' style='width:330px;' value='"+username+"'></div></div>\
            <div class='line'>\
            <span class='tname'>密码</span>\
            <div class='info-r'><input class='bt-input-text mr5' type='text' name='password' id='MyPassword' style='width:330px' value='"+(randomStrPwd(16))+"' /><span title='随机密码' class='glyphicon glyphicon-repeat cursor' onclick='repeatPwd(16)'></span></div>\
            </div>\
            <input type='hidden' name='ps' value='' />\
            <div class='bt-form-submit-btn'>\
                <button type='button' class='btn btn-success btn-sm btn-title' id='submit_update_master' >提交</button>\
            </div>\
          </form>",
    });

    $('#submit_update_master').click(function(){
        var data = $("#update_master").serialize();
        data = decodeURIComponent(data);
        var dataObj = str2Obj(data);
        myPost('update_master_rep_slave_user', data, function(data){
            var rdata = $.parseJSON(data.data);
            showMsg(rdata.msg,function(){
                if (rdata.status){
                    getMasterRepSlaveList();
                }
                $('.layui-layer-close1').click();
            },{icon: rdata.status ? 1 : 2},600);
        });
    });
}

function getMasterRepSlaveUserCmd(username, db=''){
    myPost('get_master_rep_slave_user_cmd', {username:username,db:db}, function(data){
        var rdata = $.parseJSON(data.data);

        if (!rdata['status']){
            layer.msg(rdata['msg']);
            return;
        }

        var cmd = rdata.data['cmd'];
        
        var loadOpen = layer.open({
            type: 1,
            title: '同步命令',
            area: '500px',
            content:"<form class='bt-form pd20 pb70' id='add_master'>\
            <div class='line'>"+cmd+"</div>\
            <div class='bt-form-submit-btn'>\
                <button type='button' class='btn btn-success btn-sm btn-title class-copy-cmd'>复制</button>\
            </div>\
          </form>",
        });

       
        copyPass(cmd);
        $('.class-copy-cmd').click(function(){
            copyPass(cmd);
        });
    });
}

function delMasterRepSlaveUser(username){
    myPost('del_master_rep_slave_user', {username:username}, function(data){
        var rdata = $.parseJSON(data.data);
        layer.msg(rdata.msg);

        $('.layui-layer-close1').click();

        setTimeout(function(){
            getMasterRepSlaveList();
        },1000);
    });
}


function setDbMasterAccess(username){
    myPost('get_db_access','username='+username, function(data){
        var rdata = $.parseJSON(data.data);
        if (!rdata.status){
            layer.msg(rdata.msg,{icon:2,shade: [0.3, '#000']});
            return;
        }
        
        var index = layer.open({
            type: 1,
            area: '500px',
            title: '设置数据库权限',
            closeBtn: 1,
            shift: 5,
            btn:["提交","取消"],
            shadeClose: true,
            content: "<form class='bt-form pd20' id='set_db_access'>\
                        <div class='line'>\
                            <span class='tname'>访问权限</span>\
                            <div class='info-r '>\
                                <select class='bt-input-text mr5' name='dataAccess' style='width:100px'>\
                                <option value='127.0.0.1'>本地服务器</option>\
                                <option value=\"%\">所有人</option>\
                                <option value='ip'>指定IP</option>\
                                </select>\
                            </div>\
                        </div>\
                      </form>",
            success:function(){
                if (rdata.msg == '127.0.0.1'){
                    $('select[name="dataAccess"]').find("option[value='127.0.0.1']").attr("selected",true);
                } else if (rdata.msg == '%'){
                    $('select[name="dataAccess"]').find('option[value="%"]').attr("selected",true);
                } else if ( rdata.msg == 'ip' ){
                    $('select[name="dataAccess"]').find('option[value="ip"]').attr("selected",true);
                    $('select[name="dataAccess"]').after("<input id='dataAccess_subid' class='bt-input-text mr5' type='text' name='address' placeholder='多个IP使用逗号(,)分隔' style='width: 230px; display: inline-block;'>");
                } else {
                    $('select[name="dataAccess"]').find('option[value="ip"]').attr("selected",true);
                    $('select[name="dataAccess"]').after("<input value='"+rdata.msg+"' id='dataAccess_subid' class='bt-input-text mr5' type='text' name='address' placeholder='多个IP使用逗号(,)分隔' style='width: 230px; display: inline-block;'>");
                }

                 $('select[name="dataAccess"]').change(function(){
                    var v = $(this).val();
                    if (v == 'ip'){
                        $(this).after("<input id='dataAccess_subid' class='bt-input-text mr5' type='text' name='address' placeholder='多个IP使用逗号(,)分隔' style='width: 230px; display: inline-block;'>");
                    } else {
                        $('#dataAccess_subid').remove();
                    }
                });
            },
            yes:function(index){
                var data = $("#set_db_access").serialize();
                data = decodeURIComponent(data);
                var dataObj = str2Obj(data);
                if(!dataObj['access']){
                    dataObj['access'] = dataObj['dataAccess'];
                    if ( dataObj['dataAccess'] == 'ip'){
                        if (dataObj['address']==''){
                            layer.msg('IP地址不能空!',{icon:2,shade: [0.3, '#000']});
                            return;
                        }
                        dataObj['access'] = dataObj['address'];
                    }
                }
                dataObj['username'] = username;
                myPost('set_dbmaster_access', dataObj, function(data){
                    var rdata = $.parseJSON(data.data);
                    showMsg(rdata.msg,function(){
                        layer.close(index);
                    },{icon: rdata.status ? 1 : 2});   
                });
            }
        });

    });
}

function getMasterRepSlaveList(){
    var _data = {};
    if (typeof(page) =='undefined'){
        var page = 1;
    }
    
    _data['page'] = page;
    _data['page_size'] = 10;
    myPost('get_master_rep_slave_list', _data, function(data){
        // console.log(data);
        var rdata = [];
        try {
            rdata = $.parseJSON(data.data);
        } catch(e){
            console.log(e);
        }
        var list = '';
        // console.log(rdata['data']);
        var user_list = rdata['data'];
        for (i in user_list) {
            // console.log(i);
            var name = user_list[i]['username'];
            list += '<tr><td>'+name+'</td>\
                <td>'+user_list[i]['password']+'</td>\
                <td>\
                    <a class="btlink" onclick="updateMasterRepSlaveUser(\''+name+'\');">修改</a> | \
                    <a class="btlink" onclick="delMasterRepSlaveUser(\''+name+'\');">删除</a> | \
                    <a class="btlink" onclick="setDbMasterAccess(\''+name+'\');">权限</a> | \
                    <a class="btlink" onclick="getMasterRepSlaveUserCmd(\''+name+'\');">从库同步命令</a>\
                </td>\
            </tr>';
        }

        $('#get_master_rep_slave_list_page tbody').html(list);
        $('.dataTables_paginate_4').html(rdata['page']);
    });
}

function getMasterRepSlaveListPage(){
    var page = '<div class="dataTables_paginate_4 dataTables_paginate paging_bootstrap page" style="margin-top:0px;"></div>';
        page += '<div class="table_toolbar" style="left:0px;"><span class="sync btn btn-default btn-sm" onclick="addMasterRepSlaveUser()" title="">添加同步账户</span></div>';

    var loadOpen = layer.open({
        type: 1,
        title: '同步账户列表',
        area: '500px',
        content:"<div class='bt-form pd20 c6'>\
                 <div class='divtable mtb10' id='get_master_rep_slave_list_page'>\
                    <div><table class='table table-hover'>\
                        <thead><tr><th>用户名</th><th>密码</th><th>操作</th></tr></thead>\
                        <tbody></tbody>\
                    </table></div>\
                    "+page +"\
                </div>\
            </div>",
        success:function(){
            getMasterRepSlaveList();
        }
    });
}


function deleteSlave(){
    myPost('delete_slave', {}, function(data){
        var rdata = $.parseJSON(data.data);
        showMsg(rdata['msg'], function(){
            masterOrSlaveConf();
        },{},3000);
    });
}


function getFullSyncStatus(db){
    var timeId = null;

    var btn = '<div class="table_toolbar" style="left:0px;"><span data-status="init" class="sync btn btn-default btn-sm" id="begin_full_sync" title="">开始</span></div>';
    var loadOpen = layer.open({
        type: 1,
        title: '全量同步['+db+']',
        area: '500px',
        content:"<div class='bt-form pd20 c6'>\
                 <div class='divtable mtb10'>\
                    <span id='full_msg'></span>\
                    <div class='progress'>\
                        <div class='progress-bar' role='progressbar' aria-valuenow='0' aria-valuemin='0' aria-valuemax='100' style='min-width: 2em;'>0%</div>\
                    </div>\
                </div>\
                "+btn+"\
            </div>",
        cancel: function(){ 
            clearInterval(timeId);
        }
    });

    function fullSync(db,begin){
       
        myPostN('full_sync', {db:db,begin:begin}, function(data){
            var rdata = $.parseJSON(data.data);
            $('#full_msg').text(rdata['msg']);
            $('.progress-bar').css('width',rdata['progress']+'%');
            $('.progress-bar').text(rdata['progress']+'%');

            if (rdata['code']==6 ||rdata['code']<0){
                layer.msg(rdata['msg']);
                clearInterval(timeId);
                $("#begin_full_sync").attr('data-status','init');
            }
        });
    }

    $('#begin_full_sync').click(function(){
        var val = $(this).attr('data-status');
        if (val == 'init'){
            fullSync(db,1);
            timeId = setInterval(function(){
                fullSync(db,0);
            }, 1000);
            $(this).attr('data-status','starting');
        } else {
            layer.msg("正在同步中..");
        }
    });
}

function addSlaveSSH(ip=''){

    myPost('get_slave_ssh_by_ip', {ip:ip}, function(rdata){
        
        var rdata = $.parseJSON(rdata.data);

        var ip = '127.0.0.1';
        var port = "22";
        var id_rsa = '';
        var db_user ='';

        if (rdata.data.length>0){
            ip = rdata.data[0]['ip'];
            port = rdata.data[0]['port'];
            id_rsa = rdata.data[0]['id_rsa'];
            db_user = rdata.data[0]['db_user'];
        }

        var index = layer.open({
            type: 1,
            area: ['500px','480px'],
            title: '添加SSH',
            closeBtn: 1,
            shift: 5,
            shadeClose: true,
            btn:["确认","取消"],
            content: "<form class='bt-form pd20'>\
                <div class='line'><span class='tname'>IP</span><div class='info-r'><input name='ip' class='bt-input-text mr5' type='text' style='width:330px;' value='"+ip+"'></div></div>\
                <div class='line'><span class='tname'>端口</span><div class='info-r'><input name='port' class='bt-input-text mr5' type='number' style='width:330px;' value='"+port+"'></div></div>\
                <div class='line'><span class='tname'>同步账户[DB]</span><div class='info-r'><input name='db_user'  placeholder='为空则取第一个!' class='bt-input-text mr5' type='text' style='width:330px;' value='"+db_user+"'></div></div>\
                <div class='line'>\
                <span class='tname'>ID_RSA</span>\
                <div class='info-r'><textarea class='bt-input-text mr5' row='20' cols='50' name='id_rsa' style='width:330px;height:200px;'></textarea></div>\
                </div>\
                <input type='hidden' name='ps' value='' />\
              </form>",
            success:function(){
                $('textarea[name="id_rsa"]').html(id_rsa);
            },
            yes:function(index){
                var ip = $('input[name="ip"]').val();
                var port = $('input[name="port"]').val();
                var db_user = $('input[name="db_user"]').val();
                var id_rsa = $('textarea[name="id_rsa"]').val();

                var data = {ip:ip,port:port,id_rsa:id_rsa,db_user:db_user};
                myPost('add_slave_ssh', data, function(data){
                    layer.close(index);
                    var rdata = $.parseJSON(data.data);
                    showMsg(rdata.msg,function(){
                        if (rdata.status){
                            getSlaveSSHPage();
                        }
                    },{icon: rdata.status ? 1 : 2},600);
                });
            }
        });
    });
}


function delSlaveSSH(ip){
    myPost('del_slave_ssh', {ip:ip}, function(rdata){
        var rdata = $.parseJSON(rdata.data);
        layer.msg(rdata.msg, {icon: rdata.status ? 1 : 2});
        getSlaveSSHPage();
    });
}

function getSlaveSSHPage(page=1){
    var _data = {};    
    _data['page'] = page;
    _data['page_size'] = 5;
    _data['tojs'] ='getSlaveSSHPage';
    myPost('get_slave_ssh_list', _data, function(data){
        var layerId = null;
        var rdata = [];
        try {
            rdata = $.parseJSON(data.data);
        } catch(e) {
            console.log(e);
        }
        var list = '';
        var ssh_list = rdata['data'];
        for (i in ssh_list) {
            var ip = ssh_list[i]['ip'];
            var port = ssh_list[i]['port'];

            var id_rsa = '未设置';
            if ( ssh_list[i]['port'] != ''){
                id_rsa = '已设置';
            }

            var db_user = '未设置';
            if ( ssh_list[i]['db_user'] != ''){
                db_user = ssh_list[i]['db_user'];
            }

            list += '<tr><td>'+ip+'</td>\
                <td>'+port+'</td>\
                <td>'+db_user+'</td>\
                <td>'+id_rsa+'</td>\
                <td>\
                    <a class="btlink" onclick="addSlaveSSH(\''+ip+'\');">修改</a> | \
                    <a class="btlink" onclick="delSlaveSSH(\''+ip+'\');">删除</a>\
                </td>\
            </tr>';
        }

        $('.get-slave-ssh-list tbody').html(list);
        $('.dataTables_paginate_4').html(rdata['page']);
    });
}


function getSlaveSSHList(page=1){

    var page = '<div class="dataTables_paginate_4 dataTables_paginate paging_bootstrap page" style="margin-top:0px;"></div>';
    page += '<div class="table_toolbar" style="left:0px;"><span class="sync btn btn-default btn-sm" onclick="addSlaveSSH()" title="">添加SSH</span></div>';

    layerId = layer.open({
        type: 1,
        title: 'SSH列表',
        area: '500px',
        content:"<div class='bt-form pd20 c6'>\
                 <div class='divtable mtb10'>\
                    <div><table class='table table-hover get-slave-ssh-list'>\
                        <thead><tr><th>IP</th><th>PORT</th><th>同步账户</th><th>SSH</th><th>操作</th></tr></thead>\
                        <tbody></tbody>\
                    </table></div>\
                    "+page +"\
                </div>\
            </div>",
        success:function(){
            getSlaveSSHPage(1);
        }
    });
}

function handlerRun(){
    myPostN('get_slave_sync_cmd', {}, function(data){
        var rdata = $.parseJSON(data.data);
        var cmd = rdata['data'];
        var loadOpen = layer.open({
            type: 1,
            title: '手动执行',
            area: '500px',
            content:"<form class='bt-form pd20 pb70' id='add_master'>\
            <div class='line'>"+cmd+"</div>\
            <div class='bt-form-submit-btn'>\
                <button type='button' class='btn btn-success btn-sm btn-title class-copy-cmd'>复制</button>\
            </div>\
          </form>",
        });
        copyPass(cmd);
        $('.class-copy-cmd').click(function(){
            copyPass(cmd);
        });
    });
}

function initSlaveStatus(){
    myPost('init_slave_status', '', function(data){
        var rdata = $.parseJSON(data.data);
        showMsg(rdata.msg,function(){
            if (rdata.status){
                masterOrSlaveConf();
            }
        },{icon:rdata.status?1:2},2000);
    });
}

function masterOrSlaveConf(version=''){

    function getMasterDbList(){
        var _data = {};
        if (typeof(page) =='undefined'){
            var page = 1;
        }
        
        _data['page'] = page;
        _data['page_size'] = 10;

        myPost('get_masterdb_list', _data, function(data){
            var rdata = $.parseJSON(data.data);
            var list = '';
            for(i in rdata.data){
                list += '<tr>';
                list += '<td>' + rdata.data[i]['name'] +'</td>';
                list += '<td>' + (rdata.data[i]['master']?'是':'否') +'</td>';
                list += '<td style="text-align:right">' + 
                    '<a href="javascript:;" class="btlink" onclick="setDbMaster(\''+rdata.data[i]['name']+'\')" title="加入或退出">'+(rdata.data[i]['master']?'退出':'加入')+'</a> | ' +
                    '<a href="javascript:;" class="btlink" onclick="getMasterRepSlaveUserCmd(\'\',\''+rdata.data[i]['name']+'\')" title="同步命令">同步命令</a>' +
                '</td>';
                list += '</tr>';
            }

            var con = '<div class="divtable mtb10">\
                    <div class="tablescroll">\
                        <table id="DataBody" class="table table-hover" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 0 none;">\
                        <thead><tr>\
                        <th>数据库名</th>\
                        <th>同步</th>\
                        <th style="text-align:right;">操作</th></tr></thead>\
                        <tbody>\
                        '+ list +'\
                        </tbody></table>\
                    </div>\
                    <div id="databasePage" class="dataTables_paginate paging_bootstrap page"></div>\
                    <div class="table_toolbar" style="left:0px;">\
                        <span class="sync btn btn-default btn-sm" onclick="getMasterRepSlaveListPage()" title="">同步账户列表</span>\
                    </div>\
                </div>';

            $(".table_master_list").html(con);
            $('#databasePage').html(rdata.page);
        });
    }

    function getAsyncMasterDbList(){
        var _data = {};
        if (typeof(page) =='undefined'){
            var page = 1;
        }
        
        _data['page'] = page;
        _data['page_size'] = 10;

        myPost('get_slave_list', _data, function(data){
            var rdata = $.parseJSON(data.data);
            var list = '';
            for(i in rdata.data){

                var v = rdata.data[i];
                var status = "异常";
                if (v['Slave_SQL_Running'] == 'Yes' && v['Slave_IO_Running'] == 'Yes'){
                    status = "正常";
                }

                list += '<tr>';
                list += '<td>' + rdata.data[i]['Master_Host'] +'</td>';
                list += '<td>' + rdata.data[i]['Master_Port'] +'</td>';
                list += '<td>' + rdata.data[i]['Master_User'] +'</td>';
                list += '<td>' + rdata.data[i]['Master_Log_File'] +'</td>';
                list += '<td>' + rdata.data[i]['Slave_IO_Running'] +'</td>';
                list += '<td>' + rdata.data[i]['Slave_SQL_Running'] +'</td>';
                list += '<td>' + status +'</td>';
                list += '<td style="text-align:right">' + 
                    '<a href="javascript:;" class="btlink" onclick="deleteSlave()" title="删除">删除</a>' +
                '</td>';
                list += '</tr>';
            }

            var con = '<div class="divtable mtb10">\
                    <div class="tablescroll">\
                        <table id="DataBody" class="table table-hover" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 0 none;">\
                        <thead><tr>\
                        <th>主[服务]</th>\
                        <th>端口</th>\
                        <th>用户</th>\
                        <th>日志</th>\
                        <th>IO</th>\
                        <th>SQL</th>\
                        <th>状态</th>\
                        <th style="text-align:right;">操作</th></tr></thead>\
                        <tbody>\
                        '+ list +'\
                        </tbody></table>\
                    </div>\
                </div>';

            // <div id="databasePage_slave" class="dataTables_paginate paging_bootstrap page"></div>\
            // <div class="table_toolbar">\
            //     <span class="sync btn btn-default btn-sm" onclick="getMasterRepSlaveList()" title="">添加</span>\
            // </div>
            $(".table_slave_status_list").html(con);
        });
    }

    function getAsyncDataList(){
        var _data = {};
        if (typeof(page) =='undefined'){
            var page = 1;
        }
        
        _data['page'] = page;
        _data['page_size'] = 10;
        myPost('get_masterdb_list', _data, function(data){
            var rdata = $.parseJSON(data.data);
            var list = '';
            for(i in rdata.data){
                list += '<tr>';
                list += '<td>' + rdata.data[i]['name'] +'</td>';
                list += '<td style="text-align:right">' + 
                    '<a href="javascript:;" class="btlink" onclick="setDbSlave(\''+rdata.data[i]['name']+'\')"  title="加入|退出">'+(rdata.data[i]['slave']?'退出':'加入')+'</a> | ' +
                    '<a href="javascript:;" class="btlink" onclick="getFullSyncStatus(\''+rdata.data[i]['name']+'\')" title="同步">同步</a>' +
                '</td>';
                list += '</tr>';
            }

            var con = '<div class="divtable mtb10">\
                    <div class="tablescroll">\
                        <table id="DataBody" class="table table-hover" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 0 none;">\
                        <thead><tr>\
                        <th>本地库名</th>\
                        <th style="text-align:right;">操作</th></tr></thead>\
                        <tbody>\
                        '+ list +'\
                        </tbody></table>\
                    </div>\
                    <div id="databasePage" class="dataTables_paginate paging_bootstrap page"></div>\
                    <div class="table_toolbar" style="left:0px;">\
                        <span class="sync btn btn-default btn-sm" onclick="handlerRun()" title="免登录设置后,需要手动执行一下!">手动命令</span>\
                        <span class="sync btn btn-default btn-sm" onclick="getFullSyncStatus(\'ALL\')" title="全量同步">全量同步</span>\
                    </div>\
                </div>';

            $(".table_slave_list").html(con);
            $('#databasePage').html(rdata.page);
        });
    }

   

    function getMasterStatus(){
        myPost('get_master_status', '', function(data){
            var rdata = $.parseJSON(data.data);
            // console.log('mode:',rdata.data);
            var rdata = rdata.data;
            var limitCon = '\
                <p class="conf_p">\
                    <span class="f14 c6 mr20">主从同步模式</span><span class="f14 c6 mr20"></span>\
                    <button class="btn '+(!(rdata.mode == "classic") ? 'btn-danger' : 'btn-success')+' btn-xs db-mode btn-classic">经典</button>\
                    <button class="btn '+(!(rdata.mode == "gtid") ? 'btn-danger' : 'btn-success')+' btn-xs db-mode btn-gtid">GTID</button>\
                </p>\
                <hr/>\
                <p class="conf_p">\
                    <span class="f14 c6 mr20">Master[主]配置</span><span class="f14 c6 mr20"></span>\
                    <button class="btn '+(!rdata.status ? 'btn-danger' : 'btn-success')+' btn-xs btn-master">'+(!rdata.status ? '未开启' : '已开启') +'</button>\
                </p>\
                <hr/>\
                <!-- master list -->\
                <div class="safe bgw table_master_list"></div>\
                <hr/>\
                <!-- class="conf_p" -->\
                <p class="conf_p">\
                    <span class="f14 c6 mr20">Slave[从]配置</span><span class="f14 c6 mr20"></span>\
                    <button class="btn '+(!rdata.slave_status ? 'btn-danger' : 'btn-success')+' btn-xs btn-slave">'+(!rdata.slave_status ? '未启动' : '已启动') +'</button>\
                    <button class="btn btn-success btn-xs" onclick="getSlaveSSHList()" >[主]SSH配置</button>\
                    <button class="btn btn-success btn-xs" onclick="initSlaveStatus()" >初始化</button>\
                </p>\
                <hr/>\
                <!-- slave status list -->\
                <div class="safe bgw table_slave_status_list"></div>\
                <!-- slave list -->\
                <div class="safe bgw table_slave_list"></div>\
                ';
            $(".soft-man-con").html(limitCon);

            //设置主服务器配置
            $(".btn-master").click(function () {
                myPost('set_master_status', 'close=change', function(data){
                    var rdata = $.parseJSON(data.data);
                    layer.msg(rdata.msg, { icon: rdata.status ? 1 : 5 });
                    setTimeout(function(){
                        getMasterStatus();
                    }, 3000);
                });
            });

            $(".btn-slave").click(function () {
                myPost('set_slave_status', 'close=change', function(data){
                    var rdata = $.parseJSON(data.data);
                    layer.msg(rdata.msg, { icon: rdata.status ? 1 : 5 });
                    setTimeout(function(){
                        getMasterStatus();
                    }, 3000);
                });
            });

            $('.db-mode').click(function(){
                if ($(this).hasClass('btn-success')){
                    //no action
                    return;
                }

                var mode = 'classic';
                if ($(this).hasClass('btn-gtid')){
                    mode = 'gtid';
                }

                layer.open({
                    type:1,
                    title:"MySQL主从模式切换",
                    shadeClose:false,
                    btnAlign: 'c',
                    btn: ['切换并重启', '切换不重启'],
                    yes: function(index, layero){
                        this.change(index,mode,"yes");

                    },
                    btn2: function(index, layero){
                        this.change(index,mode,"no");
                        return false;
                    },
                    change:function(index,mode,reload){
                        console.log(index,mode,reload);
                        myPost('set_dbrun_mode',{'mode':mode,'reload':reload},function(data){
                            layer.close(index);
                            var rdata = $.parseJSON(data.data);
                            showMsg(rdata.msg ,function(){
                                getMasterStatus();
                            },{ icon: rdata.status ? 1 : 5 });
                        });
                    }
                });
            });

            if (rdata.status){
                getMasterDbList();
            }
            
            if (rdata.slave_status){
                getAsyncMasterDbList();
                getAsyncDataList()
            }
        });
    }
    getMasterStatus();
}
