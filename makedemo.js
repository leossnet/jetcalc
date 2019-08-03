/**
 * Преобразование базы данных к демо-версии:
 * 1. Удаление всех учетных записей
 * 2. Добавление учетной записи admin с паролем admin
 * 3. Установление во всех коллекциях значение атрибута UserEdit='admin'
 * 4. Установление в sql-таблицах значение поля CodeUser='admin'
 * 
 * Для запуска необходимо выполнить следующие команды:
 *      cd /htdocs/jetcalc
 *      node makedemo.js
 * В открывшемся меню выбрать нужный пункт.
 */

var shell = require('shelljs');
var Menu = require('terminal-menu');
//global.__base = __dirname + "/";

/**
 * Метки пунктов меню
 */
var Labels = {
    header     : "Выбор действия\n",
    heder_line : "-------------------------\n",
    makedemo   : "Создание демо-базы",
    exit       : "Выход",
};

/**
 * Задачи
 */ 
var Tasks = {
    makedemo: function(){
        console.log("run makedemo...");
    }
};

/**
 * Отрисовка меню выбора операций в соответствии с шаблоном:
 * https://www.npmjs.com/package/terminal-menu
 * После завершения выбранной операции нужно нажать Ctrl+C
 */
function start () {
    var menu = Menu({ width: 29, x: 4, y: 2 });
    menu.reset();
    menu.write(Labels.header);
    menu.write(Labels.heder_line);
    menu.add(Labels.makedemo);
    menu.add(Labels.exit);
    menu.on('select', function (label) {
        menu.close();
        shell.exec('clear');
        switch (label){
            case Labels.makedemo:
                Tasks.makedemo();
            break;
        }
        console.log("Press Ctrl+C or Enter to exit.");
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