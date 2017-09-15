var mongoose = require('mongoose');
var router = require('express').Router();
var _ = require('lodash');
var async = require('async');
var socket = require(__base + '/src/socket.js');
var api = require(__base + '/lib/helper.js');
var spawn = require('child_process').spawn;
var fs = require('fs');
var RabbitManager = require(__base + 'src/rabbitmq.js');
var Calculator = require(__base + 'classes/calculator/Calculator.js');
var lib = require(__base + 'lib/helpers/lib.js');
var Structure = require(__base + 'classes/jetcalc/Helpers/Structure.js');
var gfs = require(__base + 'src/gfs.js');
var http = require('http');


var PhantomJSHelper = (new function () {
    var self = this;

    self.ALLOW_FILE_CACHE = true;
    self.PHANTOM_IS_RUNNING = false;
    self.PHANTOM_PORT = 16162;

    self.getStructure = function (arg, done) {
        Structure.get(arg,function (err, Ans) {
            if (err) {
                return done(null, {})
            }
            return done(null, Ans);
        })
    };

    self.getCells = function (arg, done) {
        RabbitManager.CountConsumers(function (ConsumersCount) {
            if (!ConsumersCount) {
                return done(null, {});
            }
            arg.Priority = 4;
            RabbitManager.CalculateDocument(arg, function (err, Result) {
                if (err) {
                    return done(null, {});
                }
                return done(null, Result);
            })
        })
    };

    self.getChartByDoc = function (CodeDoc, done) {
        var Query = mongoose.model('chart').findOne({
            CodeDoc: CodeDoc
        });
        Query.exec(function (err, Chart) {
            if (!Chart) {
                return done('График документа ' + CodeDoc + ' не найден!')
            } else {
                return done(null, Chart);
            }
        })
    };

    self.getRowChartLines = function (CodeDoc, done) {
        var Query = mongoose.model('rowchartline').find({
            CodeDoc: CodeDoc
        });
        Query.exec(function (err, RowChartLines) {
            if (!RowChartLines) {
                return done('Настройки графика документа ' + CodeDoc + ' не найдены!');
            } else {
                return done(null, RowChartLines);
            }
        });
    };

    self.getContext = function (params) {
        return {
            CodeDoc: params.CodeDoc,
            CodeReport: params.CodeReport,
            CodeObj: params.CodeObj,
            CodePeriod: params.CodePeriod,
            CodeValuta: params.CodeValuta,
            CodePresent: params.CodePresent,
            UseCache: true,
            Year: parseInt(params.YearData),
            CodeUser: params.CodeUser,
            IsInput: false,
            ChildObj: '',
            CodeGrp: params.CodeGrp,
            GroupType: params.GroupType,
            IsDebug: false,
            IsOlap: false,
            SandBox: null
        }
    };

    /*self.loadJSONDataFromGfs = function(filename, params, callback){
        var fs_write_stream = fs.createWriteStream(require('os').tmpdir() + '/' + filename + '.json');
        gfs._pipeToFileByName(filename + '.json', fs_write_stream, function(){
            fs_write_stream.on('close', function () {
                callback()
            });
        })
    };*/

    self.getJSONData = function (filename, params, callback) {
        return self.genarateJSONData(params, callback);
    };

    self.genarateJSONData = function (params, callback) {
        var sources = [
            {
                'provider': self.getCells,
                'argSelector': function (params) {
                    return self.getContext(params)
                },
                'returned': 'Cells'
            },
            {
                'provider': self.getStructure,
                'argSelector': function (params) {
                    return self.getContext(params)
                },
                'returned': 'Structure'
            }
        ]
        if (params.work === 'svg' || params.work === 'png') {
            sources.push({
                'provider': self.getChartByDoc,
                'argSelector': function (params) {
                    return params.CodeDoc
                },
                'returned': 'Chart'
            });
            sources.push({
                'provider': self.getRowChartLines,
                'argSelector': function (params) {
                    return params.CodeDoc
                },
                'returned': 'RowChartLines'
            });
        }
        var JSONData = {};
        var sourceIndex = 0;
        var getJSONDataFromSource = function (sourceIndex) {
            if (sourceIndex >= sources.length) {
                return callback(JSON.stringify(JSONData))
            }
            var source = sources[sourceIndex];
            source.provider(source.argSelector(params), function (err, data) {
                if (!err) {
                    JSONData[source.returned] = data;
                    getJSONDataFromSource(sourceIndex + 1);
                } else {
                    return callback('{}')
                }
            })
        }
        getJSONDataFromSource(0);
    };

    self.makeJSON = function (filename, params, callback) {
        self.getJSONData(filename, params, function (data) {
            if (data) {
                fs.writeFile(require('os').tmpdir() + '/' + filename + '.json', data, function (err, data) {
                    if (!err) {
                        return callback();
                    }
                });
            } else {
                return callback();
            }
        });
    };

    self.getHTML = function (url, callback) {
        if (self.PHANTOM_IS_RUNNING) {
            var options = {
                host: '',
                port: self.PHANTOM_PORT,
                path: '/$' + url.substr(7)
            }
            http.request(options, function (resp) {
                var content = '';
                resp.on('data', function (chunk) {
                    content += chunk.toString();
                })
                resp.on('end', function () {
                    return callback(null, content);
                })
            }).end();
        } else {
            var content = "";
            var phantom = spawn("phantomjs", [__base + "modules/presentation/phantom/phantom-server.js", url, "--load-images=true"]);
            phantom.stdout.setEncoding("UTF-8");
            phantom.stdout.on("data", function (data) {
                content += data.toString();
            });
            phantom.on("exit", function (code) {
                if (code === 0) {
                    return callback(null, content);
                }
                return callback(code, content);
            });
        }
    };

    self.getFilename = function (params) {
        return 'CP' + params.CodePresent + ((params.work === 'svg' || params.work === 'png') ? 'Chart' : 'Table') + 'CD' + params.CodeDoc + 'CP' + params.CodePeriod + 'CR' + params.CodeReport + 'YD' + params.YearData + 'CV' + params.CodeValuta + 'CO' + params.CodeObj + Math.random().toString(36).substring(2, 10);
    };

    self.saveOnGfs = function (filename, done) {
        var fnp = filename.split('.');
        var savedName = fnp.slice(0, -1).join('').slice(0, -8) + '.' + fnp[fnp.length - 1];
        if (self.ALLOW_FILE_CACHE) {
            gfs.FileInfoByName(savedName, function (err, data) {
                if (err) {
                    return gfs.SaveFile(filename, done, savedName);
                } else {
                    return done();
                }
            })
        } else {
            return done();
        }
    };

    self.buildSVG = function (params, done) {
        params.work = 'svg';
        var filename = self.getFilename(params);
        self.makeJSON(filename, params, function () {
            self.getHTML('file://' + __base + '/modules/chart/export.html?file=' + filename + '&width=' + params.width + '&height=' + params.height, function (err, content) {
                if (err) {
                    return done('phantomjs error ' + err);
                } else {
                    fs.unlink(require('os').tmpdir() + '/' + filename + '.json', function (err, data) {});
                    return done(null, content);
                }
            })
        });
    };

    self.buildPNG = function (params, done) {
        params.work = 'png';
        var filename = self.getFilename(params);
        if (self.ALLOW_FILE_CACHE) {
            gfs.getReadStreamByName(filename.slice(0, -8) + '.png', function (err, rs) {
                if (!err) {
                    return done(null, filename + '.png', rs);
                } else {
                    self.makeJSON(filename, params, function () {
                        self.getHTML('file://' + __base + '/modules/chart/export.html?file=' + filename + '&width=' + params.width + '&height=' + params.height + "&png=true", function (err, content) {
                            if (err) {
                                return done('phantomjs error ' + err);
                            } else {
                                return self.saveOnGfs(require('os').tmpdir() + '/' + filename + '.png', function () {
                                    fs.unlink(require('os').tmpdir() + '/' + filename + '.json', function (err, data) {})
                                    done(null, filename + '.png')
                                })
                            }
                        })
                    });
                }
            })
        } else {
            self.makeJSON(filename, params, function () {
                self.getHTML('file://' + __base + '/modules/chart/export.html?file=' + filename + '&width=' + params.width + '&height=' + params.height + "&png=true", function (err, content) {
                    if (err) {
                        return done('phantomjs error ' + err);
                    } else {
                        return self.saveOnGfs(require('os').tmpdir() + '/' + filename + '.png', function () {
                            fs.unlink(require('os').tmpdir() + '/' + filename + '.json', function (err, data) {})
                            done(null, filename + '.png')
                        })
                    }
                })
            });
        }
    };

    self.buildTable = function (params, done, forbidCache) {
        params.work = 'table';
        var filename = self.getFilename(params);
        if (self.ALLOW_FILE_CACHE && !forbidCache) {
            gfs.getReadStreamByName(filename.slice(0, -8) + '.html', function (err, rs) {
                if (!err) {
                    return done(null, filename + '.html', rs);
                } else {
                    self.makeJSON(filename, params, function () {
                        self.getHTML('file://' + __base + '/modules/report/export.html?file=' + filename, function (err, content) {
                            if (err) {
                                return done('phantomjs error ' + err);
                            } else {
                                fs.writeFile(require('os').tmpdir() + '/' + filename + '.html', content, function (err, data) {
                                    if (!err) {
                                        return self.saveOnGfs(require('os').tmpdir() + '/' + filename + '.html', function () {
                                            fs.unlink(require('os').tmpdir() + '/' + filename + '.json', function (err, data) {})
                                            fs.unlink(require('os').tmpdir() + '/' + filename + '.html', function (err, data) {})
                                            done(null, content)
                                        })
                                    } else {
                                        fs.unlink(require('os').tmpdir() + '/' + filename + '.json', function (err, data) {})
                                        done(null, content)
                                    }
                                });
                            }
                        })
                    });
                }
            })
        } else {
            self.makeJSON(filename, params, function () {
                self.getHTML('file://' + __base + '/modules/report/export.html?file=' + filename, function (err, content) {
                    if (err) {
                        return done('phantomjs error ' + err);
                    } else {
                        fs.writeFile(require('os').tmpdir() + '/' + filename + '.html', content, function (err, data) {
                            if (!err) {
                                return self.saveOnGfs(require('os').tmpdir() + '/' + filename + '.html', function () {
                                    fs.unlink(require('os').tmpdir() + '/' + filename + '.json', function (err, data) {})
                                    fs.unlink(require('os').tmpdir() + '/' + filename + '.html', function (err, data) {})
                                    done(null, content)
                                })
                            } else {
                                fs.unlink(require('os').tmpdir() + '/' + filename + '.json', function (err, data) {})
                                done(null, content)
                            }
                        });
                    }
                })
            });
        }
    };

    return self;
});

module.exports = PhantomJSHelper;
