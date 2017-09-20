/**
 * Zoetrope is an animation helper, designed to make creating simple
 * RAF animations a bit easier, in particular helps with handling
 * easing.
 *
 * @author  hparton
 * @version  1.0.0
 * @created_at 28/07/2017
 */

class Timeline {
  constructor (animations) {
    this._animations = this.processAnimations(animations)
    this._runtime = this.calcTotalDuration()
    this._timeline = this.constructTimeline()
    this._forwards = true

    console.log(this)
  }

  processAnimations (animations) {
    for (var i = 0; i < animations.length; i++) {
      let animation = animations[i]
      let previousAnimation = animations[i - 1]

      animation.hasRan = false

      if (typeof animation.delay === 'undefined') {
        if (!previousAnimation) {
          animation.delay = 0
        } else {
          animation.delay = previousAnimation.animation._duration + previousAnimation.delay
        }
      }

      if (typeof animation.delay === 'string') {
        let operator = animation.delay.slice(0, 1)
        let time = animation.delay.slice(1, animation.delay.length)

        switch (operator) {
          case '~':
            animation.delay = previousAnimation.delay
            break
          case '+':
            animation.delay = previousAnimation.animation._duration + previousAnimation.delay + parseInt(time)
            break
          case '-':
            animation.delay = previousAnimation.animation._duration + previousAnimation.delay - parseInt(time)
            break
          default:
            throw new Error('Operator not defined. Use +, - or ~')
        }
      }
    }

    return animations
  }

  resetAnimationsState () {
    this._animations.map(x => {
      x.hasRan = false
    })
  }

  swapPlayDirections () {
    this._forwards = !this._forwards
  }

  calcTotalDuration () {
    let runTimes = this._animations.map(x => { return x.animation._duration + x.delay })
    return Math.max(...runTimes)
  }

  constructTimeline () {
    let timeline = new Zoetrope({
      duration: this._runtime,
      onTick: p => this.runAnimations(p),
      onComplete: () => {
        this.runAnimations(1)
        this.resetAnimationsState()
      },
      easing: (t) => { return t }
    })

    return timeline
  }

  runAnimations (p) {
    for (let i = 0; i < this._animations.length; i++) {
      let animation = this._animations[i]

      if (this._forwards) {
        if ((p >= (animation.delay / this._runtime) && !animation.hasRan)) {
          animation.animation.play()
          animation.hasRan = true
        }
      }

      if (!this._forwards) {
        if ((p <= (animation.delay / this._runtime) && !animation.hasRan)) {
          animation.animation.reverse()
          animation.hasRan = true
        }
      }
    }
  }

  play () {
    this._timeline.play()
    return this
  }

  pause () {
    this._timeline.pause()
    return this
  }

  resume () {
    this._timeline.resume()
    return this
  }

  reverse () {
    this.swapPlayDirections()
    this._timeline.reverse()
  }

  repeat () {
    this.play()
    this._timeline.on('complete', () => {
      this.resetAnimationsState()
      this.play()
    })
  }

  loop (delay) {
    if (!delay) delay = 0

    this._timeline.on('complete', () => { this.swapPlayDirections() })
    this._timeline.loop(delay)
  }
}

class Zoetrope {
  /**
   * Zoetrope constructor.
   */
  constructor (options) {
    this._duration = options && options.duration ? options.duration : 1000
    this._running = true
    this._startedAt = null
    this._pausedAt = null
    this._handlers = []
    this._easingFunc = options && options.easing ? options.easing : easeOutQuart
    this._rafID = null

    if (options && options.onStart) {
      this.on('start', options.onStart)
    }

    if (options && options.onComplete) {
      this.on('complete', options.onComplete)
    }

    if (options && options.onTick) {
      this.on('tick', options.onTick)
    }

    this._polyfillDateNow()
    this._polyfillRAF()
  }

  /**
   * Set the duration of the animation.
   * @param  {Number} duration Duration of the animation in ms
   * @return {Object}          The current instance of Zoetrope, so methods can be chained.
   */
  duration (duration) {
    this._duration = duration
    return this
  }

  /**
   * Set a function to determine easing for the animation, if this is not called
   * the animation will just use easeOutQuint easing.
   * @param  {Function} easingFunc Function to ease the animation
   * @return {Object}              The current instance of Zoetrope, so methods can be chained.
   */
  easing (easingFunc) {
    this._easingFunc = easingFunc
    return this
  }

  /**
   * Start the animation, wrapper for internal function _run().
   * @param  {Boolean} reversed Run the animation in reverse
   * @return {Object}           The current instance of Zoetrope, so methods can be chained.
   */
  play (reversed) {
    if (this._startedAt === null) {
      this._run(this._setStartTime(), reversed)
    }
    return this
  }

