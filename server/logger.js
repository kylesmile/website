"use strict";

module.exports = class Logger {
  constructor(outStream, errorStream, additionalTags) {
    this._outStream = outStream;
    this._errorStream = errorStream;
    this._additionalTags = additionalTags;
  }

  log(message) {
    this.outStream().write(`${this.tags()} ${message}`);
    this.outStream().write("\n");
  }

  error(error) {
    this.errorStream().write(this.tags());
    this.errorStream().write(error.stack);
    this.errorStream().write("\n");
  }

  tagged(additionalTag) {
    return new Logger(this.outStream(), this.errorStream(), this.additionalTags().concat(additionalTag));
  }

  addTag(tag) {
    this.additionalTags().push(tag);
  }

  additionalTags() {
    if (!this._additionalTags) {
      this._additionalTags = [];
    }
    return this._additionalTags;
  }

  tags() {
    return [this._timestamp()].concat(this.additionalTags()).map(tag => `[${tag}]`).join(' ');
  }

  outStream() {
    if (!this._outStream) {
      this._outStream = process.stdout;
    }
    return this._outStream;
  }

  errorStream() {
    if (!this._errorStream) {
      this._errorStream = process.stderr;
    }
    return this._errorStream;
  }

  _timestamp() {
    return this.dateFormatter().format(new Date());
  }

  dateFormatter() {
    if (!this._dateFormatter) {
      this._dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      });
    }
    return this._dateFormatter;
  }
}
