var page = require('webpage').create();
page.settings.userAgent = 'phantom';
var system = require('system');

var lastReceived = new Date().getTime();
var requestCount = 0;
var responseCount = 0;
var requestIds = [];
var startTime = new Date().getTime();

var MaxTime = 2000;

/*page.onConsoleMessage = function(msg, lineNum, sourceId) {
  console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
};*/

page.onResourceReceived = function (response) {
    if (requestIds.indexOf(response.id) !== -1) {
        lastReceived = new Date().getTime();
        responseCount++;
        requestIds[requestIds.indexOf(response.id)] = null;
    }
};

page.onResourceRequested = function (request) {
    if (requestIds.indexOf(request.id) === -1) {
        requestIds.push(request.id);
        requestCount++;
    }
};

page.open(system.args[1], {
    encoding: "utf8"
}, function () {
    window.setTimeout(function () {
        page.evaluate(function () {});
    }, MaxTime);
});

var checkComplete = function () {
    if ((new Date().getTime() - lastReceived > 4000 && requestCount === responseCount) || new Date().getTime() - startTime > MaxTime) {
        clearInterval(checkCompleteInterval);
        page.evaluate(function () {
            try {
                document.getElementsByClassName('ht_clone_top')[0].parentNode.removeChild(document.getElementsByClassName('ht_clone_top')[0]);
                document.getElementsByClassName('ht_clone_left')[0].parentNode.removeChild(document.getElementsByClassName('ht_clone_left')[0]);
            } catch (e) {}
            try {
                var wtHiderWidth = parseInt(document.getElementsByClassName('wtHider')[0].style.width);
                var slidesWidth = parseInt(document.getElementsByClassName('slides')[0].style.width);
                $('.wtHider').css('left', (slidesWidth - wtHiderWidth) / 2 + 'px');
            } catch (e) {}
            $('.wtHider').css('position', 'fixed');
        })
        var pC = page.evaluate(function () {
            return document.getElementsByTagName('body')[0].innerHTML;
        })
        pC = pC.replace(/\s/g, ' ').replace(/<!--.*?-->/g, '').trim();
        console.log(pC);
        if (system.args[1].substr(-8) === "png=true") {
            var filename = system.args[1].split('?')[1].split('&')[0].split('=')[1];
            page.render('/tmp' + '/' + filename + '.png');
        }
        phantom.exit();
    }
};

var checkCompleteInterval = setInterval(checkComplete, MaxTime);
