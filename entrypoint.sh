#!/bin/bash

if [ ! -w "${APP_HOME}/" ]; then
	echo "ERROR: ${APP_HOME}/ cannot write"
	exit 1
fi

cd "${APP_HOME}"
exec "$@"
