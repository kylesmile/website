import DeleteButton from './delete_button'

document.addEventListener('DOMContentLoaded', () => {
  Array.from(document.querySelectorAll('button.delete')).forEach(element => {
    new DeleteButton(element).connect();
  });
});
