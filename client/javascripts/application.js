import DeleteButton from './DeleteButton'

document.addEventListener('DOMContentLoaded', () => {
  Array.from(document.querySelectorAll('button.delete')).forEach(element => {
    new DeleteButton(element).connect();
  });
});
