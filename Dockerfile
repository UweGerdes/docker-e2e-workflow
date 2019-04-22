# Dockerfile for e2e-workflow

FROM uwegerdes/nodejs

MAINTAINER Uwe Gerdes <entwicklung@uwegerdes.de>

USER root

COPY package.json ${NODE_HOME}/

WORKDIR ${NODE_HOME}

RUN apt-get update && \
	apt-get dist-upgrade -y && \
	apt-get clean && \
	rm -rf /var/lib/apt/lists/* && \
	npm install -g \
				gulp@3.9.1 \
				nodemon && \
	npm install && \
	chown -R ${USER_NAME}:${USER_NAME} ${NODE_HOME}

COPY . ${APP_HOME}

RUN chown -R ${USER_NAME}:${USER_NAME} ${APP_HOME}

WORKDIR ${APP_HOME}

USER ${USER_NAME}

VOLUME [ "${APP_HOME}" ]

CMD [ "npm", "start" ]

