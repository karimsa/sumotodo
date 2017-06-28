/**
 * @file lib/todo.js
 */

module.exports = class Todo {
  constructor ({ text, done }) {
    this.text = text
    this.done = done

    if (!text) {
      throw new Error('Text must be a valid string of length > 0.')
    }
  }

  toJSON () {
    return {
      text: this.text,
      done: this.done
    }
  }
}