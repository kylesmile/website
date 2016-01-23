'use strict';

const MongoClient = require('mongodb').MongoClient;

module.exports = class BlogPost {
  static db() {
    if (!this._db) {
      this._db = MongoClient.connect('mongodb://localhost:27017/my_website');
    }
    return this._db;
  }

  static collection() {
    if (!this._collection) {
      this._collection = this.db().then(db => db.collection('blogPosts'));
    }
    return this._collection;
  }

  static find(query) {
    return this.collection()
      .then(collection => collection.find(query).toArray())
      .then(results => results.map(result => new this(result)));
  }

  static findOne(query) {
    return this.collection()
      .then(collection => collection.findOne(query))
      .then(result => new this(result));
  }

  constructor(properties) {
    this._title = properties.title || properties._title;
    this._body = properties.body || properties._body;
    this._id = properties._id;
  }

  save() {
    if (this._id) {
      return this._update();
    } else {
      return this._insert();
    }
  }

  delete() {
    this.constructor.collection()
      .then(collection => collection.deleteOne({ _id: this.id() }))
      .then(() => this);
  }

  _insert() {
    return this.constructor.collection()
      .then(collection => collection.insertOne(this))
      .then(result => {
        this.setId(result.insertedId);
        return this;
      });
  }

  _update() {
    return this.constructor.collection()
      .then(collection => {
        return collection.updateOne({ _id: this.id() }, { $set: this });
      }).then(result => this);
  }

  title() {
    return this._title;
  }

  setTitle(title) {
    this._title = title;
  }

  body() {
    return this._body;
  }

  setBody(body) {
    this._body = body;
  }

  id() {
    return this._id;
  }

  setId(id) {
    this._id = id;
  }
}
