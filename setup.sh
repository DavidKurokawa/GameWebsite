#!/bin/sh

sudo apt-get install curl
curl -sL https://deb.nodesource.com/setup | sudo bash -
sudo apt-get install nodejs
sudo apt-get install build-essential
npm install --save express@4.10.2
npm install --save socket.io
