#!/bin/bash

if [ "$EUID" -ne 0 ]; then
	echo "Must be run as root"
	exit 1
fi
if mongod --dbpath /var/lib/mongo --logpath /var/log/mongodb/mongod.log --bind_ip 127.0.0.1 --fork > /dev/null; then
	echo "Launch properly"
	exit
else
	echo "Unknown ERROR"
	exit
fi
