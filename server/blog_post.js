'use strict';

const classyMongo = require('classy-mongo');
const pug = require('pug');

module.exports = class BlogPost extends classyMongo.Model {
  static defineSchema(schema) {
    schema.field('title');
    schema.field('body');
    schema.field('createdAt');
  }

  static latestPosts() {
    let count = 10;
    return this.collection()
      .then(collection => {
        return collection.find().sort({ createdAt: -1 }).limit(count).toArray();
      }).then(results => results.map(result => new this(result)));
  }

  static allPosts() {
    return this.collection()
      .then(collection => {
        return collection.find().sort({ createdAt: -1 }).toArray();
      }).then(results => results.map(result => new this(result)));
  }

  parsedBody() {
    try {
      return pug.render(this.body(), {});
    } catch(error) {
      console.log(error);
      return "<p>There was a problem with this blog post</p>";
    }
  }

  beforeSave() {
    if (!this.createdAt()) {
      this.setCreatedAt(new Date());
    }
    return Promise.resolve();
  }
}
