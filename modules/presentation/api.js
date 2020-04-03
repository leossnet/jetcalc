var mongoose = require('mongoose');
var router = require('express').Router();
var _ = require('lodash');
var async = require('async');
var socket = require(__base + '/src/socket.js');
var api = require(__base + '/lib/helper.js');
var fs = require('fs');
var spawn = require('child_process').spawn;
var PhantomJSHelper = require(__base + 'modules/presentation/phantom/phantom-helper.js');
var gfs = require(__base + 'src/gfs.js');

PresentationHtmlGenerator = new function () {
    var self = this;

    self.table_count = -1;

    self.LayoutAdapter = {
        '1x1': 'single',
        '2x1': 'one-v-one',
        '1x2': 'one-h-one',
        '2x1_1': 'two-v-one',
        '2x1_2': 'one-v-two',
        '1_2x2': 'two-h-one',
        '1_1x2': 'one-h-two',
        '2x2': 'four'
    };

    self.requiredCss = [
        "./css/c3.min.css",
        "./css/bootstrap.min.css",
        "./css/ace.min.css",
        "./css/handsontable.full.min.css",
        "./css/handsontable.custom.css",
        "./css/index.css",
        "./css/deck.css"
    ];

    self.requiredFonts = [
    ];

    self.requiredScripts = [
        "./js/fix.js",
        "./js/jquery-1.11.3.min.js"
    ];

    self._generateCss = function () {
        css = '';
        self.requiredCss.forEach(function (c) {
            css += '<link rel="stylesheet" href="' + c + '">'
        })
        return css;
    }

    self._generateFonts = function () {
        fonts = '';
        self.requiredFonts.forEach(function (f) {
            fonts += '<link rel="stylesheet" href="' + f + '">'
        })
        return fonts;
    }

    self._generateScripts = function () {
        scripts = '';
        self.requiredScripts.forEach(function (s) {
            scripts += '<script src="' + s + '"></script>'
        })
        return scripts;
    }

    self._generateFragment = function (slot) {
        var fc = ''
        fc += '<div>' + '<span>' + slot.NamePresentSlot + '</span>';
        if (slot.html) {
            fc += '<div class="fragment-html">'
            if (false) {
                fc += '<div class="present-table-highlight-column-' + 3 + '">' + slot.html + '</div>';
            } else {
                fc += slot.html;
            }
            fc += '</div>'
        }
        fc += '</div>'
        return fc;
    }

    self._generateSlideFragments = function (slide) {
        var slots = '';
        slide.slots.forEach(function (slot, ind) {
            slots += self._generateFragment(slot);
        })
        return ('<div class="slide-fragments footered headered">' + slots + '</div>')
    }

    self._getSecondFooter = function (slide, all) {
        return 'Слайд ' + slide + '/' + all;
    }

    self._generateSlideFooter = function (slide, present, ind) {
        return ('<div class="slide-footer"><div>' +
            ((slide.PresentSlideFooter != '') ? slide.PresentSlideFooter : present.PresenFooter) + '</div><div>' +
            self._getSecondFooter(ind + 1, present.slides.length) + '</div></div>')
    }

    self._generateSlideHeader = function (slide, present) {
        return ('<div class="slide-header"><span>' +
            slide.NamePresentSlide + '</span><span>' +
            ((slide.PresentSlideHeder != '') ? slide.PresentSlideHeder : present.PresentHeader) + '</span></div>')
    }

    self._generateSlide = function (slide, present, ind) {
        return ('<section class="slide-view ' + self.LayoutAdapter[slide.CodePresentSlideLayout] + '">' +
            self._generateSlideHeader(slide, present) + self._generateSlideFragments(slide) + self._generateSlideFooter(slide, present, ind) +
            '</section>')
    }

    self._generateSlides = function (present) {
        var slides = '';
        present.slides.forEach(function (slide, ind) {
            slides += self._generateSlide(slide, present, ind);
        })
        return slides;
    }

    self._generateRevealConfig = function (present) {
        return JSON.stringify({
            transition: present.CodePresentTransitType,
            loop: present.IsLoop,
            controls: present.IsShowNavigation,
            autoSlide: (present.IsAutoPlay ? present.AutoPlayInterval : 0)
        })
    }

    self._generateBody = function (present, pdf) {
        return ('<body onload="fix(' + pdf.toString() + ');"><div class="reveal"><div class="slides">' +
            self._generateSlides(present) +
            '</div></div><script src="./reveal/lib/js/head.min.js"></script><script src="./reveal/js/reveal.js"></script>' +
            '<script>Reveal.initialize(' + self._generateRevealConfig(present) + ');' +
            'Reveal.addEventListener("slidechanged",function(e){});</script>' + '</body>')
    }

    self._generateHead = function (present, pdf) {
        return ('<head>' + '<meta charset="utf-8">' +
            '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">' +
            '<title>' + present.NamePresent + '</title>' +
            '<link rel="stylesheet" href="./reveal/css/theme/' + present.CodePresentThema + '.css">' +
            '<link rel="stylesheet" href="./reveal/css/reveal.css">' +
            '<link rel="stylesheet" href="./reveal/css/print/paper.css">' +
            self._generateCss() + self._generateFonts() +
            self._generateScripts() + '</head>')
    }

    self.generateHtml = function (present, pdf) {
        return ('<!doctype html><html>' +
            self._generateHead(present, pdf) +
            self._generateBody(present, pdf) + '</html>');
    }

    return self;
}

