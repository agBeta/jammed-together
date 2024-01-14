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
