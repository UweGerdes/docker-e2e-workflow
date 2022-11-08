# Dockerfile for e2e-workflow

FROM uwegerdes/expressjs-boilerplate

MAINTAINER Uwe Gerdes <entwicklung@uwegerdes.de>

ARG SERVER_PORT='8080'
ARG HTTPS_PORT='8443'
ARG LIVERELOAD_PORT='8081'

ENV SERVER_PORT ${SERVER_PORT}
ENV HTTPS_PORT ${HTTPS_PORT}
ENV LIVERELOAD_PORT ${LIVERELOAD_PORT}

USER root

RUN apt-get update && \
	apt-get dist-upgrade -y && \
	apt-get clean && \
	rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY --chown=${USER_NAME}:${USER_NAME} package.json ${NODE_HOME}/

WORKDIR ${NODE_HOME}

RUN npm install --cache /tmp/node-cache && \
	rm -r /tmp/*

RUN perl -i.bak -0pe 's/(.+prefer-regex-literals.+?:).+?\n.+?\n.+?\n/$1 1,\n/gms' \
		/home/node/node_modules/eslint-config-airbnb-base/rules/best-practices.js

WORKDIR ${APP_HOME}

COPY --chown=${USER_NAME}:${USER_NAME} package.json ${APP_HOME}/
COPY --chown=${USER_NAME}:${USER_NAME} key ${APP_HOME}/key
COPY --chown=${USER_NAME}:${USER_NAME} modules/e2e ${APP_HOME}/modules/e2e

USER ${USER_NAME}

EXPOSE ${SERVER_PORT} ${HTTPS_PORT} ${LIVERELOAD_PORT}

CMD [ "npm", "start" ]
