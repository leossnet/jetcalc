var config = require(__base+'config.js');
var redis = require("redis");
var client = redis.createClient(config.redis);

module.exports =  client;
