// ==UserScript==
// @author      h-collector <githcoll@gmail.com>
// @name        2chan-utils
// @namespace   https://gist.github.com/h-collector/
// @description Script for 2chan.net futaba board and archived threads on yakumo-family.com adding useful functions
// @include     http://*.2chan.net/*
// @exclude     http://*.2chan.net/*/src/*
// @include     http://yakumo-family.com/fdat/*
// @include     http://yakumo-family.com/f*dat/*
// @include     http://www.yakumo-family.com/fdat/*
// @include     http://www.yakumo-family.com/f*dat/*
// @require     https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js
// @homepageURL https://github.com/h-collector/2chan-utils
// @update      https://raw.github.com/h-collector/2chan-utils/master/src/includes/2chan-utils.js
// @history     1.0.6 add cached links count, some refactoring, added constriction on max image height/width
// @history     1.0.5 fix: userjs @include/exclude/require declarations (overlay on image page, no www on yakumo-family)
// @history     1.0.4 fix: clicking on image while loading open link, a little code reformat, added more icons
// @history     1.0.3 minor changes
// @history     1.0.2 fixed and improved sidebar, added goto link, fixed autoscroll
// @history     1.0.1 partially fix sideeffect of reverse node traversal on sidebar
// @history     1.0   initial release
// @version     1.0.6
// @date        2013-05-26
// @license     GPL
// ==/UserScript==

//  Features:
//  - inline image expansion, 
//  - inline thread expansion,
//  - expose mailto hidden messages
//  - single post anchoring and post highlight , 
//  - futalog and axfc uploader autolinking with highlight and unique links in sidebar 
//  - page autorefresh on new content, 
// - removing ads. 
//  To use with eg. opera scripter (tested), or using converter to oex on opera (tested)
//  Should be used in domready event, didn't really try on greasemonkey but should work

