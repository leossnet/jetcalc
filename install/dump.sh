#!/bin/bash

rm ~/jetcalc/dump.zip

now="$(date +'%d%m%Y')"
dirname="~/jetcalc/$now"

mkdir $dirname
cd $dirname
mongodump -d jetcalc
pg_dump -h localhost -p 5432 -U postgres -F c -b -v -f $dirname/sql.backup jetcalc

zip -r ~/jetcalc/dump.zip $dirname
