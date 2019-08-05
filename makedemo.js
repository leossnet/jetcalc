/**
 * Преобразование базы данных к демо-версии:
 * а) Удаление всех учетных записей
 * б) Добавление учетной записи admin с паролем admin
 * в) Установление во всех коллекциях значение атрибута UserEdit='admin'
 * г) Установление в sql-таблицах значение поля CodeUser='admin'
 * 
 * Для запуска необходимо выполнить следующие команды:
 *      cd /htdocs/jetcalc
 *      node makedemo.js
 * В открывшемся меню выбрать нужный пункт.
 */

var shell = require('shelljs'); // https://www.npmjs.com/package/shelljs
var Menu = require('terminal-menu'); // https://www.npmjs.com/package/terminal-menu

var anyDB = require('any-db'); // https://www.npmjs.com/package/any-db
var Config  = require("./config.js");
var pg = Config.dbconfig.pgsql;
var ConnectURL = [
    pg.adapter,"://",pg.userName,":",pg.password,"@",pg.server,":",pg.options.port,"/",pg.options.database
].join("");

/**
 * Метки пунктов меню
 */
var Headers = {
    header          : "Выбор действия\n",
    heder_line      : "-------------------------\n",
};
var Labels = {
    setadminsql     : "Замена кодов пользователей в sql",
    setadmincode    : "Замена кодов пользователей в mongo",
    setadminuser    : "Удаление пользователей кроме admin",
    exit            : "Выход",
};

var bye = "\n------------------------------\nPress Ctrl+C or Enter to exit.\n";
var dstr = "\n==============================";

/**
 * Задачи
 */ 
var Tasks = {
    makedemo: function(){
        console.log(Labels.makedemo);
    },
    setadminsql: function(done){
        console.log(Labels.setadminsql+dstr);
        var queryes = [
            "alter table cells disable trigger trigger_on_cells;"
            ,"update cells set \"CodeUser\" = 'admin' where \"CodeUser\" != 'admin'"
            ,"alter table cells enable trigger trigger_on_cells;"
            ,"update cells_h set \"CodeUser\" = 'admin' where \"CodeUser\" != 'admin'"
            ,"alter table valuta_rates disable trigger trigger_on_valuta_rates;"
            ,"update valuta_rates set \"CodeUser\" = 'admin' where \"CodeUser\" != 'admin'"
            ,"alter table valuta_rates enable trigger trigger_on_valuta_rates;"
            ,"update valuta_rates_h set \"CodeUser\" = 'admin' where \"CodeUser\" != 'admin'"
        ];
        var pool = anyDB.createPool(ConnectURL, {min: 4, max: 10});
        runQueryes(pool, queryes);
    },
    setadminuser: function(){
        console.log(Labels.setadminuser);
    },
    setadmincode: function(){
        console.log(Labels.setadmincode);
    }
};

/**
 * Отрисовка меню выбора операций в соответствии с шаблоном shelljs
 * После завершения выбранной операции нужно нажать Ctrl+C
 */
function start () {
    var menu = Menu({ width: 36, x: 4, y: 2 });
    menu.reset();
    for (var header in Headers) {
        menu.write(Headers[header]);
    }
    for (var label in Labels ) {
        menu.add(Labels[label]);
    }
    menu.on('select', function (label) {
        menu.close();
        shell.exec('clear');
        switch (label){
            case Labels.setadminsql:
                Tasks.setadminsql();
            break;
            case Labels.setadminuser:
                Tasks.setadminuser();
            break;
            case Labels.setadmincode:
                Tasks.setadmincode();
            break;
        }
    });
    process.stdin.pipe(menu.createStream()).pipe(process.stdout);
    process.stdin.setRawMode(true);
    menu.on('close', function () {
        process.stdin.setRawMode(false);
        process.stdin.end();
    });
};

/**
 * Запуск скрипта
 */
var StartTask = "";
process.argv.forEach(function (val, index, array) {
    if (Tasks[val]) StartTask = val;
});
if (StartTask && Tasks[StartTask]){
    Tasks[StartTask]();
} else {
    start();
}

/**
 * Последовательное выполнение sql-запросов из массива queryes 
 * с завершающим закрытием пула соединений с базой данных
 * @param {*} pool 
 * @param {*} queryes 
 */
function runQueryes(pool, queryes){
    var sql = queryes.shift();
    pool.query(sql, function(error, result){
        if (error){
            console.log("Error: "+error.message+"\npool close."+bye);
            pool.close();
        }
        else {
            console.log(sql);
            if (result.command == "UPDATE") console.log("Обновлено "+result.rowCount+" строк.");
            if ( queryes.length == 0) {
                console.log("pool close."+bye);
                pool.close();
            }
            else {
                runQueryes(pool, queryes);
            }
        }
    });
}
