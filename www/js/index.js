~ function () {
  'use strict'

  /**
   * Client socket.
   */
  const sock = io()

  /**
   * Important elements.
   */
  const list = document.querySelector('.todo-list')
  const input = document.querySelector('.todo-text')
  const form = document.querySelector('form')
  const error = document.querySelector('.error')
  const doneAll = document.querySelector('.all-done')

  /**
   * M.
   */
  const todos = []

  /**
   * V.
   */
  function cleanText( text ) {
    // cleans up text to be used as id
    return text.toLowerCase().replace(/\W+/g, '-')
  }

  function _render() {
    list.innerHTML = ''

    todos.forEach(todo => {
      const li = document.createElement('li')
      let checkbox = document.createElement('input')
      checkbox.type = 'checkbox'

      /**
       * Add [checked='true'] if the state is done.
       */
      if (todo.done) {
        checkbox.setAttribute('checked', 'true')
        li.classList.add('done')
      }

      /**
       * Some hacks to make sure that the todo's text is
       * escaped & can't inject HTML.
       */
      li.appendChild(checkbox)
      li.id = cleanText(todo.text)
      li.innerText = todo.text
      li.innerHTML = checkbox.outerHTML + li.innerHTML

      /**
       * The first (and only) child.
       */
      checkbox = li.children[0]

      /**
       * Create toggling function.
       */
      const toggle = todoToggle(todo, li, checkbox)

      /**
       * Attach it to the checkbox.
       */
      checkbox.addEventListener('change', toggle)

      /**
       * But also to the item so that you can click anywhere.
       */
      li.addEventListener('click', evt => {
        // invert checkbox
        if (evt.target !== checkbox) {
          evt.preventDefault()
          checkbox.checked = !checkbox.checked
        }

        // update data
        toggle({ preventDefault: function () { /* noop */ } })
      })

      /**
       * Add to DOM.
       */
      list.appendChild(li)
    })
  }

  /**
   * V public.
   * 
   * Will run render when animation frame is available.
   */
  function render() {
    requestAnimationFrame(_render)
  }

  /**
   * C.
   */
  function todoToggle(todo, elm, cb) {
    return function toggleClicked(evt) {
      evt.preventDefault()

      // update state based on checkbox
      todo.done = !! cb.checked
    
      // update style state
      elm.setAttribute('class', todo.done ? 'done' : '')

      // update on backend
      save(() => sock.emit('update', todo))
    }
  }

  doneAll.addEventListener('click', evt => {
    evt.preventDefault()

    // mark all as done
    todos.forEach(todo => {
      todo.done = true
      save(() => sock.emit('update', todo))
    })

    // rerender
    render()
  })

  form.addEventListener('submit', function addEvent(evt) {
    evt.preventDefault()

    // grab value, then discard
    let todo = input.value.trim()
    input.value = ''

    if (todo) {
      // create object
      todo = {
        text: todo,
        done: false,
        init: Date.now()
      }

      // add to list
      todos.push(todo)

      // send todo for storage
      save(() => sock.emit('add', todo))

      // rerender
      render()
    }
  })

  function save( fn ) {
    localStorage.setItem('db', JSON.stringify(todos))
    fn()
  }

  /**
   * Load old todos from backend.
   */
  sock.on('load', function loadedTodosFromServer(_todos) {
    // in case load takes a while and we have already
    // added todos
    _todos.forEach(todo => todos.push(todo))

    // store again
    localStorage.setItem('db', JSON.stringify(todos))

    // rerender
    render()
  })

  /**
   * Add from other clients.
   */
  sock.on('client_add', function gotBroadcastAdd( todo ) {
    // add to local collection
    todos.push(todo)

    // rerender
    render()
  })

  sock.on('client_update', function gotBroadcastUpdate( todo ) {
    console.warn('got update: ' + JSON.stringify(todo))

    let found = false

    for (let t of todos) {
      if (t.text === todo.text) {
        t.done = todo.done
        found = true

        /**
         * Update view.
         */
        const elm = document.getElementById(cleanText(t.text))
        const cb = elm.children[0]
        
        cb.checked = t.done
        elm.setAttribute('class', t.done ? 'done' : '')

        return 
      }
    }

    /**
     * If not found in update, just add.
     */
    if (!found) {
      todos.push(todo)
      render()
    }
  })

  /**
   * Run sync in case anything was added while we were offline.
   */
  sock.emit('sync', function () {
    // try and load from localStorage
    try { return JSON.parse(localStorage.getItem('db') || '[]') }
    
    // if errors happen, just start fresh
    catch (_) { return [] }
  }())

  /**
   * Setup error listener.
   */
  sock.on('fail', err => {
    error.innerText = err
    document.documentElement.classList.add('error')
  })
}()