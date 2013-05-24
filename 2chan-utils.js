// ==UserScript==
// @author      h-collector <githcoll@gmail.com>
// @name        2chan-utils
// @namespace   https://gist.github.com/h-collector/
// @description Script for 2chan.net futaba board adding:
// @include     http://*.2chan.net/*
// @include     http://yakumo-family.com/fdat/*
// @require     //ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js
// @homepageURL https://gist.github.com/h-collector/5471519#file-2chan-utils-js
// @history     1.0.1 partially fix sideeffect of reverse node traversal on sidebar
// @history     1.0   initial release
// @version     1.0.1
// @date        2013-05-24
// @license     GPL
// ==/UserScript==

/**
 *    Features: 
 *    - inline image expansion, 
 *    - inline thread expansion,
 *    - expose mailto hidden messages
 *    - single post anchoring and post highlight , 
 *    - futalog and axfc uploader autolinking with highlight and unique links in sidebar 
 *    - page autorefresh on new content, 
 *    - removing ads. 
 *    To use with eg. opera scripter (tested), or using converter to oex on opera (tested)
 *    Should be used in domready event
 *    Didn't really try on greasemonkey
 */

(function(){
    if (window.document.readyState == 'complete'){
        init();
    } else {
        window.addEventListener('DOMContentLoaded', init, false);
    }

    function init(){
        // Add jQuery if not avalible
        if (typeof window.jQuery == 'undefined') {
            var head   = document.getElementsByTagName('head')[0] || document.documentElement,
                script = document.createElement('script');

            script.src = 'http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js';
            script.type = 'text/javascript';
            script.onload = function(){
                run(window.jQuery)
            };
            head.appendChild(script);
            //head.insertBefore(script, head.firstChild);
        } else {
           run(window.jQuery)
        }
    }
    function run($){
        var debug = false;
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
            for (var i = 0, len = find.length; i < len; i++)
                replaceString = replaceString.replace(find[i], replace[i]);
            return replaceString;
        };
        //search and replace text content
        $.fn.searchAndReplace = function(pattern, replacement) {
            if (this.length === 0 || !pattern || !replacement) 
                return this;

            var isArray    = $.isArray(pattern);
            var tempHolder = document.createElement('span');
            var innerSearchAndReplace = function(node, pattern, replacement) {
                if (node.nodeType === 3) {
                    var parent  = node.parentNode,
                        oldText = node.nodeValue;
                    tempHolder.innerHTML = isArray
                        ? oldText.replaceArray(pattern,replacement)
                        : oldText.replace(pattern,replacement);

                    if (oldText === tempHolder.innerHTML)
                        return;

                    var len = tempHolder.childNodes.length;
                    if (len > 1){
                        while (len--)
                           parent.insertBefore(tempHolder.lastChild, node);
                        parent.removeChild(node);
                    } else {
                        parent.replaceChild(tempHolder.lastChild, node);
                    }
                } else if (node.nodeType === 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) {
                    for (var i = node.childNodes.length - 1; i >= 0; --i)
                        innerSearchAndReplace(node.childNodes[i], pattern, replacement)
                }
            };
            return this.each(function() {
                innerSearchAndReplace(this, pattern, replacement);
            });
        };
        //add styles
        $('<style type="text/css">\n\
            .highlight { background: #F0C0B0; }\
            .postanchor{ margin: 0 2px; }\
            .axfc      { background: #F0C0B0; text-decoration:none; }\
            .futalog   { background: #00ee00; text-decoration:none; }\
            #sidebar   { position: fixed; right: 0; \
                         padding: 5px; overflow: auto; \
                         border: 1px solid #a08070; }\
            #sidebar div{ text-align:center; font-weight:bold; }\
            #sidebar ul { padding:0; margin:0; text-align:left; }\
            #sidebar li { padding:0; margin:0; }\
            #sidebar a { display:block; }\
            #stickynav { background: #F0e0c0; text-align:center; \
                         position: fixed; top: 50px; right: 10px; }\
            .pointer   { background: #a00; padding:1px; margin:1px; cursor:pointer; \
                         display:inline-block; width:14px; height:14px; \
                         text-decoration:none; color:#fff; font-size:14px; font-weight:900; \
                         border:1px solid #000; border-radius:4px; }\
            .active    { color:#f00; }\
            .resizeable{ width:auto; height:auto; }\
            .loading   { opacity: 0.5; }\
            .overlay-parent { position: relative; display:block; float:left; }\
            .overlay   { position:absolute; left:20px; z-index:1000; \
                         opacity: 0.5;\
                         background: #00f url(data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA==) center center no-repeat;}\
            .fullimg   { border: 1px solid #f00; }\
            .loaded    { border: 1px dashed #a08070; }\
            .secret    { border: 1px dashed #a08070; }\
            #autoscroll{ display:block; margin:0 2px; width: 34px; \
                         border: 1px solid #a08070; }\n\
          </style>').appendTo('head');
        //futalog links
        var futalog = {
            su : 'nijibox5.com/futabafiles/tubu/src/', /* 12 */
            sa : 'nijibox6.com/futabafiles/001/src/',  /* 12 */
            ss : 'nijibox5.com/futabafiles/kobin/src/',/* 24 */
            sq : 'nijibox6.com/futabafiles/mid/src/auth.redirect.php?',  /* 48 key */
            sp : 'nijibox2.com/futabafiles/003/src/'   /* 60 */
        };//$.map(futalog, function(e,i) {return i}).join('|');
        var futaAlt = 's[uaspq]';
        //axfc uploader links
        var axfc = {//didn't use full names but
            Sc: "Scandium",  He: "Helium",    Ne: "Neon",      H:  "Hydrogen",
            Li: "Lithium",   N:  "Nitrogen",  Si: "Silicon",   C:  "Carbon",
            O:  "Oxygen",    Al: "Aluminium", S:  "Sulphur",   P:  "Phosphorus",
            Ar: "Argon",     B:  "Boron",     K:  "Potassium", F:  "Fluorine",
            Be: "Beryllium", Na: "Sodium",    Ca: "Calcium",   Mg: "Magnesium",
            Cl: "Chlorine"
        };//$.map(axfc, function(e,i) {return i}).sort().reverse().join('|');
        //var axfcAlt      = 'Si|Sc|S|P|O|Ne|Na|N|Mg|Li|K|He|H|F|Cl|Ca|C|Be|B|Ar|Al';
        //var axfcAlt      = 'S[ic]?|P|O|N[ea]?|Mg|Li|K|He?|F|C[la]?|Be?|A[rl]';
        //var axfcAlt      = 'S[ic]?|[POKF]|N[ea]?|Mg|Li|[HB]e?|C[la]?|A[rl]';
        var axfcAlt      = '[FKOP]|C[al]?|N[ae]?|S[ci]?|A[lr]|Be?|He?|Li|Mg';
        //////////////////
        var basehref     = location.href.split('#')[0];//(/\?|#/)[0]
        var $placeholder = $('<ul/>');
        var $highlight   = $();
        var sidebar      = {};
        var addToSidebar = function(m, content){
            if (sidebar[m]) return sidebar[m];
                sidebar[m] = content;
                $('<li>'+sidebar[m]+'</li>').prependTo($placeholder);
            return content;
        };
        //process contexted form
        $.fn.processDoc = function(url){
            $context = $(this);
            $context.css({display: 'none'});
            $context.find('#rightad').remove();
            //expose mailto hidden messages
            var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
            $context.find('a').each(function(){
                var href = this.href;// $(this).attr('href') or decodeURI
                //faster .filter('[href^=mailto]')
                if(!href || href.indexOf('mailto') !== 0) return true;
                //extract fragment after mailto:
                var text = href.substr(7);
                //don't expose sage or valid emails (don't need them)
                if(text === 'sage' || emailReg.test(text))
                    return true;
                $(this).after($('<span/>',{html: decodeURI(text), 'class':'secret'}))
            });
            //add post anchor link and axfc uploader links
            // var $parent     = $context.parent(), 
            //     $nexSibling = $context.next(), 
            //     $offDOM     = $context.detach();//clone(true,true);
            try {
                $context.searchAndReplace(
                    [
                        /\bNo\.(\d+)\b/g,                                       /* post number */
                        new RegExp("(" + axfcAlt + ")_([0-9]{4,8})",'g'),      /* axfc links */
                        new RegExp("(" + futaAlt + ")[0-9]{5,7}(\.[a-zA-Z0-9]{2,4})?",'g') /* futalog links */
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
            } catch(err){
                if(debug) throw err;
                console.error(err.stack); 
                txt="There was an error in script.\n\n";
                txt+="Error description: " + err.message + "\n\n";
                txt+="Click OK to continue.\n\n";
                alert(txt);
            }
            ////can fail on body
            ////cloned
            // $context.replaceWith($offDOM);
            ////or detached
            // if( $nexSibling.length === 0){
            //      $context = $offDOM.appendTo($parent)
            // } else {
            //      $context = $offDOM.insertBefore($nexSibling);
            // }
            $context.css({display: 'block'});

            //add found links to futalog or axfc uploader to sidebar
            if($placeholder.children().length > 0){
                //if($placeholder.parent('body').length === 0)
                var $sidebar = $('#sidebar');
                if( $sidebar.length === 0)
                    $sidebar = $('<div/>', {id:'sidebar'})
                        .append($('<div/>', {text:'Downloads'}))
                        .append($placeholder)
                        .appendTo('body');
                var hHeight = $placeholder.prev().height();
                var wHeight = $(window).height();
                var pHeight = Math.min($placeholder.height() + hHeight,wHeight); 
                $sidebar.css({
                    top :   Math.max(0, ((wHeight - pHeight) / 2) ),
                    height: pHeight 
                });
            }
            return $context;
        };
        //remove ads, comment if you like them :D
        $('td.chui > div, iframe').remove();
        //#ufm + div, hr + b,
        $('#ufm').next('div').remove();
        $('hr').next('b').remove();
        ///inital parse
        $contentForm = $('form').eq(1);
        if( $contentForm.length === 0)
            $contentForm = $('body');//for yakumo-family.com
        $contentForm.processDoc(basehref);
        //add post highlight
        $contentForm.on('click', 'a.postanchor', function(e){
            //var target = '#'+$(this).attr('href').split('#')[1];
            $highlight.removeClass('highlight');
            $highlight = $(this.hash).closest('td').addClass('highlight');
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
                        var $img = $(this);/*.removeClass('loading');*/
                        $img.prev('.overlay').remove();
                        if (($img.attr('src') === $img.data('srcfull'))) {
                            $img.addClass('fullimg');
                        } else
                            $img.removeClass('fullimg');
                    })
                    .before($('<div/>',{
                        'class': 'overlay',
                        width:   $img.width(),
                        height:  $img.height()
                    }).hide())
                    .parent()
                        .addClass('overlay-parent');

            }
            var src = $img.data('srcalt');
            $img.data('srcalt',$img.attr('src'))
                //.addClass('loading')
                .attr('src', src)
                .prev('.overlay')
                    .show()
        });
        ///////////
        if(location.hash)
            $highlight = $(location.hash).closest('td').addClass('highlight');

        //add inline thread expansion
        $contentForm.find("font").filter("[color=#707070]").filter(":contains('レス')")
            .css('cursor', 'pointer')
            .click(function(e) {
                var prev = $(this).prevUntil("a:contains('返信'), small").last().prev().get(0);
                if( prev.tagName === 'small') return;
                $self = $(this).next('br').remove().end();
                $.get(prev.href, {}, function(data) {//$prev.attr('href')
                    $(data).filter('form')
                            .eq(1)
                            .find('table')
                            .slice(0, -10)/*or untilNext($self.next())*/
                            .processDoc(prev.href)
                            .replaceAll($self)//$self.nextUntil('hr').andSelf()
                            .wrapAll('<div class="loaded"/>')
                });
            });
        //add top/bottom sticky nav and autoscroll
        var autoscroll = new Counter({interval:200});
        $('body')
            .attr('id','top')
            .append($('<div/>',{id:'stickynav'})
                .append($('<a/>',{text:'⬆'/*▲*/, href:basehref+'#top','class':'pointer', title:'Top'}))
                .append($('<a/>',{text:'⬇'/*▼*/, href:basehref+'#btm','class':'pointer', title:'Bottom'}))
                .append($('<input/>',{id:'autoscroll', type:'text', value:$('body').height(), title: 'Speed'}))
                .on('click', 'a.pointer', function(e){
                    e.preventDefault();
                    autoscroll.stop();

                    var $self = $(this);
                    if( $self.hasClass('active')){
                        $self.removeClass('active');
                        return
                    }
                    var $body = $('html, body');
                    var speed = parseInt($('#autoscroll').val());
                    var hash  = $self
                        .siblings()
                            .removeClass('active')
                        .end()
                        .addClass('active')
                        .get(0).hash//.attr('href');

                    var offset, pos = $(hash).offset().top;
                    autoscroll.start(function(){
                        if( hash === '#top') {
                            offset = $body.scrollTop() - speed;
                            if(offset <= pos) $self.click();
                        } else {
                            offset = $body.scrollTop() + speed;
                            if(offset >= pos) $self.click();
                        }
                        $body.scrollTop(offset);
                    })
                })
            ).append($('<div/>',{id:'btm'}));
        //add autorefresh and counter
        var $contres = $('#contres a');
        if( $contres.length){
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
            for (var i = 0, len = ca.length; i < len; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                if (c.indexOf(cookie) == 0) { 
                    chBox.click();
                    break;
                }
            }
        }
    };
})();