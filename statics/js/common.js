;(function () {
    //全局ajax处理
    $.ajaxSetup({
        complete: function (jqXHR) {},
        data: {
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //请求失败处理
        }
    });

    if ($.browser.msie) {
        //ie 都不缓存
        $.ajaxSetup({
            cache: false
        });
    }

    //不支持placeholder浏览器下对placeholder进行处理
    if (document.createElement('input').placeholder !== '') {
        $('[placeholder]').focus(function () {
            var input = $(this);
            if (input.val() == input.attr('placeholder')) {
                input.val('');
                input.removeClass('placeholder');
            }
        }).blur(function () {
            var input = $(this);
            if (input.val() == '' || input.val() == input.attr('placeholder')) {
                input.addClass('placeholder');
                input.val(input.attr('placeholder'));
            }
        }).blur().parents('form').submit(function () {
            $(this).find('[placeholder]').each(function () {
                var input = $(this);
                if (input.val() == input.attr('placeholder')) {
                    input.val('');
                }
            });
        });
    }


    //提交按钮是否固定底部
    //setBtnWrap();
    $(window).on('resize', function () {
        setBtnWrap(true);
    });

    function setBtnWrap(reset) {
        if (parent.Wind && parent.Wind.art) {
            //过滤弹窗
            return;
        }

        if ($('body').height() <= $(window).height()) {
            $('div.btn_wrap').removeClass('btn_wrap');
        } else {
            if (reset) {
                var par = $('button.J_ajax_submit_btn:last').parent().parent();
                if (!par.attr('class')) {
                    //class一定为空
                    par.addClass('btn_wrap');
                }
            }
        }
    }

    //iframe页面f5刷新
    $(document).on('keydown', function (event) {
        var e = window.event || event;
        if (e.keyCode == 116) {
            e.keyCode = 0;

            var $doc = $(parent.window.document),
                id = $doc.find('#B_history .current').attr('data-id'),
                iframe = $doc.find('#iframe_' + id);
            try{
                if (iframe[0].contentWindow) {
                    //common.js
                    reloadPage(iframe[0].contentWindow);
                }
            }catch(err){}
            //!ie
            return false;
        }

    });

    //所有加了dialog类名的a链接，自动弹出它的href
    if ($('a.J_dialog').length) {
        Wind.use('artDialog', 'iframeTools', function () {
            $('.J_dialog').on('click', function (e) {
                e.preventDefault();
                var $_this = this,
                    _this = $($_this);
                art.dialog.open($(this).prop('href'), {
                    close: function () {
                        $_this.focus(); //关闭时让触发弹窗的元素获取焦点
                        return true;
                    },
                    title: _this.prop('title')
                });
            }).attr('role', 'button');

        });
    }

    //所有的ajax form提交,由于大多业务逻辑都是一样的，故统一处理
    var ajaxForm_list = $('form.J_ajaxForm');
    if (ajaxForm_list.length) {
        Wind.use('ajaxForm', 'artDialog', function () {
            if ($.browser.msie) {
                //ie8及以下，表单中只有一个可见的input:text时，会整个页面会跳转提交
                ajaxForm_list.on('submit', function (e) {
                    //表单中只有一个可见的input:text时，enter提交无效
                    e.preventDefault();
                });
            }

            $('button.J_ajax_submit_btn').on('click', function (e) {
                e.preventDefault();
                /*var btn = $(this).find('button.J_ajax_submit_btn'),
					form = $(this);*/
                var btn = $(this),
                    form = btn.parents('form.J_ajaxForm');
                
                if(btn.data("loading")){
            		return;
            	}

                //批量操作 判断选项
                if (btn.data('subcheck')) {
                    btn.parent().find('span').remove();
                    if (form.find('input.J_check:checked').length) {
                        var msg = btn.data('msg');
                        if (msg) {
                            art.dialog({
                                id: 'warning',
                                icon: 'warning',
                                content: btn.data('msg'),
                                cancelVal: '关闭',
                                cancel: function () {
                                    //btn.data('subcheck', false);
                                    //btn.click();
                                },
                                ok: function () {
                                	 btn.data('subcheck', false);
                                	 btn.click();
                                }
                            });
                        } else {
                            btn.data('subcheck', false);
                            btn.click();
                        }

                    } else {
                        $('<span class="tips_error">请至少选择一项</span>').appendTo(btn.parent()).fadeIn('fast');
                    }
                    return false;
                }

                //ie处理placeholder提交问题
                if ($.browser.msie) {
                    form.find('[placeholder]').each(function () {
                        var input = $(this);
                        if (input.val() == input.attr('placeholder')) {
                            input.val('');
                        }
                    });
                }
                
                form.ajaxSubmit({
                    url: btn.data('action') ? btn.data('action') : form.attr('action'), //按钮上是否自定义提交地址(多按钮情况)
                    dataType: 'json',
                    beforeSubmit: function (arr, $form, options) {
                    	
                    	btn.data("loading",true);
                        var text = btn.text();

                        //按钮文案、状态修改
                        btn.text(text + '中...').prop('disabled', true).addClass('disabled');
                    },
                    success: function (data, statusText, xhr, $form) {
                        var text = btn.text();

                        //按钮文案、状态修改
                        btn.removeClass('disabled').text(text.replace('中...', '')).parent().find('span').remove();
                        if (data.state === 'success') {
                            $('<span class="tips_success">' + data.info + '</span>').appendTo(btn.parent()).fadeIn('slow').delay(1000).fadeOut(function () {
                            });
                        } else if (data.state === 'fail') {
                        	var $verify_img=form.find(".verify_img");
                        	if($verify_img.length){
                        		$verify_img.attr("src",$verify_img.attr("src")+"&refresh="+Math.random()); 
                        	}
                            $('<span class="tips_error">' + data.info + '</span>').appendTo(btn.parent()).fadeIn('fast');
                            btn.removeProp('disabled').removeClass('disabled');
                        }
                        
                        if (data.referer) {
                            //返回带跳转地址
                            if(window.parent.art){
                                //iframe弹出页
                                window.parent.location.href = data.referer;
                            }else{
                                window.location.href = data.referer;
                            }
                        } else {
                        	if (data.state === 'success') {
                        		if(window.parent.art){
                                    reloadPage(window.parent);
                                }else{
                                    //刷新当前页
                                    reloadPage(window);
                                }
                        	}
                        }
                        
                    },
                    complete: function(){
                    	btn.data("loading",false);
                    }
                });
            });

        });
    }

    //dialog弹窗内的关闭方法
    $('#J_dialog_close').on('click', function (e) {
        e.preventDefault();
        try{
            art.dialog.close();
        }catch(err){
            Wind.use('artDialog','iframeTools',function(){
                art.dialog.close();
            });
        };
    });

    //所有的删除操作，删除数据后刷新页面
    if ($('a.J_ajax_del').length) {
        Wind.use('artDialog', function () {
            $('.J_ajax_del').on('click', function (e) {
                e.preventDefault();
                var $_this = this,
                    $this = $($_this),
                    href = $this.prop('href'),
                    msg = $this.data('msg');
                art.dialog({
                    title: false,
                    icon: 'question',
                    content: '确定要删除吗？',
                    follow: $_this,
                    close: function () {
                        $_this.focus();; //关闭时让触发弹窗的元素获取焦点
                        return true;
                    },
                    ok: function () {
                    	
                        $.getJSON(href).done(function (data) {
                            if (data.state === 'success') {
                                if (data.referer) {
                                    location.href = data.referer;
                                } else {
                                    reloadPage(window);
                                }
                            } else if (data.state === 'fail') {
                                //art.dialog.alert(data.info);
                            	alert(data.info);//暂时处理方案
                            }
                        });
                    },
                    cancelVal: '关闭',
                    cancel: true
                });
            });

        });
    }
    
    
    if ($('a.J_ajax_dialog_btn').length) {
        Wind.use('artDialog', function () {
            $('.J_ajax_dialog_btn').on('click', function (e) {
                e.preventDefault();
                var $_this = this,
                    $this = $($_this),
                    href = $this.prop('href'),
                    msg = $this.data('msg');
                if(!msg){
                	msg="您确定要进行此操作吗？";
                }
                art.dialog({
                    title: false,
                    icon: 'question',
                    content: msg,
                    follow: $_this,
                    close: function () {
                        $_this.focus();; //关闭时让触发弹窗的元素获取焦点
                        return true;
                    },
                    ok: function () {
                    	
                        $.getJSON(href).done(function (data) {
                            if (data.state === 'success') {
                                if (data.referer) {
                                    location.href = data.referer;
                                } else {
                                    reloadPage(window);
                                }
                            } else if (data.state === 'fail') {
                                art.dialog.alert(data.info);
                            }
                        });
                    },
                    cancelVal: '关闭',
                    cancel: true
                });
            });

        });
    }

    //所有的请求刷新操作
    var ajax_refresh = $('a.J_ajax_refresh'),
        refresh_lock = false;
    if (ajax_refresh.length) {
        ajax_refresh.on('click', function (e) {
            e.preventDefault();
            if (refresh_lock) {
                return false;
            }
            refresh_lock = true;

            $.post(this.href, function (data) {
                refresh_lock = false;

                if (data.state === 'success') {
                    if (data.referer) {
                        location.href = data.referer;
                    } else {
                        reloadPage(window);
                    }
                } else if (data.state === 'fail') {
                    Wind.art.dialog.alert(data.info);
                }
            }, 'json');
        });
    }

    //拾色器
    var color_pick = $('.J_color_pick');
    if (color_pick.length) {
        Wind.use('colorPicker', function () {
            color_pick.each(function () {
                $(this).colorPicker({
                    default_color: 'url("' + GV.DIMAUB + 'statics/images/transparent.png")', //写死
                    callback: function (color) {
                        var em = $(this).find('em'),
                            input = $(this).next('.J_hidden_color');

                        em.css('background', color);
                        input.val(color.length === 7 ? color : '');
                    }
                });
            });
        });
    }

    //字体配置
    if ($('.J_font_config').length) {
        Wind.use('colorPicker', function () {
            var elem = $('.color_pick');
            elem.each(function () {
                var panel = $(this).parent('.J_font_config');
                var bg_elem = $(this).find('.J_bg');
                $(this).colorPicker({
                    default_color: 'url("' + GV.DIMAUB + 'statics/images/transparent.png")',
                    callback: function (color) {
                        bg_elem.css('background', color);
                        panel.find('.case').css('color', color.length === 7 ? color : '');
                        panel.find('.J_hidden_color').val(color.length === 7 ? color : '');
                    }
                });
            });
        });
        //加粗、斜体、下划线的处理
        $('.J_bold,.J_italic,.J_underline').on('click', function () {
            var panel = $(this).parents('.J_font_config');
            var c = $(this).data('class');
            if ($(this).prop('checked')) {
                panel.find('.case').addClass(c);
            } else {
                panel.find('.case').removeClass(c);
            }
        });
    }

    /*复选框全选(支持多个，纵横双控全选)。
     *实例：版块编辑-权限相关（双控），验证机制-验证策略（单控）
     *说明：
     *	"J_check"的"data-xid"对应其左侧"J_check_all"的"data-checklist"；
     *	"J_check"的"data-yid"对应其上方"J_check_all"的"data-checklist"；
     *	全选框的"data-direction"代表其控制的全选方向(x或y)；
     *	"J_check_wrap"同一块全选操作区域的父标签class，多个调用考虑
     */

    if ($('.J_check_wrap').length) {
        var total_check_all = $('input.J_check_all');

        //遍历所有全选框
        $.each(total_check_all, function () {
            var check_all = $(this),
                check_items;

            //分组各纵横项
            var check_all_direction = check_all.data('direction');
            check_items = $('input.J_check[data-' + check_all_direction + 'id="' + check_all.data('checklist') + '"]');

            //点击全选框
            check_all.change(function (e) {
                var check_wrap = check_all.parents('.J_check_wrap'); //当前操作区域所有复选框的父标签（重用考虑）

                if ($(this).attr('checked')) {
                    //全选状态
                    check_items.attr('checked', true);

                    //所有项都被选中
                    if (check_wrap.find('input.J_check').length === check_wrap.find('input.J_check:checked').length) {
                        check_wrap.find(total_check_all).attr('checked', true);
                    }

                } else {
                    //非全选状态
                    check_items.removeAttr('checked');

                    //另一方向的全选框取消全选状态
                    var direction_invert = check_all_direction === 'x' ? 'y' : 'x';
                    check_wrap.find($('input.J_check_all[data-direction="' + direction_invert + '"]')).removeAttr('checked');
                }

            });

            //点击非全选时判断是否全部勾选
            check_items.change(function () {

                if ($(this).attr('checked')) {

                    if (check_items.filter(':checked').length === check_items.length) {
                        //已选择和未选择的复选框数相等
                        check_all.attr('checked', true);
                    }

                } else {
                    check_all.removeAttr('checked');
                }

            });


        });

    }

    /*li列表添加&删除(支持多个)，实例(“验证机制-添加验证问题”，“附件相关-添加附件类型”)：
		<ul id="J_ul_list_verify" class="J_ul_list_public">
			<li><input type="text" value="111" ><a class="J_ul_list_remove" href="#">[删除]</a></li>
			<li><input type="text" value="111" ><a class="J_ul_list_remove" href="#">[删除]</a></li>
		</ul>
		<a data-related="verify" class="J_ul_list_add" href="#">添加验证</a>

		<ul id="J_ul_list_rule" class="J_ul_list_public">
			<li><input type="text" value="111" ><a class="J_ul_list_remove" href="#">[删除]</a></li>
			<li><input type="text" value="111" ><a class="J_ul_list_remove" href="#">[删除]</a></li>
		</ul>
		<a data-related="rule" class="J_ul_list_add" href="#">添加规则</a>
	*/
    var ul_list_add = $('a.J_ul_list_add');
    if (ul_list_add.length) {
        var new_key = 0;

        //添加
        ul_list_add.click(function (e) {
            e.preventDefault();
            new_key++;
            var $this = $(this);

            //"new_"字符加上唯一的key值，_li_html 由列具体页面定义
            var $li_html = $(_li_html.replace(/new_/g, 'new_' + new_key));

            $('#J_ul_list_' + $this.data('related')).append($li_html);
            $li_html.find('input.input').first().focus();
        });

        //删除
        $('ul.J_ul_list_public').on('click', 'a.J_ul_list_remove', function (e) {
            e.preventDefault();
            $(this).parents('li').remove();
        });
    }

    //日期选择器
    var dateInput = $("input.J_date")
    if (dateInput.length) {
        Wind.use('datePicker', function () {
            dateInput.datePicker();
        });
    }

    //日期+时间选择器
    var dateTimeInput = $("input.J_datetime");
    if (dateTimeInput.length) {
        Wind.use('datePicker', function () {
            dateTimeInput.datePicker({
                time: true
            });
        });
    }

    //图片上传预览
    if ($("input.J_upload_preview").length) {
        Wind.use('uploadPreview', function () {
            $("input.J_upload_preview").uploadPreview();
        });
    }

    //代码复制
    var copy_btn = $('a.J_copy_clipboard'); //复制按钮
    if (copy_btn.length) {
        Wind.use('dialog', 'textCopy', function () {
            for (i = 0, len = copy_btn.length; i < len; i++) {
                var item = $(copy_btn[i]);
                item.textCopy({
                    content: $('#' + item.data('rel')).val()
                });
            }
        });
    }

    //tab
    var tabs_nav = $('ul.J_tabs_nav');
    if (tabs_nav.length) {
        Wind.use('tabs', function () {
            tabs_nav.tabs('.J_tabs_contents > div');
        });
    }

    //radio切换显示对应区块
    var radio_change = $('.J_radio_change');
    if (radio_change.length) {

        var radio_c = radio_change.find('input:checked');
        if (radio_c.length) {
            radio_c.each(function () {
                var $this = $(this);
                //页面载入
                change($this.data('arr'), $this.parents('.J_radio_change'));
            });
        }

        //切换radio
        $('.J_radio_change input:radio').on('change', function () {
            change($(this).data('arr'), $(this).parents('.J_radio_change'));
        });

    }

    function change(str, radio_change) {
        var rel = $(radio_change.data('rel'));
        if (rel.length) {
            rel.hide();
        } else {
            $('.J_radio_tbody, .J_radio_change_items').hide();
        }

        if (str) {
            var arr = new Array();
            arr = str.split(",");


            $.each(arr, function (i, o) {
                $('#' + o).show();
            });
        }
    }

    /*
     * 默认头像
     */
    var avas = $('img.J_avatar');
    if (avas.length) {
        avatarError(avas);
    }


})();

