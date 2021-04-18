#!/bin/bash

LOCATION="$HOME/mongo_ssl"

if [ "$EUID" -ne 0 ]; then
	echo "Must be run as root"
	exit 1
fi
echo "================================="
echo "  Creando entidad certificadora  "
echo "================================="
[[ -d "${LOCATION}" ]] && rm -rf "${LOCATION}/rootCA.* ${LOCATION}/mongodb.*"
[[ -d "${LOCATION}" ]] || mkdir "${LOCATION}"
echo -n "    Generando clave privada de CA "
openssl genrsa -out "${LOCATION}/rootCA.key" 2048 > /dev/null 2>&1
if [ "$?" -eq 0 ]; then
  echo "✅"
else
  echo "❌"
  exit 48;
fi
echo -n "    Generando certificado de CA "
openssl req -x509 -new -nodes -key "${LOCATION}/rootCA.key" \
        -sha256 -days 1024 -out "${LOCATION}/rootCA.pem" \
        -subj "/C=ES/ST=Zaragoza/L=Zaragoza/O=UniGames/CN=10.0.0.1" > /dev/null 2>&1
if [ "$?" -eq 0 ]; then
  echo "✅"
else
  echo "❌"
  exit 48;
fi

echo "================================="
echo "   Creando certificado servidor  "
echo "================================="
echo -n "    Generando clave privada del servidor "
openssl genrsa -out "${LOCATION}/mongodb.key" 2048 > /dev/null 2>&1
if [ "$?" -eq 0 ]; then
  echo "✅"
else
  echo "❌"
  exit 48;
fi
echo -n "    Generando certificado a firmar "
openssl req -new -key "${LOCATION}/mongodb.key" \
            -out "${LOCATION}/mongodb.csr"\
        -subj "/C=ES/ST=Zaragoza/L=Zaragoza/O=UniGames/CN=10.0.0.1" > /dev/null 2>&1
if [ "$?" -eq 0 ]; then
  echo "✅"
else
  echo "❌"
  exit 48;
fi
echo -n "    Firmando certificado "
openssl x509 -req -in "${LOCATION}/mongodb.csr" \
        -CA "${LOCATION}/rootCA.pem" \
        -CAkey "${LOCATION}/rootCA.key" -CAcreateserial \
        -out "${LOCATION}/mongodb.crt" -days 1024 -sha256 > /dev/null 2>&1
if [ "$?" -eq 0 ]; then
  echo "✅"
else
  echo "❌"
  exit 48;
fi
echo -n "    Creando el fichero pem "
cat "${LOCATION}/mongodb.key" "${LOCATION}/mongodb.crt" > "${LOCATION}/mongodb.pem"
if [ "$?" -eq 0 ]; then
  echo "✅"
else
  echo "❌"
  exit 48;
fi

echo "================================="
echo " Creando certificado del cliente "
echo "================================="

[[ -d "../keys" ]] || mkdir "../keys"

DIR="../keys"

echo -n "    Generando clave privada del servidor "
openssl genrsa -out "${DIR}/mongo_key.key" 2048 > /dev/null 2>&1
if [ "$?" -eq 0 ]; then
  echo "✅"
else
  echo "❌"
  exit 48;
fi
echo -n "    Generando certificado a firmar "
openssl req -new -key "${DIR}/mongo_key.key" \
                  -out "${DIR}/mongo_key.csr" \
        -subj "/C=ES/ST=Zaragoza/L=Zaragoza/O=UniGames/CN=10.0.0.1" > /dev/null 2>&1
if [ "$?" -eq 0 ]; then
  echo "✅"
else
  echo "❌"
  exit 48;
fi
echo -n "    Firmando certificado "
openssl x509 -req -in "${DIR}/mongo_key.csr" \
        -CA "${LOCATION}/rootCA.pem" \
        -CAkey "${LOCATION}/rootCA.key" -CAcreateserial \
        -out "${DIR}/mongo_key.crt" -days 1024 -sha256 > /dev/null 2>&1
if [ "$?" -eq 0 ]; then
  echo "✅"
else
  echo "❌"
  exit 48;
fi
echo -n "    Creando el fichero pem "
cat "${DIR}/mongo_key.key" "${DIR}/mongo_key.crt" > "${DIR}/mongo_key.pem"
if [ "$?" -eq 0 ]; then
  echo "✅"
else
  echo "❌"
  exit 48;
fi

echo "================================="
echo -n "Los ficheros de la CA y del servidor están en ${LOCATION}"
echo "y los del cliente en ../keys"