"use strict";

const env = require('./config');

const Logger = require('./server/logger');
const logger = new Logger();
logger.log("Starting server");

const http = require('http');
const express = require('express');
const path = require('path');
const sassMiddleware = require('node-sass-middleware'); // TODO: Replace this. WAY too many dependencies
const bodyParser = require('body-parser');

const ObjectId = require('mongodb').ObjectId;
const webpack = require('webpack');
const cookieParser = require('cookie-parser');

const BlogPost = require('./server/blog_post');
const User = require('./server/user');
const Session = require('./server/session');

require('./server/scheduled_tasks');

User.collection().then(collection => {
  return collection.count();
}).then(count => {
  if (count === 0) {
    logger.log("No users exist")
    if (env.defaultUserEmail && env.defaultUserPassword) {
      logger.log('Creating user based on specified environment variables');
      let user = new User({ email: env.defaultUserEmail, password: env.defaultUserPassword });
      user.save().catch(error => {
        logger.log('Unable to create default user');
        logger.error(error);
      });
    } else {
      logger.log('Define DEFAULT_USER_EMAIL and DEFAULT_USER_PASSWORD to automatically create one');
    }
  }
}).catch(error => {
  logger.log('Could not count users');
  logger.error(error);
});

const app = express();

app.use((request, response, next) => {
  response.locals.ip = request.get('X-Forwarded-For') || request.ip;
  next();
});

app.use(cookieParser(env.sessionSecret));

app.use((request, response, next) => {
  request.logger = logger.tagged(response.locals.ip);
  next();
});

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
        return new Session({ relevantData: response.locals.ip }).save().then(session => {
          response.cookie('sessionToken', session.token(), { maxAge: env.sessionExpiration, signed: true });
          response.locals.currentSession = session;
          next();
        });
      }
    }).catch(next);
  } else {
    new Session({ relevantData: response.locals.ip }).save().then(session => {
      response.cookie('sessionToken', session.token(), { maxAge: env.sessionExpiration, signed: true });
      response.locals.currentSession = session;
      next();
    }).catch(next);
  }
});

app.use((request, response, next) => {
  request.logger.addTag(`Session: ${response.locals.currentSession.id()}`);
  if (response.locals.currentUser) {
    request.logger.addTag(`User: ${response.locals.currentUser.email()}`);
  }
  request.logger.log(`${request.method} ${request.url}`);
  next();
});

app.set('views', path.join(__dirname, 'client', 'views'));
app.set('view engine', 'pug');

app.use('/assets/styles', sassMiddleware({
  src: path.join(__dirname, 'client', 'styles'),
  dest: path.join(__dirname, 'tmp', 'public', 'styles'),
  response: true,
  debug: env.debug,
  outputStyle: 'compressed',
  prefix: '/assets/styles',
  error: (error) => {
    logger.log(error);
  }
}));
app.use('/assets/images', express.static(path.join(__dirname, 'client', 'images')));

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (request, response, next) => {
  BlogPost.latestPosts().then(posts => {
    response.render('home', { latestPosts: posts });
  }).catch(next);
});

app.get('/sign_in', (request, response) => response.render('sign_in'));
app.post('/sessions', (request, response, next) => {
  request.logger.log(`Attempting to sign in as ${request.body.email}`);
  let userId;
  User.findOne({ email: request.body.email }).then(user => {
    if (user) {
      userId = user.id();
      return user.checkPassword(request.body.password);
    } else {
      response.render('sign_in');
    }
  }).then(isCorrectPassword => {
    if (isCorrectPassword) {
      request.logger.log(`Successfully signed in as ${request.body.email}`);
      return new Session({ userId: userId, relevantData: response.locals.ip }).save();
    } else if (!response.headersSent) {
      request.logger.log(`Failed sign in as ${request.body.email}`);
      response.render('sign_in');
    }
  }).then(session => {
    if (session) {
      response.locals.currentSession.delete().then(() => {
        response.cookie('sessionToken', session.token(), { maxAge: env.sessionExpiration, signed: true });
        response.redirect('/');
      }).catch(next);
    }
  }).catch(next);
});

app.post('/sign_out', (request, response, next) => {
  response.locals.currentSession.delete().then(() => {
    request.logger.log('Successfully logged out');
    response.send('{ "redirect": "/" }');
  }).catch(next);
});

app.get('/account', (request, response) => {
  response.render('users/edit');
});

app.post('/account', (request, response, next) => {
  if (response.locals.currentUser) {
    request.logger.log('Updating user');
    let password = request.body.password;
    let passwordConfirmation = request.body.password_confirmation;
    let email = request.body.email;

    response.locals.currentUser.setEmail(email);

    if (password && passwordConfirmation && password === passwordConfirmation) {
      request.logger.log('Updated user password');
      response.locals.currentUser.setPassword(password);
    }

    response.locals.currentUser.save().then(() => {
      response.redirect('/account');
    }).catch(next);
  } else {
    response.redirect('/');
  }
});

app.get('/about', (request, response) => response.render('about'));

app.get('/blog', (request, response, next) => {
  BlogPost.allPosts()
    .then(posts => response.render('blog', { posts: posts }))
    .catch(next);
});

app.get('/posts/new', (request, response) => {
  response.render('posts/new');
});

app.get('/posts/:id/edit', (request, response, next) => {
  BlogPost.findOne({ _id: new ObjectId(request.params.id) })
    .then(post => response.render('posts/edit', { post: post }))
    .catch(next);
});

app.get('/posts/:id', (request, response, next) => {
  BlogPost.findOne({ _id: new ObjectId(request.params.id) })
    .then(post => response.render('posts/show', { post: post }))
    .catch(next);
});

app.post('/posts/:id', (request, response, next) => {
  BlogPost.findOne({ _id: new ObjectId(request.params.id) }).then(post => {
      post.setTitle(request.body.title);
      post.setBody(request.body.body);
      return post.save();
    }).then(post => {
      request.logger.log(`Updated post ${post.id()}`);
      response.redirect(`/posts/${post.id()}`);
    }).catch(next);
});

app.delete('/posts/:id', (request, response, next) => {
  BlogPost.findOne({ _id: new ObjectId(request.params.id) })
    .then(post => post.delete())
    .then(post => {
      request.logger.log(`Deleted post ${post.id()}`);
      response.send('{ "redirect": "/blog" }');
    }).catch((error) => next(error));
});

app.post('/posts', (request, response, next) => {
  let title = request.body.title;
  let body = request.body.body;

  let post = new BlogPost({ title: title, body: body });
  post.save().then(post => {
    request.logger.log(`Created new post ${post.id()}`);
    response.redirect(`/posts/${post.id()}`);
  }).catch(next);
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
  if (error) return logger.error(error);

  let jsonStats = stats.toJson();
  if (jsonStats.errors.length > 0) return logger.log(jsonStats.errors);
  if (jsonStats.warnings.length > 0) logger.log(jsonStats.warnings);
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
    request.logger.error(err);
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
  request.logger.error(err);
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
      logger.log(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.log(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

app.listen(env.port, () => {
  logger.log(`Listening on ${env.port}`);
});
