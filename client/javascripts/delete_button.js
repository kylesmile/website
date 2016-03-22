import SingleElementComponent from './single_element_component';
import PromisedRequest from './promised_request';

export default class DeleteButton extends SingleElementComponent {
  url() {
    return this.element().dataset.resource;
  }

  connect() {
    this.element().addEventListener('click', () => {
      new PromisedRequest(this.url(), 'DELETE').perform().then(response => {
        window.location = JSON.parse(response).redirect;
      });
    });
  }
}
