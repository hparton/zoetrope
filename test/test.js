/*eslint no-unused-vars: "anim"*/

// Testing libs
import { describe, it } from 'mocha'
import { expect } from 'chai'

// Actual modual
import Zoetrope from '../dist/zoetrope.js'

describe('Setup', function () {
  let easeInCubic = t => { return t*t*t }

  it('Create new animation without any errors', function () {
    let anim = new Zoetrope()
  })

  it('Defaults are correct', function () {
    let anim = new Zoetrope()
    expect(anim._duration).to.equal(1000)
    expect(anim._easingFunc.name).to.equal('easeOutQuart')
  })

  it('Can set new values on creation', function() {
    let duration = 200;

    let anim = new Zoetrope({
      duration: duration,
      easing: easeInCubic
    })

    expect(anim._duration).to.equal(duration)
    expect(anim._easingFunc.name).to.equal('easeInCubic')
  })

  it('Event handlers set correctly', function() {
    let anim = new Zoetrope({
      onStart: () => {

      },
      onTick: (progress) => {
        console.log(progress)
      },
      onComplete: () => {
        console.log('Done!')
      }
    })

    expect(anim._handlers[0].event).to.equal('start')
    expect(anim._handlers[0].cb).to.be.a('function')

    expect(anim._handlers[1].event).to.equal('complete')
    expect(anim._handlers[1].cb).to.be.a('function')

    expect(anim._handlers[2].event).to.equal('tick')
    expect(anim._handlers[2].cb).to.be.a('function')
  })

  it('Can setup using chainable functions', function () {
    let anim = new Zoetrope()

    anim.duration(9999)
      .easing(easeInCubic)
      .on('tick', progress => {
        console.log(progress)
      })
      .on('complete', () => {
        console.log('Done!')
      })

    expect(anim._duration).to.equal(9999)
    expect(anim._easingFunc.name).to.equal('easeInCubic')
    expect(anim._handlers).to.have.lengthOf(2)
  })
})

describe('API', function() {
  let fallback = new Zoetrope();

  it('play', function (done) {
    let anim = new Zoetrope({
      duration: 50,
      onComplete: () => {
        done()
      }
    });

    anim.play()
  })

  it('reverse', function (done) {
    let anim = new Zoetrope({
      duration: 50,
      onComplete: () => {
        done()
      }
    })

    anim.reverse()
  })

  it('pause', function () {
    let anim = new Zoetrope({
      duration: 200
    })

    expect(anim._pausedAt).to.be.null
    expect(anim._running).to.be.true

    anim.play()
    anim.pause()

    expect(anim._running).to.be.false
    expect(anim._pausedAt).to.be.at.least(1)
  })

  it('resume', function () {
    let anim = new Zoetrope({
      duration: 200
    })

    anim.play()
    anim.pause()
    anim.resume()

    expect(anim._running).to.be.true
  })

  it('stop', function () {
    let anim = new Zoetrope({
      duration: 200
    })

    anim.play()

    expect(anim._startedAt).to.not.be.null

    anim.stop()

    expect(anim._startedAt).to.be.null
  })

  it('loop', function (done) {
    let i = 0
    let anim = new Zoetrope({
      duration: 20
    })

    anim.on('complete', () => {
      i++

      if (i === 2) {
        done()
      }
    })

    anim.loop(5)
  })

  it('duration', function () {
    // No need to retest, we know it works from 'Can setup using chainable functions'
    fallback.duration()
  })

  it('easing', function () {
    // No need to retest, we know it works from 'Can setup using chainable functions'
    fallback.easing(t => { return t })
  })

  it('debug', function () {
    // No idea how to test this one.
    fallback.debug(false)
  })
})

