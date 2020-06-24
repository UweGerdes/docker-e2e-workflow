# Docker for e2e-workflow

Regression testing for frontend developement.

At the moment the configuration.yaml and docker-compose.yaml are wired for use with my docker-expressjs-boilerplate projects (tests in modules/**/tests/e2e-workflow/*.js). Copy docker-compose.yaml to other project, make some changes and use.

## Config File

The configuration file defines urls, viewport widths and page elements. A simple example is `config/default.js`.

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
$ docker-compose exec e2e-workflow bash
```
