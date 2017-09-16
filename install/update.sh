#!/bin/bash

cd /htdocs/jetcalc
git pull
grunt
node admin.js compile
npm i
pm2 restart start.json
