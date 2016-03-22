export default class SingleElementComponent {
  constructor(element) {
    this._element = element;
  }

  element() {
    return this._element;
  }

  connect() {
    // subclass should override
  }
}
