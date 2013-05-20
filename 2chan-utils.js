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
    //simple counter class
    function Counter(options){
        this.count      = options.count      || 60;
        this.tick       = options.count      || 60;
        this.interval   = options.interval   || 1000;
        this.ontick     = options.ontick     || function(){};
        this.oncomplete = options.oncomplete || function(){};
    };
    Counter.prototype = {
        id       : undefined,
        isRunning: function(){ return this.id !== undefined },
        stop     : function(){ this.id = clearInterval(this.id) },
        start    : function(ticktock){
            var self = this;
            this.id  = setInterval(ticktock || function() {
                self.ontick(--self.tick);
                if (self.tick <= 0) {
                    self.tick =     self.count;
                    self.oncomplete(self.count)
                }
            }, this.interval)
        }
    };
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
                var $this = $(this);
                if(isArray)  $this.replaceWith($this.text().replaceArray(pattern,replacement));
                else         $this.replaceWith($this.text().replace(pattern,replacement));
            } else if (this.nodeType === 1 && this.childNodes && !/(script|style)/i.test(this.tagName)){ // Child element
                $(this).searchAndReplace(pattern, replacement);
            }
        });
        return this;
    };
    //add styles
    $('<style type="text/css">            \n\
        .highlight { background: #F0C0B0 }\n\
        .postanchor{ }                    \n\
        .axfc      { background: #F0C0B0; text-decoration:none }\n\
        .futalog   { background: #00ee00; text-decoration:none }\n\
        .sidebar   { position: fixed; right: 0; width: 100px;\n\
                     padding: 5px; overflow: auto;\n\
                     border: 1px solid #a08070; }\n\
        .sidebar a { display:block; }\n\
        .stickynav { position: fixed; top: 50px; right: 10px; text-align:center;  }\n\
        .pointer   { background: #F0C0B0; text-decoration:none; cursor:pointer;\n\
                     padding:0 2px; font-size:120%;\n\
                     display:inline-block; border:1px solid #a08070; }\n\
        .active    { color:#f00; }\n\
        .resizeable{ width:auto; height:auto; }\n\
        .loading   { opacity: 0.5; }\n\
        .fullimg   { border: 1px solid #f00; }\n\
        .loaded    { border: 1px dashed #a08070; }\n\
        #autoscroll{ display:block; margin:0 2px; width: 34px;\n\
                     border: 1px solid #a08070; }\n\
      </style>').appendTo('head');
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
        Sc: "Scandium",  He: "Helium",    Ne: "Neon",      H:  "Hydrogen",
        Li: "Lithium",   N:  "Nitrogen",  Si: "Silicon",   C:  "Carbon",
        O:  "Oxygen",    Al: "Aluminium", S:  "Sulphur",   P:  "Phosphorus",
        Ar: "Argon",     B:  "Boron",     K:  "Potassium", F:  "Fluorine",
        Be: "Beryllium", Na: "Sodium",    Ca: "Calcium",   Mg: "Magnesium",
        Cl: "Chlorine"
    };
    var axfcAlt      = $.map(axfc, function(e,i) {return i}).join('|');
    //////////////////
    var urlSplit     = location.href.split(/\?|#/);
    var $placeholder = $('<div/>', {'class':'sidebar'});
    var $highlight   = $();
    var sidebar      = {};
    var addToSidebar = function(m, content){
        if(sidebar[m]) return sidebar[m];
           sidebar[m] = content;
         $(sidebar[m]).appendTo($placeholder);
        return content;
    };
    //process contexted form
    $.fn.processDoc = function(url){
        $context = $(this);
        $context.find('#rightad').remove();
        //add post anchor link and axfc uploader links
        $context.searchAndReplace(
            [
                /No\.(\d+)/g,                                       /* post number */
                new RegExp('(' + axfcAlt + ')_([0-9]{4,8})','g'),      /* axfc links */
                new RegExp('(' + futaAlt + ')[0-9]{5,7}(\.[a-zA-Z0-9]{2,4})?','g') /* futalog links */
            ],
            [
                '<a href="'+url+'#delcheck$1" class="postanchor">$&</a>',
                function(m, pre, num){
                    return addToSidebar(m, '<a href="http://www1.axfc.net/uploader/'+pre+'/so/'+num+'" class="axfc">'+m+'</a>')
                },
                function(m, pre){
                    return addToSidebar(m, '<a href="http://www.'+futalog[pre]+m+'" class="futalog">'+m+'</a>')
                }
            ]
        );
        //add found links to futalog or axfc uploader to sidebar
        if($placeholder.children().length > 0){
            //if($placeholder.parent('body').length === 0)
            $placeholder.appendTo('body');
            var wHeight = $(window).height();
            var pHeight = Math.min($placeholder.height(),wHeight); 
            $placeholder.css({
                top :   Math.max(0, ((wHeight - pHeight) / 2) ),
                height: pHeight
            });
        }
        return $context;
    };
    //remove ads, comment if you like them :D
    $('.chui > div, #rightad, #ufm + div, hr + b').remove();
    ///inital parse
    $contentForm = $('form').eq(1).processDoc(urlSplit[0]);
    //add post highlight
    $contentForm.on('click', '.postanchor', function(e){
        var target = '#'+$(this).attr('href').split(/\?|#/)[1];
        $highlight.removeClass('highlight');
        $highlight = $(target).closest('td').addClass('highlight');
    });
    //add image expanding on click
    $contentForm.on('click', 'img', function(e) {
        e.preventDefault(); 
        var $img = $(this);
        if(!$img.data('srcfull')){
            var href = $img.parent().attr('href');
            $img.data({ srcfull: href, srcalt : href })
                .addClass('resizeable')
                .bind('load', function() {
                    var $img = $(this).removeClass('loading');
                    if (($img.attr('src') === $img.data('srcfull'))) {
                        $img.addClass('fullimg');
                    } else
                        $img.removeClass('fullimg');
                })
        }
        var src = $img.data('srcalt');
        $img.data('srcalt',$img.attr('src'))
            .addClass('loading')
            .attr('src', src)
    });
    ///////////
    if(urlSplit[1])
        $highlight = $('#'+urlSplit[1]).closest('td').addClass('highlight');

    //add inline thread expansion
    $contentForm.find("font[color=#707070]:contains('レス')")
        .css('cursor', 'pointer')
        .click(function(e) {
            var $prev = $(this).prevUntil("a:contains('返信'), small").last().prev();
            if( $prev.tagName === 'small') return;
            $self = $(this).next('br').remove().end();
            $.get($prev.attr('href'), {}, function(data) {
                $(data).filter('form')
                        .eq(1)
                        .find('table')
                        .slice(0, -10)/*or untilNext($self.next())*/
                        .processDoc($prev.attr('href'))
                        .replaceAll($self)//$self.nextUntil('hr').andSelf()
                        .wrapAll('<div class="loaded"/>')
            });
        });
    //add top/bottom sticky nav and autoscroll
    var autoscroll = new Counter({interval:200});
    $('body').append(
        $('<div/>',{'class':'stickynav'})
            .append($('<a/>',{text:'▲', href:/*urlSplit[0]+*/'#top','class':'pointer', title:'Top'}))
            .append($('<a/>',{text:'▼', href:/*urlSplit[0]+*/'#ufm','class':'pointer', title:'Bottom'}))
            .append($('<input/>',{id:'autoscroll', type:'text', value:$('body').height(), title: 'Speed'}))
            .on('click', '.pointer', function(e){
                e.preventDefault();
                autoscroll.stop();

                var $self = $(this);
                if( $self.hasClass('active')){
                    $self.removeClass('active');
                    return
                }
                var $body = $('html, body');
                var speed = parseInt($('#autoscroll').val());
                var frag  = $self
                    .siblings()
                        .removeClass('active')
                    .end()
                    .addClass('active')
                    .attr('href');

                var offset, pos = $(frag).offset().top;
                autoscroll.start(function(){
                    if( frag === '#top') {
                        offset = $body.scrollTop() - speed;
                        if(offset <= pos) $self.click();
                    } else {
                        offset = $body.scrollTop() + speed;
                        if(offset >= pos) $self.click();
                    }
                    $body.scrollTop(offset);
                })
            })
        ).attr('id','top');
    //add autorefresh and counter
    var $contres = $('#contres a');
    if($contres.length){
        var cookie = "AutoRefresh=";
        var $timer = $('<span> 60s</span>').appendTo($('#contres'));
        var counter = new Counter({
            count     : 60,
            interval  : 1000,
            ontick    : function(tick){ $timer.text(' ' + tick + 's') },
            oncomplete: function()    { $contres.click() }            
        });
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