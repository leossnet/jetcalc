#!/bin/bash

cd /htdocs/jetcalc
git pull
grunt
node admin.js compile
npm i
node admin.js syncsqlstructure
wget http://dev.jetcalc.com/custom/translate.json -O /htdocs/jetcalc/static/custom/translate.json
wget http://dev.jetcalc.com/custom/catalogue.json -O /htdocs/jetcalc/static/custom/catalogue.json
pm2 restart start.json