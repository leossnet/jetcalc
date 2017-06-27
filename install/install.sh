#!/bin/bash

echo Имя пользователя github:
read GitUser
echo Пароль github:
read Password

echo $GitUser with $Password

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

git clone https://$GitUser:$Password@github.com/leossnet/jetcalc.git
chmod -R 777 /htdocs
cd /htdocs/jetcalc
git config core.fileMode false


#mongo
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-3.2.list

#rabbitmq
echo 'deb http://www.rabbitmq.com/debian/ testing main' | tee /etc/apt/sources.list.d/rabbitmq.list
wget -O- https://www.rabbitmq.com/rabbitmq-release-signing-key.asc | apt-key add -

#postgresql
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt/ `lsb_release -cs`-pgdg main" >> /etc/apt/sources.list.d/pgdg.list'
wget -q https://www.postgresql.org/media/keys/ACCC4CF8.asc -O - | sudo apt-key add -

#apt-get
sudo apt-get update
#sudo apt-get dist-upgrade

#nginx install
sudo apt-get install -y nginx
sudo cp /htdocs/jetcalc/install/nginx.conf /etc/nginx/sites-available/jetcalc.conf
ln -s /etc/nginx/sites-available/jetcalc.conf /etc/nginx/sites-enabled/jetcalc.conf
sudo service nginx restart

#postgres install
sudo apt-get install -y postgresql-9.5
sudo su postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'postgres';\""
sudo su postgres -c "createdb -U postgres jetcalc;"
sudo su postgres -c "psql -U postgres jetcalc < /htdocs/jetcalc/sql/dump/postgres.sql;"
sudo echo "host all all ::0/0 md5" >> /etc/postgresql/9.5/main/pg_hba.conf
sudo echo "host all all 0.0.0.0/0 md5" >> /etc/postgresql/9.5/main/pg_hba.conf
sudo echo "listen_addresses = '*'" >> /etc/postgresql/9.5/main/postgresql.conf
sudo service postgresql restart

#mongo install
sudo apt-get install -y mongodb-org

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

curl -sL https://deb.nodesource.com/setup_8.x | bash -s

#node install
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
nvm install node
nvm use node
cd /htdocs/jetcalc

#npm modules
npm i -g pm2 gitbook-cli mocha grunt --unsafe-perms

cp /htdocs/jetcalc/install/config.origin jetcalc/config.js

sudo npm i --unsafe-perms

node admin.js compile
node admin.js build
node admin.js postgress
grunt