  /**
   * Wrapper for the play function to make the external API clearer.
   * @return {Object} The current instance of Zoetrope, so methods can be chained.
   */
  reverse () {
    this.play(true)
    return this
  }

  /**
   * Pause the animation but keep the RAF running so it can be resumed.
   * @return {Object} The current instance of Zoetrope, so methods can be chained.
   */
  pause () {
    this._running = false
    this._pausedAt = this._getNow()
    return this
  }

  /**
   * Resume the animation if it was paused, otherwise it does nothing.
   * @return {Object} The current instance of Zoetrope, so methods can be chained.
   */
  resume () {
    if (!this._running) {
      this._running = true
      this._startedAt = this._startedAt + (this._getNow() - this._pausedAt)
    }
    return this
  }

  /**
   * Stop the animation, cannot be resumed as it destroys the current instance of RAF.
   * @return {Object} The current instance of Zoetrope, so methods can be chained.
   */
  stop () {
    window.cancelAnimationFrame(this._rafID)
    this._startedAt = null
    return this
  }

  /**
   * Loop the animation forwards then backwards with an optional delay inbetween.
   * @param  {Number} delay Duration of the delay in ms
   * @return {Object} The current instance of Zoetrope, so methods can be chained.
   */
  loop (delay) {
    if (!delay) {
      delay = 0
    }

    let i = 0
    this.play()
    this.on('complete', () => {
      setTimeout(() => {
        (i % 2 === 0) ? this.reverse() : this.play()
        i++
      }, delay)
    })

    return this
  }

  /**
   * @private
   *
   * All of the internal loop logic
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
    var progress = runtime / this._duration

    if (runtime === 0) {
      this.dispatch('start')
    }

    progress = Math.min(progress, 1)

    if (reversed) {
      progress = (1 - progress)
    }

    progress = this._easingFunc(progress)

    this.dispatch('tick', progress)
    if (runtime <= this._duration) { // if duration not met yet
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
   * @private
   *
   * Set the timestamp at the animation start time.
   * @return {Number} Return a copy of the timestamp
   */
  _setStartTime (cb) {
    this._startedAt = this._getNow()
    return this._startedAt
  }

  /**
   * @private
   *
   * Get the current timestamp, try performance.now() first
   * as its more accurate, then fall back to Date.now().
   * @return {Mixed} Timestamp for right the hell now!
   */
  _getNow () {
    if (window.performance && window.performance.now) {
      return window.performance.now()
    }

    return Date.now()
  }

  /**
   * Log a shallow copy of the current state
   * @return {Object} The current instance of Zoetrope, so methods can be chained.
   */
  debug (log) {
    if (typeof log === 'undefined' || log) console.log(Object.assign({}, this))
    return this
  }

  /**
   * @private
   *
   * If the browser doesn't support Date.now, we will polyfill it to
   * use Date().getTime(), which is less performant but better supported.
   */
  _polyfillDateNow () {
    if (!Date.now) { Date.now = function () { return new Date().getTime() } }
  }

  /**
   * @private
   *
   * Reformatted from: https://github.com/darius/requestAnimationFrame/blob/master/requestAnimationFrame.js
   * Fixes from Paul Irish, Tino Zijdel, Andrew Mao, Klemen Slavič, Darius Bacon
   *
   * If the browser doesn't support RAF, we will polyfill in a version
   * using setTimeout() instead.
   */
  _polyfillRAF () {
    var vendors = ['webkit', 'moz']
    for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
      var vp = vendors[i]
      window.requestAnimationFrame = window[vp + 'RequestAnimationFrame']
      window.cancelAnimationFrame = (window[vp + 'CancelAnimationFrame'] ||
                                    window[vp + 'CancelRequestAnimationFrame'])
    }
    if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || // iOS6 is buggy
        !window.requestAnimationFrame || !window.cancelAnimationFrame) {
      var lastTime = 0
      window.requestAnimationFrame = (callback) => {
        var now = this._getNow()
        var nextTime = Math.max(lastTime + 16, now)
        return setTimeout(() => callback(lastTime = nextTime),
          nextTime - now)
      }
      window.cancelAnimationFrame = clearTimeout
    }
  }
}

/**
   * easeOutQuart Easing Function
   * @param  {Number} t - current time
   * @return {Number} Eased time
   */
const easeOutQuart = (t) => { return 1 - (--t) * t * t * t }

if (typeof module !== 'undefined') {
  module.exports = Zoetrope
  module.exports.Zoetrope = Zoetrope
  module.exports.Timeline = Timeline
} else {
  window.Zoetrope = Zoetrope
  window.Timeline = Timeline
}
