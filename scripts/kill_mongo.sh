#!/bin/bash

if [ "$EUID" -ne 0 ]; then
	echo "Must be run as root"
	exit 1
fi
if kill -9 "$(pgrep mongod)" > /dev/null; then
	echo "Mongod finished properly"
	exit
else
	echo "ERROR"
	exit
fi
