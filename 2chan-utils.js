(function($){  
    var href = location.href.split(/\?|#/)[0];
    var $contentForm = $('form').eq(1);
    //remove ads, comment if you like them :D
    $('.chui > div, #rightad, #ufm + div, hr + b').remove();
    //add post anchor link
    $('.del').closest('td').html(function(i,html){
        return html.replace(/No\.(\d+)/,'<a href="'+href+'#delcheck$1">No. $1</a>')
    });
    //add image expanding on click
    $contentForm.find('img').click(function(e){ 
        e.preventDefault(); 
        var $img=$(this);
        if(!$img.data('srcfull')){
            var href = $img.parent().attr('href');
            $img.data({
                   srcfull: href,
                   srcalt : href
                }).attr({
                    height:'auto',
                    width: 'auto'
                })
        }
        var src = $img.data('srcalt');
        $img.data('srcalt',$img.attr('src'))
            .css({ opacity: 0.5 })
            .attr('src', src)
    }).bind('load', function() {
         var $img = $(this);
             $img.css({
             opacity: 1,
             border : ($img.attr('src') === $img.data('srcfull')) 
                    ? '1px solid #f00'
                    : '0'
         });
    });
    //add autorefresh and counter
    var $contres = $('#contres a');
    if($contres.length){
        var cookie = "AutoRefresh=";
        var count = 60;
        var $timer = $('<span> '+count+' s</span>').appendTo($('#contres'));
        var counter = {//simple counter object
            tick     : count,
            id       : undefined,
            start    : function(){ this.id = setInterval(this.ticktock, 1000) },
            stop     : function(){ this.id = clearInterval(this.id) },
            isRunning: function(){ return this.id !== undefined },
            ticktock : function() {
              if (--counter.tick <= 0) {
                 $contres.click();
                 counter.tick = count
              }
              $timer.text(' ' + counter.tick + ' s')
            }
        };
        var chBox = $('<input/>', {type:'checkbox'})
            .appendTo($('<label/>', {text:"[Auto]"}).insertBefore($timer))
            .change(function(){
                if(counter.isRunning()) {//stop autorefresh
                    counter.stop();
                    document.cookie = cookie + ":; expires = Thu, 01-Jan-70 00:00:01 GMT; path=/;"
                } else {//start autorefresh
                    counter.start();
                    document.cookie = cookie + "1; path=/;"
                }
            })
        //restore state of checkbox on page refresh
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(cookie) == 0) { 
                chBox.click();
                break;
            }
        }
    }
})(jQuery)