var fixTables = function () {
    var wtHiders = document.getElementsByClassName('wtHider');
    var containers = document.getElementsByClassName('handsonContainer');
    for (var i = 0; i < wtHiders.length; i++) {
        $(document.getElementsByClassName('wtHider')[i]).css("height", "auto")
        var wtHiderWidth = $(document.getElementsByClassName('wtHider')[i]).width()
        var wtHiderHeight = $(document.getElementsByClassName('wtHider')[i]).height()
        var containerHeight = $(document.getElementsByClassName('handsonContainer')[i]).height()
        var containerWidth = $(document.getElementsByClassName('handsonContainer')[i]).width()
        var wr = 1;
        var hr = 1;
        if (containerWidth < wtHiderWidth) {
            wr = (containerWidth / wtHiderWidth)
        } else {
            $(document.getElementsByClassName('wtHider')[i]).css("margin-left", (containerWidth - wtHiderWidth) / 2 + "px")
        }
        if (containerHeight < wtHiderHeight * wr) {
            hr = ((containerHeight - 35) / wtHiderHeight)
            if (wr > hr) {
                $(document.getElementsByClassName('wtHider')[i]).css("margin-left", (containerWidth - wtHiderWidth * hr) / 2 + "px")
            }
        } else {
            $(document.getElementsByClassName('wtHider')[i]).css("margin-top", ((containerHeight - 35) - wtHiderHeight * wr) / 2 + "px")
        }
        wr = Math.min(wr, hr);
        hr = wr;
        $(document.getElementsByClassName('wtHider')[i]).css("transform-origin", "top left")
        $(document.getElementsByClassName('wtHider')[i]).css("transform", "scale(" + wr + "," + hr + ")")
    }

}

var fixCharts = function () {
    var charts = document.getElementsByClassName('c3');
    for (var i = 0; i < charts.length; i++) {
        var chart = charts[i];
        var cheight = $(chart.parentNode).height();
        var cwidth = $(chart.parentNode).width();
        var height = $(chart).height();
        var width = $(chart).width();
        if (cwidth > width) {
            $(chart).css("left", parseInt((cwidth - width) / 2));
        }
        if (cheight > height) {
            $(chart).css("margin-top", parseInt((cheight - height) / 2));
        }
    }
}

var highlightColumns = function () {
    for (var index = 1; index < 20; index++) {
        $(".present-table-highlight-column-" + index).find("td:nth-child(" + index + ")").css("background-color", "#dcf2ff");
        $(".present-table-highlight-column-" + index).find("th:nth-child(" + index + ")").css("background-color", "#004eb6");
        $(".present-table-highlight-column-" + index).find("th:nth-child(" + index + ")").css("color", "white");
    }
}

var analyze = function () {
    Reveal.configure({
        autoSlide: 0
    })
    var getLeft = function (sectionClass, ind) {
        if (sectionClass == "single") {
            return true;
        }
        if (sectionClass == "four" && (ind == 0 || ind == 4)) {
            return true;
        }
        if (sectionClass == "one-v-one" && (ind == 0)) {
            return true;
        }
        if (sectionClass == "one-h-one") {
            return true;
        }
        if (sectionClass == "one-h-two" && (ind == 0 || ind == 2)) {
            return true;
        }
        if (sectionClass == "two-h-one" && (ind == 0 || ind == 4)) {
            return true;
        }
        if (sectionClass == "one-v-two" && (ind == 0)) {
            return true;
        }
        if (sectionClass == "two-v-one" && (ind == 0 || ind == 2)) {
            return true;
        }
        return false;
    }
    var getTop = function (sectionClass, ind) {
        if (sectionClass == "single") {
            return true;
        }
        if (sectionClass == "four" && (ind == 0 || ind == 2)) {
            return true;
        }
        if (sectionClass == "one-v-one") {
            return true;
        }
        if (sectionClass == "one-h-one" && (ind == 0)) {
            return true;
        }
        if (sectionClass == "one-h-two" && (ind == 0)) {
            return true;
        }
        if (sectionClass == "two-h-one" && (ind == 0 || ind == 2)) {
            return true;
        }
        if (sectionClass == "one-v-two" && (ind == 0 || ind == 2)) {
            return true;
        }
        if (sectionClass == "two-v-one" && (ind == 0 || ind == 4)) {
            return true;
        }
        return false;
    }
    var sections = document.getElementsByTagName('section');
    for (var i = 0; i < sections.length; i++) {
        var fragments = sections[i].childNodes[1].childNodes;
        for (var j = 0; j < fragments.length; j++) {
            var table = fragments[j].childNodes[1] && fragments[j].childNodes[1].childNodes[0].className === "intab-container";
            var left = getLeft(sections[i].classList[1], j);
            var top = getTop(sections[i].classList[1], j);
            if (table) {
                if (top) {
                    fragments[j].childNodes[1].childNodes[0].style.margin = "155px 0px"
                } else {
                    if (j == 4 && sections[i].classList[1] == "one-v-two") {
                        fragments[j].childNodes[1].childNodes[0].style.margin = "-4px 0px"
                    } else {
                        fragments[j].childNodes[1].childNodes[0].style.margin = "-12px 0px"
                    }
                }
                if (left) {
                    fragments[j].childNodes[1].childNodes[0].style.left = "640px"
                } else {
                    fragments[j].childNodes[1].childNodes[0].style.left = "155px"
                }
            }
        }
    }

}

var fix = function (pdf) {
    fixTables();
    fixCharts();
    highlightColumns();
    if (pdf) {
        analyze();
    }
}
