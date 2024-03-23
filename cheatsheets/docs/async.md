# Async Activity

## `setImmediate()` in Node

*from [Node.js understanding setImmediate docs](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate.)*  

When you want to execute some piece of code asynchronously, but as soon as possible, one option is to use the `setImmediate()` function provided by Node.js:

```js
setImmediate(() => {
  // run something
});
```

Any function passed as the setImmediate() argument is a callback that's executed in the next iteration of the event loop.

How is `setImmediate()` different from `setTimeout(() => {}, 0)` (passing a 0ms timeout), and from `process.nextTick()` and `Promise.then()`?

A function passed to `process.nextTick()` is going to be executed on the current iteration of the event loop, after the current operation ends. This means it will always execute before `setTimeout` and `setImmediate`.

A `setTimeout()` callback with a 0ms delay is very similar to `setImmediate()`. The execution order will depend on various factors, but they will be both run in the next iteration of the event loop.

A `process.nextTick` callback is added to `process.nextTick queue`. A `Promise.then()` callback is added to `promises microtask queue`. A `setTimeout`, `setImmediate` callback is added to `macrotask queue`.

Event loop executes tasks in `process.nextTick queue` first, and then executes `promises microtask queue`, and then executes `macrotask queue`.

Here is an example to show the order between `setImmediate()`, `process.nextTick()` and `Promise.then()`:

```js
const baz = () => console.log('baz');
const foo = () => console.log('foo');
const zoo = () => console.log('zoo');

const start = () => {
  console.log('start');
  setImmediate(baz);
  new Promise((resolve, reject) => {
    resolve('bar');
  }).then(resolve => {
    console.log(resolve);
    process.nextTick(zoo);
  });
  process.nextTick(foo);
};

start();

// start foo bar zoo baz
```

This code will first call `start()`, then call `foo()` in `process.nextTick queue`. After that, it will handle `promises microtask queue`, which prints `bar` and adds `zoo()` in `process.nextTick queue` at the same time. Then it will call `zoo()` which has just been added. In the end, the `baz()` in `macrotask queue` is called.

---

## The Node.js Event Loop

### What is the Event Loop?

The event loop is what allows Node.js to perform non-blocking I/O operations — despite the fact that JavaScript is single-threaded — by offloading operations to the system kernel whenever possible.

Since most modern kernels are multi-threaded, they can handle multiple operations executing in the background. When one of these operations completes, the kernel tells Node.js so that the appropriate callback may be added to the **poll** queue to eventually be executed. We'll explain this in further detail later in this topic.

### Event Loop Explained

When Node.js starts, it initializes the event loop, processes the provided input script (or drops into the [REPL][], which is not covered in this document) which may make async API calls, schedule timers, or call `process.nextTick()`, then begins processing the event loop.

The following diagram shows a simplified overview of the event loop's order of operations.

```
    ───────────────────────────┐
┌─>│           timers          │
│  └─────────────┬─────────────┘
│   ─────────────┴─────────────┐
│  │     pending callbacks     │
│  └─────────────┬─────────────┘
│   ─────────────┴─────────────┐
│  │       idle, prepare       │
│  └─────────────┬─────────────┘      ┌───────────────┐
│   ─────────────┴─────────────┐      │   incoming:   │
│  │           poll            │<─────┤  connections, │
│  └─────────────┬─────────────┘      │   data, etc.  │
│   ─────────────┴─────────────┐      └───────────────┘
│  │           check           │
│  └─────────────┬─────────────┘
│   ─────────────┴─────────────┐
└──┤      close callbacks      │
   └───────────────────────────┘
```

> Each box will be referred to as a "phase" of the event loop.

Each phase has a FIFO queue of callbacks to execute. While each phase is special in its own way, generally, when the event loop enters a given phase, it will perform any operations specific to that phase, then execute callbacks in that phase's queue until the queue has been exhausted or the maximum number of callbacks has executed. When the queue has been exhausted or the callback limit is reached, the event loop will move to the next phase, and so on.

Since any of these operations may schedule _more_ operations and new events processed in the **poll** phase are queued by the kernel, poll events can be queued while polling events are being processed. As a result, long running callbacks can allow the poll phase to run much longer than a timer's threshold. See the timers and poll sections for more details.

