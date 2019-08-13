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
var Config  = require("./config.js");

var anyDB = require('any-db'); // https://www.npmjs.com/package/any-db
var pg = Config.dbconfig.pgsql;
var ConnectURL = [
    pg.adapter,"://",pg.userName,":",pg.password,"@",pg.server,":",pg.options.port,"/",pg.options.database
].join("");

var mongoose = require('mongoose'); // https://www.npmjs.com/package/mongoose


/**
 * Метки пунктов меню
 */
var Headers = {
    header          : "Выбор действия\n",
    heder_line      : "-------------------------\n",
};
var Labels = {
    setadminmongo   : "Замена кодов пользователей в mongo",
    setadminsql     : "Замена кодов пользователей в sql",
    setonlyadmin    : "Удаление пользователей кроме admin",
    clearsearch     : "Удаление кеша поиска",
    clearfiles      : "Удаление лишних файлов",
    exit            : "Выход",
};

var bye = "\n------------------------------\nPress Ctrl+C or Enter to exit.\n";
var dstr = "\n==============================";

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
            case Labels.setadminmongo:
                Tasks.setadminmongo();
                break;
            case Labels.setadminsql:
                Tasks.setadminsql();
                break;
            case Labels.setonlyadmin:
                Tasks.setonlyadmin();
                break;
                case Labels.clearsearch:
                    Tasks.clearsearch();
                    break;
                case Labels.clearfiles:
                Tasks.clearfiles();
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
 * Функции админки, вызываемые через меню
 */ 
var Tasks = {
    makedemo: function(){
        console.log(Labels.makedemo);
    },
    setadminsql: function(){
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
    setadminmongo: function(){
        onConnectMongo(function(){
            var modelKeysArray = getModelKeysArray(mongoose.models, "UserEdit");
            updateModel(mongoose.models, modelKeysArray);            
        });
    },
    setonlyadmin: function(){
        onConnectMongo(function(){
            var modelKeysArray = getModelKeysArray(mongoose.models, "CodeUser");
            clearUsers(mongoose.models, modelKeysArray);
        });
    },
    clearsearch: function(){
        onConnectMongo(function(){
            var modelKeysArray = getModelKeysArray(mongoose.models, "search");
            clearSearch(mongoose.models, modelKeysArray);
        });
    },
    clearfiles: function(){
        onConnectMongo(function(){
            // заглушка
            mongoose.disconnect(function(){
                console.log(bye);
            });
        });
    },
};

/**
 * =====================================================================
 * Запуск скрипта makedemo.js
 * =====================================================================
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
 * =====================================================================
 * Вспомогательные функции
 * =====================================================================
 */

/**
 * Стандартная обертка для специализированных функций работы с mongoose
 * @param {Function} callback 
 */
 function onConnectMongo(callback) {
    console.log(Labels.clearfiles);
    mongoose.connect(Config.mongoUrl, { useMongoClient: true });
    mongoose.connection.on('connected', function () {
        console.log("mongodb sconnected...");
        var ModelInit = require('./classes/InitModels.js');
        ModelInit(callback);
    });
}

/**
 * Возвращает список кодов моделей mongoose, содержащих атрибут field
 * @param {Object} models 
 * @param {String} field 
 * @returns {Array<String>}
 */
function getModelKeysArray(models, field) {
    return Object.keys(models).filter(function (key) {
        return models[key].schema.tree.hasOwnProperty(field);
    });
}

/**
 * Последовательное выполнение sql-запросов из массива queryes 
 * с завершающим закрытием пула соединений с базой данных
 * @param {Object} pool 
 * @param {Array<String>} queryes 
 */
function runQueryes(pool, queryes){
    var sql = queryes.shift();
    pool.query(sql, function(err, res){
        if (err){
            console.log("Error: "+err.message+"\npool close."+bye);
            pool.close();
        }
        else {
            console.log(sql);
            if (res.command == "UPDATE") console.log("Обновлено "+res.rowCount+" строк.");
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

/**
 * Замена значений атрибута UserEdit на 'admin' в докуметах текущей модели
 * @param {Object} model 
 * @param {Array<String>} modelKeysArray 
 */
function updateModel(models, modelKeysArray) {
    mongoQuery(
        models, 
        modelKeysArray, 
        "updateMany", 
        { UserEdit: { $not: /admin/ } }, 
        { UserEdit: "admin" } 
    );
}

/**
 * Удаление всех пользователей, кроме admin, и связанных с ними данных
 * @param {Object} model 
 * @param {Array<String>} modelKeysArray 
 */
function clearUsers(models, modelKeysArray) {
    var modelKey = modelKeysArray.shift();
    models[modelKey].remove( { CodeUser: { $not: /admin/ } }, function(err, res) {
        if (err) {
            console.log("Error: "+err.message+"\npool close."+bye);
            mongoose.disconnect(function(){
                console.log(bye);
            });
        }
        else {
            console.log(modelKey+":");
            console.log(res.result);
            if ( modelKeysArray.length == 0) {
                mongoose.disconnect(function(){
                    console.log(bye);
                });
                }
            else {
                clearUsers(models, modelKeysArray);
            }
        }
    });
}

/**
 * Очистка кеша поиска во всех коллекциях
 * @param {Object} models 
 * @param {Array<String>} modelKeysArray 
 */
function clearSearch(models, modelKeysArray) {
    mongoQuery(
        models, 
        modelKeysArray, 
        "updateMany", 
        {}, 
        { search: "" }
    );
}

/**
 * Настраиваемый запрос к MongoDB, выполняемый синхронно
 * @param {Object} models 
 * @param {Array<String>} modelKeysArray 
 * @param {String} functionName 
 * @param {Object} filterParam 
 * @param {Object} updateParam 
 */
function mongoQuery(models, modelKeysArray, functionName, filterParam, updateParam) {
    var modelKey = modelKeysArray.shift();
        models[modelKey][functionName]( filterParam, updateParam, function(err, res) {
        if (err) {
            console.log("Error: "+err.message+"\npool close."+bye);
            mongoose.disconnect(function(){
                console.log(bye);
            });
        }
        else {
            console.log(modelKey+":");
            console.log( functionName == "remove" ? res.result : res );
            if ( modelKeysArray.length == 0) {
                mongoose.disconnect(function(){
                    console.log(bye);
                });
                }
            else {
                mongoQuery(models, modelKeysArray, functionName, filterParam, updateParam);
            }
        }
    });
}