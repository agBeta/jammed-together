# More

## Node & threads

[SO question](https://stackoverflow.com/q/77218759): I started learning Node.JS and ran into several misunderstandings that I couldn't find answers online. Let's say I use non-blocking file reading
```js
fs.readFile("filename.txt", (err, data) => { ... })
```
As far as I know, reading a file is a synchronous operation performed by a thread (if you do not use third-party libraries, but I could be wrong). This is how I understand what happens next: one of the free threads from the pool will “take” this task => after completion, a callback will be executed. So I have a few questions:

What happens if all threads are busy with other tasks when I want to read a file? Will the main thread wait until one of the threads is free to give it this task?
If so, is it normal practice to create a Worker Thread in such situations?

**Answer (2023)** 

Within nodejs, file asynchronous operations are carried out by a thread pool. So, a `fs.readFile()` operation works like this:

1. Call `fs.open()` to open the file in question.

2. The implementation of that calls some native code (built into nodejs). That native code then asks for an available thread in the thread pool.

3. If a thread is available, the file open operation is turned over to the thread and the open function returns. This eventually gets control back to the event loop so other nodejs code can run while the thread in the thread pool is doing its work.

4. If a thread is not available, then it registers an internal callback to be notified when a thread is available and then the open function returns. This eventually gets control back to the event loop so other nodejs code can run while the thread in the thread pool is doing its work.

5. When a thread becomes available, the callback is called and it then picks up where step 3 was.

6. When the thread in the thread pool finishes the open operation, it posts a message to the nodejs event queue indicating that the open operation is complete. When nodejs is done doing other things and it gets to be this events turn, then nodejs executes the callback associated with the original fs.open() call that started all this.

7. That callback then carries on the next step in the `fs.readFile()` operation by starting to read data with `fs.read()` which then goes through a very similar process.

> What happens if all threads are busy with other tasks when I want to read a file? Will the main thread wait until one of the threads is free to give it this task?

The main thread will not wait. This is all non-blocking. The operation has been started, it just isn't making progress yet through its first `fs.open()` step because a thread pool thread isn't available. But, that doesn't make it blocking. `fs.readFile()` still returns immediately and nodejs is free to do other things. It's just the the non-blocking `fs.open()` step is taking longer. Steps 4 and 5 above cover the scenario where no thread is immediately available.

If so, is it normal practice to create a Worker Thread in such situations?

No, it is not and that may not even help because worker threads may even share the same thread pool. If you really, really, really want to, you can make the thread pool larger by setting an environment variable before you start nodejs.

But, unless your system has a whole bunch of completely separate disks using separate I/O controllers and these requests are all on separate disks, it's generally not useful to attempt to run a whole bunch of disk requests on the same disk at the same time. That's because internally, the disk can really only do one thing at a time and attempting to do 10 things at once probably just slows everything down causing everything to take longer, particularly with a spinning disk that has to physically move the read/write head around the platter in order to do anything. Whereas allowing only a few operations to proceed in parallel and making other operations wait their turn is actually more efficient when they are all competing for the same disk.

---

## `<script>`

The `<script>` HTML element is used to embed executable code or data; this is typically used to embed or refer to JavaScript code. The `<script>` element can also be used with other languages, such as WebGL's GLSL shader programming language and JSON.

This element includes the [global attributes](/en-US/docs/Web/HTML/Global_attributes).

- `async`

  : For classic scripts, if the `async` attribute is present, then the classic script will be fetched in parallel to parsing and evaluated as soon as it is available.

    For module scripts, if the `async` attribute is present then the scripts and all their dependencies will be fetched in parallel to parsing and evaluated as soon as they are available. This attribute allows the elimination of **parser-blocking JavaScript** where the browser would have to load and evaluate scripts before continuing to parse. `defer` has a similar effect in this case.

    This is a boolean attribute: the presence of a boolean attribute on an element represents the true value, and the absence of the attribute represents the false value.

- `defer`

  : This Boolean attribute is set to indicate to a browser that the script is meant to be executed after the document has been parsed, but before firing `DOMContentLoaded`. Scripts with the `defer` attribute will prevent the `DOMContentLoaded` event from firing until the script has loaded and finished evaluating.

- `type="module"`

   : This value causes the code to be treated as a JavaScript module. The processing of the script contents is deferred. The charset and defer attributes have no effect. Unlike classic scripts, module scripts require the use of the CORS protocol for cross-origin fetching.


**Note**: Scripts without `async`, `defer` or `type="module"` attributes, as well as inline scripts without the `type="module"` attribute, are fetched and executed immediately before the browser continues to parse the page.


[SO Question](https://stackoverflow.com/questions/8996852/load-and-execute-order-of-scripts/8996894#8996894): There are so many different ways to include JavaScript in a html page. I know about the following options:

- inline code or loaded from external URI
- included in `<head>` or `<body>` tag [1,2]
- having none, `defer` or `async` attribute (only external scripts)
- included in static source or added dynamically by other scripts (at different parse states, with different methods).


**Answer**

If you aren't dynamically loading scripts or marking them as `defer` or `async`, then scripts are loaded in the order encountered in the page. It doesn't matter whether it's an external script or an inline script - they are executed in the order they are encountered in the page. Inline scripts that come after external scripts are held until all external scripts that came before them have loaded and run.

Async scripts (regardless of how they are specified as async) load and run in an unpredictable order. The browser loads them in parallel and it is free to run them in whatever order it wants.

There is no predictable order among multiple async things. If one needed a predictable order, then it would have to be coded in by registering for load notifications from the async scripts and manually sequencing javascript calls when the appropriate things are loaded.

When a script tag is inserted dynamically, how the execution order behaves will depend upon the browser. You can see how Firefox behaves in this reference article. In a nutshell, the newer versions of Firefox default a dynamically added script tag to async unless the script tag has been set otherwise.

A script tag with `async` may be run as soon as it is loaded. In fact, the browser may pause the parser from whatever else it was doing and run that script. So, it really can run at almost any time. If the script was cached, it might run almost immediately. If the script takes awhile to load, it might run after the parser is done. The one thing to remember with async is that it can run anytime and that time is not predictable.

A script tag with `defer` waits until the entire parser is done and then runs all scripts marked with `defer` in the order they were encountered. This allows you to mark several scripts that depend upon one another as defer. They will all get postponed until after the document parser is done, but they will execute in the order they were encountered preserving their dependencies. I think of defer like the scripts are dropped into a queue that will be processed after the parser is done. Technically, the browser may be downloading the scripts in the background at any time, but they won't execute or block the parser until after the parser is done parsing the page and parsing and running any inline scripts that are not marked defer or async.

All scripts with `type="module"` are automatically given the `defer` attribute. This downloads them in parallel (if not inline) with other loading of the page and then runs them in order, but after the parser is done.

Module scripts can also be given the async attribute which will run inline module scripts as soon as possible, not waiting until the parser is done and not waiting to run the async script in any particular order relative to other scripts.

There's a pretty useful timeline chart that shows fetch and execution of different combinations of scripts, including module scripts here in v8 features/module article.

![image0002](image0002.png)


---

## REST

[SO](https://stackoverflow.com/questions/671118/what-exactly-is-restful-programming)  

Here is my basic outline of REST. I tried to demonstrate the thinking behind each of the components in a RESTful architecture so that understanding the concept is more intuitive. Hopefully this helps demystify REST for some people!

REST (Representational State Transfer) is a design architecture that outlines how networked resources (i.e. nodes that share information) are designed and addressed. In general, a RESTful architecture makes it so that the client (the requesting machine) and the server (the responding machine) can request to read, write, and update data without the client having to know how the server operates and the server can pass it back without needing to know anything about the client. Okay, cool...but how do we do this in practice?

- The most obvious requirement is that there needs to be a universal language of some sort so that the server can tell the client what it is trying to do with the request and for the server to respond.

- But to find any given resource and then tell the client where that resource lives, there needs to be a universal way of pointing at resources. This is where Universal Resource Identifiers (URIs) come in; they are basically unique addresses to find the resources.

But the REST architecture doesn’t end there! While the above fulfills the basic needs of what we want, we also want to have an architecture that supports high volume traffic since any given server usually handles responses from a number of clients. Thus, we don’t want to overwhelm the server by having it remember information about previous requests.

- Therefore, we impose the restriction that each request-response pair between the client and the server is independent, meaning that the server doesn’t have to remember anything about previous requests (previous states of the client-server interaction) to respond to a new request. This means that we want our interactions to be stateless.

- To further ease the strain on our server from redoing computations that have already been recently done for a given client, REST also allows caching. Basically, caching means to take a snapshot of the initial response provided to the client. If the client makes the same request again, the server can provide the client with the snapshot rather than redo all of the computations that were necessary to create the initial response. However, since it is a snapshot, if the snapshot has not expired--the server sets an expiration time in advance--and the response has been updated since the initial cache (i.e. the request would give a different answer than the cached response), the client will not see the updates until the cache expires (or the cache is cleared) and the response is rendered from scratch again.

- The last thing that you’ll often here about RESTful architectures is that they are layered. We have actually already been implicitly discussing this requirement in our discussion of the interaction between the client and server. Basically, this means that each layer in our system interacts only with adjacent layers. So in our discussion, the client layer interacts with our server layer (and vice versa), but there might be other server layers that help the primary server process a request that the client does not directly communicate with. Rather, the server passes on the request as necessary.

Now, if all of this sounds familiar, then great. The Hypertext Transfer Protocol (HTTP), which defines the communication protocol via the World Wide Web is an implementation of the abstract notion of RESTful architecture (or an implementation of the abstract REST class if you're an OOP fanatic like me). In this implementation of REST, the client and server interact via GET, POST, PUT, DELETE, etc., which are part of the universal language and the resources can be pointed to using URLs.


---

## Module

from [v8 features javascript modules](https://v8.dev/features/modules)  

### `import.meta`
Another new module-related feature is `import.meta`, which gives you metadata about the current module. The exact metadata you get is not specified as part of ECMAScript; it depends on the host environment. In a browser, you might get different metadata than in Node.js, for example.

Here’s an example of import.meta on the web. By default, images are loaded relative to the current URL in HTML documents. import.meta.url makes it possible to load an image relative to the current module instead.
```js
function loadThumbnail(relativePath) {
  const url = new URL(relativePath, import.meta.url);
  const image = new Image();
  image.src = url;
  return image;
}

const thumbnail = loadThumbnail('../img/thumbnail.png');
container.append(thumbnail);
```

### Bundling

With modules, it becomes possible to develop websites without using bundlers such as webpack, Rollup, or Parcel. It’s fine to use native JS modules directly in the following scenarios:

- during local development
- in production for small web apps with less than 100 modules in total and with a relatively shallow dependency tree (i.e. a maximum depth less than 5)

However, as we learned during our bottleneck analysis of Chrome’s loading pipeline when loading a modularized library composed of ~300 modules, the loading performance of bundled applications is better than unbundled ones.

#### Trade-offs of bundling vs. shipping unbundled modules
As usual in web development, everything is a trade-off. Shipping unbundled modules might decrease initial load performance (cold cache), but could actually improve load performance for subsequent visits (warm cache) compared to shipping a single bundle without code splitting. For a 200 KB code base, changing a single fine-grained module and having that be the only fetch from the server for subsequent visits is way better than having to re-fetch the whole bundle.

If you’re more concerned with the experience of visitors with warm caches than first-visit performance and have a site with less than a few hundred fine-grained modules, you could experiment with shipping unbundled modules, measure the performance impact for both cold and warm loads, and then make a data-driven decision!

Browser engineers are working hard on improving the performance of modules out-of-the-box. Over time, we expect shipping unbundled modules to become feasible in more situations.

### Dynamic `import()`

from [v8 feature docs](https://v8.dev/features/dynamic-import)  

Dynamic `import()` introduces a new function-like form of import that caters to those use cases. `import(moduleSpecifier)` returns a promise for the module namespace object of the requested module, which is created after fetching, instantiating, and evaluating all of the module’s dependencies, as well as the module itself.

Here’s how to dynamically import and use the `./utils.mjs` module:
```
<script type="module">
  const moduleSpecifier = './utils.mjs';
  import(moduleSpecifier)
    .then((module) => {
      module.default();
      // → logs 'Hi from the default export!'
      module.doStuff();
      // → logs 'Doing stuff…'
    });
</script>
```

Since `import()` returns a promise, it’s possible to use `async`/`await` instead of the `then`-based callback style:

```
<script type="module">
  (async () => {
    const moduleSpecifier = './utils.mjs';
    const module = await import(moduleSpecifier)
    module.default();
    // → logs 'Hi from the default export!'
    module.doStuff();
    // → logs 'Doing stuff…'
  })();
</script>
```

*Note*: Although `import()` looks like a function call, it is specified as syntax that just happens to use parentheses (similar to super()). That means that import doesn’t inherit from `Function.prototype` so you cannot `call` or `apply` it, and things like const importAlias = import don’t work — heck, import is not even an object! This doesn’t really matter in practice, though.

Here’s an example of how dynamic `import()` enables **lazy-loading modules upon navigation** in a small single-page application:

```
<!DOCTYPE html>
<meta charset="utf-8">
<title>My library</title>
<nav>
  <a href="books.html" data-entry-module="books">Books</a>
  <a href="movies.html" data-entry-module="movies">Movies</a>
  <a href="video-games.html" data-entry-module="video-games">Video Games</a>
</nav>
<main>This is a placeholder for the content that will be loaded on-demand.</main>
<script>
  const main = document.querySelector('main');
  const links = document.querySelectorAll('nav > a');
  for (const link of links) {
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      try {
        const module = await import(`/${link.dataset.entryModule}.mjs`);
        // The module exports a function named `loadPageInto`.
        module.loadPageInto(main);
      } catch (error) {
        main.textContent = error.message;
      }
    });
  }
</script>
```
The lazy-loading capabilities enabled by dynamic import() can be quite powerful when applied correctly. For demonstration purposes, Addy modified an example Hacker News PWA that statically imported all its dependencies, including comments, on first load. The updated version uses dynamic import() to lazily load the comments, avoiding the load, parse, and compile cost until the user really needs them.

Note: If your app imports scripts from another domain (either statically or dynamically), the scripts need to be returned with valid CORS headers (such as `Access-Control-Allow-Origin: *`). This is because unlike regular scripts, module scripts (and their imports) are fetched with CORS.

Static import and dynamic import() are both useful. Each have their own, very distinct, use cases. Use static imports for initial paint dependencies, especially for above-the-fold content. In other cases, consider loading dependencies on-demand with dynamic import().