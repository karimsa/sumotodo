/**
 * @file index.js
 * @description Main io logic.
 */

// config defaults
process.env.PORT = process.env.PORT || 8080
const SAVE_INTERVAL = 750

const fs = require('fs')
    , path = require('path')
    , util = require('util')
    , express = require('express')
    , Todo = require('./lib/todo')
    , app = express()

    // since this is only for demo purposes, just going
    // to use the regular http (no ssl)
    , http = require('http').createServer(app)

    // bind socket.io to the same http instance
    , io = require('socket.io')(http)

// load currrent data
let db = require('./lib/data').map(t => new Todo(t))

// lockdown - similar to debounce but doesn't wait
// for last call
let storeDataLock = false
let storeDataAgain = false

// store data cycle
function storeData( force = false ) {
  /**
   * Check lock; otherwise, lock.
   */
  if (storeDataLock && !force) return (storeDataAgain = true)
  storeDataLock = true

  /**
   * Discard done items.
   */
  db = db.filter(t => !t.done)

  /**
   * Write to disk. This is just one way to implement the persistent
   * real-time storage when using files (that's not scalable, but that's
   * within the constraints of the challenge).
   */
  fs.writeFile('./lib/data.json', JSON.stringify(db), err => {
    console.log('  db updated')

    if (err) console.error(err && err.stack ? err.stack : err)
    
    // forced restore... in a bit
    if (storeDataAgain) {
      return setTimeout(() => storeData(true), SAVE_INTERVAL)
    }

    // release the lock
    storeDataLock = false
  })
}

/**
 * Handle the data storage.
 */
app.post('/', (req, res) => {
  res.end('This feature isn\'t supported in favour of the things you can do with JS.')
})

/**
 * Static-ish. A bit of server-side rendering.
 */
app.use(express.static(`${__dirname}/www`))

/**
 * Handle real-time communication.
 */
io.on('connection', client => {
  client.on('sync', offlineTodos => {
    console.log('  sync %j', offlineTodos)

    // try and update db
    offlineTodos.forEach(t => {
      let found = false

      /**
       * Update the state of an existing entry.
       */
      db = db.filter(b => {
        if (b.text === t.text) {
          b.done = t.done
          found = true
        }

        return !b.done
      })

      /**
       * If no match, just add new entry.
       */
      if (!found) {
        db.push(t)
      }
    })

    // send updated db
    client.emit('load', db)
  })

  client.on('add', t => {
    try {
      // validate
      t = new Todo(t)

      // verify that there is no duplicate
      for (let b of db) {
        if (b.text === t.text) {
          throw new Error('Cannot add duplicate item.')
        }
      }

      // push this newly created todo to our database
      db.push(t)

      // resave
      console.log('  add %j', t)
      storeData()
    } catch (err) {
      console.error('  fail Invalid todo: %s', err && err.stack ? err.stack : err)
      client.emit('fail', `Invalid todo item: "${t}"`)
    }
  })

  /**
   * Updating of state. This really just discards the todo.
   */
  client.on('update', todo => {
    for (let t of db) {
      if (t.text === todo.text) {
        t.done = todo.done
        console.warn('  toggle %j', todo)
        return storeData()
      }
    }
  })
})

// prepare for failures
http.on('error', err => {
  console.error('Failed to start on port: %s', process.env.PORT)
  console.error('%s', err && err.stack ? err.stack : err)
})

// startup io
http.listen(process.env.PORT, () => {
  console.log('Listening @ :%s', process.env.PORT)
})