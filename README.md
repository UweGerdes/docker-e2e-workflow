# Docker for e2e-workflow

Regression testing for frontend developement.

At the moment the configuration.yaml and docker-compose.yaml are wired for use with my docker-vcards project.

## Config File

The configuration file defines urls, viewport widths and page elements.

## Docker Build

Build the docker image with:

```bash
$ docker build -t uwegerdes/e2e-workflow .
```

## Usage

For the development time a gulpfile.js is included to generate css from less and restart the server.

```bash
$ docker-compose up
```

Open the server address listed in the output. Read content.

You might want to use some of these commands:

```bash
$ docker-compose exec e2e-workflow-vcards bash
```

## Changelog

0.3.1 run test from browser

0.3.0 use async/await for test execution in index.js

0.2.3 run modules tests

0.2.2 collecting results

0.2.1 refactor gulp tasks

0.2.0 rebuild index.js with webdriver, chai

0.1.1 refactoring
