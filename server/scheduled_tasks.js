"use strict";

const env = require('../config');

const later = require('later');
const Logger = require('./logger');
const path = require('path');
const exec = require('child_process').exec;
const fs = require('fs');

const logger = new Logger();
logger.addTag('TASK');

const tmpPath = path.resolve(path.join(__dirname, '..', 'tmp'));
const backupBasePath = path.join(tmpPath, 'backups');
try {
  fs.mkdirSync(tmpPath);
} catch(error) {} // Throws if the directory already exists

try {
  fs.mkdirSync(backupBasePath);
} catch(error) {} // Throws if the directory already exists

const schedule = later.parse.recur().on('06:00:00').time(); // 6 AM UTC, 2 AM EDT, 1 AM EST

later.setInterval(function() {
  let backupPath = path.join(backupBasePath, `dbdump-${Date.now()}`);
  exec(`mongodump --host=${env.dbHost} --port=${env.dbPort} --db ${env.dbName} --gzip --archive=${backupPath}`, function() {
    logger.log('Created new backup');
  });
}, schedule);
