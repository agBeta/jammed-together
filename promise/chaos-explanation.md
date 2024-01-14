
Based on [Node.js docs](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate.): Any function passed as the setImmediate() argument is a callback that's executed in the **next** iteration of the event loop.  
A function passed to process.nextTick() is going to be executed on the **current** iteration of the event loop, after the current operation ends. This means it will always execute **before** setTimeout and setImmediate.  

A setTimeout() callback with a 0ms delay is very similar to setImmediate(). The execution order *will depend on various factors* (??), but they will be both run in the **next** iteration of the event loop.

