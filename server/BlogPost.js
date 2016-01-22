'use strict';

module.exports = class BlogPost {
  constructor(properties) {
    for (let key in properties) {
      this[key] = properties[key];
    }
  }

  title() {
    return this._title;
  }

  body() {
    return this._body;
  }
}