//重新刷新页面，使用location.reload()有可能导致重新提交
function reloadPage(win) {
    var location = win.location;
    location.href = location.pathname + location.search;
}

//页面跳转
function redirect(url) {
    location.href = url;
}

//读取cookie
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) == 0) {
            return c.substring(nameEQ.length, c.length);
        }
    };

    return null;
}

//设置cookie
function setCookie(name, value, days) {
    var argc = setCookie.arguments.length;
    var argv = setCookie.arguments;
    var secure = (argc > 5) ? argv[5] : false;
    var expire = new Date();
    if(days==null || days==0) days=1;
    expire.setTime(expire.getTime() + 3600000*24*days);
    document.cookie = name + "=" + escape(value) + ("; path=/") + ((secure == true) ? "; secure" : "") + ";expires="+expire.toGMTString();
}

//浮出提示_居中
function resultTip(options) {

    var cls = (options.error ? 'warning' : 'success');
    var pop = $('<div style="left:50%;top:30%;" class="pop_showmsg_wrap"><span class="pop_showmsg"><span class="' + cls + '">' + options.msg + '</span></span></div>');

    pop.appendTo($('body')).fadeIn(function () {
        pop.css({
            marginLeft: -pop.innerWidth() / 2
        }); //水平居中
    }).delay(1500).fadeOut(function () {
        pop.remove();

        //回调
        if (options.callback) {
            options.callback();
        }
    });

}

