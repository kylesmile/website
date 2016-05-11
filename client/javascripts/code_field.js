import SingleElementComponent from './single_element_component';

export default class CodeField extends SingleElementComponent {
  connect() {
    this.element().addEventListener('keydown', this.keydown.bind(this));
  }

  keydown(event) {
    if (event.key === "Tab" || event.keyCode === 9) {
      this.handleTab(event);
    } else if (event.key === "Enter" || event.keyCode === 13) {
      this.handleReturn(event);
    }
  }

  handleTab(event) {
    event.preventDefault();

    this.insert("  ");
  }

  handleReturn(event) {
    event.preventDefault();

    this.insert(`\n${this.tabs()}`);
  }

  insert(string) {
    let start = this.element().selectionStart;
    let end = this.element().selectionEnd;

    let value = this.element().value;

    this.element().value = value.substring(0, start) + string + value.substring(end);
    let newSelection = start + string.length;
    this.element().setSelectionRange(newSelection, newSelection);
  }

  tabs() {
    let lineRegex = /\r?\n|\r/;
    let start = this.element().selectionStart;
    let value = this.element().value;
    let lineNumber = value.substr(0, start).split(lineRegex).length;
    let lineText = value.split(lineRegex)[lineNumber - 1]
    let lineBeginTabs = lineText.match(/^(\s*)/);
    if (lineBeginTabs === null) return '';
    return lineBeginTabs[1];
  }
}
