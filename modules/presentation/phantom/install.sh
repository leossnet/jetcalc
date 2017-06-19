sudo apt-get remove phantomjs
sudo unlink /usr/local/bin/phantomjs
sudo unlink /usr/local/share/phantomjs
sudo unlink /usr/bin/phantomjs

cd /usr/local/share

sudo wget https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2
sudo tar xjf phantomjs-2.1.1-linux-x86_64.tar.bz2

sudo ln -s /usr/local/share/phantomjs-2.1.1-linux-x86_64/bin/phantomjs /usr/local/share/phantomjs
sudo ln -s /usr/local/share/phantomjs-2.1.1-linux-x86_64/bin/phantomjs /usr/local/bin/phantomjs
sudo ln -s /usr/local/share/phantomjs-2.1.1-linux-x86_64/bin/phantomjs /usr/bin/phantomjs

sudo cp phantom.conf /etc/init/

exit 0
