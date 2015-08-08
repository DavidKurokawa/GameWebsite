#!/bin/bash

sudo apt-get install curl
curl -sL https://deb.nodesource.com/setup | sudo bash -
sudo apt-get install nodejs
sudo apt-get install build-essential
npm install --save express@4.10.2
npm install --save socket.io

read -p "UNCOMMENT THE LINE: net.ipv4.ip_forward=1"
sudo vim /etc/sysctl.conf
sudo sysctl -p /etc/sysctl.conf
sudo iptables -A PREROUTING -t nat -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 8080
sudo iptables -A INPUT -p tcp -m tcp --sport 80 -j ACCEPT
sudo iptables -A OUTPUT -p tcp -m tcp --dport 80 -j ACCEPT

node index.js