//弹窗居中定位 非ie6 fixed定位
function popPos(wrap) {
    var ie6 = false,
        pos = 'fixed',
        top,
        win_height = $(window).height(),
        wrap_height = wrap.outerHeight();

    if ($.browser.msie && $.browser.version < 7) {
        ie6 = true;
        pos = 'absolute';
    }

    if (win_height < wrap_height) {
        top = 0;
    } else {
        top = ($(window).height() - wrap.outerHeight()) / 2;
    }

    wrap.css({
        position: pos,
        top: top + (ie6 ? $(document).scrollTop() : 0),
        left: ($(window).width() - wrap.innerWidth()) / 2
    }).show();
}


/*
 * 头像的错误处理
 */
function avatarError(avatars) {
    avatars.each(function () {
        this.onerror = function () {
            this.onerror = null;
            this.src = GV.URL.IMAGE_RES + '/face/face_' + $(this).data('type') + '.jpg'; //替代头像
            this.setAttribute('alt', '默认头像');

            //隐藏恢复默认头像
            $('#J_set_def').hide();
        }
        this.src = this.src;
    });
}

//新窗口打开
function openwinx(url,name,w,h) {
    if(!w) w=screen.width;
    if(!h) h=screen.height;
    //window.open(url,name,"top=100,left=400,width=" + w + ",height=" + h + ",toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no");
    window.open(url,name);
}
//询问
function confirmurl(url, message) {
    Wind.use("artDialog", "iframeTools", function () {
        art.dialog.confirm(message, function () {
            location.href = url;
        }, function () {
            art.dialog.tips('你取消了操作');
        });
    });
}

