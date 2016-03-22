'use strict';

const classyMongo = require('classy-mongo');

module.exports = class BlogPost extends classyMongo.Model {
  static defineSchema(schema) {
    schema.field('title');
    schema.field('body');
  }
}
