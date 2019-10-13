# Dockerfile for expressjs projects

ARG NODEIMAGE_VERSION=latest
FROM uwegerdes/nodejs:${NODEIMAGE_VERSION}

MAINTAINER Uwe Gerdes <entwicklung@uwegerdes.de>

ARG SERVER_PORT='8080'
ARG HTTPS_PORT='8443'
ARG LIVERELOAD_PORT='8081'

ENV SERVER_PORT ${SERVER_PORT}
ENV HTTPS_PORT ${HTTPS_PORT}
ENV LIVERELOAD_PORT ${LIVERELOAD_PORT}

USER root

COPY package.json ${NODE_HOME}/
COPY . ${APP_HOME}

RUN apt-get update && \
	apt-get dist-upgrade -y && \
	apt-get clean && \
	rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
	chown -R ${USER_NAME}:${USER_NAME} ${NODE_HOME} && \
	npm -g config set user ${USER_NAME} && \
	if [ "${NODE_ENV}" = "development" ] ; then \
		npm install -g --cache /tmp/root-cache \
					c8 \
					gulp-cli \
					mocha \
					nodemon \
					npm ; \
	fi && \
	rm -r /tmp/*

COPY entrypoint.sh /usr/local/bin/
RUN chmod 755 /usr/local/bin/entrypoint.sh
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

USER ${USER_NAME}

WORKDIR ${NODE_HOME}

RUN npm install --cache /tmp/node-cache && \
	rm -r /tmp/*

WORKDIR ${APP_HOME}

EXPOSE ${SERVER_PORT} ${HTTPS_PORT} ${LIVERELOAD_PORT}

CMD [ "npm", "start" ]
