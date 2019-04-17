#!/bin/bash

arh=$1
echo "Выбран файл $arh"

tmp=dumpjetcalc
cd $HOME
if [ -d $tmp ]
then
    rm -R $tmp
fi

unzip $HOME/backup/$arh 
cd $HOME/$tmp

mongorestore --drop
export PGPASSWORD="postgres"
pg_restore -h localhost -p 5432 -U postgres -d jetcalc -v --clean sql.backup

cd $HOME
rm -R $tmp