PresentationBuildHelper = new function () {
    var self = this;

    self.buildStructure = function (CodePresent, done) {
        PresenationDBHelper.getPresent(CodePresent, function (err, present) {
            if (err) {
                done(err, present)
            } else {
                present = JSON.parse(JSON.stringify(present))
                PresenationDBHelper.getSlides(CodePresent, function (err, slides) {
                    if (err) {
                        done(err, present)
                    } else {
                        var tmp_slides = [];
                        slides.forEach(function (s) {
                            tmp_slides.push(JSON.parse(JSON.stringify(s)))
                        })
                        slides = tmp_slides;
                        var loadSlides = function (index) {
                            if (index >= slides.length) {
                                present.slides = slides;
                                return done(err, present);
                            }
                            var current = slides[index];
                            PresenationDBHelper.getSlots(current.CodePresentSlide, function (err, slots) {
                                if (err) {
                                    done(err, present)
                                } else {
                                    var tmp_slots = [];
                                    slots.forEach(function (s) {
                                        tmp_slots.push(JSON.parse(JSON.stringify(s)))
                                    })
                                    slots = tmp_slots;
                                    current.slots = slots;
                                    loadSlides(index + 1)
                                }
                            })
                        }
                        loadSlides(0);
                    }
                })
            }
        })
    }

    self.buildContent = function (CodePresent, params, done) {
        self.buildStructure(CodePresent, function (err, structure) {
            if (err) {
                return done(err, structure)
            } else {
                var SortSlots = function (index) {
                    if (index >= allSlots.length) {
                        return buildChartSlotContent(0);
                    } else {
                        var Query = mongoose.model('doc').findOne({
                            CodeDoc: allSlots[index].slot.CodeDoc
                        });
                        Query.exec(function (err, Doc) {
                            if (Doc) {
                                if (Doc.IsChart) {
                                    chartSlots.push(allSlots[index]);
                                } else {
                                    tableSlots.push(allSlots[index]);
                                }
                            }
                            SortSlots(index + 1);
                        })
                    }
                }
                var chartSlots = [];
                var tableSlots = [];
                var allSlots = [];
                var builders = [];
                var worksDoneCounter = 0;
                structure.slides.forEach(function (slide, slide_ind) {
                    slide.slots.forEach(function (slot, slot_ind) {
                        allSlots.push({
                            slot: slot,
                            slide: slide,
                            slot_ind: slot_ind,
                            slide_ind: slide_ind
                        });
                    })
                })
                var computeWidth = function (ind, slide) {
                    var layout = PresentationHtmlGenerator.LayoutAdapter[slide.CodePresentSlideLayout];
                    var slideWidth = 800;
                    var wd = ['four', 'one-v-one', 'one-v-two', 'two-v-one']
                    if (wd.some(function (N) {
                            return N == layout || (layout == 'one-h-two' && ind != 0) || (layout == 'two-h-one' && ind != 2);
                        })) {
                        return parseInt(parseInt(slideWidth) / 2);
                    }
                    return slideWidth;
                }
                var computeHeight = function (ind, slide) {
                    var layout = PresentationHtmlGenerator.LayoutAdapter[slide.CodePresentSlideLayout];
                    var slideHeight = 600;
                    var hd = ['four', 'one-h-one', 'one-h-two', 'two-h-one']
                    if (hd.some(function (N) {
                            return N == layout || (layout == 'one-v-two' && ind != 0) || (layout == 'two-v-one' && ind != 2);
                        })) {
                        return parseInt(parseInt(slideHeight) / 2);
                    }
                    return slideHeight;
                }
                var onBuildeFinish = function (err) {
                    if (worksDoneCounter != builders.length) {
                        setTimeout(onBuildeFinish, 500)
                    } else {
                        return done(err, structure);
                    }
                }
                var runBuilders = function () {
                    async.each(builders, function (builder, callback) {
                        builder();
                        callback();
                    }, onBuildeFinish)
                }
                var buildChartSlotContent = function (index) {
                    if (index >= chartSlots.length) {
                        return buildTableSlotContent(0);
                    } else {
                        builders.push(function () {
                            var svgwidth = computeWidth(chartSlots[index].slot_ind, chartSlots[index].slide);
                            var svgheight = computeHeight(chartSlots[index].slot_ind, chartSlots[index].slide);
                            if (4 * svgheight > 3 * svgwidth) {
                                svgheight = parseInt(0.75 * svgwidth);
                            } else {
                                svgwidth = parseInt(1.3333333 * svgheight);
                            }
                            PhantomJSHelper.buildSVG(_.merge(chartSlots[index].slot,
                                _.merge({
                                    width: svgwidth,
                                    height: svgheight
                                }, params)
                            ), function (err, data) {
                                if (!err) {
                                    chartSlots[index].slot.html = data;
                                }
                                worksDoneCounter++;
                            })
                        })
                        buildChartSlotContent(index + 1);
                    }
                }
                var buildTableSlotContent = function (index) {
                    if (index >= tableSlots.length) {
                        return runBuilders()
                    } else {
                        builders.push(function () {
                            PhantomJSHelper.buildTable(_.merge(tableSlots[index].slot, params), function (err, data) {
                                if (!err) {
                                    tableSlots[index].slot.html = data;
                                }
                                worksDoneCounter++;
                            }, true)
                        })
                        buildTableSlotContent(index + 1);
                    }
                }
                SortSlots(0);
            }
        })
    }

    self._makeDirectory = function (html, done) {
        var cp = spawn("cp", ["-r", __base + 'static/presentation', require('os').tmpdir()])
        cp.on("exit", function (code) {
            if (code === 0) {
                fs.writeFile(require('os').tmpdir() + '/presentation/presentation.html', html, function (err, data) {
                    return done(err, data);
                });
            } else {
                return done(code, {});
            }
        })
    }

    self._makeZip = function (done) {
        var zip = spawn("zip", ["-rm", require('os').tmpdir() + "/presentation.zip", require('os').tmpdir() + '/presentation/'])
        zip.on("exit", function (code) {
            if (code === 0) {
                return done(null, {})
            } else {
                return done(code, {})
            }
        })
    }

    self._makePdf = function (done) {
        var pdf = spawn(__base + 'modules/presentation/decktape/phantomjs', [__base + 'modules/presentation/decktape/decktape.js', "reveal", require('os').tmpdir() + '/presentation/presentation.html', require('os').tmpdir() + '/presentation.pdf'])
        pdf.on("exit", function (code) {
            if (code === 0) {
                return done(null, {})
            } else {
                return done(code, {})
            }
        })
    }

    self._clearFiles = function (done) {
        var rmzip = spawn("rm", [require('os').tmpdir() + "/presentation.zip"]);
        var rmpdf = spawn("rm", [require('os').tmpdir() + "/presentation.pdf"]);
        var rmdir = spawn("rm", ["-rf", require('os').tmpdir() + "/presentation/"]);
    }

    self.buildHtml = function (CodePresent, params, pdf, done) {
        self.buildContent(CodePresent, params, function (err, data) {
            if (!err) {
                var html = PresentationHtmlGenerator.generateHtml(data, pdf);
                self._makeDirectory(html, function (err, data) {
                    if (!err) {
                        if (pdf) {
                            self._makePdf(done);
                        } else {
                            self._makeZip(done);
                        }
                    } else {
                        return done(err, data);
                    }
                });
            } else {
                return done(err, data)
            }
        })
    }

    return self;
}

