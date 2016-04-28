"use strict";

module.exports = class Logger {
  constructor(outStream, errorStream) {
    this._outStream = outStream;
    this._errorStream = errorStream;
  }

  log(messageObject) {
    this.outStream().write(`[${this._timestamp()}] ${messageObject}`);
    this.outStream().write("\n");
  }

  error(error) {
    this.errorStream().write(`[${this._timestamp()}]`);
    this.errorStream().write(error.stack);
    this.errorStream().write("\n");
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