> There is a slight discrepancy between the Windows and the Unix/Linux implementation, but that's not important for this demonstration. The most important parts are here. There are actually seven or eight steps, but the ones we care about — ones that Node.js actually uses - are those above.

### Phases Overview

- **timers**: this phase executes callbacks scheduled by `setTimeout()` and `setInterval()`.
- **pending callbacks**: executes I/O callbacks deferred to the next loop iteration.
- **idle, prepare**: only used internally.
- **poll**: retrieve new I/O events; execute I/O related callbacks (almost all with the exception of close callbacks, the ones scheduled by timers, and `setImmediate()`); node will block here when appropriate.
- **check**: `setImmediate()` callbacks are invoked here.
- **close callbacks**: some close callbacks, e.g. `socket.on('close', ...)`.

Between each run of the event loop, Node.js checks if it is waiting for any asynchronous I/O or timers and shuts down cleanly if there are not any.

### Phases in Detail

#### timers

A timer specifies the **threshold** _after which_ a provided callback _may be executed_ rather than the **exact** time a person _wants it to be executed_. Timers callbacks will run as early as they can be scheduled after the specified amount of time has passed; however, Operating System scheduling or the running of other callbacks may delay them.

> Technically, the **poll** phase controls when timers are executed.

For example, say you schedule a timeout to execute after a 100 ms threshold, then your script starts asynchronously reading a file which takes 95 ms:

```js
const fs = require('node:fs');

function someAsyncOperation(callback) {
  // Assume this takes 95ms to complete
  fs.readFile('/path/to/file', callback);
}

const timeoutScheduled = Date.now();

setTimeout(() => {
  const delay = Date.now() - timeoutScheduled;

  console.log(`${delay}ms have passed since I was scheduled`);
}, 100);

// do someAsyncOperation which takes 95 ms to complete
someAsyncOperation(() => {
  const startCallback = Date.now();

  // do something that will take 10ms...
  while (Date.now() - startCallback < 10) {
    // do nothing
  }
});
```

When the event loop enters the **poll** phase, it has an empty queue (`fs.readFile()` has not completed), so it will wait for the number of ms remaining until the soonest timer's threshold is reached. While it is waiting 95 ms pass, `fs.readFile()` finishes reading the file and its callback which takes 10 ms to complete is added to the **poll** queue and executed. When the callback finishes, there are no more callbacks in the queue, so the event loop will see that the threshold of the soonest
timer has been reached then wrap back to the **timers** phase to execute the timer's callback. In this example, you will see that the total delay between the timer being scheduled and its callback being executed will be 105ms.

> To prevent the **poll** phase from starving the event loop, libuv] (the C library that implements the Node.js event loop and all of the asynchronous behaviors of the platform) also has a hard maximum (system dependent) before it stops polling for more events.

#### pending callbacks

This phase executes callbacks for some system operations such as types of TCP errors. For example if a TCP socket receives `ECONNREFUSED` when attempting to connect, some \*nix systems want to wait to report the error. This will be queued to execute in the **pending callbacks** phase.

#### poll

The **poll** phase has two main functions:

1. Calculating how long it should block and poll for I/O, then
2. Processing events in the **poll** queue.

When the event loop enters the **poll** phase _and there are no timers scheduled_, one of two things will happen:

- If the **poll** queue **is not empty**, the event loop will iterate through its queue of callbacks executing them synchronously until either the queue has been exhausted, or the system-dependent hard limit is reached.  

- If the **poll** queue **is empty**, one of two more things will happen:

    - If scripts have been scheduled by `setImmediate()`, the event loop will end the **poll** phase and continue to the **check** phase to execute those scheduled scripts.

    - If scripts **have not** been scheduled by `setImmediate()`, the event loop will wait for callbacks to be added to the queue, then execute them immediately.

Once the **poll** queue is empty the event loop will check for timers _whose time thresholds have been reached_. If one or more timers are ready, the event loop will wrap back to the **timers** phase to execute those timers' callbacks.

#### check

This phase allows a person to execute callbacks immediately after the **poll** phase has completed. If the **poll** phase becomes idle and scripts have been queued with `setImmediate()`, the event loop may continue to the **check** phase rather than waiting.

`setImmediate()` is actually a special timer that runs in a separate phase of the event loop. It uses a libuv API that schedules callbacks to execute after the **poll** phase has completed.