PresenationDBHelper = new function () {
    var self = this;

    self.getSlot = function (CodeSlot, done) {
        var Query = mongoose.model('presetslot').findOne({
            CodePresentSlot: CodeSlot
        }); //BAD MODEL NAME!
        Query.exec(function (err, Slot) {
            if (!Slot) {
                return done('Слот ' + CodeSlot + ' не найден!');
            } else {
                return done(null, Slot)
            }
        });
    };

    self.getSlide = function (CodeSlide, done) {
        var Query = mongoose.model('presentslide').findOne({
            CodePresentSlide: CodeSlide
        });
        Query.exec(function (err, Slide) {
            if (!Slide) {
                return done('Слайд ' + CodeSlide + ' не найден!');
            } else {
                return done(null, Slide);
            }
        });
    };

    self.getPresent = function (CodePresent, done) {
        var Query = mongoose.model('present').findOne({
            CodePresent: CodePresent
        });
        Query.exec(function (err, Present) {
            if (!Present) {
                return done('Презентация ' + CodePresent + ' не найдена!')
            } else {
                return done(null, Present);
            }
        })
    };

    self.getSlides = function (CodePresent, done) {
        var Query = mongoose.model('presentslide').find({
            CodePresent: CodePresent
        });
        Query.exec(function (err, Slides) {
            if (!Slides) {
                return done(null, []);
            } else {
                return done(null, Slides);
            }
        })
    };

    self.getSlots = function (CodeSlide, done) {
        var Query = mongoose.model('presetslot').find({
            CodePresentSlide: CodeSlide
        }); //BAD MODEL NAME!!!
        Query.exec(function (err, Slots) {
            if (!Slots) {
                return done(null, []);
            } else {
                return done(null, Slots);
            }
        })
    };

    self.getPresentByDoc = function (CodeDoc, done) {
        var Query = mongoose.model('present').findOne({
            CodeDoc: CodeDoc
        });
        Query.exec(function (err, Present) {
            if (!Present) {
                return done('Презентация документа ' + CodeDoc + ' не найдена!')
            } else {
                return done(null, Present);
            }
        })
    };

    self.setPresent = function (Present, CodeUser, done) {
        var getFlatSlots = function (nfs) {
            var rs = [];
            var addSlotByAction = function (slot, action) {
                rs.push({
                    action: action,
                    data: slot,
                    query: {
                        CodePresentSlot: slot.CodePresentSlot
                    },
                    model: "presetslot"
                });
            }
            nfs.toAdd.forEach(function (e) {
                addSlotByAction(e, "add");
            })
            nfs.toUpdate.forEach(function (e) {
                addSlotByAction(e, "update");
            })
            nfs.toRemove.forEach(function (e) {
                addSlotByAction(e, "remove");
            })
            return rs;
        }
        var getFlatStructure = function (nfstruct) {
            var addSlideByAction = function (slide, action) {
                rstruct.push({
                    action: action,
                    data: slide,
                    query: {
                        CodePresentSlide: slide.CodePresentSlide
                    },
                    model: "presentslide"
                });
                var flatSlots = getFlatSlots(slide.slots);
                Array.prototype.push.apply(rstruct, flatSlots)
            }
            rstruct = [];
            nfstruct.toAdd.forEach(function (e) {
                addSlideByAction(e, "add");
            })
            nfstruct.toUpdate.forEach(function (e) {
                addSlideByAction(e, "update");
            })
            nfstruct.toRemove.forEach(function (e) {
                addSlideByAction(e, "remove");
            })
            return rstruct;
        }
        var flatStructure = getFlatStructure(Present.slides);
        var saveFlatStructure = function (i) {
            if (i == flatStructure.length) {
                done();
                return;
            }
            var obj2save = flatStructure[i];
            if (obj2save.action == "add") {
                var M = mongoose.model(obj2save.model);
                var Obj = new M(obj2save.data);
                Obj.userSave(CodeUser, function () {
                    saveFlatStructure(i + 1)
                });
            }
            if (obj2save.action == "update") {
                var Q = mongoose.model(obj2save.model).findOne(obj2save.query);
                Q.exec(function (err, U) {
                    if (!U) {
                        var M = mongoose.model(obj2save.model);
                        var Obj = new M(obj2save.data);
                        Obj.userSave(CodeUser, function () {
                            saveFlatStructure(i + 1)
                        });
                    } else {
                        U.cfg().EditFields.forEach(function (field) {
                            if (U[field] != obj2save.data[field]) {
                                U[field] = obj2save.data[field];
                            }
                        })
                        U.userSave(CodeUser, function () {
                            saveFlatStructure(i + 1)
                        });
                    }
                })
            }
            if (obj2save.action == "remove") {
                var Q = mongoose.model(obj2save.model).findOne(obj2save.query);
                Q.remove().exec(function () {
                    saveFlatStructure(i + 1)
                });
            }
        }
        var Query = mongoose.model('present').findOne({
            CodePresent: Present.CodePresent
        })
        Query.exec(function (err, dbPresent) {
            if (!dbPresent) {
                var M = mongoose.model('present');
                var Obj = new M(Present);
                Obj.userSave(CodeUser, done);
            } else {
                dbPresent.cfg().EditFields.forEach(function (field) {
                    if (dbPresent[field] != Present[field]) {
                        dbPresent[field] = Present[field];
                    }
                })
                dbPresent.userSave(CodeUser, function () {
                    saveFlatStructure(0)
                });
            }
        })
    };

    return self;
};

