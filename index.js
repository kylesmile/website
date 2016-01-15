"use strict";

const http = require('http');
const express = require('express');
const path = require('path');
const sassMiddleware = require('node-sass-middleware'); // TODO: Replace this. WAY too many dependencies

const config = require('./config');

const app = express();

app.set('views', path.join(__dirname, 'client', 'views'));
app.set('view engine', 'jade');

app.use('/assets/styles', sassMiddleware({
  src: path.join(__dirname, 'client', 'styles'),
  dest: path.join(__dirname, 'tmp', 'public', 'styles'),
  response: true,
  debug: config.debug,
  outputStyle: 'compressed',
  prefix: '/assets/styles',
  error: (error) => {
    console.log(error);
  }
}));
app.use('/assets/images', express.static(path.join(__dirname, 'client', 'images')));

let pages = { home: '/', blog: '/blog', about: '/about' }
for (let page in pages) {
  let path = pages[page];
  app.get(path, (req, res) => {
    res.render(page);
  });
}

app.use((req, res, next) => {
  let error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Show full error message in development
if (config.debug === true) {
  app.use((err, req, res, next) => {
    let status = err.status || 500;
    res.status(status);
    res.render('error', {
      message: err.message,
      error: err,
      status
    });
  });
}

// Only show error messages in production
app.use((err, req, res, next) => {
  let status = err.status || 500;
  res.status(status);
  res.render('error', {
    message: err.message,
    error: {},
    status
  });
});

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  let bind = 'Port ' + config.port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

app.listen(config.port, () => {
  console.log(`Listening on ${config.port}`);
});
