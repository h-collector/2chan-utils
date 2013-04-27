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
            $img.data('srcfull', $img.parent().attr('href'))
                .attr({
                    height:'auto',
                    width: 'auto'
                })
        }
        var src = $img.data('srcfull');
        $img.data('srcfull',$img.attr('src'))
            .css({ opacity: 0.5 })
            .attr('src', src)
    }).bind('load', function() {
         $(this).css({ opacity: 1 })
    });

    //add autorefresh and counter
    var $contres = $('#contres a');
    if($contres.length){
        var cookie = "AutoRefresh=";
        var count   = 60;
        var tick    = count;
        var counterId = null;
        var $timer  = $('<span> '+tick+' s</span>').appendTo($('#contres'));
        var counter = function() {
          if (--tick <= 0) {
             $contres.click();
             tick = count
          }
          $timer.text(' ' + tick + ' s')
        }
        var chBox = $('<input/>', {type:'checkbox'})
            .appendTo($('<label/>', {text:"[Auto]"}).insertBefore($timer))
            .change(function(){
                if(counterId) {//stop autorefresh
                    clearInterval(counterId);
                    counterId = null;
                    document.cookie = cookie + ":; expires = Thu, 01-Jan-70 00:00:01 GMT; path=/;"
                } else {//start autorefresh
                    counterId = setInterval(counter, 1000);
                    document.cookie = cookie + "1; path=/;"
                }
            })
            //restore state of checkbox on page refresh
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                if (c.indexOf(cookie) == 0) { 
                    chBox.click();//set checkbox checked and start counter
                    break;
                }
            }
    }
})(jQuery)