/**
 * @file lib/todo.js
 */

module.exports = class Todo {
  constructor ({ text, done, init }) {
    this.text = text
    this.done = done

    if (!text) {
      throw new Error('Text must be a valid string of length > 0.')
    }
  }

  toString () {
    // checkbox is not included since that won't work without JS
    return `<li class="${this.done ? 'done' : ''}">${this.text}</li>`
  }

  toJSON () {
    return {
      text: this.text,
      done: this.done
    }
  }
}