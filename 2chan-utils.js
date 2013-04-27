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
        var count   = 60;
        var tick    = count;
        var $timer  = $('<span>'+tick+' s</span>').appendTo($('#contres'));
        var counter = setInterval(counter, 1000);
        function counter() {
          if (--tick <= 0) {
             $contres.click();
             tick = count
          }
          $timer.text(tick + " s")
        }
    }
})(jQuery)