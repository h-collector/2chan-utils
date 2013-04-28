(function($){
    String.prototype.replaceArray = function(find, replace) {
        var replaceString = this;
        for (var i = 0; i < find.length; i++)
            replaceString = replaceString.replace(find[i], replace[i]);
        return replaceString;
    };
    //could be faster by using vanilla js but, it's more fun using jQuery XD
    $.fn.searchAndReplace = function(pattern, replacement) {
        if(this.length === 0) 
            return this;

        this.contents().each(function () {
            if (this.nodeType == 3) { // Text only
                if($.isArray(pattern))  $(this).replaceWith($(this).text().replaceArray(pattern,replacement));
                else                    $(this).replaceWith($(this).text().replace(pattern,replacement));
            } else if (this.nodeType === 1 && this.childNodes && !/(script|style)/i.test(this.tagName)){ // Child element
                $(this).searchAndReplace(pattern, replacement);
            }
        });
        return this;
    };

    var axfc = {//didn't use full names but
		Sc: "Scandium",
		He: "Helium",
		Ne: "Neon",
		H:  "Hydrogen",
		Li: "Lithium",
		N:  "Nitrogen",
		Si: "Silicon",
		C:  "Carbon",
		O:  "Oxygen",
		Al: "Aluminium",
		S:  "Sulphur",
		P:  "Phosphorus",
		Ar: "Argon",
		B:  "Boron",
		K:  "Potassium",
		F:  "Fluorine",
		Be: "Beryllium",
		Na: "Sodium",
		Ca: "Calcium",
		Mg: "Magnesium",
		Cl: "Chlorine"
	};
    var axfcAlt      = $.map(axfc, function(element,index) {return index}).join('|');
    var urlSplit     = location.href.split(/\?|#/);
    var $contentForm = $('form').eq(1);
    //remove ads, comment if you like them :D
    $('.chui > div, #rightad, #ufm + div, hr + b').remove();
    //add post anchor link and axfc uploader links
    $contentForm.searchAndReplace(
        [
            /No\.(\d+)/g, /* post number */
            new RegExp('(' + axfcAlt + ')_([0-9]{4,8})','g')/* links */
        ],
        [
            '<a href="'+urlSplit[0]+'#delcheck$1" class="postanchor">No. $1</a>',
            '<a href="http://www1.axfc.net/uploader/$1/so/$2">$&</a>'
        ]
    );
    //add post highlight
    var $highlight = $();
    $('<style type="text/css"> .highlight{ background: #F0C0B0} </style>').appendTo('head');
    $('.postanchor').click(function(e){
        $highlight.removeClass('highlight');
        $highlight = $(this).closest('td').addClass('highlight');
    });
    if(urlSplit[1])
        $highlight = $('#'+urlSplit[1]).closest('td').addClass('highlight');

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