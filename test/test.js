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
      onTick: (progress) => {
        console.log(progress)
      },
      onComplete: () => {
        console.log('Done!')
      }
    })

    expect(anim._handlers[0].event).to.equal('complete')
    expect(anim._handlers[0].cb).to.be.a('function')

    expect(anim._handlers[1].event).to.equal('tick')
    expect(anim._handlers[1].cb).to.be.a('function')
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

