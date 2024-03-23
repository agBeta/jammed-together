# Express

*Most of these is based on [express docs](https://expressjs.com/en/54/api.html).*  

## `express.json([options])`

This middleware is available in Express v4.16.0 onwards. This is a built-in middleware function in Express. It parses incoming requests with JSON payloads and is based on body-parser.

Returns middleware that only parses JSON and only looks at requests where the `Content-Type` header matches the type option. This parser accepts any Unicode encoding of the body and supports automatic inflation of gzip and deflate encodings.

A new body object containing the parsed data is populated on the request object after the middleware (i.e. `req.body`), or an empty object ({}) if there was no body to parse, the Content-Type was not matched, or an error occurred.

## `express.raw([options])`

It parses incoming request payloads into a Buffer and is based on body-parser. Returns middleware that parses all bodies as a Buffer and only looks at requests where the Content-Type header matches the type option. This parser accepts any Unicode encoding of the body and supports automatic inflation of gzip and deflate encodings.

A new body `Buffer` containing the parsed data is populated on the request object after the middleware (i.e. `req.body`), or an empty object ({}) if there was no body to parse, the Content-Type was not matched, or an error occurred.


## `express.static(root, [options])`

This is a built-in middleware function in Express. It serves static files and is based on serve-static.  
NOTE: For best results, use a reverse proxy cache to improve performance of serving static assets.

The root argument specifies the root directory from which to serve static assets. The function determines the file to serve by combining req.url with the provided root directory. When a file is not found, **instead of** sending a 404 response, it calls next() to move on to the next middleware, allowing for stacking and fall-backs.

![image0022](image0022.png)


## keep-alive bug

Read [this SO](https://stackoverflow.com/questions/61273417/node-js-express-js-set-keep-alive).