router.get('/presentbydoc/:CodeDoc', function (req, res, next) {
    return PresenationDBHelper.getPresentByDoc(req.params.CodeDoc, function (err, Present) {
        if (err) {
            return next(err);
        } else {
            return res.json({
                Present: Present
            });
        }
    });
});

router.get('/present/:CodePresent', function (req, res, next) {
    return PresenationDBHelper.getPresent(req.params.CodePresent, function (err, Present) {
        if (err) {
            return next(err);
        } else {
            return res.json({
                Present: Present
            });
        }
    });
});

router.get('/slides/:CodePresent', function (req, res, next) {
    return PresenationDBHelper.getSlides(req.params.CodePresent, function (err, Slides) {
        if (err) {
            return next(err);
        } else {
            return res.json({
                Slides: Slides
            });
        }
    });
});

router.get('/slide/:CodeSlide', function (req, res, next) {
    return PresenationDBHelper.getSlide(req.params.CodeSlide, function (err, Slide) {
        if (err) {
            return next(err);
        } else {
            return res.json({
                Slide: Slide
            });
        }
    });
});

router.get('/slots/:CodeSlide', function (req, res, next) {
    return PresenationDBHelper.getSlots(req.params.CodeSlide, function (err, Slots) {
        if (err) {
            return next(err);
        } else {
            return res.json({
                Slots: Slots
            });
        }
    });
});

