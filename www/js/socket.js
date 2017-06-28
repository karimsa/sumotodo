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
   * Notify when network is back.
   */
  function checkNet() {
    var xhr = new XMLHttpRequest()
    var failed = false

    xhr.onerror = function () {
      failed = true
      setTimeout(checkNet, 500)
    }

    xhr.onload = function () {
      if (!failed) {
        offline.classList.remove('in')

        setTimeout(function () {
          offline.innerText = 'The network is back. Please refresh to continue online.'
          offline.classList.add('in')
        }, 500)
      }
    }

    xhr.open('GET', location.pathname + '?ts=' + Date.now(), true)
    xhr.send(null)
  }

  checkNet()

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