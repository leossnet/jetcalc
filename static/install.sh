echo Installing MongoDb
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.0 multiverse" |  tee /etc/apt/sources.list.d/mongodb-org-3.0.list
add-apt-repository ppa:nginx/stable -y
apt-get update
apt-get install -y mongodb-org
service mongod start
echo Installing Nginx
apt-get install -y nginx
service nginx status
echo Installing NodeJS
curl -sL https://deb.nodesource.com/setup | bash -
apt-get install -y nodejs
apt-get install -y build-essential
echo Installing Git
apt-get install -y git
mkdir /htdocs
cd /htdocs/
git clone https://ASSOI_USER:derparole12j@bitbucket.org/zubra12/ugmk.git
cd /htdocs/ugmk/
npm i --unsafe-perm
cp /htdocs/ugmk/install/ugmk /etc/nginx/sites-available/ugmk
ln -s /etc/nginx/sites-available/ugmk /etc/nginx/sites-enabled/ugmk
MYIP=$(ifconfig eth0 | egrep -o 'addr:([[:digit:]]{1,3}\.){3}[[:digit:]]{1,3}' | egrep -o '[[:digit:]].*') 
sed -i 's/\[SERVER_NAME\]/'$MYIP'/g' /etc/nginx/sites-available/ugmk
cp /htdocs/ugmk/install/ugmk.conf /etc/init/ugmk.conf
cd /htdocs/ugmk/
NODE_ENV=production node install.js
service nginx restart
start ugmk
echo ALL DONE!