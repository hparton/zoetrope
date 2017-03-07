
class Animation {
  constructor () {
    this._duration = 1200
    this._startedAt = null
    this._pausedAt = null
    this._handlers = []
    this._easingFunc = null
    this._rafID = null
    this._running = true
  }

  // .duration(duration) - Define a duration for the animation
  duration (duration) {
    this._duration = duration
    return this
  }

  // .easing(easingFunc) - Define an easing function here for use in the .on('tick')
  easing (easingFunc) {
    this._easingFunc = easingFunc
    return this
  }

  // .play() - Play the animation forwards
  play (reversed) {
    if (this._startedAt === null) {
      this._setStartTime(() => {
        this.trigger('start')
        this._run(this._startedAt, reversed)
      })
    }
    return this
  }

  // .reverse() - Play the animation backwards
  reverse () {
    this.play(true)
    return this
  }

  // .pause() - Pause the animation loop but keep the RAF running so it cane be resumed.
  pause (duration) {
    this._running = false
    this._pausedAt = new Date().getTime()
    return this
  }

  // .resume() - Resume the paused animation loop.
  resume () {
    this._running = true
    this._startedAt = this._startedAt + (new Date().getTime() - this._pausedAt)
    return this
  }

  // .stop() - Stop the animation, cannot be resumed
  stop () {
    window.cancelAnimationFrame(this._rafID)
    this._startedAt = null
    return this
  }

  // .bounce(delay) - Play the animation forwards then backwards with optional delay in ms
  bounce (delay) {
    let i = 0
    this.play()
    this.on('finish', () => {
      setTimeout(() => {
        (i % 2 === 0) ? this.reverse() : this.play()
        i++
      }, delay)
    })

    return this
  }

  // Main animation loop handler.
  _run (timestamp, reversed) {
    /**
     * If its paused then just skip onto the next frame.
     * This is effectively paused as we dont send out any tick events
     * and we never update the progress, but can be resumed. Still using
     * resources though so may look at a better way of implementing this.
     */
    if (!this._running) {
      window.requestAnimationFrame((timestamp) => { // call requestAnimationFrame again with parameters
        this._run(timestamp, reversed)
      })
      return
    }

    // Otherwise do the normal run function.
    timestamp = timestamp || new Date().getTime()
    var runtime = timestamp - this._startedAt
    var progress = runtime / this._duration

    progress = Math.min(progress, 1)

    if (reversed) {
      progress = (1 - progress)
    }

    if (this._easingFunc !== null) {
      progress = this._easingFunc(progress)
    }

    this.trigger('tick', progress)
    if (runtime <= this._duration) { // if duration not met yet
      this._rafID = window.requestAnimationFrame((timestamp) => { // call requestAnimationFrame again with parameters
        this._run(timestamp, reversed)
      })
    } else {
      this._startedAt = null
      this.trigger('finish')
    }
  }

  // .trigger('tick'/'finish') - Trigger any callbacks assigned to the event
  trigger (event, params) {
    for (var i = 0; i < this._handlers.length; i++) {
      if (this._handlers[i].event === event) {
        this._handlers[i].cb(params)
      }
    }
  }

  // .on('tick'/'finish') - Assign a callback to the event
  on (event, cb) {
    this._handlers.push({event, cb})
    return this
  }

  // Does what it says on the tin.
  _setStartTime (cb) {
    window.requestAnimationFrame((timestamp) => {
      // if browser doesn't support requestAnimationFrame, generate our own timestamp using Date
      this._startedAt = timestamp || new Date().getTime()
      cb(timestamp)
    })
  }

  // .log() - Log the animation object
  log () {
    console.log(this)
    return this
  }
}

export default Animation
