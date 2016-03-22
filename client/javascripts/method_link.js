import SingleElementComponent from './single_element_component';
import PromisedRequest from './promised_request';

export default class MethodLink extends SingleElementComponent {
  href() {
    return this.element().getAttribute('href');
  }

  method() {
    return this.element().dataset.method.toUpperCase();
  }

  connect() {
    this.element().addEventListener('click', event => {
      event.preventDefault();
      new PromisedRequest(this.href(), this.method()).perform().then(response => {
        window.location = JSON.parse(response).redirect
      });
    });
  }
}
