module.exports = function(grunt) {
  grunt.initConfig({
    pkg: {name:'ugmk_lib'},
    concat: {
      ugmk_lib_js: {
        src: [
            "static/lib/jquery.js",
            "static/lib/EventEmitter.min.js",
            "static/lib/jquery.include-min.js",
            "static/lib/numeral.min.js",
            "static/lib/jquery.maskedinput.min.js",
            "static/lib/jquery.nestable.js",
            "static/lib/jquery.slimscroll.min.js",
            "static/lib/jquery.datetimepicker.js",
            "static/lib/croppie.min.js",
            "static/lib/moment.min.js",
            "static/lib/moment-with-locales.min.js",
            "static/lib/knockoutjs/knockout-3.4.2.js",
            "static/lib/knockoutjs/knockout.mapping-latest.debug.js",
            "static/lib/knockoutjs/kopersist.js",
            "static/lib/pagerjs/jquery.history.js",
            "static/lib/pagerjs/pager.js",
            "static/lib/bootstrap.min.js",
            "static/lib/bootstrap-editable.min.js",
            "static/lib/fuelux.tree.min.js",
            "static/lib/ace/ace.js",
            "static/lib/ace/ace-elements.js",
            "static/lib/ace/ace-extra.js",
            "static/lib/ace/ace-editable.js",
            "static/lib/lodash.min.js",
            "static/lib/pikaday.js",
            "static/lib/sweetalert/sweetalert.min.js",
            "static/lib/mde/simplemde.min.js",
            "static/lib/handsontable.full.min.js",
            "static/lib/handsontable.extend.js",
            "static/lib/handsontable-double-click.min.js",
            "static/lib/socket/socket.io.min.js",
            "static/lib/async.js",
            "static/lib/keypress.min.js",
            "static/lib/FileAPI.min.js",
            "static/lib/form/selectize/selectize.min.js",
            "static/lib/form/selectize/kobind.js",
            "static/lib/typeahead.bundle.js",
            "static/lib/base64.js",
            "static/lib/utf8.js",
            'static/editor/editor.js',
            "static/src/tree.js",
            "static/lib/require.js",
            "static/lib/moment-range.js"
        ],
        dest: 'static/build/lib.js'
      },
      ugmk_lib_css: {
        src: [
          "static/css/opensans.css",
          "static/css/bootstrap.min.css",
          "static/lib/ace/ace.css",
          "static/lib/sweetalert/sweetalert.css",
          "static/lib/charts/c3/c3.min.css",
          "static/css/font-awesome.min.css",
          "static/css/font-awesome-animation.min.css",
          "static/css/jquery.datetimepicker.css",
          "static/css/handsontable.full.min.css",
          "static/css/handsontable.custom.css",
          "static/editor/editor.css",
          "static/lib/mde/simplemde.min.css",
          "static/lib/form/selectize/selectize_ace.css",
          "static/css/croppie.css"
        ],
        dest: 'static/build/lib.css'
      }
    },
    cssmin: {
      ugmk_lib_css: {
        src:  'static/build/lib.css',
        dest: 'static/build/lib.min.css'
      }
    },
    babel: {
        options: {
          sourceMap: true,
          presets: ['es2015']
        },
        dist: {
          files: [{
            src:['static/lib/handsontable.full.min.js'], 
            dest: 'static/lib/',
            ext: "-compiled.js"
          }]
        }
    },      
    uglify: {
      ugmk_lib_js: {
        files: {
          'static/build/lib.min.js': ['static/build/lib.js'],
        }
      }
    },     
    // Clean stuff up
    clean: {
      // Clean any pre-commit hooks in .git/hooks directory
      hooks: ['.git/hooks/pre-commit']
    },

    // Run shell commands
    shell: {
      hooks: {
        // Copy the project's pre-commit hook into .git/hooks
        command: 'cp git-hooks/pre-commit .git/hooks/'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-css');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-babel'); 
  grunt.registerTask('default', ['concat','cssmin','uglify']);
  grunt.registerTask('hookmeup', ['clean:hooks', 'shell:hooks']);
};
