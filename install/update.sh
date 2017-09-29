#!/bin/bash

cd /htdocs/jetcalc
git pull
grunt
node admin.js compile
npm i
node admin.js syncsqlstructure
pm2 restart start.json
