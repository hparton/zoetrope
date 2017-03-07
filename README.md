# zeotrope
Simple Animation ES6 class with chainable functions

```js
var anim = new Animation()

anim.duration(200)
    .easing(function(time){ return easingFunc(time) });
    
anim.on('tick', function(time) {
  console.log(time)
})

anim.play()
```
