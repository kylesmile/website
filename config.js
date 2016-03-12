'use strict';
const Connection = require('mongo_model').Connection;
const fs = require('fs');

function camelize(envString) {
  return envString.toLowerCase().replace(/_(\w)/g, (_whole, letter) => letter.toUpperCase());
}

function envize(camelString) {
  return camelString.replace(/([A-Z])/g, (_whole, letter) => `_${letter}`).toUpperCase();
}

function dupEnv(object) {
  let newObject = {};
  for (let key in object) {
    if (object.hasOwnProperty(key)) newObject[camelize(key)] = object[key];
  }
  return newObject;
}

function merge(object1, object2) {
  for (let key in object2) {
    if (object2.hasOwnProperty(key) && object1[key] === undefined) object1[key] = object2[key];
  }
}

let env = dupEnv(process.env);
env.NODE_ENV = env.NODE_ENV || 'development';
if (fs.existsSync(`./config.${env.NODE_ENV}.js`)) {
  merge(env, require(`./config.${env.NODE_ENV}.js`));
}

merge(env, {
  debug: false,
  port: +process.env.PORT || 3000,
  sessionExpiration: 60*1000
});

let requiredEnv = ['dbHost', 'dbPort', 'dbName', 'sessionSecret'];
let missingRequiredConfig = false;
requiredEnv.forEach(envKey => {
  if (env[envKey] === undefined) {
    console.log(`Missing environment variable ${envize(envKey)}`);
    missingRequiredConfig = true;
  }
});

if (missingRequiredConfig) process.exit(1);

Connection.configure(config => {
  config.host = env.dbHost;
  config.port = env.dbPort;
  config.database = env.dbName;
});

module.exports = env;
