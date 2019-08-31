/**
 * Роутер модуля JetCalc, обеспечивающий создание и публикацию экономических моделей
 * @version 0.0.1
 * @author Сергеев Сергей Юрьевич
 * @license MIT License 
 * @requires JetCalc
 */
var mongoose   = require('mongoose');
var router     = require('express').Router();
var _          = require('lodash');
var async      = require('async');
var moment      = require('moment');
var HP = require(__base+'lib/helpers/lib.js').Permits; 






module.exports = router;