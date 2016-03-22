import DeleteButton from './delete_button';
import MethodLink from './method_link';

document.addEventListener('DOMContentLoaded', () => {
  Array.from(document.querySelectorAll('button.delete')).forEach(element => {
    new DeleteButton(element).connect();
  });

  Array.from(document.querySelectorAll('a[data-method]')).forEach(element => {
    new MethodLink(element).connect();
  });
});
