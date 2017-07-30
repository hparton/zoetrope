<p align="center"><img width="250" src="https://user-images.githubusercontent.com/5281898/28753259-ca7e3540-7529-11e7-81eb-4f418af8ddd3.png" alt="Laravel Mix"></p>

<p align="center">
  <a href="https://www.npmjs.com/package/zoetrope"><img src="https://badge.fury.io/js/zoetrope.svg" alt="npm version"></a>
  <a href="https://github.com/hparton/zoetrope/issues"><img src="https://img.shields.io/badge/issues-0-brightgreen.svg" alt="issues"></a>
  <a href="#"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="prs"></a>
  <a href="https://travis-ci.org/hparton/zoetrope"><img src="https://travis-ci.org/hparton/zoetrope.svg?branch=master" alt="build status"></a>
</p>

## Introduction

Zoetrope provides a clean API for defining basic javascript animations using requestAnimationFrame. It should be very familiar if you have ever used `jQuery.animate()` progress events. But Zeotrope is dependency free, has a small file size (less than 2KB gzipped) and is much more performant.

## Browser Support
If `requestAnimationFrame` isn't available, Zoetrope will polyfill rAF using setTimeout(). Using the implimentation by [Paul Irish](https://www.paulirish.com/2011/requestanimationframe-for-smart-animating/)

| [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/edge.png" alt="IE / Edge" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>IE / Edge | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/firefox.png" alt="Firefox" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Firefox | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/chrome.png" alt="Chrome" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Chrome | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/safari.png" alt="Safari" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Safari |
| :-------: | :-------: | :-------: | :-------: |
| IE9+ | ✓| ✓| ✓


## Installation

### Using npm

```sh
$ npm install zoetrope --save
```

### Using Yarn

```sh
$ yarn add zoetrope
```

## Example

<p align="center"><img src="https://user-images.githubusercontent.com/5281898/28754266-1779cb4c-753a-11e7-9a60-379006bc4dbf.gif" alt=""></p>

```js
import Zoetrope from 'zoetrope'

// Animating DOM elements, but this could easily be a canvas animation.
let $container = document.querySelector('.animation')
let $leftCircle = document.querySelector('.circle--left')
let $rightCircle = document.querySelector('.circle--right')

// Lots of nice easings can be found in this thread: https://gist.github.com/gre/1650294
let easeInOutCubic = t => { return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1 }


// Define our animation, all we need is the current progress
let spin = function (progress) {
  // translation
  let percentage = progress * 300
  // rotation
  let rotation = 360 * progress

  $leftCircle.style.transform = `translateX(${percentage}%) rotate(${rotation}deg)`
  $rightCircle.style.transform = `translateX(-${percentage}%) rotate(${rotation}deg)`
  $container.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`
}

let animation = new Zoetrope({
  duration: 3500,
  onTick: spin,
  onComplete: () => {
    console.log('Spin!')
  },
  easing: easeInOutCubic
})

animation.loop(500)
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

## License

Zoetrope is open-sourced software licensed under the [MIT license](http://opensource.org/licenses/MIT).
