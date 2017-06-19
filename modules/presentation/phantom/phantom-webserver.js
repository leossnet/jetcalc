var server = require('webserver').create();
var system = require('system');
if (system.args.length !== 2) {
    console.log('Usage: phantom-webserver.js <port>');
    phantom.exit(1);
} 
else {
    var port = system.args[1];
    var listening = server.listen(port, function (request, response) {
        response.statusCode = 200;
        response.headers = {"Cache": "no-cache", "Content-Type": "text/html"};
        renderPage('file://' + request.url.split('$')[1], response)
    });
    if (!listening) {
        console.log("could not create web server listening on port " + port);
        phantom.exit();
    }
}

var renderPage = function(url, resp){
    var pageForRender = require('webpage').create();
    pageForRender.settings.userAgent = 'phantom';

    var lastReceived = new Date().getTime();
    var requestCount = 0;
    var responseCount = 0;
    var requestIds = [];
    var startTime = new Date().getTime();

    var MaxTime = 2000;

    /*pageForRender.onConsoleMessage = function(msg, lineNum, sourceId) {
      console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
    };*/

    pageForRender.onResourceReceived = function (response) {
        if(requestIds.indexOf(response.id) !== -1) {
            lastReceived = new Date().getTime();
            responseCount++;
            requestIds[requestIds.indexOf(response.id)] = null;
        }
    };

    pageForRender.onResourceRequested = function (request) {
        if(requestIds.indexOf(request.id) === -1) {
            requestIds.push(request.id);
            requestCount++;
        }
    };

    pageForRender.open(url, {encoding: "utf8"}, function () {
        window.setTimeout(function () {
            pageForRender.evaluate(function() {
            });
        }, MaxTime);
    });

    var checkComplete = function () {
        if((new Date().getTime() - lastReceived > 4000 && requestCount === responseCount) || new Date().getTime() - startTime > MaxTime)  {
            clearInterval(checkCompleteInterval);
            pageForRender.evaluate(function(){
                try{
                    document.getElementsByClassName('ht_clone_top')[0].parentNode.removeChild(document.getElementsByClassName('ht_clone_top')[0]);
                    document.getElementsByClassName('ht_clone_left')[0].parentNode.removeChild(document.getElementsByClassName('ht_clone_left')[0]);
                }catch(e){}
                try{
                    var wtHiderWidth = parseInt(document.getElementsByClassName('wtHider')[0].style.width);
                    var slidesWidth = parseInt(document.getElementsByClassName('slides')[0].style.width);
                    $('.wtHider').css('left', (slidesWidth - wtHiderWidth) / 2 + 'px');
                }catch(e){}
                $('.wtHider').css('position', 'fixed');
            })
            var pC = pageForRender.evaluate(function (){
                return document.getElementsByTagName('body')[0].innerHTML;
            })
            pC = pC.replace(/\s/g,' ').replace(/<!--.*?-->/g,'').trim();
            resp.write(pC);
            if(url.substr(-8) === "png=true"){
                var filename = url.split('?')[1].split('&')[0].split('=')[1];
                pageForRender.render('/tmp' + '/' + filename + '.png');
            }
            resp.close();
        }
    };

    var checkCompleteInterval = setInterval(checkComplete, MaxTime);
}