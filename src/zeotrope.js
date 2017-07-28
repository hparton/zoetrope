/**
 * Zeotrope is an animation helper, designed to make creating simple
 * RAF animations a bit easier, in particular helps with handling
 * easing.
 *
 * @author  hparton
 * @version  1.0.0
 * @created_at 28/07/2017
 */
class Zeotrope {
  /**
   * Zeotrope constructor.
   */
  constructor (options) {
    this.duration = options && options.duration ? options.duration : 1000
    this._running = true
    this._startedAt = null
    this._pausedAt = null
    this._handlers = []
    this._easingFunc = options && options.easing ? options.easing : easeOutQuart
    this._rafID = null

    if (options && options.onComplete) {
      this.on('complete', options.onComplete)
    }

    if (options && options.onTick) {
      this.on('tick', options.onTick)
    }
  }

  /**
   * Set the duration of the animation.
   * @param  {Number} duration Duration of the animation in ms
   * @return {Object}          The current instance of Zeotrope, so methods can be chained.
   */
  duration (duration) {
    this.duration = duration
    return this
  }

  /**
   * Set a function to determine easing for the animation, if this is not called
   * the animation will just use easeOutQuint easing.
   * @param  {Function} easingFunc Function to ease the animation
   * @return {Object}              The current instance of Zeotrope, so methods can be chained.
   */
  easing (easingFunc) {
    this._easingFunc = easingFunc
    return this
  }

  /**
   * Start the animation, wrapper for internal function _run().
   * @param  {Boolean} reversed Run the animation in reverse
   * @return {Object}           The current instance of Zeotrope, so methods can be chained.
   */
  play (reversed) {
    if (this._startedAt === null) {
      this._setStartTime(() => {
        this.dispatch('start')
        this._run(this._startedAt, reversed)
      })
    }
    return this
  }

  /**
   * Wrapper for the play function to make the external API clearer.
   * @return {Object} The current instance of Zeotrope, so methods can be chained.
   */
  reverse () {
    this.play(true)
    return this
  }

  /**
   * Pause the animation but keep the RAF running so it can be resumed.
   * @return {Object} The current instance of Zeotrope, so methods can be chained.
   */
  pause () {
    this._running = false
    this._pausedAt = new Date().getTime()
    return this
  }

  /**
   * Resume the animation if it was paused, otherwise it does nothing.
   * @return {Object} The current instance of Zeotrope, so methods can be chained.
   */
  resume () {
    if (!this._running) {
      this._running = true
      this._startedAt = this._startedAt + (new Date().getTime() - this._pausedAt)
    }
    return this
  }

  /**
   * Stop the animation, cannot be resumed as it destroys the current instance of RAF.
   * @return {Object} The current instance of Zeotrope, so methods can be chained.
   */
  stop () {
    window.cancelAnimationFrame(this._rafID)
    this._startedAt = null
    return this
  }

  /**
   * Loop the animation forwards then backwards with an optional delay inbetween.
   * @param  {Number} delay Duration of the delay in ms
   * @return {Object} The current instance of Zeotrope, so methods can be chained.
   */
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

  /**
   * All of the internal loop logic
   * @private
   * @param  {Date} timestamp    Timestamp when loop was started
   * @param  {Boolean} reversed  Run the animation in reverse
   */
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
    var runtime = timestamp - this._startedAt
    var progress = runtime / this.duration

    progress = Math.min(progress, 1)

    if (reversed) {
      progress = (1 - progress)
    }

    progress = this._easingFunc(progress)

    this.dispatch('tick', progress)
    if (runtime <= this.duration) { // if duration not met yet
      this._rafID = window.requestAnimationFrame((timestamp) => { // call requestAnimationFrame again with parameters
        this._run(timestamp, reversed)
      })
    } else {
      this._startedAt = null
      this.dispatch('complete')
    }
  }

  /**
   * Execute any callbacks assigned to a specific event.
   * @param  {String} event  Name of the event
   * @param  {Mixed} params  Any params passed through
   */
  dispatch (event, params) {
    for (var i = 0; i < this._handlers.length; i++) {
      if (this._handlers[i].event === event) {
        this._handlers[i].cb(params)
      }
    }
  }

  /**
   * Add a callback to to a specific event, will be called when
   * dispatch() is run.
   * @param  {String}   event Name of the event
   * @param  {Function} cb
   */
  on (event, cb) {
    this._handlers.push({event, cb})
    return this
  }

  /**
   * Set the date at the animation start time.
   * @private
   * @param  {Function} cb    Call after current frame
   */
  _setStartTime (cb) {
    window.requestAnimationFrame((timestamp) => {
      this._startedAt = timestamp
      cb(timestamp)
    })
  }

  /**
   * Log a shallow copy of the current state
   * @return {Object} The current instance of Zeotrope, so methods can be chained.
   */
  debug () {
    console.log(Object.assign({}, this))
    return this
  }
}

/**
   * easeOutQuart Easing Function
   * @param  {Number} t - current time
   * @return {Number} Eased time
   */
const easeOutQuart = (t) => { return 1-(--t)*t*t*t }

export default Zeotrope