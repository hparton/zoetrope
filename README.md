# 🐎 Zoetrope

[![npm version](https://badge.fury.io/js/zoetrope.svg)](https://badge.fury.io/js/zoetrope) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#) [![issues](https://img.shields.io/badge/issues-0-brightgreen.svg)](#) [![Build Status](https://travis-ci.org/hparton/zoetrope.svg?branch=master)](https://travis-ci.org/hparton/zoetrope)

Zoetrope is a lightweight animation helper, designed to make creating JS animations a bit easier. It doesn't do any animations out of the box, just removes the cruft when defining your own.

Should work in most browsers and will fallback to setTimeout() if RAF isn't available.

## Installation

### Using npm

```sh
$ npm install zoetrope --save
```

### Using Yarn

```sh
$ yarn add zoetrope
```

## Usage

```js
import Zoetrope from 'zoetrope';

// Define a new animation, can set duration, easing, onTick and onComplete here
let anim = new Zoetrope({
  duration: 1200, // default 1000
  easing: yourEasingFunc // default easeOutQuad
  onTick: (progress) => {
   // This is where your animation would live, progress is an eased value from 0 - 1
   console.log(progress)
  },
  onComplete: () => {
   console.log('Done!')
  }
});

anim.play();

// Or you can set options later, most functions for Zoetrope are chainable
let otherAnim = new Zoetrope();

otherAnim.duration(1200)
          .easing(yourEasingFunc)
          .on('tick', progress => {
            console.log(progress)
          })
          .on('complete', () => {
            console.log('Done!')
          })
          .play()
```

## API

#### play
Start the animation

```js
anim.play()
```

#### reverse
Start the animation in reverse

```js
anim.reverse()
```

#### pause
Pause the animation but keep the RAF running so it can be resumed.

```js
anim.pause()
```

#### resume
Resume the animation if it was paused, otherwise it does nothing.

```js
anim.resume()
```

#### stop
Stop the animation, cannot be resumed as it destroys the current instance of RAF.

```js
anim.stop()
```

#### loop(delay)
Loop the animation forwards then backwards with an optional delay inbetween.

```js
// Play the animation forwards, wait 200ms then play it backwards and repeat forever.
anim.loop(200)
```

#### duration(duration)
Set the duration of the animation in ms.

```js
// On creation
anim = new Zoetrope({
  duration: 5000
})

// Or later
anim.duration(5000)
```

#### easing(easingFunc)
Set a function to determine easing for the animation, if this is not called the animation will just use easeOutQuint easing.

```js
// Define your own, only accepts one value of current time
// More available here: https://gist.github.com/gre/1650294
let easeInCubic = t => { return t*t*t }

// On creation
anim = new Zoetrope({
  easing: easeInCubic
})

// Or later
anim.easing(easeInCubic)
```

#### debug
Log a shallow copy of the current state

```js
let anim = new Zoetrope({
  duration: 300
})

anim.debug() // logs: {duration: 300, easing: easeOutQuart, ...}
    .duration(2000)
    .debug() // logs: {duration: 2000, easing: easeOutQuart, ...}
```

## Events

#### 'tick'
Fired on each RAF update of the animation.<br>
**Returns:** progress - *Eased value between 0 - 1*

#### 'complete'
Fired when the animation has finished running.<br>
