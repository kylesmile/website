"use strict";

const http = require('http');
const express = require('express');
const path = require('path');
const sassMiddleware = require('node-sass-middleware'); // TODO: Replace this. WAY too many dependencies
const bodyParser = require('body-parser');

const env = require('./config');

const webpack = require('webpack');

const cookieParser = require('cookie-parser');

const app = express();

app.use(cookieParser(env.sessionSecret));

const Session = require('./server/session');

app.use((request, response, next) => {
  if (request.signedCookies.sessionToken) {
    Session.findByToken(request.signedCookies.sessionToken).then(session => {
      if (session) {
        response.cookie('sessionToken', session.token(), { maxAge: env.sessionExpiration, signed: true });
        response.locals.currentSession = session;
        if (session.userId()) {
          return session.user().then(user => {
            response.locals.currentUser = user;
            next();
          });
        } else {
          next();
        }
      } else {
        return new Session({ relevantData: request.ip }).save().then(session => {
          response.cookie('sessionToken', session.token(), { maxAge: env.sessionExpiration, signed: true });
          response.locals.currentSession = session;
          next();
        });
      }
    }).catch(error => next(error));
  } else {
    new Session({ relevantData: request.ip }).save().then(session => {
      response.cookie('sessionToken', session.token(), { maxAge: env.sessionExpiration, signed: true });
      response.locals.currentSession = session;
      next();
    }).catch(error => next(error));
  }
});

app.set('views', path.join(__dirname, 'client', 'views'));
app.set('view engine', 'jade');

app.use('/assets/styles', sassMiddleware({
  src: path.join(__dirname, 'client', 'styles'),
  dest: path.join(__dirname, 'tmp', 'public', 'styles'),
  response: true,
  debug: env.debug,
  outputStyle: 'compressed',
  prefix: '/assets/styles',
  error: (error) => {
    console.log(error);
  }
}));
app.use('/assets/images', express.static(path.join(__dirname, 'client', 'images')));

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (request, response) => response.render('home'));

const User = require('./server/user');
let userId;

app.get('/sign_in', (request, response) => response.render('sign_in'));
app.post('/sessions', (request, response, next) => {
  User.findOne({ email: request.body.email }).then(user => {
    if (user) {
      userId = user.id();
      return user.checkPassword(request.body.password);
    } else {
      response.render('sign_in');
    }
  }).then(isCorrectPassword => {
    if (isCorrectPassword) {
      return new Session({ userId: userId, relevantData: request.ip }).save();
    } else if (!response.headersSent) {
      response.render('sign_in');
    }
  }).then(session => {
    if (session) {
      response.locals.currentSession.delete().then(() => {
        response.cookie('sessionToken', session.token(), { maxAge: env.sessionExpiration, signed: true });
        response.redirect('/');
      }).catch(error => next(error));
    }
  }).catch(error => next(error));
});

app.get('/about', (request, response) => response.render('about'));

const BlogPost = require('./server/blog_post');
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;

app.get('/blog', (request, response, next) => {
  BlogPost.find()
    .then(posts => response.render('blog', { posts: posts }))
    .catch(error => next(error));
});

app.get('/posts/new', (request, response) => {
  response.render('posts/new');
});

app.get('/posts/:id/edit', (request, response, next) => {
  BlogPost.findOne({ _id: new ObjectId(request.params.id) })
    .then(post => response.render('posts/edit', { post: post }))
    .catch(error => next(error));
});

app.get('/posts/:id', (request, response, next) => {
  BlogPost.findOne({ _id: new ObjectId(request.params.id) })
    .then(post => response.render('posts/show', { post: post }))
    .catch(error => next(error));
});

app.post('/posts/:id', (request, response, next) => {
  BlogPost.findOne({ _id: new ObjectId(request.params.id) }).then(post => {
      post.setTitle(request.body.title);
      post.setBody(request.body.body);
      return post.save();
    }).then(post => response.redirect(`/posts/${post.id()}`))
      .catch(error => next(error));
});

app.delete('/posts/:id', (request, response, next) => {
  BlogPost.findOne({ _id: new ObjectId(request.params.id) })
    .then(post => post.delete())
    .then(() => response.send('{ "redirect": "/blog" }'))
    .catch((error) => next(error));
});

app.post('/posts', (request, response, next) => {
  let title = request.body.title;
  let body = request.body.body;

  let post = new BlogPost({ title: title, body: body });
  post.save().then(post => {
    response.redirect(`/posts/${post.id()}`);
  }).catch(error => next(error));
});

webpack({
  entry: path.join(__dirname, 'client', 'javascripts', 'application.js'),
  output: {
    filename: 'application.js',
    path: path.join(__dirname, 'tmp', 'public', 'javascripts')
  },
  debug: env.debug,
  devtool: 'inline-source-map',
  module: {
    loaders: [
      {
        loader: 'babel',
        query: {
          presets: ['es2015']
        }
      }
    ]
  }
}, function(error, stats) {
  if (error) return console.log(error);

  let jsonStats = stats.toJson();
  if (jsonStats.errors.length > 0) return console.log(jsonStats.errors);
  if (jsonStats.warnings.length > 0) console.log(jsonStats.warnings);
});
app.use('/assets/javascripts', express.static(path.join(__dirname, 'tmp', 'public', 'javascripts')));

app.use((request, response, next) => {
  let error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Show full error message in development
if (env.debug === true) {
  app.use((err, request, response, next) => {
    console.log(err.message);
    console.log(err.stack);
    let status = err.status || 500;
    response.status(status);
    response.render('error', {
      message: err.message,
      error: err,
      status
    });
  });
}

// Only show error messages in production
app.use((err, request, response, next) => {
  console.log(err.message);
  console.log(err.stack);
  let status = err.status || 500;
  response.status(status);
  response.render('error', {
    message: err.message,
    error: {},
    status
  });
});

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  let bind = 'Port ' + env.port;

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

app.listen(env.port, () => {
  console.log(`Listening on ${env.port}`);
});
