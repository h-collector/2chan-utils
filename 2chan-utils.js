/**
 * Script for 2chan.net futaba board adding:
 * - inline image expansion, 
 * - single post anchoring and post highlight , 
 * - futalog and axfc uploader autolinking with highlight and unique links in sidebar 
 * - page autorefresh on new content, 
 * - removing ads. 
 * To use with Opera Scripter extension .
 * 
 * @author h-collector <githcoll@gmail.com>
 */
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

        var isArray = $.isArray(pattern);
        this.contents().each(function () {
            if (this.nodeType == 3) { // Text only
                if(isArray)  $(this).replaceWith($(this).text().replaceArray(pattern,replacement));
                else         $(this).replaceWith($(this).text().replace(pattern,replacement));
            } else if (this.nodeType === 1 && this.childNodes && !/(script|style)/i.test(this.tagName)){ // Child element
                $(this).searchAndReplace(pattern, replacement);
            }
        });
        return this;
    };
    //futalog links
    var futalog = {
        su : 'nijibox5.com/futabafiles/tubu/src/', /* 12 */
        sa : 'nijibox6.com/futabafiles/001/src/',  /* 12 */
        ss : 'nijibox5.com/futabafiles/kobin/src/',/* 24 */
        sq : 'nijibox6.com/futabafiles/mid/src/auth.redirect.php?',  /* 48 key */
        sp : 'nijibox2.com/futabafiles/003/src/'   /* 60 */
    };
    var futaAlt = $.map(futalog, function(e,i) {return i}).join('|');
    //axfc uploader links
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
    var axfcAlt      = $.map(axfc, function(e,i) {return i}).join('|');
    //////////////////
    var urlSplit     = location.href.split(/\?|#/);
    var $contentForm = $('form').eq(1);
    //remove ads, comment if you like them :D
    $('.chui > div, #rightad, #ufm + div, hr + b').remove();
    //add post anchor link and axfc uploader links
    var sidebar = {};
    $contentForm.searchAndReplace(
        [
            /No\.(\d+)/g,                                       /* post number */
            new RegExp('(' + axfcAlt + ')_([0-9]{4,8})','g'),      /* axfc links */
            new RegExp('(' + futaAlt + ')[0-9]{5,7}(\.[a-zA-Z0-9]{2,4})?','g') /* futalog links */
        ],
        [
            '<a href="'+urlSplit[0]+'#delcheck$1" class="postanchor">$&</a>',
            function(m, pre, num){
                return sidebar[m] = '<a href="http://www1.axfc.net/uploader/'+pre+'/so/'+num+'" class="axfc">'+m+'</a>'
            },
            function(m, pre){
                return sidebar[m] = '<a href="http://www.'+futalog[pre]+m+'" class="futalog">'+m+'</a>'
            }
        ]
    );
    //add post highlight
    var $highlight = $();
    $('<style type="text/css">            \n\
        .highlight { background: #F0C0B0 }\n\
        .postanchor{ }                    \n\
        .axfc      { background: #F0C0B0; text-decoration:none }\n\
        .futalog   { background: #00ee00; text-decoration:none }\n\
        .sidebar   { position: fixed; right: 0; width: 100px;\n\
                     padding: 5px; overflow: auto;\n\
                     border: 1px solid #a08070; }\n\
        .stickynav { position: fixed; top: 50px; right: 10px; text-align:center;  }\n\
        .pointer   { background: #F0C0B0; text-decoration:none; cursor:pointer;\n\
                     padding:0 2px; font-size:120%;\n\
                     display:inline-block; border:1px solid #a08070; }\n\
        #autoscroll{ display:block; margin:2px; width: 44px;\n\
                     border: 1px solid #a08070; }\n\
      </style>').appendTo('head');
    $('.postanchor').click(function(e){
        var target = '#'+$(this).attr('href').split(/\?|#/)[1];
        $highlight.removeClass('highlight');
        $highlight = $(target).closest('td').addClass('highlight');
    });
    if(urlSplit[1])
        $highlight = $('#'+urlSplit[1]).closest('td').addClass('highlight');
    //add found links to futalog or axfc uploader to sidebar

    var i, count=0;
    for (i in sidebar)
        if (sidebar.hasOwnProperty(i))
            count++;
    if(count > 0 ){
        var $placeholder = $('<div/>', {'class':'sidebar'});
        $.each(sidebar, function(index, value){
            $(value).css({display:'block'}).appendTo($placeholder)
        });
        $placeholder.appendTo('body');
        var wHeight = $(window).height();
        var pHeight = Math.min($placeholder.height(),wHeight); 
        $placeholder.css({
            top :   Math.max(0, ((wHeight - pHeight) / 2) ),
            height: pHeight
        });
    }

    //add top/bottom sticky nav
    $('body').append(
        $('<div/>',{'class':'stickynav'})
            .append($('<a/>',{text:'▲', href:/*urlSplit[0]+*/'#top','class':'pointer', title:'Top'}))
            .append($('<a/>',{text:'■', href: urlSplit[0],'class':'pointer', title:'Stop'}))
            .append($('<a/>',{text:'▼', href:/*urlSplit[0]+*/'#ufm','class':'pointer', title:'Bottom'}))
            .append($('<input/>',{id:'autoscroll', type:'text', value:30, title: 'Delay'}))
    ).attr('id','top');
    $('.pointer').click(function(e){
        e.preventDefault();
        var $body   = $('html, body').stop();
        var $target = $($(this).attr('href'));
        if($target.length){
            $body.animate({
                scrollTop: $target.offset().top
            }, parseInt($('#autoscroll').val()) * 1000);
        }
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