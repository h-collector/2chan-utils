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
// @updateOEX   https://raw.github.com/h-collector/2chan-utils/master/build/2chan-utils.oex
// @homepageURL https://github.com/h-collector/2chan-utils
// @downloadURL https://raw.github.com/h-collector/2chan-utils/master/src/includes/2chan-utils.js
// @updateURL   https://raw.github.com/h-collector/2chan-utils/master/2chan-utils.meta.js
// @history     1.0.7 add some greasemonkey specific things, some changes to image expansion (dimensions display)
// @history     1.0.6 add cached links count, some refactoring, added constriction on max image height/width
// @history     1.0.5 fix: userjs @include/exclude/require declarations (overlay on image page, no www on yakumo-family)
// @history     1.0.4 fix: clicking on image while loading open link, a little code reformat, added more icons
// @history     1.0.3 minor changes
// @history     1.0.2 fixed and improved sidebar, added goto link, fixed autoscroll
// @history     1.0.1 partially fix sideeffect of reverse node traversal on sidebar
// @history     1.0   initial release
// @version     1.0.7
// @date        2013-07-01
// @license     GPL
// @grant       none
// ==/UserScript==
//
//  Features:
//  - inline image expansion, 
//  - inline thread expansion,
//  - expose mailto hidden messages
//  - single post anchoring and post highlight , 
//  - futalog and axfc uploader autolinking with highlight and unique links in sidebar 
//  - page autorefresh on new content, 
//  - removing ads. 
//  To use on opera:   with eg. opera scripter (tested), using converter to oex on opera (tested, also provided .oex build)
//         on firefox: with greasemonkey (tested)
//  Should be used in domready event
