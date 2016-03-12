'use strict';

class RequestError extends Error {
  constructor(status, message, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export default class PromisedRequest {
  constructor(url, method = 'GET') {
    this._url = url;
    this._method = method;
  }

  url() { return this._url }
  method() { return this._method }

  request() {
    if (!this._request) {
      this._request = new XMLHttpRequest();
      this._request.open(this.method(), this.url(), true);
    }
    return this._request;
  }

  perform() {
    return new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;

      this.request().addEventListener('load', this._load.bind(this));
      this.request().addEventListener('error', this._error.bind(this));

      this.request().send();
    });
  }

  _load() {
    let request = this.request();
    if (request.status >= 200 && request.status < 400) {
      this._resolve(request.response);
    } else {
      this._reject(new RequestError(request.status, request.statusText, request.response));
    }
  }

  _error() {
    this._reject(new Error());
  }
}
