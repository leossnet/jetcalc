#!/bin/bash

now="$(date +'%Y-%m-%d-%H-%M')"

cd $HOME
if [ ! -d jetcalc ] 
then
    mkdir jetcalc
fi

dirname="$HOME/jetcalc/$now"
cd jetcalc
mkdir $now
cd $now

mongodump -d jetcalc
export PGPASSWORD="postgres"
pg_dump -h localhost -p 5432 -U postgres -F c -b -v -f $dirname/sql.backup jetcalc

zip -r "$dirname/dump_$now.zip" $dirname
