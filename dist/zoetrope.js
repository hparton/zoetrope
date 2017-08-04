'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Zoetrope is an animation helper, designed to make creating simple
 * RAF animations a bit easier, in particular helps with handling
 * easing.
 *
 * @author  hparton
 * @version  1.0.0
 * @created_at 28/07/2017
 */

var Timeline = function () {
  function Timeline(animations) {
    _classCallCheck(this, Timeline);

    this._animations = this.processAnimations(animations);
    this._runtime = this.calcTotalDuration();
    this._timeline = this.constructTimeline();

    console.log(this);
  }

  _createClass(Timeline, [{
    key: 'processAnimations',
    value: function processAnimations(animations) {
      for (var i = 0; i < animations.length; i++) {
        var animation = animations[i];
        var previousAnimation = animations[i - 1];

        animation.hasRan = false;

        if (typeof animation.delay === 'undefined') {
          if (!previousAnimation) {
            animation.delay = 0;
          } else {
            animation.delay = previousAnimation.animation._duration + previousAnimation.delay;
          }
        }

        if (typeof animation.delay === 'string') {
          var operator = animation.delay.slice(0, 1);
          var time = animation.delay.slice(1, animation.delay.length);

          switch (operator) {
            case '~':
              animation.delay = previousAnimation.delay;
              break;
            case '+':
              animation.delay = previousAnimation.animation._duration + previousAnimation.delay + parseInt(time);
              break;
            case '-':
              animation.delay = previousAnimation.animation._duration + previousAnimation.delay - parseInt(time);
              break;
            default:
              throw new Error('Operator not defined. Use +, - or ~');
          }
        }
      }

      return animations;
    }
  }, {
    key: 'resetAnimationsState',
    value: function resetAnimationsState() {
      this._animations.map(function (x) {
        x.hasRan = false;
      });
    }
  }, {
    key: 'calcTotalDuration',
    value: function calcTotalDuration() {
      var runTimes = this._animations.map(function (x) {
        return x.animation._duration + x.delay;
      });
      return Math.max.apply(Math, _toConsumableArray(runTimes));
    }
  }, {
    key: 'constructTimeline',
    value: function constructTimeline() {
      var _this = this;

      var timeline = new Zoetrope({
        duration: this._runtime,
        onTick: function onTick(p) {
          return _this.runAnimations(p);
        },
        onComplete: function onComplete() {
          _this.runAnimations(1);
          _this.resetAnimationsState();
        },
        easing: function easing(t) {
          return t;
        }
      });

      return timeline;
    }
  }, {
    key: 'runAnimations',
    value: function runAnimations(p) {
      for (var i = 0; i < this._animations.length; i++) {
        var animation = this._animations[i];

        if (p >= animation.delay / this._runtime && !animation.hasRan) {
          animation.animation.play();
          animation.hasRan = true;
        }
      }
    }
  }, {
    key: 'play',
    value: function play() {
      this._timeline.play();
      return this;
    }
  }, {
    key: 'pause',
    value: function pause() {
      this._timeline.pause();
      return this;
    }
  }, {
    key: 'resume',
    value: function resume() {
      this._timeline.resume();
      return this;
    }
  }, {
    key: 'reverse',
    value: function reverse() {
      this._timeline.reverse();
    }
  }, {
    key: 'loop',
    value: function loop() {
      this._timeline.loop();
    }
  }]);

  return Timeline;
}();

