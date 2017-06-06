'use babel';

export default class AtomSLangView {

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('atom-s-lang');

    // Create message element, commented out for reasons
    // const message = document.createElement('div');
    // message.textContent = 'The AtomSLang package is Alive! It\'s ALIVE!';
    // message.classList.add('message');
    // this.element.appendChild(message); //commented out for reasons
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

}
