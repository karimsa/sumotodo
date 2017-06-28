/**
 * @file js/socket.js
 * @description socket.io polyfill.
 */

window.io = window.io || function () {
  console.warn('created offline socket.io polyfill')

  /**
   * Tiny event emitterish.
   */
  const events = {}

  /**
   * Setup offline warning.
   */
  const offline = document.querySelector('.offline-warning')
  offline.classList.add('in')

  /**
   * Reveal polyfill.
   */
  return {
    on: function ( name, fn ) {
      events[name] = events[name] || []
      events[name].push(fn)
    },

    emit: function ( name, data ) {
      // just forward right back
      if (name === 'sync') {
        events.load.forEach(fn => fn(data))
      }

      // otherwise, ignore
    }
  }
}