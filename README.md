# Docker for e2e-workflow

Workflow testing for frontend developement.

Copy docker-compose.yaml to other project, make some changes and use. See `docker-expressjs-boilerplate` for sample compose and test file.

## Config File

The configuration file defines urls, viewport widths and page elements. A simple example is in `modules/e2e/tests/e2e-workflow/default.js`.

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
