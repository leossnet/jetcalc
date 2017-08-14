var jison = require("jison")
var Parser = jison.Parser
var fs = require("fs-extra")

var config   = require('./config.js');
var Menu = require('terminal-menu');

require('shelljs/global');

jison.print = function() {} // теперь jison не засирает логи

global.__base = __dirname + "/";



var Tasks = {
	postgress:function(){
    	cd(__base + 'sql/mocha/');
    	exec('mocha pgexec.js');
    	cd(__base);
	},
	build:function(){
		var Compiller = require(__base+"modules/modules/compiller.js");
		Compiller.BuildBundle(function(){
	    	cd(__base);
			exec('grunt');
		})
	},
	compile: function() {
		var generateParser = function(grammar) {
		    var parser = new Parser(grammar)
		    return parser.generate()
		}
        var items = [
            { file_name: "calculator.jison", output_path: __base + "classes/calculator/jison/calculator.js" },
            { file_name: "column.jison", output_path: __base + "classes/calculator/jison/column.js" },
            { file_name: "compile.jison", output_path: __base + "classes/calculator/jison/compile.js" },
            { file_name: "parser.jison", output_path: __base + "classes/calculator/jison/parser.js" },
            { file_name: "parser.jison", output_path: __base + "static/src/parser.js" }
        ]
        var template = fs.readFileSync(__base + "classes/calculator/jison/template.jison", "utf8")
        items.forEach(function(item) {
            var lexes = fs.readFileSync(__base + "classes/calculator/jison/" + item.file_name, "utf8")
            var grammar = template.replace("<% CAN_HAVE_U_PREFIX_LEXES %>", lexes)
            var parser = generateParser(grammar)

            fs.writeFileSync(item.output_path, parser, "utf8")
        })
    	cd(__base + 'classes/calculator/jison/mocha');
    	exec('mocha start.js');
    	cd(__base);
	}	
}

var StartTask = "";
process.argv.forEach(function (val, index, array) {
  	if (Tasks[val]) StartTask = val;
});

if (StartTask && Tasks[StartTask]){
	Tasks[StartTask]();
} else {
	var menu = Menu({ width: 29, x: 4, y: 2 });
	menu.reset();
	menu.write('Выбор действия\n');
	menu.write('-------------------------\n');
	menu.add('Компиляция парсеров');
	menu.add('Компиляция библиотек');
	menu.add('Проверка Postgres');
	menu.add('Выход');
	menu.on('select', function (label) {
	    menu.close();
	    exec('clear');
	    switch (label){
	    	case 'Компиляция парсеров':
	    		Tasks.compile();
	    	break;
	    	case 'Компиляция библиотек':
	    		Tasks.build();
	    	break;
		   	case 'Проверка Postgres':
	    		Tasks.postgress();
		   	break;

	    }
	});
	process.stdin.pipe(menu.createStream()).pipe(process.stdout);
	process.stdin.setRawMode(true);
	menu.on('close', function () {
	    process.stdin.setRawMode(false);
	    process.stdin.end();
	});
}