Generally, as the code is executed, the event loop will eventually hit the **poll** phase where it will wait for an incoming connection, request, etc. However, if a callback has been scheduled with `setImmediate()` and the **poll** phase becomes idle, it will end and continue to the **check** phase rather than waiting for **poll** events.

#### close callbacks

If a socket or handle is closed abruptly (e.g. `socket.destroy()`), the `'close'` event will be emitted in this phase. Otherwise it will be emitted via `process.nextTick()`.

<br/>

### `setImmediate()` vs `setTimeout()`

`setImmediate()` and `setTimeout()` are similar, but behave in different ways depending on when they are called.

- `setImmediate()` is designed to execute a script once the current **poll** phase completes.
- `setTimeout()` schedules a script to be run after a minimum threshold in ms has elapsed.

The order in which the timers are executed will vary depending on the context in which they are called. If both are called from within the main module, then timing will be bound by the performance of the process (which can be impacted by other applications running on the machine).

For example, if we run the following script which is not within an I/O cycle (i.e. the main module), the order in which the two timers are executed is non-deterministic, as it is bound by the performance of the process:

```js
// timeout_vs_immediate.js
setTimeout(() => {
  console.log('timeout');
}, 0);

setImmediate(() => {
  console.log('immediate');
});
```

```bash
$ node timeout_vs_immediate.js
timeout
immediate

$ node timeout_vs_immediate.js
immediate
timeout
```

However, if you move the two calls within an I/O cycle, the immediate callback is always executed first:

```js
// timeout_vs_immediate.js
const fs = require('node:fs');

fs.readFile(__filename, () => {
  setTimeout(() => {
    console.log('timeout');
  }, 0);
  setImmediate(() => {
    console.log('immediate');
  });
});
```

```bash
$ node timeout_vs_immediate.js
immediate
timeout

$ node timeout_vs_immediate.js
immediate
timeout
```

The main advantage to using `setImmediate()` over `setTimeout()` is `setImmediate()` will always be executed before any timers if scheduled within an I/O cycle, independently of how many timers are present.

</br>

### `process.nextTick()`

#### Understanding `process.nextTick()`

You may have noticed that `process.nextTick()` was not displayed in the diagram, even though it's a part of the asynchronous API. This is because `process.nextTick()` is not technically part of the event loop. Instead, the `nextTickQueue` will be processed after the current operation is completed, regardless of the current phase of the event loop. Here,
an _operation_ is defined as a transition from the underlying C/C++ handler, and handling the JavaScript that needs to be
executed.

Looking back at our diagram, any time you call `process.nextTick()` in a given phase, all callbacks passed to `process.nextTick()` will be resolved before the event loop continues. This can create some bad situations because **it allows you to "starve" your I/O by making recursive `process.nextTick()` calls**, which prevents the event loop from reaching the **poll** phase.

#### Why would that be allowed?

Why would something like this be included in Node.js? Part of it is a design philosophy where an API should always be asynchronous even where it doesn't have to be. Take this code snippet for example:

```js
function apiCall(arg, callback) {
  if (typeof arg !== 'string')
    return process.nextTick(
      callback,
      new TypeError('argument should be string')
    );
}
```

The snippet does an argument check and if it's not correct, it will pass the error to the callback. The API updated fairly recently to allow passing arguments to `process.nextTick()` allowing it to take any arguments passed after the callback to be propagated as the arguments to the callback so you don't have to nest functions.

What we're doing is passing an error back to the user but only _after_ we have allowed the rest of the user's code to execute. By using `process.nextTick()` we guarantee that `apiCall()` always runs its callback _after_ the rest of the user's code and _before_ the event loop is allowed to proceed. To achieve this, the JS call stack is allowed to unwind then immediately execute the provided callback which allows a person to make recursive calls to `process.nextTick()` without reaching a `RangeError: Maximum call stack size exceeded from v8`.

This philosophy can lead to some potentially problematic situations.  
Take this snippet for example:

```js
let bar;

// this has an asynchronous signature, but calls callback synchronously
function someAsyncApiCall(callback) {
  callback();
}

// the callback is called before `someAsyncApiCall` completes.
someAsyncApiCall(() => {
  // since someAsyncApiCall hasn't completed, bar hasn't been assigned any value
  console.log('bar', bar); // undefined
});

bar = 1;
```