var Zoetrope = function () {
  /**
   * Zoetrope constructor.
   */
  function Zoetrope(options) {
    _classCallCheck(this, Zoetrope);

    this._duration = options && options.duration ? options.duration : 1000;
    this._running = true;
    this._startedAt = null;
    this._pausedAt = null;
    this._handlers = [];
    this._easingFunc = options && options.easing ? options.easing : easeOutQuart;
    this._rafID = null;

    if (options && options.onStart) {
      this.on('start', options.onStart);
    }

    if (options && options.onComplete) {
      this.on('complete', options.onComplete);
    }

    if (options && options.onTick) {
      this.on('tick', options.onTick);
    }

    this._polyfillDateNow();
    this._polyfillRAF();
  }

  /**
   * Set the duration of the animation.
   * @param  {Number} duration Duration of the animation in ms
   * @return {Object}          The current instance of Zoetrope, so methods can be chained.
   */


  _createClass(Zoetrope, [{
    key: 'duration',
    value: function duration(_duration) {
      this._duration = _duration;
      return this;
    }

    /**
     * Set a function to determine easing for the animation, if this is not called
     * the animation will just use easeOutQuint easing.
     * @param  {Function} easingFunc Function to ease the animation
     * @return {Object}              The current instance of Zoetrope, so methods can be chained.
     */

  }, {
    key: 'easing',
    value: function easing(easingFunc) {
      this._easingFunc = easingFunc;
      return this;
    }

    /**
     * Start the animation, wrapper for internal function _run().
     * @param  {Boolean} reversed Run the animation in reverse
     * @return {Object}           The current instance of Zoetrope, so methods can be chained.
     */

  }, {
    key: 'play',
    value: function play(reversed) {
      if (this._startedAt === null) {
        this.dispatch('start');
        this._run(this._setStartTime(), reversed);
      }
      return this;
    }

    /**
     * Wrapper for the play function to make the external API clearer.
     * @return {Object} The current instance of Zoetrope, so methods can be chained.
     */

  }, {
    key: 'reverse',
    value: function reverse() {
      this.play(true);
      return this;
    }

    /**
     * Pause the animation but keep the RAF running so it can be resumed.
     * @return {Object} The current instance of Zoetrope, so methods can be chained.
     */

  }, {
    key: 'pause',
    value: function pause() {
      this._running = false;
      this._pausedAt = this._getNow();
      return this;
    }

    /**
     * Resume the animation if it was paused, otherwise it does nothing.
     * @return {Object} The current instance of Zoetrope, so methods can be chained.
     */

  }, {
    key: 'resume',
    value: function resume() {
      if (!this._running) {
        this._running = true;
        this._startedAt = this._startedAt + (this._getNow() - this._pausedAt);
      }
      return this;
    }

    /**
     * Stop the animation, cannot be resumed as it destroys the current instance of RAF.
     * @return {Object} The current instance of Zoetrope, so methods can be chained.
     */

  }, {
    key: 'stop',
    value: function stop() {
      window.cancelAnimationFrame(this._rafID);
      this._startedAt = null;
      return this;
    }

    /**
     * Loop the animation forwards then backwards with an optional delay inbetween.
     * @param  {Number} delay Duration of the delay in ms
     * @return {Object} The current instance of Zoetrope, so methods can be chained.
     */

  }, {
    key: 'loop',
    value: function loop(delay) {
      var _this2 = this;

      if (!delay) {
        delay = 0;
      }

      var i = 0;
      this.play();
      this.on('complete', function () {
        setTimeout(function () {
          i % 2 === 0 ? _this2.reverse() : _this2.play();
          i++;
        }, delay);
      });

      return this;
    }

    /**
     * @private
     *
     * All of the internal loop logic
     * @param  {Date} timestamp    Timestamp when loop was started
     * @param  {Boolean} reversed  Run the animation in reverse
     */

  }, {
    key: '_run',
    value: function _run(timestamp, reversed) {
      var _this3 = this;

      /**
       * If its paused then just skip onto the next frame.
       * This is effectively paused as we dont send out any tick events
       * and we never update the progress, but can be resumed. Still using
       * resources though so may look at a better way of implementing this.
       */
      if (!this._running) {
        window.requestAnimationFrame(function (timestamp) {
          // call requestAnimationFrame again with parameters
          _this3._run(timestamp, reversed);
        });
        return;
      }

      // Otherwise do the normal run function.
      var runtime = timestamp - this._startedAt;
      var progress = runtime / this._duration;

      progress = Math.min(progress, 1);

      if (reversed) {
        progress = 1 - progress;
      }

      progress = this._easingFunc(progress);

      this.dispatch('tick', progress);
      if (runtime <= this._duration) {
        // if duration not met yet
        this._rafID = window.requestAnimationFrame(function (timestamp) {
          // call requestAnimationFrame again with parameters
          _this3._run(timestamp, reversed);
        });
      } else {
        this._startedAt = null;
        this.dispatch('complete');
      }
    }

    /**
     * Execute any callbacks assigned to a specific event.
     * @param  {String} event  Name of the event
     * @param  {Mixed} params  Any params passed through
     */

  }, {
    key: 'dispatch',
    value: function dispatch(event, params) {
      for (var i = 0; i < this._handlers.length; i++) {
        if (this._handlers[i].event === event) {
          this._handlers[i].cb(params);
        }
      }
    }

    /**
     * Add a callback to to a specific event, will be called when
     * dispatch() is run.
     * @param  {String}   event Name of the event
     * @param  {Function} cb
     */

  }, {
    key: 'on',
    value: function on(event, cb) {
      this._handlers.push({ event: event, cb: cb });
      return this;
    }

    /**
     * @private
     *
     * Set the timestamp at the animation start time.
     * @return {Number} Return a copy of the timestamp
     */

  }, {
    key: '_setStartTime',
    value: function _setStartTime(cb) {
      this._startedAt = this._getNow();
      return this._startedAt;
    }

    /**
     * @private
     *
     * Get the current timestamp, try performance.now() first
     * as its more accurate, then fall back to Date.now().
     * @return {Mixed} Timestamp for right the hell now!
     */

  }, {
    key: '_getNow',
    value: function _getNow() {
      if (window.performance && window.performance.now) {
        return window.performance.now();
      }

      return Date.now();
    }

    /**
     * Log a shallow copy of the current state
     * @return {Object} The current instance of Zoetrope, so methods can be chained.
     */

  }, {
    key: 'debug',
    value: function debug(log) {
      if (typeof log === 'undefined' || log) console.log(Object.assign({}, this));
      return this;
    }

    /**
     * @private
     *
     * If the browser doesn't support Date.now, we will polyfill it to
     * use Date().getTime(), which is less performant but better supported.
     */

  }, {
    key: '_polyfillDateNow',
    value: function _polyfillDateNow() {
      if (!Date.now) {
        Date.now = function () {
          return new Date().getTime();
        };
      }
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

  }, {
    key: '_polyfillRAF',
    value: function _polyfillRAF() {
      var _this4 = this;

      var vendors = ['webkit', 'moz'];
      for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
        var vp = vendors[i];
        window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
      }
      if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || // iOS6 is buggy
      !window.requestAnimationFrame || !window.cancelAnimationFrame) {
        var lastTime = 0;
        window.requestAnimationFrame = function (callback) {
          var now = _this4._getNow();
          var nextTime = Math.max(lastTime + 16, now);
          return setTimeout(function () {
            return callback(lastTime = nextTime);
          }, nextTime - now);
        };
        window.cancelAnimationFrame = clearTimeout;
      }
    }
  }]);

  return Zoetrope;
}();

/**
   * easeOutQuart Easing Function
   * @param  {Number} t - current time
   * @return {Number} Eased time
   */


var easeOutQuart = function easeOutQuart(t) {
  return 1 - --t * t * t * t;
};

if (typeof module !== 'undefined') {
  module.exports = Zoetrope;
  module.exports.Zoetrope = Zoetrope;
  module.exports.Timeline = Timeline;
} else {
  window.Zoetrope = Zoetrope;
  window.Timeline = Timeline;
}