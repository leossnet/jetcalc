#!/bin/bash

mkdir /htdocs
cd /htdocs/

apt-get install -y git \
    python \
    libkrb5-dev \
    libcairo2-dev \
    libjpeg8-dev \
    libpango1.0-dev \
    libgif-dev \
    build-essential \
    g++

git clone https://github.com/leossnet/jetcalc.git
chmod -R 777 /htdocs
cd /htdocs/jetcalc
git config core.fileMode false

sudo apt-get install  -y software-properties-common python-software-properties

#mongo 3.6 for ubuntu 18.04 bionic
wget -qO - https://www.mongodb.org/static/pgp/server-3.6.asc | sudo apt-key add -
echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list

#rabbitmq
echo 'deb http://www.rabbitmq.com/debian/ testing main' | sudo tee /etc/apt/sources.list.d/rabbitmq.list
wget -O- https://www.rabbitmq.com/rabbitmq-release-signing-key.asc | apt-key add -

#postgresql 9.6
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt/ `lsb_release -cs`-pgdg main" >> /etc/apt/sources.list.d/pgdg.list'
wget -q https://www.postgresql.org/media/keys/ACCC4CF8.asc -O - | sudo apt-key add -


sudo apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D
sudo apt-add-repository 'deb https://apt.dockerproject.org/repo ubuntu-xenial main'

#apt-get
sudo apt-get update
#sudo apt-get dist-upgrade

sudo apt-cache policy docker-engine
sudo apt-get install -y docker-engine

#nginx install
sudo apt-get install -y nginx
sudo cp /htdocs/jetcalc/install/nginx.conf /etc/nginx/sites-available/jetcalc.conf
ln -s /etc/nginx/sites-available/jetcalc.conf /etc/nginx/sites-enabled/jetcalc.conf
rm -rf /etc/nginx/sites-enabled/default
sudo service nginx restart

#postgres install
sudo apt-get install -y postgresql-9.6
sudo su postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'postgres';\""
sudo su postgres -c "createdb -U postgres jetcalc;"
sudo su postgres -c "psql -U postgres jetcalc < /htdocs/jetcalc/sql/dump/postgres.sql;"
#sudo echo "host all all ::0/0 md5" >> /etc/postgresql/9.6/main/pg_hba.conf
#sudo echo "host all all 0.0.0.0/0 md5" >> /etc/postgresql/9.6/main/pg_hba.conf
#sudo echo "listen_addresses = '*'" >> /etc/postgresql/9.6/main/postgresql.conf
sudo service postgresql restart

#mongo install
sudo apt-get install -y mongodb-org
cp /htdocs/jetcalc/install/mongodb.service /etc/systemd/system/mongodb.service
sudo systemctl start mongodb
sudo systemctl status mongodb
sudo systemctl enable mongodb

#redis install
sudo apt-get -y install redis-server

#rabbitmq install
apt-get install -y rabbitmq-server
rabbitmq-plugins enable rabbitmq_management
rabbitmq-plugins enable rabbitmq_tracing

rabbitmqctl delete_user guest
rabbitmqctl add_user jet jetparole12j
rabbitmqctl set_permissions jet ".*" ".*" ".*"
rabbitmqctl set_user_tags jet administrator

#curl -sL https://deb.nodesource.com/setup_8.x | bash -s

#node install
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
echo Fixing source ...
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
source ~/.nvm/nvm.sh

nvm install node
nvm use node
cd /htdocs/jetcalc
echo Fixing source ...
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
source ~/.nvm/nvm.sh

#npm modules
npm i -g pm2 mocha grunt --unsafe-perm

cp /htdocs/jetcalc/install/config.origin /htdocs/jetcalc/config.js

npm i --unsafe-perm

node admin.js compile
node admin.js build 
node admin.js installgitbook 

cd /htdocs/jetcalc
cp /htdocs/jetcalc/install/start.json /htdocs/jetcalc/start.json
cp /htdocs/jetcalc/install/catalogue.json /htdocs/jetcalc/static/custom/catalogue.json
cp /htdocs/jetcalc/install/translate.json /htdocs/jetcalc/static/custom/translate.json

pm2 start start.json
pm2 startup
pm2 save

#тест posgresql
node admin.js postgress
