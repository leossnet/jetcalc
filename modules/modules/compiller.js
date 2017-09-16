var _ = require("lodash");
var async = require("async");
var fs = require("fs");
var lib = require(__base+'lib/helpers/lib.js');



var Compiller = (new function(){
    var self = this;

    self.Cache = {}, JSMIN = {}; JSMIN[__base+'static/build/index.js'] = [__base+'static/build/index.max.js'];

    self.BuildBundle = function(final){
        var gr_config = {
            pkg: {name:'ugmk_modules'},
            concat:{
                "modules_js":{
                     src:[],
                     dest:__base+'static/build/index.max.js'
                },
                "modules_html":{
                     src:[],
                     dest:__base+'static/build/template.html'
                },
                "modules_css":{
                     src:[],
                     dest:__base+'static/build/index.max.css'
                }
            },
            cssmin:{
                "modules_css_min":{
                    src:  __base+'static/build/index.max.css',
                    dest: __base+'static/build/index.css'
                }
            },
            uglify:{
                "modules_js_min":{
                    files: JSMIN
                }
            }

        };
        var _remap = function(List){
            return _.map(List,function(L){
                return __base+L.substring(1);
            })
        }
        async.each(["index.js","index.css","template.html"],function(fileType,done){
            self.Files(fileType,function(err,JSFilesList){
                var dest = null;
                switch(fileType){
                    case "index.js":
                        gr_config.concat.modules_js.src = _remap(JSFilesList);
                    break;
                    case "index.css":
                        gr_config.concat.modules_css.src = _remap(JSFilesList);
                    break;
                    case "template.html":
                        gr_config.concat.modules_html.src = _remap(JSFilesList);
                    break;
                }
                return done();
            })
        },function(err){
            var grunt = require('grunt');
            grunt.task.init = function() {};
            grunt.initConfig(gr_config);
            grunt.loadNpmTasks('grunt-contrib-concat');
            grunt.loadNpmTasks('grunt-css');
            grunt.loadNpmTasks('grunt-contrib-uglify');
            grunt.loadNpmTasks('grunt-contrib-cssmin');
            grunt.tasks(['concat','cssmin','uglify'], {}, function() {
                fs.writeFileSync(__base+"static/build/index.html",[
                    '<link rel="stylesheet" href="/build/index.css">',
                    '<script src="/build/index.js" ></script>',
                    '<span src="/build/template.html" ></span> '
                ].join("\n\n"));
                grunt.log.ok('Done running tasks.');
                console.log("Rebuild bundle is done !");
                final();
            });
        })
    }


    self.Build = function(done){
        var Content = {};
        async.each(["Css","Js","Templates"],function(Type,cb){
            self[Type](function(err,Cont){
                Content[Type] = Cont;
                return cb();
            })
        },function(err){
            fs.writeFileSync(__base+"static/build/index.html",[Content.Css,Content.Js,Content.Templates].join("\n\n"));
            console.log("BUILD is done");
            done && done();
        })

    }

    self.EnabledMods = function(done){
        //if (self.Cache["Modules"]) return done(null,self.Cache["Modules"]);
        lib.enabledExtensions(function(err,modules){
            self.Cache["Modules"] = modules;
            return done(null,self.Cache["Modules"])
        })
    };


    self.Css = function(done){
        self.Files("index.css",function(err,FilesList){
            var Content = [];
            FilesList.forEach(function(F){
                Content.push('<link rel="stylesheet" href="'+F+'"> ');
            })
            return done(null,Content.join("\n"));
        })
    }

    self.Js = function(done){
        self.Files("index.js",function(err,FilesList){
            var Content = [];
            FilesList.forEach(function(F){
                Content.push('<script src="'+F+'" ></script>');
            })
            return done(null,Content.join("\n"));
        })
    }

    self.Templates = function(done){
        self.Files("template.html",function(err,FilesList){
           var Content = [];
            FilesList.forEach(function(F){
                Content.push('<span src="'+F+'" ></span>');
            })
            return done(null,Content.join("\n"));
        })
    }

    self.Files = function(mask,done){
        self.EnabledMods(function(err,List){
            var result = [], fs = require("fs");
            async.each(List,function(moduleName,cb){
                fs.stat(__base+'modules/'+moduleName+'/'+mask,function(err,stat){
                    if (stat && stat.size){
                        result.push("/modules/"+moduleName+'/'+mask);
                    }
                    return cb();
                })
            },function(err){
                return done(err,result)
            });
        })
    }


    return self;
})


module.exports = Compiller;