function open_iframe_dialog(url,title,options){
	var params={
            title: title,
            lock:true,
            opacity:0,
            width:"95%"
        };
	params=options?$.extend(params,options):params;
	 Wind.use('artDialog','iframeTools', function () {
	            art.dialog.open(url, params);
	        });
}

function open_map_dialog(url,title,options,callback){
	
	var params={
            title: title,
            lock:true,
            opacity:0,
            width:"95%",
            height:400,
            ok:function(){
            	 if (callback) {
            		 var d=this.iframe.contentWindow;
            		 var lng=$("#lng_input",d.document).val();
            		 var lat=$("#lat_input",d.document).val();
            		 var address={};
            		 address.address=$("#address_input",d.document).val();
            		 address.province=$("#province_input",d.document).val();
            		 address.city=$("#city_input",d.document).val();
            		 address.district=$("#district_input",d.document).val();
            		 callback.apply(this, [lng, lat,address]);
                 }
            }
        };
	params=options?$.extend(params,options):params;
	 Wind.use('artDialog','iframeTools', function () {
	            art.dialog.open(url, params);
	        });
	
}

/* 扩展ThinkPHP对象 */
;(function($){
    /**
     * 获取ThinkPHP基础配置
     * @type {object}
     */
    var ThinkPHP = window.Think = {};

    /* 基础对象检测 */
    //ThinkPHP || $.error("ThinkPHP基础配置没有正确加载！");

    /**
     * 解析URL
     * @param  {string} url 被解析的URL
     * @return {object}     解析后的数据
     */
    ThinkPHP.parse_url = function(url){
        var parse = url.match(/^(?:([a-z]+):\/\/)?([\w-]+(?:\.[\w-]+)+)?(?::(\d+))?([\w-\/]+)?(?:\?((?:\w+=[^#&=\/]*)?(?:&\w+=[^#&=\/]*)*))?(?:#([\w-]+))?$/i);
        parse || $.error("url格式不正确！");
        return {
            "scheme"   : parse[1],
            "host"     : parse[2],
            "port"     : parse[3],
            "path"     : parse[4],
            "query"    : parse[5],
            "fragment" : parse[6]
        };
    }

    ThinkPHP.parse_str = function(str){
        var value = str.split("&"), vars = {}, param;
        for(val in value){
            param = value[val].split("=");
            vars[param[0]] = param[1];
        }
        return vars;
    }

    ThinkPHP.parse_name = function(name, type){
        if(type){
            /* 下划线转驼峰 */
            name.replace(/_([a-z])/g, function($0, $1){
                return $1.toUpperCase();
            });

            /* 首字母大写 */
            name.replace(/[a-z]/, function($0){
                return $0.toUpperCase();
            });
        } else {
            /* 大写字母转小写 */
            name = name.replace(/[A-Z]/g, function($0){
                return "_" + $0.toLowerCase();
            });

            /* 去掉首字符的下划线 */
            if(0 === name.indexOf("_")){
                name = name.substr(1);
            }
        }
        return name;
    }

    //scheme://host:port/path?query#fragment
    ThinkPHP.U = function(url, vars, suffix){
        var info = this.parse_url(url), path = [], param = {}, reg;

        /* 验证info */
        info.path || $.error("url格式错误！");
        url = info.path;

        /* 组装URL */
        if(0 === url.indexOf("/")){ //路由模式
            this.MODEL[0] == 0 && $.error("该URL模式不支持使用路由!(" + url + ")");

            /* 去掉右侧分割符 */
            if("/" == url.substr(-1)){
                url = url.substr(0, url.length -1)
            }
            url = ("/" == this.DEEP) ? url.substr(1) : url.substr(1).replace(/\//g, this.DEEP);
            url = "/" + url;
        } else { //非路由模式
            /* 解析URL */
            path = url.split("/");
            path = [path.pop(), path.pop(), path.pop()].reverse();
            path[1] || $.error("ThinkPHP.U(" + url + ")没有指定控制器");

            if(path[0]){
                param[this.VAR[0]] = this.MODEL[1] ? path[0].toLowerCase() : path[0];
            }

            param[this.VAR[1]] = this.MODEL[1] ? this.parse_name(path[1]) : path[1];
            param[this.VAR[2]] = path[2].toLowerCase();

            url = "?" + $.param(param);
        }

        /* 解析参数 */
        if(typeof vars === "string"){
            vars = this.parse_str(vars);
        } else if(!$.isPlainObject(vars)){
            vars = {};
        }

        /* 解析URL自带的参数 */
        info.query && $.extend(vars, this.parse_str(info.query));

        if(vars){
            url += "&" + $.param(vars);
        }

        if(0 != this.MODEL[0]){
            url = url.replace("?" + (path[0] ? this.VAR[0] : this.VAR[1]) + "=", "/")
                     .replace("&" + this.VAR[1] + "=", this.DEEP)
                     .replace("&" + this.VAR[2] + "=", this.DEEP)
                     .replace(/(\w+=&)|(&?\w+=$)/g, "")
                     .replace(/[&=]/g, this.DEEP);

            /* 添加伪静态后缀 */
            if(false !== suffix){
                suffix = suffix || this.MODEL[2].split("|")[0];
                if(suffix){
                    url += "." + suffix;
                }
            }
        }

        url = this.APP + url;
        return url;
    }

    /* 设置表单的值 */
    ThinkPHP.setValue = function(name, value){
        var first = name.substr(0,1), input, i = 0, val;
        if(value === "") return;
        if("#" === first || "." === first){
            input = $(name);
        } else {
            input = $("[name='" + name + "']");
        }

        if(input.eq(0).is(":radio")) { //单选按钮
            input.filter("[value='" + value + "']").each(function(){this.checked = true});
        } else if(input.eq(0).is(":checkbox")) { //复选框
            if(!$.isArray(value)){
                val = new Array();
                val[0] = value;
            } else {
                val = value;
            }
            for(i = 0, len = val.length; i < len; i++){
                input.filter("[value='" + val[i] + "']").each(function(){this.checked = true});
            }
        } else {  //其他表单选项直接设置值
            input.val(value);
        }
    }

})(jQuery);
