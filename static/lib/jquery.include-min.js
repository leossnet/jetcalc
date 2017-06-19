/*
        jquery.include <http://code.google.com/p/jquery-include/>
        @version  2.5
        @author   John Hunter on 2011-04-02
        Licence CC-BSD <http://creativecommons.org/licenses/BSD/>
        
        Uses a standard tag with an src value <span data-src=""></span> - these are stripped from the dom after loading.
        Can handle nested includes - linking paths in the include file are modifed to match the host page context.
        For post-include scripts $(document).includeReady works the same as $(document).ready
        
        Based on ideas from hinclude by Mark Nottingham <mnot@pobox.com>
        
        version 2.3
        - move from success/error callbacks to use complete due to failure with jQuery 1.5 (fixed in 1.5.1)
        version 2.4
        - allow include tags to use 'src' or 'data-src' attr
        version 2.5
        - fix error with path rewriting in top level includes
        - rename unwrap to replaceWithChildren as its different from native $.unwrap
        
*/
(function($) {
        var maxRegression = 20,
                tagName = 'span',
                incSelect = tagName +'[src],'+ tagName +'[data-src]',
                ieParseDelay = 30,
                includeReadyFired = false,
                
                keepIncludeTags = false,
                rewritePaths = true;
                
        
        function parse (domNode) {
                if (maxRegression-- < 1) return this;
                
                // remove include tags and fire ready event
                if ($(incSelect).length === 0) {
                        $(tagName +'.include-loaded')[keepIncludeTags ? 'show' : 'replaceWithChildren']();
                        if (!includeReadyFired) {
                                // NOTE: this may fire a little early - difficult to tell when all includes have completed.
                                $(document).trigger('includeReady');
                        }
                        return this;
                }
                
                // load and parse include
                $(incSelect, domNode).each(function () {
                        var inc = $(this),
                                src = inc.attr('src') || inc.attr('data-src'),
                                path;
                        
                        
                        if (src) {
                                path = src.split('/').slice(0, -1).join('/');
                                if (path) path += '/';
                                
                                try {
                                        
                                        $.ajax({
                                                type: "GET",
                                                url: src,
                                                complete: function (xhr, status) {
                                                        if (status === 'error' || !xhr.responseText) {
                                                                handleError(inc, src);
                                                        }
                                                        else {
                                                                var data = xhr.responseText;
                                                                if (rewritePaths) {
                                                                        data = pathRewrite(data, path);
                                                                }
                                                                inc.html(data).
                                                                        addClass('include-loaded').
                                                                        removeAttrs(['src','data-src']);
                                                                
                                                                setTimeout(function () { parse(inc.get(0)); }, ieParseDelay);
                                                        }
                                                }
                                        });

                                } catch(e) { handleError(inc, src); }
                        }
                });
                return this;
        }
        
        function pathRewrite (html, path) {
                // modify any relative paths 
                return html.replace(/(\b(?:src|href)=")([^"]+")/g, function () {
                        var s = arguments;
                        if (/^http(s{0,1}):\/{2}|^\//.test(s[2])) {
                                return s[1] + s[2];
                        }
                        //console.info('rewrite: `%s` + `%s` + `%s`', s[1], path, s[2])
                        return s[1] + path + s[2];
                });
        }
        
        function handleError (inc, src) {
                if (window.console && console.warn) {
                        console.warn('Unable to load ', src);
                }
                setTimeout(function () {
                                inc.removeAttrs(['src','data-src']);
                                parse(inc.get(0));
                        }, ieParseDelay);
        };
        
        
        // create the custom event
        $.fn.includeReady = function (observerFn) {
                $(document).bind('includeReady', function(event) {
                        includeReadyFired = true;
                        observerFn(event);
                });
                return this;
        };
        
        $.fn.replaceWithChildren = function () {
                return this.each(function () {
                        var el = $(this);
                        el.replaceWith(this.childNodes);
                });
        };
        
        $.fn.removeAttrs = function (list) {
                for (var i = list.length; i--; ) { 
                        this.removeAttr(list[i]);
                }
        };

        //CUSTOM CODE
        document.parse = parse;

        $(document).ready(function() {
                parse(document);
        });
        
}(jQuery));