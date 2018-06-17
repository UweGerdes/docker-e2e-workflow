# Docker for e2e-workflow

Regression testing for frontend developement

## Use Scenarios

You have a development web server running on your computer - perhaps in a virtual machine or another docker.

You want to make sure that only the layouts / elements change you expect to change.

You want to keep track of responsiveness.

This should be available with easy to use config files.

## Use Cases

You are styling a block on a web page. You have a style that should become better.

You want to see the changes compared to a previous version.

You want to check different screen widths.

You get a web ui to start the grabbing and show the results.

Differences between the old and new layout are highlighted, mouse moves should change the opacity.

Other page elements should not change, you are informed if they do.

Perhaps I can figure out how to configure a livereload to trigger an automatic start.

## Config File

The configuration file defines urls, viewport widths and page elements and how to compare them.

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

You might want to use some of these commands:

```bash
$ docker-compose exec e2e-workflow-vcards bash
```

Open the server address listed in the output. Read content.

## Changelog

0.2.3 run modules tests

0.2.2 collecting results

0.2.1 refactor gulp tasks

0.2.0 rebuild index.js with webdriver, chai

0.1.1 refactoring
