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

app.get('/', (req, res) => res.render('home'));
app.get('/about', (req, res) => res.render('about'));

const BlogPost = require('./server/BlogPost');
const MongoClient = require('mongodb').MongoClient;
app.get('/blog', (req, res) => {
  MongoClient.connect('mongodb://localhost:27017/my_website').then((db) => {
    let posts = db.collection('blogPosts').find().map((p) => new BlogPost(p)).toArray().then((posts) => {
      res.render('blog', { posts: posts });
    });
  }).catch((error) => {
    console.log(error);
  });
});

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
