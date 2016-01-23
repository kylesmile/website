import PromisedRequest from './PromisedRequest'

export default class DeleteButton {
  constructor(element) {
    this._element = element;
  }

  element() {
    return this._element
  }

  url() {
    return this.element().dataset.resource;
  }

  connect() {
    this.element().addEventListener('click', () => {
      new PromisedRequest(this.url(), 'DELETE').perform().then((response) => {
        window.location = JSON.parse(response).redirect;
      });
    });
  }
}
