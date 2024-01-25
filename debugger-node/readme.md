### How to run:
1- in terminal: `node --inspect-brk main.js`  
2- One of these ways:  
  - Open `chrome://inspect` in a Chromium-based browser. Click the Configure button and ensure your target host and port are listed.  
  - Or, in vscode, Run > Start Debugging.


### More information
Especially for "Inspector Clients" see the first link.  
https://nodejs.org/en/guides/debugging-getting-started.    
https://www.builder.io/blog/debug-nodejs.  


### Remote debugging scenarios
According to the first link, you are able to debug a Node.js application on a remote machine. On that machine, you should start the node process with the inspector listening only to localhost. Then, on your local machine from where you want to initiate a debug client connection, you can setup an ssh tunnel. You should be able to debug as if the Node.js application was running locally.  
Read more here: https://nodejs.org/en/guides/debugging-getting-started#enabling-remote-debugging-scenarios.

### More on debugging

According to [nodejs console docs](https://nodejs.org/api/console.html#consoleprofilelabel): You can use console.profile() to start a JavaScript CPU profile with an optional label until console.profileEnd() is called.

Also read more about debugger in [nodejs debugger docs](https://nodejs.org/api/debugger.html). V8 Inspector integration allows attaching Chrome DevTools to Node.js instances for debugging and profiling. It uses the Chrome DevTools Protocol. V8 Inspector can be enabled by passing the --inspect flag when starting a Node.js application. It is also possible to supply a custom port with that flag, e.g. --inspect=9222 will accept DevTools connections on port 9222. To break on the first line of the application code, pass the --inspect-brk flag instead of --inspect.

Also take a look at Memory Leaks inside node.md in nevis self-documentation.