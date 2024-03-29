## Explanation

Based on [Node.js docs](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate.): Any function passed as the setImmediate() argument is a callback that's executed in the **next** iteration of the event loop.  
A function passed to process.nextTick() is going to be executed on the **current** iteration of the event loop, after the current operation ends. This means it will always execute **before** setTimeout and setImmediate.

A setTimeout() callback with a 0ms delay is very similar to setImmediate(). The execution order _will depend on various factors_ (??), but they will be both run in the **next** iteration of the event loop.

A process.nextTick callback is added to process.nextTick queue. A Promise.then() callback is added to promises microtask queue. A setTimeout, setImmediate callback is added to macrotask queue. Event loop executes tasks in process.nextTick queue **first**, and **then** executes promises microtask queue, and **then** executes macrotask queue.

Based on [nextTick docs](https://nodejs.org/en/learn/asynchronous-work/understanding-processnexttick), Every time the event loop takes a full trip, we call it a tick.

Calling setTimeout(() => {}, 0) will execute the function at the end of next tick, much later than when using nextTick() which prioritizes the call and executes it **just before** the beginning of the next tick.

Use nextTick() when you want to make sure that in the next event loop iteration that code is already executed.

Based on [MDN queueMicrotask](https://developer.mozilla.org/en-US/docs/Web/API/queueMicrotask), The microtask is a short function which will run **after** the current task has completed its work and when there is **no other code waiting** to be run **before** control of the execution context is returned to the browser's event loop. This lets your code run without interfering with any other, potentially higher priority, code that is pending, but before the browser regains control over the execution context.  

According to [nodejs queueMicrotask](https://nodejs.org/api/process.html#when-to-use-queuemicrotask-vs-processnexttick), defers execution of a function using the **same** microtask queue used to execute the then, catch, and finally handlers of resolved promises. **Note**, the code example in the documentation is wrong. After node 11.0.0, the result is 2->3->1 (see microtask.js file).   

</br>

Highly recommended to read [event loop timers and nextTick](https://nodejs.org/en/guides/event-loop-timers-and-nexttick).  

In essence, the names should be swapped. `process.nextTick()` fires **more immediately** than `setImmediate()`, but this is an artifact of the past which is unlikely to change. 

According to [Richard Clayton article](https://rclayton.silvrback.com/scheduling-execution-in-node-js), process.nextTick or setTimeout(fn, 0) both compete against waiting I/O callbacks and potentially starve the event loop. 

</br>

### Other useful references

Based on [this SO answer](https://stackoverflow.com/questions/63770952/nodejs-setimmediate-function-realtime-usecase-and-example), ...When you're trying to not block the event loop for too long. You may run a chunk of code, then call setImmediate() and run the next chunk of code when the setImmediate() callback gets called and so on. This allows the processing of other events that arrive in the event loop in between your chunks of processing.

There are places in the nodejs library where it does this to guarantee that a callback is always called asynchronously, even if the result is known synchronously. This creates programming consistency for the caller so that the callback is not called synchronously sometimes and asynchronously sometimes which can lead to subtle bugs.

</br>

### Breaking Change in Node
According to [this github issue](https://github.com/nodejs/help/issues/1789#issuecomment-1312455792):
nodejs change this behavior since v11. Before it node ran microtask queue between each phase in event loop; since v11 and above node will also flush microtask queue between each task in timer phase.

Also read nodejs pull request pull/22842, and another relevant issue nodejs/node/issues/22257.

</br>

### Talking about promises

Based on [this link](https://thenewtoys.dev/blog/2021/02/08/lets-talk-about-how-to-talk-about-promises/):

```
async function doStuff() {
    const firstResult = await first();
    return second(firstResult);
}
```

If the promise from first is fulfilled, `doStuff` calls second and then resolves its promise to the promise second returns. At that point, until/unless second's promise is settled, the promise from `doStuff` is **both pending and resolved**. It will fulfill itself, or reject itself, when/if second's promise settles. That's the difference between resolving and fulfilling a promise.  
You might be wondering, "Why use the word 'resolved' when things are still up in the air?" It's because of the irrevocability I mentioned earlier: once a promise is resolved, nothing can change what's going to happen to it. If it's resolved with a non-promise value, it's fulfilled with that value and that's that. If it's resolved to a promise, it's going to follow that other promise and that's that. You can't change its resolution, or reject it directly.

</br>

### Use case for `Promise.resolve`

One of its primary use cases is where you don't know what you're going to receive — a native promise, a non-native promise from a library like Q or jQuery, a thenable, or a non-thenable value. By passing any those through `Promise.resolve` and consuming the resulting promise, you can treat them all the same way.
`Promise.resolve(input).then(x => { /* ... */ })`  
In that example, input can be just about anything, and when you get x in the fulfillment handler, you know that A) if input was a promise of some kind, it was fulfilled; and B) x is not a promise or thenable, so you can work with it as a value.
