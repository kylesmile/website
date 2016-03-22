'use strict';

const classyMongo = require('classy-mongo');
const bcrypt = require('bcrypt');

module.exports = class User extends classyMongo.Model {
  static defineSchema(schema) {
    schema.field('email');
    schema.field('hashedPassword');
  }

  setPassword(password) {
    this._password = password;
    this._passwordUpdated = true;
  }

  password() {
    return this._password || '';
  }

  passwordUpdated() {
    return Boolean(this._passwordUpdated) || this.hashedPassword() === undefined;
  }

  checkPassword(candidatePassword) {
    return new Promise((resolve, reject) => {
      bcrypt.compare(candidatePassword, this.hashedPassword(), (err, isMatch) => {
        if (err) return reject(err);

        resolve(isMatch);
      });
    });
  }

  beforeSave() {
    return new Promise((resolve, reject) => {
      if (!this.passwordUpdated()) return resolve();

      bcrypt.genSalt((err, salt) => {
        if (err) return reject(err);

        bcrypt.hash(this.password(), salt, (err, hash) => {
          if (err) return reject(err);

          this.setHashedPassword(hash);

          resolve();
        });
      });
    });
  }

  updateHash() {
    bcrypt.genSalt((err, salt) => {
      if (err) return; // TODO: Handle this error

      bcrypt.hash(this.password(), salt, function(err, hash) {

      });
    });
  }
}
