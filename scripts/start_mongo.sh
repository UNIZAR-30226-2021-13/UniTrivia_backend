#!/bin/bash

LOCATION="$HOME/mongo_ssl"

if [ "$EUID" -ne 0 ]; then
	echo "Must be run as root"
	exit 1
fi
mongod  --dbpath /var/lib/mongo \
	--logpath /var/log/mongodb/mongod.log \
	--bind_ip 127.0.0.1 \
	--tlsMode "allowTLS" \
	--tlsCertificateKeyFile "$LOCATION/mongodb.pem" \
	--tlsCAFile "$LOCATION/rootCA.pem" \
	--fork > /dev/null;
if [ "$?" -eq 0 ]; then
	echo "Launched properly"
	exit 0
else
	echo "Unknown ERROR"
	exit 1
fi
