'use strict';

const mongoModel = require('mongo_model');

module.exports = class BlogPost extends mongoModel.Model {
  static defineSchema(schema) {
    schema.field('title');
    schema.field('body');
  }
}
