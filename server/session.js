"use strict";

const mongoModel = require('mongo_model');
const bcrypt = require('bcrypt');
const User = require('./user');

module.exports = class Session extends mongoModel.Model {
  static findByToken(token) {
    return this.findOne({ token: token });
  }

  static defineSchema(schema) {
    schema.field('token');
    schema.field('userId');
  }

  isSignedIn() {
    return this.userId() !== undefined;
  }

  relevantData() {
    return this._relevantData;
  }

  beforeSave() {
    return new Promise((resolve, reject) => {
      let tokenData = `${this.userId()}${this.relevantData()}${Date.now()}`;

      bcrypt.genSalt((err, salt) => {
        if (err) return reject(err);

        bcrypt.hash(tokenData, salt, (err, hash) => {
          if (err) return reject(err);

          this.setToken(hash);

          resolve();
        });
      });
    });
  }

  user() {
    return User.findOne({ _id: this.userId() })
  }
}