(function(){
    if (window.document.readyState == 'complete'){
        init();
    } else {
        window.addEventListener('DOMContentLoaded', init, false);
    }

    function init(){
        //just in odd case
        if (!("console" in window)) {
            var names = ["log", "error", "time", "timeEnd"];
            window.console = {};
            for (var i = 0, len = names.length; i < len; ++i)
                window.console[names[i]] = function(){}
        }
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
        } else {
           run(window.jQuery)
        }
    }

    function run($){
        var timeit             = true,
            optConstrictWidth  = true,
            optConstrictHeight = true,
            optLinkifyAxfc     = true,
            optLinkifyFutaba   = true,
            optLinkifyPosts    = true;

        timeit && console.time("2chan-utils");
        console.log('jQuery version: ' + $().jquery + ' Script version: 1.0.6');

        var windowWidth,
            windowHeight,
            $window = $(window);
        $window.resize(function() {
                windowWidth  = $window.width(),
                windowHeight = $window.height();
            }).triggerHandler('resize');

        //simple counter class
        function Counter(options){
            this.count      = options.count      || 60;
            this.tick       = options.count      || 60;
            this.interval   = options.interval   || 1000;
            this.ontick     = options.ontick     || function(){};
            this.oncomplete = options.oncomplete || function(){};
        }
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
        }
        //highlighter
        $.fn.highlight = function() {
            return $(this).each(function () {
                var $el = $(this);
                $('<div/>', {'class': 'highlight'})
                    .width( $el.outerWidth())
                    .height($el.outerHeight())
                    .css({
                        left: $el.offset().left,
                        top:  $el.offset().top
                    })
                    .appendTo('body')
                    .fadeOut(1000)
                    .queue(function () { $(this).remove() })
            })
        }
        String.prototype.replaceArray = function(find, replace) {
            var replaceString = this;
            for (var i = 0, len = find.length; i < len; i++)
                replaceString = replaceString.replace(find[i], replace[i]);
            return replaceString
        };
        //search and replace text content
        $.fn.searchAndReplace = function(pattern, replacement) {
            if (this.length === 0 || !pattern || !replacement) 
                return this;

            var isArray    = $.isArray(pattern),
                tempHolder = document.createElement('span');
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
                           parent.insertBefore(tempHolder.firstChild, node);
                        parent.removeChild(node);
                    } else {
                        parent.replaceChild(tempHolder.firstChild, node);
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
        $('<style type="text/css">'
            +'a.del        { color: #222}'
            +'a.del:hover  { color: #888}'
            +'td           { border-radius: 10px}'
            +'hr           { clear:both;}'
            +'.expand      { background: url(data:image/gif;base64,R0lGODlhEgASAKEAAAQCBPz+/IQCBJxCPCH5BAEAAAAALAAAAAASABIAAAI7hI+pyycP40ti2IutQBWHkG1O9oUcCWKi0V2len7yDK5ARdOD3VrvxUOZRp4U8FQcsjLMHUUCbUinjQIAOw==) center left no-repeat; }'
            +'.expanding   { background: url(data:image/gif;base64,R0lGODlhEgASAJEDAJ9AO4AAAP//+v///yH/C05FVFNDQVBFMi4wAwEAAAAh+QQFCgADACwAAAAAEgASAAACO5yPqcsXD+NLAdiLbUAVC5FtTvaFHAliotFdpXp+8gyuQ0XTgN1a78VDmUaeFPBUHLIyzB1FAm1Ip40CACH5BAUKAAMALAQABAAKAAoAAAIThI8JIrp84EOsNmplzNjo6mhGAQAh+QQFCgADACwFAAUACQAJAAACEYQvAomcumB8p0nLTKZUq1wVACH5BAUKAAMALAUABQAJAAkAAAIShASpdtqcDopyUsuke9zqRQEFACH5BAUKAAMALAUABQAJAAkAAAISBCSmhrnskGrtUHmdhQ/qJQEFADs=) left center no-repeat; }'
            +'td.highlight { background: #eba; }'
            +'div.highlight{ background: #ff9; position: absolute; opacity: 0.7; z-index: 1000; }'
            +'a.postanchor { margin: 0 2px; }'
            +'a.axfc       { background: #eba; }'
            +'a.futalog    { background: #0e0; }'
            +'a.axfc,'
            +'a.futalog,'
            +'#sidebar a   { display:inline; display:inline-block; padding: 0 4px; '
                           +'text-decoration:none; border-radius:4px;}'
            +'#sidebar     { padding: 4px; position: fixed; right: 0; '
                           +'overflow: auto; '
                           +'border: 1px solid #a08070; }'
            +'#sidebar div { text-align:center; font-weight:bold; }'
            +'#sidebar ul  { padding:0; margin:0; text-align:left; }'
            +'#sidebar li,'
            +'.collapse    { background: url(data:image/gif;base64,R0lGODlhEgASAKEAAP///59AO4AAAP//+iH5BAEAAAAALAAAAAASABIAAAI0hI+pyycP40si2IutQDX77XgfJ2ag0ZUaObTuG5xA9dZDTKprqOO8Lkupgj2fQ4JsKJeNAgA7) center left no-repeat; }'
            +'#sidebar li,'
            +'.expand, .expanding, .collapse '
                         +'{ padding:0; margin:0; padding-left: 20px; cursor:pointer; }'
            +'#sidebar a   { display:block; height: 22px;}'
            +'#sidebar li:hover a, a.highlight '
                         +'{ background: #ff0;}'
            +'#stickynav   { background: #eba; text-align:center; '
                           +'position: fixed; top: 50px; right: 10px; }'
            +'.pointer     { background: #a00; padding:1px; margin:1px; cursor:pointer; '
                           +'display:inline-block; width:14px; height:14px; '
                           +'text-decoration:none; color:#fff; font-size:14px; font-weight:900; '
                           +'border:1px solid #000; border-radius:4px; }'
            +'.active      { color:#f00; }'
            +'.resizeable  { width:auto; height:auto; }'
            +'.loading     { opacity: 0.5; }'
            +'.overlay-parent { position: relative; display:block; float:left; }'
            +'.overlay     { position:absolute; z-index:1000; left:20px; opacity: 0.5;'
                           +'background: #00f url(data:image/gif;base64,R0lGODlhKwALAPEAAP///wAAAIKCggAAACH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAKwALAAACMoSOCMuW2diD88UKG95W88uF4DaGWFmhZid93pq+pwxnLUnXh8ou+sSz+T64oCAyTBUAACH5BAkKAAAALAAAAAArAAsAAAI9xI4IyyAPYWOxmoTHrHzzmGHe94xkmJifyqFKQ0pwLLgHa82xrekkDrIBZRQab1jyfY7KTtPimixiUsevAAAh+QQJCgAAACwAAAAAKwALAAACPYSOCMswD2FjqZpqW9xv4g8KE7d54XmMpNSgqLoOpgvC60xjNonnyc7p+VKamKw1zDCMR8rp8pksYlKorgAAIfkECQoAAAAsAAAAACsACwAAAkCEjgjLltnYmJS6Bxt+sfq5ZUyoNJ9HHlEqdCfFrqn7DrE2m7Wdj/2y45FkQ13t5itKdshFExC8YCLOEBX6AhQAADsAAAAAAAAAAAA=) center center no-repeat;}'
            +'.olinfo      { padding: 4px; background: #00f; color: #fff}'
            +'.fullimg     { border: 1px solid #f00; }'
            +'.loaded      { border: 1px dashed #a08070; }'
            +'.secret      { border: 1px dashed #a08070; }'
            +'#autoscroll  { display:block; margin:0 2px; width: 34px; '
                           +'border: 1px solid #a08070; }'
            +'</style>').appendTo('head');

        //utalog links
        var futalog = {
            su : 'nijibox5.com/futabafiles/tubu/src/', /* 12 */
            sa : 'nijibox6.com/futabafiles/001/src/',  /* 12 */
            ss : 'nijibox5.com/futabafiles/kobin/src/',/* 24 */
            sq : 'nijibox6.com/futabafiles/mid/src/auth.redirect.php?',  /* 48 key */
            sp : 'nijibox2.com/futabafiles/003/src/'   /* 60 */
        },  futaAlt = 's[uaspq]';
        //axfc uploader links
        var axfc = {//didn't use full names but
            Sc: "Scandium",  He: "Helium",    Ne: "Neon",      H:  "Hydrogen",
            Li: "Lithium",   N:  "Nitrogen",  Si: "Silicon",   C:  "Carbon",
            O:  "Oxygen",    Al: "Aluminium", S:  "Sulphur",   P:  "Phosphorus",
            Ar: "Argon",     B:  "Boron",     K:  "Potassium", F:  "Fluorine",
            Be: "Beryllium", Na: "Sodium",    Ca: "Calcium",   Mg: "Magnesium",
            Cl: "Chlorine"
        },  axfcAlt      = '[FKOP]|C[al]?|N[ae]?|S[ci]?|A[lr]|Be?|He?|Li|Mg';

        //////////////////
        var emailReg     = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
            aId          = 0,
            sidebar      = {},
            $placeholder = $('<ul/>'),
            addToSidebar = function(m, aId, attributes){
                if(sidebar[m]){
                    var $li = $('#'+m, $placeholder);
                    if( $li !== $placeholder.first())
                        $li.prependTo($placeholder);
                    $li.data('anchorId').push(aId)
                } else{//var id = m.replace('.','')
                    sidebar[m] = true;
                    $('<li id="'+m+'"><a'+attributes+'>'+m+'</a></li>')
                        .prependTo($placeholder)
                        .data('anchorId',[aId])
                }
                return attributes;
            };
        //process contexted form
        $.fn.processDoc = function(url){
            timeit && console.time("processing: " + url);
            var $context = $(this),
                pattern = [],
                replace = [];
            if(optLinkifyPosts) {/* post number */
                pattern.push(/\bNo\.(\d+)\b/g);
                replace.push('<a href="'+url+'#delcheck$1" class="postanchor">$&</a>');
            }
            if(optLinkifyAxfc){  /* axfc links */
                pattern.push(new RegExp("(" + axfcAlt + ")_([0-9]{4,8})",'g')); 
                replace.push(function(m, pre, num){
                                return '<a id="a'+(++aId)+'"' 
                                    + addToSidebar(m, aId, ' href="http://www1.axfc.net/uploader/'+pre+'/so/'+num+'" class="axfc"') 
                                    + '>'+m+'</a>'
                            });
            }
            if(optLinkifyFutaba){/* futalog links */
                pattern.push(new RegExp("(" + futaAlt + ")[0-9]{5,7}",'g'));    
                replace.push(function(m, pre){
                                return '<a id="a'+(++aId)+'"' 
                                    + addToSidebar(m, aId, ' href="http://www.'+futalog[pre]+m+'" class="futalog"') 
                                    + '>'+m+'</a>'
                            });
            }

            //move to offscreen rendering//hide()
            $context.css({display: 'none'});
            //remove right ad
            $context.find('#rightad').remove();
            //expose mailto hidden messages
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
            ////add post anchor link and axfc uploader links
            try {
                $context.searchAndReplace(pattern, replace);
            } catch(err){
                console.error(err.stack); 
                var 
                txt="There was an error in script.\n\n";
                txt+="Error description: " + err.message + "\n\n";
                txt+="Click OK to continue.\n\n";
                alert(txt);
            }
            //display content //show()
            $context.css({display: 'block'});

            //add found links to futalog or axfc uploader to sidebar and recalculate height
            if($placeholder.children().length > 0){
                //if($placeholder.parent('body').length === 0)
                var $sidebar = $('#sidebar');
                if( $sidebar.length === 0){
                    $sidebar = $('<div/>', {id:'sidebar'})
                        .append($('<div/>', {text:'Links '})
                            .append($('<span/>', {id:'dlcount'}))
                        )
                        .append($placeholder)
                        .appendTo('body');

                    //add links highlight
                    $placeholder
                        .on('mouseenter','li',function(){
                            $.each($(this).data('anchorId'), function(idx, val){
                                $('#a'+val).addClass('highlight')
                            })
                        })
                        .on('mouseleave','li',function(){
                            $.each($(this).data('anchorId'), function(idx, val){
                                $('#a'+val).removeClass('highlight')
                            })
                        })
                        .on('click','a',function(event){
                            event.stopPropagation();
                        })
                        .on('click','li',function(){
                            $('html, body').scrollTop(
                                $('#a'+ $(this)
                                    .data('anchorId')
                                    .slice(-1)[0]
                                )
                                .closest('td')
                                .highlight()
                                .offset().top
                            );
                        });
                }
                $('#dlcount').text(
                    '('+(function(s){var i=0,x;for(x in s)++i;return i})(sidebar) + '/' + aId +')'
                );
                var hHeight = $placeholder.prev().height(),
                    wHeight = $(window).height(),
                    pHeight = Math.min($placeholder.height() + hHeight,wHeight); 
                $sidebar.css({
                    top :   Math.max(0, ((wHeight - pHeight) / 2) ),
                    height: pHeight 
                });
            }
            timeit && console.timeEnd("processing: " + url);
            return $context;
        };

        //remove ads (alt set display none i css), comment if you like them :D
        $('td.chui > div, iframe').remove();
        //#ufm + div, hr + b,
        $('#ufm').next('div').remove();
        $('hr').next('b').remove();

        ///inital parse
        var basehref = window.location.href.split('#')[0],
            $contentForm = $('form').eq(1);
        if( $contentForm.length === 0)//for yakumo-family.com
            $contentForm = $('body');/*.wrapInner($('<div/>')).first();*/
        $contentForm.processDoc(basehref);

        //add post highlight
        var $highlight = $();
        $contentForm.on('click', 'a.postanchor', function(){
            $highlight.removeClass('highlight');
            $highlight = $(this.hash).closest('td').addClass('highlight');
        });
        if(window.location.hash)//don't need to fire click
            $highlight = $(window.location.hash).closest('td').addClass('highlight');

        //add image expansion on click
        $contentForm.on('click', /*a>*/'img', function(e) {
            e.stopPropagation();
            e.preventDefault();
            var $img = $(this),
                data = $img.data();
            if(!data.srcfull){//or use one()?
                var  href    = $img.parent().attr('href');
                data.srcfull = href;
                data.srcalt  = href;
                $img.addClass('resizeable')
                    .bind('load', function() {
                        //$img.prev('div.overlay').remove();
                        var $img    = $(this),
                            $prev   = $img.prev('div.overlay'),
                            //width   = $img.width(),
                            //height  = $img.height(),
                            nWidth  = $img[0].naturalWidth,
                            nHeight = $img[0].naturalHeight;
                        if(!$prev.hasClass('olinfo'))
                            $prev.css({
                                    width: 'auto', 
                                    height:'auto'
                                })
                                .addClass('olinfo');

                        $prev.text(nWidth + ' x ' + nHeight);
                        // $prev.html(
                        //       width + ' x ' + height
                        //     + (width  === nWidth  ? '' : '<br />width : ' + nWidth)
                        //     + (height === nHeight ? '' : '<br />height: ' + nHeight)
                        // );
                        if (($img.attr('src') === $img.data('srcfull'))) {
                            $img.addClass('fullimg');
                        } else
                            $img.removeClass('fullimg');
                    })
                    .bind('error', function() {
                        $(this).prev('div.overlay').hide()
                    })
                    .before($('<div/>',{'class': 'overlay'})
                            .click(function(){ return false })
                            .width( $img.outerWidth())
                            .height($img.outerHeight())
                            .show()
                    )
                    .parent()
                        .addClass('overlay-parent')
            }
            var  src    = data.srcalt;
            data.srcalt = $img.attr('src');

            if(optConstrictWidth)
                $img.css('max-width',  windowWidth);
            if(optConstrictHeight)
                $img.css('max-height', windowHeight);
            $img.attr('src', src)
                .prev('div.overlay')
                    .show()
        });

        //add inline thread expansion
        $contentForm.find('font').filter('[color=#707070]').filter(":contains('レス')")
            .addClass('expand')
            .one('click',function() {
                var $self = $(this);
                var prev = $self.prevUntil("a:contains('返信'), small").last().prev().get(0);
                if( prev.tagName === 'small') 
                    return;//how come?
                $self.toggleClass('expand expanding').next('br').remove();
                $.get(prev.href, {}, function(data) {
                    $self.toggleClass('expanding collapse')
                         .data('expanded',true);
                    //$self.nextUntil('hr').remove();//without slicing
                    $(data).filter('form')
                            .eq(1)
                            .find('table')
                            .slice(0, -10) /* can take more than is needed*/
                            .processDoc(prev.href)
                            .insertAfter($self)
                            .wrapAll('<div class="loaded"/>')
                })
            })
            .click(function(){
                var $self = $(this);
                if( $self.data('expanded')) {
                    $self.toggleClass('collapse expand')
                         .next('div.loaded')
                            .toggle();
                }
            });

        //add top/bottom sticky nav and autoscroll
        var autoscroll = new Counter({interval:200});
        $('body')
            .attr('id','top')
            .append($('<div/>',{id:'btm'}))
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
                    var hash  = $self
                        .siblings()
                            .removeClass('active')
                        .end()
                        .addClass('active')
                        .get(0).hash,
                        speed = parseInt($('#autoscroll').val()),
                        $body = $('html, body'),
                        offset, lastOffset;
                    if( hash === '#top')
                        speed *= -1;
                    autoscroll.start(function(){
                        offset = $body.scrollTop() + speed;
                        if(offset === lastOffset)
                            return $self.click();
                        $body.scrollTop(lastOffset = offset);
                    })
                })
            );

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
                .appendTo($('<label/>', {text:'[Auto]'}).insertBefore($timer))
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
        timeit && console.timeEnd("2chan-utils");
    }
})();