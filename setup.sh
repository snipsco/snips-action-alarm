#!/bin/sh

npm install && npm run build

if [ ! -e "./config.ini" ]
then
    cp config.ini.default config.ini
fi

if [ ! -e ".db_alarms" ]
then
    echo "Created db folder"
    mkdir .db_alarms
else
    echo "Found db folder"
fi