The user defines `someAsyncApiCall()` to have an asynchronous signature, but it actually operates synchronously. When it is called, the callback provided to `someAsyncApiCall()` is called in the same phase of the event loop because `someAsyncApiCall()` doesn't actually do anything asynchronously. As a result, the callback tries to reference `bar` even though it may not have that variable in scope yet, because the script has not been able to run to completion.

By placing the callback in a `process.nextTick()`, the script still has the ability to run to completion, allowing all the variables, functions, etc., to be initialized prior to the callback being called. It also has the advantage of not allowing the event loop to continue. It may be useful for the user to be alerted to an error before the event loop is allowed to continue. Here is the previous example using `process.nextTick()`:

```js
let bar;
function someAsyncApiCall(callback) {
  process.nextTick(callback);
}
someAsyncApiCall(() => {
  console.log('bar', bar); // 1
});
bar = 1;
```

Here's another real world example:

```js
const server = net.createServer(() => {}).listen(8080);
server.on('listening', () => {});
```

When only a port is passed, the port is bound immediately. So, the `'listening'` callback could be called immediately. The problem is that the `.on('listening')` callback will not have been set by that time.

To get around this, the `'listening'` event is queued in a `nextTick()` to allow the script to run to completion. This allows the user to set any event handlers they want.

<br/>

### `process.nextTick()` vs `setImmediate()`

We have two calls that are similar as far as users are concerned, but their names are confusing.

- `process.nextTick()` fires immediately on the same phase
- `setImmediate()` fires on the following iteration or 'tick' of the event loop

In essence, the names should be swapped. `process.nextTick()` fires more immediately than `setImmediate()`, but this is an artifact of the past which is unlikely to change. Making this switch would break a large percentage of the packages on npm. Every day more new modules are being added, which means every day we wait, more potential breakages occur. While they are confusing, the names themselves won't change.

> We recommend developers use `setImmediate()` in all cases because it's easier to reason about.

### Why use `process.nextTick()`?

There are two main reasons:

1. Allow users to handle errors, cleanup any then unneeded resources, or perhaps try the request again before the event loop continues.

2. At times it's necessary to allow a callback to run after the call stack has unwound but before the event loop continues.

One example is to match the user's expectations. Simple example:

```js
const server = net.createServer();
server.on('connection', conn => {});

server.listen(8080);
server.on('listening', () => {});
```

Say that `listen()` is run at the beginning of the event loop, but the listening callback is placed in a `setImmediate()`. Unless a hostname is passed, binding to the port will happen immediately. For the event loop to proceed, it must hit the **poll** phase, which means there is a non-zero chance that a connection could have been received allowing the connection event to be fired before the listening event.

Another example is extending an `EventEmitter` and emitting an event from within the constructor:

```js
const EventEmitter = require('node:events');

class MyEmitter extends EventEmitter {
  constructor() {
    super();
    this.emit('event');
  }
}

const myEmitter = new MyEmitter();
myEmitter.on('event', () => {
  console.log('an event occurred!');
});
```

You can't emit an event from the constructor immediately because the script will not have processed to the point where the user
assigns a callback to that event. So, within the constructor itself, you can use `process.nextTick()` to set a callback to emit the event after the constructor has finished, which provides the expected results:

```js
const EventEmitter = require('node:events');

class MyEmitter extends EventEmitter {
  constructor() {
    super();

    // use nextTick to emit the event once a handler is assigned
    process.nextTick(() => {
      this.emit('event');
    });
  }
}

const myEmitter = new MyEmitter();
myEmitter.on('event', () => {
  console.log('an event occurred!');
});
```

[libuv]: https://libuv.org/
[REPL]: https://nodejs.org/api/repl.html#repl_repl

---

</br>

## Understanding process.nextTick()

As you try to understand the Node.js event loop, one important part of it is `process.nextTick()`. Every time the event loop takes a full trip, we call it a tick.

When we pass a function to `process.nextTick()`, we instruct the engine to invoke this function at the end of the current operation, before the next event loop tick starts:

```js
process.nextTick(() => {
  // do something
});
```

The event loop is busy processing the current function code. When this operation ends, the JS engine runs all the functions passed to `nextTick` calls during that operation.

It's the way we can tell the JS engine to process a function asynchronously (after the current function), but as soon as possible, not queue it.

