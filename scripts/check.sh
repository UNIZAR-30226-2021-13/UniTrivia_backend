#!/bin/bash

############################
# USAGE
############################
usage(){
	echo "Usage: $0 [-h <host>] [-p <port>]"
	exit 1
}

PORT="27017"
HOST="localhost"
if [ "$#" -ne 0 ] && [ "$#" -ne 2 ] && [ "$#" -ne 4 ]; then
	usage
elif [ "$#" -eq 2 ] && [ "$1" != "-h" ] && [ "$1" != "-p" ]; then
	usage
elif [ "$#" -eq 4 ] && [ "$1" != "-h" ] && [ "$1" != "-p" ] && [ "$2" != "-h" ] && [ "$2" != "-p" ]; then
	usage
fi

if [ "$1" == "-h" ]; then
	HOST="$2"
elif [ "$2" == "-h" ]; then
	HOST="$4"
fi
if [ "$1" == "-p" ]; then
	PORT="$2"
elif [ "$2" == "-p" ]; then
	PORT="$4"
fi


if [ "$EUID" -ne 0 ]; then
	echo "Please run as root"
	exit
fi

if ! pgrep mongod > /dev/null; then
	echo "Mongod must be running"
	exit
fi

mongo --host "$HOST" --port "$PORT" "test.js"