router.get('/slot/:CodeSlot', function (req, res, next) {
    return PresenationDBHelper.getSlot(req.params.CodeSlot, function (err, Slot) {
        if (err) {
            return next(err);
        } else {
            return res.json({
                Slot: Slot
            });
        }
    });
});

router.put('/present', function (req, res, next) {
    return PresenationDBHelper.setPresent(JSON.parse(req.body['present']), req.user.CodeUser,
        function (err, ret) {
            return res.json({});
        });
});

router.get('/presenthtml/:CodePresent', function (req, res, next) {
    params = _.merge(req.query, {
        CodeUser: req.user.CodeUser,
        CodePresent: req.params.CodePresent
    })
    return PresentationBuildHelper.buildHtml(req.params.CodePresent, params, false, function (err, data) {
        if (err) {
            return next(err)
        } else {
            res.setHeader('Content-disposition', 'attachment; filename=presentation.zip');
            var fsrs = fs.createReadStream(require('os').tmpdir() + "/presentation.zip");
            fsrs.pipe(res);
            fsrs.on("close", function () {
                PresentationBuildHelper._clearFiles(function () {});
            })
        }
    })
})

router.get('/presentpdf/:CodePresent', function (req, res, next) {
    params = _.merge(req.query, {
        CodeUser: req.user.CodeUser,
        CodePresent: req.params.CodePresent
    })
    return PresentationBuildHelper.buildHtml(req.params.CodePresent, params, true, function (err, data) {
        if (err) {
            return next(err)
        } else {
            res.setHeader('Content-disposition', 'attachment; filename=presentation.pdf');
            var fsrs = fs.createReadStream(require('os').tmpdir() + "/presentation.pdf");
            fsrs.pipe(res);
            fsrs.on("close", function () {
                PresentationBuildHelper._clearFiles(function () {});
            })
        }
    })
})

router.get('/clearpresentcache/:CodePresent', function (req, res, next) {
    gfs.ClearPresentCache(req.params.CodePresent, function (err) {
        if (err) {
            return next(err);
        } else {
            res.json({
                status: 'OK'
            })
        }
    })
});

module.exports = router
