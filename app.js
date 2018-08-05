Ractive.DEBUG = false;
function index(page){
    var page = parseInt(page) || 1;
    window._G = window._G || {post: {}, postList: {}};
    $('title').html(_config['blog_name']);
    if(_G.postList[page] != undefined){
      $('#container').html(_G.postList[page]);
      return;
    }
    $.ajax({
        url:"https://api.github.com/repos/"+_config['owner']+"/"+_config['repo']+"/issues",
        data:{
            filter       : 'created',
            page         : page,
            // access_token : _config['access_token'],
            per_page     : _config['per_page']
        },
        beforeSend:function(){
          $('#container').html('<center><img src="../images/loading.gif" class="loading"></center>');
        },
        success: function (data, textStatus, jqXHR) {
            var link = jqXHR.getResponseHeader("Link") || "";
            var next = false;
            var prev = false;
            if(link.indexOf('rel="next"') > 0){
              next = true;
            }
            if(link.indexOf('rel="prev"') > 0){
              prev = true;
            }

            //提取mardonw的第一个图片
            for (var i = 0; i < data.length; i++) {
                var subStr = data[i].body.substring(data[i].body.indexOf('!['), 1000);
                var img = subStr.substring(subStr.indexOf('!['), subStr.indexOf('g)') + 2);
                data[i]['img'] = img;

                //labels url 跳转
                if (data[i].labels.length>0) {
                    data[i].labels[0].url = data[i].labels[0].url.replace('api.', '');
                    data[i].labels[0].url = data[i].labels[0].url.replace('repos', '');
                }
            }
            var ractive = new Ractive({
                template: '#listTpl',
                data: {
                    posts: data,
                    next  : next,
                    prev  : prev,
                    page  : page
                }
            });
            window._G.postList[page] = ractive.toHTML();
            $(window._G.postList[page]).find('img:first')
            $('#container').html(window._G.postList[page]);

            //将文章列表的信息存到全局变量中，避免重复请求
            for(i in data){
              var ractive = new Ractive({
                  template : '#detailTpl',
                  data     : {post: data[i]}
              });
              window._G.post[data[i].number] = {};
              window._G.post[data[i].number].body = ractive.toHTML();
              
              var title = data[i].title + " | " + _config['blog_name'];
              window._G.post[data[i].number].title = title;
            }
        }
    });
}

function highlight(){
  $('pre code').each(function(i, block) {
    hljs.highlightBlock(block);
  });
}

// 动态加载多说评论框的函数
function toggleDuoshuoComments(container, id){
    var el = document.createElement('div');
    var url = window.location.href;
    el.setAttribute('data-thread-key', id);
    el.setAttribute('data-url', url);
    //DUOSHUO.EmbedThread(el);
    jQuery(container).append(el);
}

function detail(id){
    if(!window._G){
      window._G = {post: {}, postList: {}};
      window._G.post[id] = {};  
    }
    
    if(_G.post[id].body != undefined){
      $('#container').html(_G.post[id].body);
      $('title').html(_G.post[id].title);
      toggleDuoshuoComments('#container', id);
      highlight();
      return;
    }
    $.ajax({
        url:"https://api.github.com/repos/"+_config['owner']+"/"+_config['repo']+"/issues/" + id,
        data:{
            // access_token:_config['access_token']
        },
        beforeSend:function(){
            $('#container').html('<center><img src="../images/loading.gif" alt="loading" class="loading"></center>');
        },
        success:function(data){
            var ractive = new Ractive({
                 el: "#container",
                 template: '#detailTpl',
                 data: {post: data}
            });

            $('title').html(data.title + " | " + _config['blog_name']);
            toggleDuoshuoComments('#container', id);
            highlight();
        }
    });  

}



var helpers = Ractive.defaults.data;
helpers.markdown2HTML = function(content){
    return marked(content);
}
helpers.formatTime = function(time){
    return time.substr(0,10);
}

var routes = {
    '/': index,
    'p:page': index,
    'post/:postId': detail
};
var router = Router(routes);
router.init('/');
