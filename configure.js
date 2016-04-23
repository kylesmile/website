"use strict";

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const nodeEnv = process.env.NODE_ENV || 'development';

const configFile = `config.${nodeEnv.toLowerCase()}.js`;

function generateSecret() {
  return crypto.randomBytes(64).toString('hex');
}

function readOptions() {
  let optionsJSON = process.argv[2];
  return JSON.parse(optionsJSON);
}

if (!fs.existsSync(path.join(__dirname, configFile))) {
  let options = readOptions();

  let fileContents = `
module.exports = {
  dbHost: '${options.dbHost}',
  dbPort: '${options.dbPort}',
  dbName: '${options.dbName}',
  sessionSecret: '${generateSecret()}'
}
  `.trim();

  fs.writeFileSync(path.join(__dirname, configFile), fileContents, 'utf8');
}
