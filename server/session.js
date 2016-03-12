"use strict";

const mongoModel = require('mongo_model');
const crypto = require('crypto');
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
      let tokenData = `${this.userId()}${this.relevantData()}${Date.now()}${this.nonce()}`;
      let hash = crypto.createHash('sha512');
      hash.update(tokenData);
      this.setToken(hash.digest().toString('hex'));
      resolve();
    });
  }

  user() {
    return User.findOne({ _id: this.userId() })
  }

  nonce() {
    return crypto.randomBytes(16).toString('hex');
  }
}