Calling `setTimeout(() => {}, 0)` will execute the function at the end of next tick, much later than when using `nextTick()` which prioritizes the call and executes it just before the beginning of the next tick.

Use `nextTick()` when you want to make sure that in the next event loop iteration that code is already executed.

#### An Example of the order of events:

```js
console.log('Hello => number 1');

setImmediate(() => {
  console.log('Running before the timeout => number 3');
});

setTimeout(() => {
  console.log('The timeout running last => number 4');
}, 0);

process.nextTick(() => {
  console.log('Running at next tick => number 2');
});
```

Output:

```bash
Hello => number 1
Running at next tick => number 2
The timeout running last => number 4
Running before the timeout => number 3
```

---

## More

*[MDN queueMicrotask](https://developer.mozilla.org/en-US/docs/Web/API/queueMicrotask)*  

The microtask is a short function which will run **after** the current task has completed its work and when there is **no other code waiting** to be run **before** control of the execution context is returned to the browser's event loop. This lets your code run without interfering with any other, potentially higher priority, code that is pending, but before the browser regains control over the execution context.  

*[nodejs queueMicrotask](https://nodejs.org/api/process.html#when-to-use-queuemicrotask-vs-processnexttick)*  

... defers execution of a function using the **same** microtask queue used to execute the then, catch, and finally handlers of resolved promises. **Note**, the code example in the documentation is wrong. After node 11.0.0, the result is 2->3->1 (see microtask.js file).   

### Breaking Change in Node
According to [this github issue](https://github.com/nodejs/help/issues/1789#issuecomment-1312455792):  

nodejs change this behavior since v11. Before it node ran microtask queue between each phase in event loop; since v11 and above node will also flush microtask queue between each task in timer phase.

Also read nodejs pull request pull/22842, and another relevant issue nodejs/node/issues/22257.


*Based on [SO about real usecase of setImmediate](https://stackoverflow.com/questions/63770952/nodejs-setimmediate-function-realtime-usecase-and-example)*  

... When you're trying to not block the event loop for too long. You may run a chunk of code, then call setImmediate() and run the next chunk of code when the setImmediate() callback gets called and so on. This allows the processing of other events that arrive in the event loop in between your chunks of processing.

There are places in the nodejs library where it does this to guarantee that a callback is always called asynchronously, even if the result is known synchronously. This creates programming consistency for the caller so that the callback is not called synchronously sometimes and asynchronously sometimes which can lead to subtle bugs.

</br>


---

## Let's talk about how to talk about promises

Based on [T.J Cowder blog post](https://thenewtoys.dev/blog/2021/02/08/lets-talk-about-how-to-talk-about-promises/)

Did you know...

- ...that "fulfilling" a promise and "resolving" a promise aren't the same thing?
- ...that a promise can be both "pending" and "resolved" at the same time?
- ...that lots of your code is creating these pending resolved promises?
- ...that when you resolve a promise you might be rejecting it rather than fulfilling it (or neither)?
- If you answered "yes" to all of the questions above, there's probably no new information for you in this post. But if you answered "no" or "I don't know" to any of those, read on!

First off: You are not alone. "Resolve" is probably the most misunderstood word in promise-land. I completely misunderstood it when I first ran into promises some years back. People think "resolve" and "fulfill" are synonyms, but they aren't, and since the words "resolve" and "fulfill" are part of the JavaScript promise API¹ and not just some arbitrary terms I've picked, it's important to understand the difference.

A promises's primary state is one of three mutually-exclusive values:

pending - the initial state of most promises, it hasn't been fulfilled or rejected
fulfilled - the promise has been fulfilled with a fulfillment value
rejected - the promise has been rejected with a rejection reason (saying why the promise can't be fulfilled)
For convenience, we also use the collective term "settled" to mean "fulfilled or rejected."

Following on from that, we can say that:

You fulfill a promise (with a fulfillment value)
or
You reject a promise (with a rejection reason explaining why it can't be fulfilled)
Notice that the word resolve isn't anywhere in the above. Contrary to popular belief, resolving a promise doesn't necessarily change its primary state. In fact, it often doesn't. Promise resolution is a separate concept from promise fulfillment.

So what's resolve then? When you resolve a promise, you determine what will happen to that promise from then on. When you resolve a promise with something like `42` or `"answer"` or `{"example": "result"}`, yes, you do fulfill the promise with that value. But if you resolve your promise to another promise (or more generally a thenable), you're telling your promise to follow that other promise and do what it does:

If the other promise is fulfilled, your original promise will fulfill itself with the other promise's fulfillment value
If the other promise is rejected, your original promise will reject itself with the other promise's rejection reason
If the other promise never settles, your original promise won't either
Regardless of what happens, though, there's nothing further you can do to the promise to affect the outcome. The promise is resolved to the other promise, irrevocably. Any attempt to resolve it again, or to reject it, will have no effect.

Now, you might be thinking of the `resolve` function the `new Promise` callback receives as an argument and saying "Well, okay, but I don't think I've ever passed a promise to `resolve`. That's just a niche use case." Fair enough! But that's just one way you resolve a promise, and probably not the main one. Probably the main one is returning something from a promise handler function, and I bet you've returned promises from handler functions a lot. Consider this, assuming `first` and `second` return promises:

```js
function doStuff() {
    return first()
    .then(firstResult => {
        return second(firstResult);
    });
}
// ...
doStuff()
.then(result => {
    // ...use `result`...
});
.catch(error => {
    // ...handle/report error...
});
```

(Yes, that first `then` call could be just `.then(second)`. The goal here is clarity.)

Before async functions came around, you probably wrote code like that all the time. Guess what? It creates a pending resolved promise. Here's how:

- When you call `doStuff`, it calls `first` which creates and returns a promise (Promise A).
- When you call `then` on that promise, `then` creates and returns another promise, the one that `doStuff` returns (Promise B).
- Let's assume that at some point, the promise from `first` is fulfilled. The fulfillment handler in `doStuff` calls `second` with that fulfillment value and returns the promise second gives it (Promise C). That resolves Promise B to Promise C. From that point forward, Promise B follows Promise C and does what it does.

In the normal case, Promise C won't be settled yet when that code resolves Promise B to it, so Promise B remains pending (neither fulfilled nor rejected), but it's also resolved (nothing can change what's going to happen, it's going to follow Promise C no matter what). If/when Promise C is settled, Promise B will settle itself the same way.

The same thing happens in an `async` function, since `async` functions are syntax for creating and consuming promises. Let's look at how we might write `doStuff` using `async/await`:
```js
async function doStuff() {
    const firstResult = await first();
    return second(firstResult);
}
```

Sometimes you might resolve a promise to another promise that's already settled. That's probably not the case in this example, but when that's true the promise you're resolving adopts the state of the promise you resolve it to immediately, although as always any promise handlers are called asynchronously. That's how resolving a promise can sometimes reject it: if you resolve a promise to a rejected promise, you implicitly reject the promise.


If the promise from `first` is fulfilled, `doStuff` calls `second` and then resolves its promise to the promise `second` returns. At that point, until/unless `second`'s promise is settled, the promise from `doStuff` is both pending and resolved. It will fulfill itself, or reject itself, when/if `second`'s promise settles.

That's the difference between resolving and fulfilling a promise.

You might be wondering, "Why use the word 'resolved' when things are still up in the air?" It's because of the irrevocability I mentioned earlier: once a promise is resolved, nothing can change what's going to happen to it. If it's resolved with a non-promise value, it's fulfilled with that value and that's that. If it's resolved to a promise, it's going to follow that other promise and that's that. You can't change its resolution, or reject it directly. Often, you don't have any way to even try to do that, but even if you do have the promise's `resolve` and `reject` functions from the `new Promise` callback, neither of them does anything once the promise is resolved. It's on a particular course, and while the outcome of the course it's on may not be clear yet, you can't change the course it's on. (You'll sometimes hear resolved/unresolved called "fates" to differentiate them from the states "pending," "fulfilled," and "rejected." For me that's a bit contrived but it may still be useful.)

So to round up, some verbs:

- fulfill - to settle with a fulfillment value
- reject - to settle with a rejection reason saying why the promise can't be fulfilled
- settle - to fulfill or reject (I'm aware this is circular and I'm fine with that)
- resolve - to either

- - make a promise follow another promise (typically resolve to, which is Promises/A+ spec terminology)
or
- - fulfill it with a value (I typically use resolve with in this case, if I know I'm working with a non-thenable, though that may be just my personal convention)


Some adjectives for a promise's primary state:

- pending - neither fulfilled nor rejected
- fulfilled - fulfilled with a fulfillment value
- rejected - rejected with a rejection reason saying why the promise can't be fulfilled

And some further adjectives:

- settled - convenience term for "fulfilled or rejected"
- resolved - either settled or following another promise that will determine what happens to this promise
- unresolved - not resolved (and thus can be resolved)

Just a quick coda before we go:

I've mentioned two of the ways you resolve promises, 1) calling the `resolve` function you get from `new Promise` and 2) returning a value from a promise handler callback. A third way you resolve a promise is by using `Promise.resolve`. `Promise.resolve` creates a promise that's resolved to what you pass into it. One of its primary use cases is where you don't know what you're going to receive — a native promise, a non-native promise from a library like `Q` or `jQuery`, a thenable, or a non-thenable value. By passing any those through `Promise.resolve` and consuming the resulting promise, you can treat them all the same way:
```js
Promise.resolve(input)
.then(x => {
    // ...
})
// ...
```
In that example, input can be just about anything, and when you get x in the fulfillment handler, you know that A) if input was a promise of some kind, it was fulfilled; and B) x is not a promise or thenable, so you can work with it as a value.


----


## `await` vs `return` vs `return await`

*from [jake archibald's blog](https://jakearchibald.com/2017/await-vs-return-vs-return-await/)*  

When writing async functions, there are differences between `await` vs `return` vs `return await`, and picking the right one is important.

Let's start with this async function:

```js
async function waitAndMaybeReject() {
  // Wait one second
  await new Promise((r) => setTimeout(r, 1000));
  // Toss a coin
  const isHeads = Boolean(Math.round(Math.random()));

  if (isHeads) return 'yay';
  throw Error('Boo!');
}
```

This returns a promise that waits a second, then has a 50/50 chance of fulfilling with `"yay"` or rejecting with an error. Let's use it in a few subtlety different ways:

### Just calling

```js
async function foo() {
  try {
    waitAndMaybeReject();
  } catch (e) {
    return 'caught';
  }
}
```

Here, if you call `foo`, the returned promise will always **fulfill with undefined, without waiting**.

Since we don't await or return the result of `waitAndMaybeReject()`, we don't react to it in any way. Code like this is usually a mistake.

### Awaiting

```js
async function foo() {
  try {
    await waitAndMaybeReject();
  } catch (e) {
    return 'caught';
  }
}
```

Here, if you call `foo`, the returned promise will always **wait one second**, then either **fulfill with undefined**, or **fulfill with `"caught"`**.

Because we await the result of `waitAndMaybeReject()`, its rejection will be turned into a throw, and our catch block will execute. However, if `waitAndMaybeReject()` fulfills, we don't do anything with the value.

### Returning

```js
async function foo() {
  try {
    return waitAndMaybeReject();
  } catch (e) {
    return 'caught';
  }
}
```

Here, if you call `foo`, the returned promise will always **wait one second**, then either **fulfill with `"yay"`**, or **reject with `Error('Boo!')`**.

By returning `waitAndMaybeReject()`, we're deferring to its result, so our catch block never runs.

### Return-awaiting

The thing you want in try/catch blocks, is `return await`:

```js
async function foo() {
  try {
    return await waitAndMaybeReject();
  } catch (e) {
    return 'caught';
  }
}
```

Here, if you call `foo`, the returned promise will always **wait one second**, then either **fulfill with `"yay"`**, or **fulfill with `"caught"`**.

Because we await the result of `waitAndMaybeReject()`, its rejection will be turned into a throw, and our catch block will execute. If `waitAndMaybeReject()` fulfills, we return its result.

If the above seems confusing, it might be easier to think of it as two separate steps:

```js
async function foo() {
  try {
    // Wait for the result of waitAndMaybeReject() to settle,
    // and assign the fulfilled value to fulfilledValue:
    const fulfilledValue = await waitAndMaybeReject();
    // If the result of waitAndMaybeReject() rejects, our code
    // throws, and we jump to the catch block.
    // Otherwise, this block continues to run:
    return fulfilledValue;
  } catch (e) {
    return 'caught';
  }
}
```

Note: Outside of try/catch blocks, `return await` is redundant. There's even an [ESLint rule to detect it](https://eslint.org/docs/latest/rules/no-return-await), but it allows it in try/catch.