# HTTP & REST

## Some Headers

### Last-Modified

See [RFS 9110](https://www.rfc-editor.org/rfc/rfc9110#field.last-modified):   
An origin server SHOULD send Last-Modified for any selected representation for which a last modification date can be reasonably and consistently determined, since its use in conditional requests and evaluating cache freshness ([CACHING]) can substantially reduce unnecessary transfers and significantly improve service availability and scalability.

According to DMN:  
The `Last-Modified` response HTTP header contains a date and time when the origin server believes the resource was last modified. It is used as a validator to determine if the resource is the same as the previously stored one. Less accurate than an ETag header, it is a fallback mechanism. Conditional requests containing If-Modified-Since or If-Unmodified-Since headers make use of this field.

### Content-Type

*Based on [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type)*  
The Content-Type representation header is used to indicate the original media type of the resource (prior to any content encoding applied for sending).  
In responses, a Content-Type header provides the client with the actual content type of the returned content. In requests, (such as POST or PUT), the client tells the server what type of data is actually sent.

For multipart entities the `boundary` directive is required. The directive consists of 1 to 70 characters from a set of characters (and not ending with white space) known to be very robust through email gateways. It is used to encapsulate the boundaries of the multiple parts of the message. Often, the header boundary is prepended with two dashes and the final boundary has two dashes appended at the end.  

(Example) **Content-Type in HTML forms**  
In a POST request, resulting from an HTML form submission, the Content-Type of the request is specified by the enctype attribute on the `<form>` element.

```html
<form action="/foo" method="post" enctype="multipart/form-data">
  <input type="text" name="description" value="some text" />
  <input type="file" name="myFile" />
  <button type="submit">Submit</button>
</form>
```

The request looks something like this (less interesting headers are omitted here):

```
POST /foo HTTP/1.1
Content-Length: 68137
Content-Type: multipart/form-data; boundary=---------------------------974767299852498929531610575

-----------------------------974767299852498929531610575
Content-Disposition: form-data; name="description"

some text
-----------------------------974767299852498929531610575
Content-Disposition: form-data; name="myFile"; filename="foo.txt"
Content-Type: text/plain

(content of the uploaded file foo.txt)
-----------------------------974767299852498929531610575--
```


#### urlencoded

[SO Question](https://stackoverflow.com/questions/4007969/application-x-www-form-urlencoded-or-multipart-form-data): In HTTP there are two ways to POST data: `application/x-www-form-urlencoded` and `multipart/form-data`. I understand that most browsers are only able to upload files if multipart/form-data is used?  

*from highly voted comment*:  
It should be mentioned that these are the two MIME types that HTML forms use. HTTP itself has **no such limitation**... one can use whatever MIME type he wants via HTTP.

*Answer*:  
Summary; if you have binary (non-alphanumeric) data (or a significantly sized payload) to transmit, use `multipart/form-data`. Otherwise, use `application/x-www-form-urlencoded`.

The MIME types you mention are the two `Content-Type` headers for HTTP POST requests that user-agents (browsers) must support. The purpose of both of those types of requests is to send a list of name/value pairs to the server. Depending on the type and amount of data being transmitted, one of the methods will be more efficient than the other. To understand why, you have to look at what each is doing under the covers.

For application/x-www-form-urlencoded, the body of the HTTP message sent to the server is essentially one giant query string -- name/value pairs are separated by the ampersand (&), and names are separated from values by the equals symbol (=). An example of this would be:  
MyVariableOne=ValueOne&MyVariableTwo=ValueTwo


### Allow

The Allow header lists the set of methods supported by a resource. This header **must** be sent if the server responds with a 405 Method Not Allowed status code to indicate which request methods can be used. An empty Allow field value indicates that the resource allows no methods, which might occur in a 405 response if the resource has been temporarily disabled by configuration.

```
Allow: GET, POST, HEAD
```


## encoding

In computers, encoding is the process of putting a sequence of characters (letters, numbers, punctuation, and certain symbols) into a specialized format for efficient transmission or storage. Decoding is the opposite process -- the conversion of an encoded format back into the original sequence of characters.

*from [MDN character encoding](https://developer.mozilla.org/en-US/docs/Glossary/Character_encoding)*:  
An encoding defines a mapping between bytes and text. A sequence of bytes allows for different textual interpretations. By specifying a particular encoding (such as UTF-8), we specify how the sequence of bytes is to be interpreted.

The Encoding API provides a mechanism for handling text in various character encodings, including legacy non-UTF-8 encodings.

### `TextEncoder`

The TextEncoder interface takes a stream of code points as input and emits a stream of UTF-8 bytes.  
`TextEncoder.encode()`:  Takes a string as input, and returns a Uint8Array containing UTF-8 encoded text.
```js
const encoder = new TextEncoder();
const view = encoder.encode("€");
console.log(view); // Uint8Array(3) [226, 130, 172]
```

**Note**: There is also `TextEncoderStream`. The TextEncoderStream interface of the Encoding API converts a stream of strings into bytes in the UTF-8 encoding. It is the streaming equivalent of TextEncoder.


##

---

## Forbidden header names

A forbidden header name is the name of any HTTP header that cannot be modified programmatically; specifically, an HTTP **request** header name. Modifying such headers is forbidden because the user agent retains full control over them. Forbidden header names start with Proxy- or Sec-, or are one of the following names. The list is based on MDN which is probably based on [Spec: Fetch Standard](https://fetch.spec.whatwg.org/#forbidden-header-name).  

### Content-Length

The Content-Length header indicates the size of the message body, in bytes, sent to the recipient.

### Cookie

The Cookie HTTP **request** header contains stored HTTP cookies associated with the server (i.e. previously sent by the server with the Set-Cookie header or set in JavaScript using Document.cookie).  
The Cookie header is optional and may be omitted if, for example, the browser's privacy settings block cookies.

*According to [SO](https://stackoverflow.com/a/70843922):*  

Some headers are forbidden to be used programmatically for security concerns and to ensure that the user agent remains in full control over them. Cookie is one of the forbidden header among the list of Forbidden header name list, and hence you cannot set it within the HTTP request header directly from the code.  
You can always set the cookies via `document.cookie` and browser will automatically send the cookies that matches the criteria. Trying to set cookies to foreign domain will be silently ignored.

#### `fetch()` and Cookie 

*from [disscussion in undici issue (2022)](https://github.com/nodejs/undici/issues/1463):*  

*aeharding*  
Hello. I'm confused. I was using nodejs v18.0 fetch and I could get the Set-Cookie header just fine.  
However now I cannot when I upgraded to nodejs v18.2. I see it when doing a console.log() of response.headers, but response.headers.get('set-cookie') doesn't work.  
I understand that that's the fetch API standard, but that standards seems like it was designed for a browser, and not Node. So I guess the fetch API is simply not compatible with my use case and I must use a third party library?  

*KhafraDev*  
Yes, you are entirely correct. The fetch spec was developed with browsers in mind - not so much a server environment. This causes a few problems with deciding how features should behave when the spec is subpar for a node.js use-case. Some decisions were made to branch away from the spec, however, those decisions were made before the creation of the WinterCG so now it has been decided to wait for a cross-platform solution/"spec", rather than introducing our own.  

*KhafraDev*  :
You can actually send set-cookie headers with `undici.request`. [Here](https://github.com/nodejs/undici/issues/1463#issuecomment-1135016690).

Also read more on this matter in:

- Rich Harris comment (2022) comparing different fetch implemenations (Deno, `node-fetch`, cloudflare workers) in [here](https://github.com/nodejs/undici/issues/1262#issuecomment-1131839918).
- an open issue in [WinterGC github](https://github.com/wintercg/fetch/issues/7).

<br/>

*from [this deno issue (2020)](https://github.com/denoland/deno/issues/6868#issuecomment-663812386)*:  

The problem is fetch() will always behave differently in a server context and a client context. You have all the situations with same origin and cross origin which just don't make sense in a server context. I am still just for documenting it. As you state, Node's implementation just passes forbidden as well.  

It is that or we implement some sort of cookie jar per origin that manages the cookies itself, and set the cookies on the document if you "really" want browser compatibility, but that just doesn't seem logical to me.

---

## Status codes in HTTP

You can find all assigned status codes with link to their RFC in [this IANA link](https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml#http-status-codes-1).  

Also you may see [Evert's blog](https://evertpot.com/http/).  

[SO](https://stackoverflow.com/a/21488282), The most important thing is that you:

-   Use the response code(s) consistently.
-   Include as much additional information in the response body as you can to help the developer(s) using your API figure out what's going on.

<br/>

### `Allow` Header in 405

According to https://www.rfc-editor.org/rfc/rfc7231#section-7.4.1, An origin server MUST generate an Allow field in a 405 (Method Not Allowed) response and MAY do so in any other response.

### 409 for email already exists? not 400?

[Comment by Wrikken](https://stackoverflow.com/a/3826024):  

400 => "The request could not be understood by the server due to malformed syntax". And the server understands perfectly, but is unable to comply due to a conflict. There is nothing wrong with the request & syntax, only a data problem. A 400 would instantly make me believe the whole mechanism I'm using is flawed, instead of just the data.

### 404 for POST?

[SO question 404 for POST](https://stackoverflow.com/questions/44915255/is-it-ok-return-http-status-404-in-the-post):
One of this scenarios is the response for POST requests. Per example, a POST method for an endpoint /orders/ receive some informations, like a `customer`. So, my questions is: if this number from `customerDocument` not exists, is it Ok to return a 404 status code error with a nice message telling that the customer was not found?

*Answer*  
I think 400 is the appropriate status code in this scenario.

According to the description, semantically, 422 is better ("The request was well-formed but was unable to be followed due to semantic errors."). However, 422 is introduced for WebDAV, so it is better to use general purpose status code such as 400.

400 is not the perfect status code, as whether document number exists or valid is not so apparent. However, excludes special-purpose status code such as 422, 400 is the best option.

Why 404 is **not** appropriate?  
From RESTful API point of view, endpoint /orders/ is a resource, no matter it accepts GET or POST or something else. 404 is only appropriate when the resource /orders/ itself does not exist. If /orders/ endpoint exist, but its invocation failed (no matter what reasons), the response status code must be something other than 404.

### 422

[SO](https://stackoverflow.com/questions/51990143/400-vs-422-for-client-error-request):  

HTTP is an extensible protocol and 422 is registered in IANA, which makes it a standard status code. So nothing stops you from using 422 in your application. And since June 2022, 422 **is defined** in the RFC 9110, which is the document that currently defines the semantics of the HTTP protocol:

> Status code 422 (previously defined in Section 11.2 of RFC 4918) has been added because of its general applicability.

HTTP status codes are sometimes not sufficient to convey enough information about an error to be helpful. 

It seems Rails also use 422 for validation errors.

Though 422 is more appropriate in some situation. see "leo_cape" comment and "Philippe Gioseffi" comment below [this SO answer](https://stackoverflow.com/a/52363900/22969951).

<br/>

### already logged in

[SO](https://stackoverflow.com/questions/18263796/http-status-for-already-logged-in)  

Here's why... The way I see it, you have two different scenarios from the perspective of the API: new login and re-login. programmatically there is a difference. But, from the perspective of the API consumer, all the consumer wants to know is if login was successful, which it was.

*comments:*  

So it's basically idempotent. Makes sense. -- mahemoff

What if another user is logged in? – soslan


<br/>

###  200 without body?

One small point: if you are not going to be returning a response body to a successful operation, I would suggest using a 204 exclusively. Some clients (jQuery Ajax, for example) will choke if they are expecting a non-zero length response but don't get it. You can see an example of this in [this SO](https://stackoverflow.com/questions/20928929/jquery-ajax-call-executes-error-on-200/20929815). – nick_w


---

## PUT

[SO](https://stackoverflow.com/questions/630453/what-is-the-difference-between-post-and-put-in-http)  

I think one cannot stress enough the fact that PUT is idempotent: if the network is botched and the client is not sure whether his request made it through, it can just send it a second (or 100th) time, and it is guaranteed by the HTTP spec that this has exactly the same effect as sending once. –  Jörg W Mittag. (Also see [MDN PUT](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PUT)).

If I'm not mistaken, what we should be stressing is that PUT is defined to be idempotent. You **still** have to write your server in such a way that PUT behaves correctly, yes? Perhaps it's better to say "PUT causes the transport to **assume** idempotence, which may affect behavior of the transport, e.g. caching." – Ian Ni-Lewis

## Idempotent

*based on MDN and [RFC 7231 4.2.2](https://datatracker.ietf.org/doc/html/rfc7231#section-4.2.2)*  

An HTTP method is idempotent if the intended effect **on the server** of making a single request is the same as the effect of making several identical requests.

This does not necessarily mean that the request does not have any unique side effects: for example, the server may log every request with the time it was received. Idempotency only applies to effects intended by the client: for example, a POST request intends to send data to the server, or a DELETE request intends to delete a resource on the server. All safe methods are idempotent, as well as PUT and DELETE. The POST method is not idempotent.

To be idempotent, only the state of the server is considered. The response returned by each request may differ: for example, the first call of a DELETE will likely return a 200, while successive ones will likely return a 404.

[SE Exchange](https://softwareengineering.stackexchange.com/questions/429393/does-put-need-to-be-idempotent):  
Because GET and PUT requests have idempotent semantics, duplicate copies of the same request mean the same thing. One useful consequence of that is we can automatically retry those requests if the response is lost - a very useful property when the message transport is unreliable.

But it **doesn't mean** that the request handler MUST handle the request in an idempotent way. What it means is that the implementation is responsible for any loss of property caused by the fact that the implementation doesn't respect the semantics of the request.

## Cacheable

[MDN](https://developer.mozilla.org/en-US/docs/Glossary/Cacheable)  

These are the constraints for an HTTP response to be cacheable:

- The method used in the request is cacheable, that is either a GET or a HEAD method. A response to a POST or PATCH request can also be cached if freshness is indicated. Other methods, like PUT or DELETE are not cacheable and their result cannot be cached.

- The status code of the response is known by the application caching, and is cacheable. The following status codes are cacheable: 200, 203, 204, 206, 300, 301, 404, 405, 410, 414, and 501.

- There are no specific headers in the response, like `Cache-Control`, with values that would prohibit caching.

Note that some requests with non-cacheable responses to a specific URI may invalidate previously cached responses from the same URI. For example, a PUT to /pageX.html **will invalidate** all cached responses to GET or HEAD requests to /pageX.html.

See also [RFC 9111 about HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111.html).

### Cache-Control

The `Cache-Control` HTTP header field holds directives (instructions) — in **both** requests and responses — that control caching in browsers and shared caches (e.g. Proxies, CDNs).

Why `Cache-Control` in request?

[SO](https://stackoverflow.com/questions/42652931/why-use-cache-control-header-in-request/42653090#42653090):  

There may be any number of intermediate proxies between the client and server which do caching. The client can explicitly request explicit caching behaviour from any and all caching entities, things like: 

- max-age - "I don't want a response older than X"
- no-cache - "I want a fresh response"

*comment* :  
An example where the client's request is not honoured is the CloudFlare cache which ignores you to avoid DoS attacks as described here https://community.cloudflare.com/t/request-no-cache-header-is-ignored-by-cloudflare/201653 – sparrowt.



### Question

*from [jake archibald's blog](https://jakearchibald.com/2016/caching-best-practices/)*   

Note that you can purge cache on Cloudflare, but it could still be cached elsewhere between client and server, e.g. by your ISP or the end-user's ISP.   
Archibald's answer: Not, since I serve over HTTPS.

### Security

When users would logout of their profile they could navigate back and view the pages as if they were logged in. This could be potentially harmful when you are on a public or shared computer. Obviously you should trust the website that the logout button forgets all trace of you ever logging in. After a short investigation we found that an update a couple days prior removed the `Cache-Control` header.

According to [MDN Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control):   

The `private` **response** directive indicates that the response can be stored only in a private cache (e.g. local caches in browsers). You **should add** the `private` directive for user-personalized content, **especially** for responses received after login and for sessions managed via cookies. If you forget to add `private` to a response with personalized content, then that response can be stored in a shared cache and end up being reused for multiple users, which can cause personal information to leak.


### Caching best practices

Note: `no-cache` doesn't mean "don't cache", it means it must check (or "revalidate" as it calls it) with the server before using the cached resource. `no-store` tells the browser not to cache it at all. Also `must-revalidate` doesn't mean "must revalidate", it means the local resource can be used if it's younger than the provided `max-age`, otherwise it must revalidate.

#### Pattern 1 
(Immutable content, long max-age)

`Cache-Control: max-age=31536000`  
The content at this URL never changes, therefore… The browser/CDN can cache this resource for a year without a problem. Cached content younger than max-age seconds can be used without consulting the server. In this pattern, you never change content at a particular URL, you change the URL. Each URL contains something that changes along with its content..

#### Pattern 2 
(Mutable content, always server-revalidated)

`Cache-Control: no-cache`  
The content at this URL may change, therefore…
Any locally cached version isn't trusted without the server's say-so.

![image0024](image0024.png)

In this pattern you can add an `ETag` (a version ID of your choosing) or `Last-Modified` date header to the response. Next time the client fetches the resource, it echoes the value for the content it already has via `If-None-Match` and `If-Modified-Since` respectively, allowing the server to say "Just use what you've already got, it's up to date", or as it spells it, "HTTP 304".

If sending `ETag` / `Last-Modified` isn't possible, the server always sends the full content.

This pattern always involves a network fetch, so it isn't as good as pattern 1 which can bypass the network entirely.

#### Wrong Pattern
(max-age on mutable content)

It's not uncommon to be put off by the infrastructure needed for pattern 1, but be similarly put off by the network request pattern 2 requires, and instead go for something in the middle: a smallish max-age and mutable content. This is a **bad compromise**.

`Cache-Control: must-revalidate, max-age=600`  
Imagine content at the URLs changes. If the browser has a cached version less than 10 minutes old, use it without consulting the server. Otherwise make a network fetch, using `If-Modified-Since` or `If-None-Match` if available.

`max-age` is relative to the response time, so if all the above resources are requested as part of the same navigation they'll be set to expire at roughly the same time, but there's still the small possibility of a race there. If you have some pages that don't include the JS, or include different CSS, your expiry dates can get out of sync. And worse, the browser drops things from the cache all the time, and it doesn't know that the HTML, CSS, & JS are interdependent, so it'll happily drop one but not the others. Multiply all this together and it becomes not-unlikely that you can end up with mismatched versions of these resources.

`max-age` on mutable content is often the wrong choice, but not always. This pattern shouldn't be used lightly. If I added a new section to one article and linked to it in another article, I've created a dependency that could race. The user could click the link and be taken to a copy of the article without the referenced section. If I wanted to avoid this, I'd update the first article, flush Cloudflare's cached copy using their UI, wait three minutes, then add the link to it in the other article.


### Types of caches

*from [MDN HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)*  
In the HTTP Caching spec, there are two main types of caches: private caches and shared caches.

A **private cache** is a cache tied to a specific client — typically a browser cache. Since the stored response is not shared with other clients, a private cache can store a personalized response for that user. If a response contains personalized content and you want to store the response only in the private cache, you must specify a `private` directive.
```
Cache-Control: private
```

The **shared cache** is located between the client and the server and can store responses that can be shared among users. And shared caches can be further sub-classified into proxy caches and managed caches.

In recent years, as HTTPS has become more common and client/server communication has become encrypted, **proxy caches** in the path can only tunnel a response and can't behave as a cache, in many cases. So in that scenario, there is no need to worry about outdated proxy cache implementations that cannot even see the response.

On the other hand, **if** a TLS bridge proxy decrypts all communications in a person-in-the-middle manner by installing a certificate from a CA (certificate authority) managed by the organization on the PC, and performs access control, etc. — it is possible to see the contents of the response and cache it. However, since CT (certificate transparency) has become widespread in recent years, and some browsers only allow certificates issued with an SCT (signed certificate timestamp), this method requires the application of an enterprise policy. In such a controlled environment, there is **no need** to worry about the proxy cache being "out of date and not updated".

**Managed caches** are explicitly deployed by service developers to offload the origin server and to deliver content efficiently. Examples include reverse proxies, CDNs, and service workers in combination with the Cache API.
  
It is also possible to ignore the standard HTTP Caching spec protocols in favor of explicit manipulation. For example, `Cache-Control: no-store` can be specified to opt-out of a private cache or proxy cache, while using your own strategy to cache only in a managed cache.

### (Re)validation & `ETag`

Stale responses are not immediately discarded. HTTP has a mechanism to transform a stale response into a fresh one by asking the origin server. This is called validation, or sometimes, revalidation. Validation is done by using a conditional request that includes an `If-Modified-Since` or `If-None-Match` request header.

The server can obtain the modification time from the operating-system file system, which is relatively easy to do for the case of serving static files. However, there are some problems; for example, the time format is complex and difficult to parse, and distributed servers have difficulty synchronizing file-update times.

To solve such problems, the `ETag` response header was standardized as an alternative.

The value of the `ETag` response header is an arbitrary value generated by the server. There are no restrictions on how the server must generate the value, so servers are free to set the value based on whatever means they choose — such as a hash of the body contents or a version number. 


### What's lost by `no-store`

You may think adding no-store would be the right way to opt-out of caching. However, it's **not** recommended to grant no-store liberally, because you lose many advantages that HTTP and browsers have, including the browser's back/forward cache. Therefore, to get the advantages of the full feature set of the web platform, prefer the use of `no-cache` in combination with `private`.

### API caching

[SO](https://stackoverflow.com/questions/58428814/should-i-add-cache-control-no-cache-to-get-endpoints-of-my-rest-api):  
What is the best practice for avoiding stale data for GET requests?
There seem to be different strategies to solve this problem, but what would be the best way?

- cache-busting my GET calls via unique query string? eg. `GET /articles/123/comments?nonce=12312310980923409`
- adding `Cache-Control: no-cache` (will this always be respected?)
- adding `ETag: xyz_HASH_OF_MY_LIST_OF_COMMENTS`?
- adding `Cache-Control: max-age=0` (to disable caching)
- adding `Cache-Control: max-age=60` (to reduce max duration of caching)
- just don't worry and assume that without headers like ETag, Last-Modified the GET request won't be cached by any of the browsers?

Answer:  
To a browser GET requests look the same, no matter if they originated by JavaScript to your REST API or by you entering an URL in the address bar.

What happens if you don't set the caching headers? The spec allows the browser to do whatever it wants. By default, browsers cache responses to GET requests and use a "best guess" approach for the duration.

You **should always** set the caching explicitly to get consistent behavior.

[Answer from another SO](https://stackoverflow.com/questions/26588705/using-http-for-rest-api-automatically-cacheable?rq=3):  

Let me expand a bit on the challenges of creating correct caching logic: Typically, the backend of the API is a database holding all kinds of little pieces of information. The typical presentation within a REST API can be an accumulated view (So, let's say, a users activity log, containing a list of the last user actions within a portal, something along those lines). Now, in order to know if your API URL /user/123/activity has changed (after the timestamp the client is sending you in the "If-modified-since"-header), you would have to check if there have been any additional activities after the last request. The overhead of doing that might be the same as simply fetching the result again. So, in a lot of cases, people just don't really bother, which is a shame, as proper caching can have a huge impact on Web App performance.

### More

[SO](https://stackoverflow.com/questions/64331735/how-to-prevent-http-caching-of-rest-calls-in-browser):  
You can disable cache in `fetch()` by appending in headers.
```js
var headers = new Headers();
headers.append('pragma', 'no-cache');
headers.append('cache-control', 'no-cache');

var init = {
  method: 'GET',
  headers: headers,
};
var request = new Request(YOUR_URL);

fetch(request, init)
```
Alternatively, you can use a dynamic string in URL, it will still store a version in your browser's cache.
```js
const ms = Date.now();
const data = await fetch(YOUR_URL+"?t="+ms)
```
This is just adding a dummy parameter that changes on every call to a query.

---

## CORS

Cross-Origin Resource Sharing (CORS) is an HTTP-header based mechanism that allows a server to indicate any origins (domain, scheme, or port) other than its own from which a browser should permit loading resources. CORS also relies on a mechanism by which browsers make a "preflight" request to the server hosting the cross-origin resource, in order to check that the server will permit the actual request. In that preflight, the browser sends headers that indicate the HTTP method and headers that will be used in the actual request.

An example of a cross-origin request: the front-end JavaScript code served from https://domain-a.com uses fetch() to make a request for https://domain-b.com/data.json.

For security reasons, browsers restrict cross-origin HTTP requests initiated from scripts. For example, fetch() and XMLHttpRequest follow the same-origin policy. This means that a web application using those APIs can only request resources from the same origin the application was loaded from unless the response from other origins includes the right CORS headers.


<br/>

## Signed cookies

Good for time-limited-form-submission (anti-spam) without having to store any data on the server side.
See https://stackoverflow.com/questions/3240246/signed-session-cookies-a-good-idea.

According to https://stackoverflow.com/a/3240427:
They should be kept private, so that attackers cannot steal them and impersonate an authenticated user. Any request that performs an action that requires authorization should be tamper-proof. That is, the entire request must have some kind of integrity protection such as an HMAC so that its contents can't be altered. For web applications, these requirements lead inexorably to HTTPS.

<br/>

## REST

Let's give you the answer right now: We don't care. We made some ad-hoc decisions.
**BUT...** It is important to be aware of trade-offs, and hidden costs behind these decision.

Imagine `GET /posts?page=1` (ignore bad pagination style for now). Imagine each post has authorId (i.e. userId). To prevent N+1 problem it is usually recommended to attach name and avatar picture of authorId directly to the post. This [youtube video](https://www.youtube.com/watch?v=JxeTegu4dD8) the presenter recommends the aforementioned optimizations to prevent N+1 problem. But regarding this ad-hoc decision, there is a comment.

*comment by ugentu*:  

Thanks for the great review of the main concepts! Sounds valuable as a base.
But can't mention that "Optimisation" advice is completely out of REST principles. One of the REST principles is, roughly speaking, resource-per-URI. Violating it with such entities folding, you may achieve quick improvement, but with a big price to pay later.

I have at least three reasons not to go with folded entities:

1. Cache inconsistency: In your example, If any of the Users updates a name, you'll need to invalidate all Posts-related cache. It may look as not a big deal in this particular scenario, but if you expend this approach - you may come up with inconsistent caching all over your API because all entities are somehow relates\included to one another.

2. Inconsistency in approach: Let's imagine that the user has a dependency on "subscriptions". Should we include it as well? Should we include Subscription dependencies as well? Feels not too optimal, isn't it? So what are the limit levels to fold? You may say that it depends on the situation, but it's actually not - it is just better not to include related entities in the response.

Some more examples are if the entity has many dependencies. What if we have Comments? Reactions? Should we fetch it and return it all the time?
What if your folded data is big? Imagine you are fetching 100 posts for one user, and all the posts will contain the same copy of User data.
What If another 10 other Clients don't care about Users of the Posts at all, but are served with a redundant chunk of payload?

When you have no strict pattern - you'll need to make ad-hoc decisions for each case, which leads to a messy API shape, hard both to use and maintain.

3. Data type inconsistency - a nightmare when you shape folded entities in different ways, based on the use case.
   Like, in the context of the posts we are interested in First Name + Last name + Avatar URL.
   In the profile\admin context, we want all the details, like phone, email, address, etc.
   It means that at Client we have two "kinds" of User TS interface\type - full and limited. So, should we define them separately? Otherwise - generalize them, so make all the fields that may be absent in any of the two options - nullable? This means null-checks and cast issues all over the app. Again, seems not a big deal when we have only 2 "variants". But in reality - we easily can over-"optimize" to have really different shapes of the same entity, with different "folded" entities depending on the usage context, and things go crazy.

And final - it just violates the Dependencies Inversion and Interface Segregation principles of SOLID. In this way, you are making API know about how the Client uses that data, so API depends on the Client.

Sure, there are some scenarios when you may naturally want to include the folded items, because of really strict non-functional requirements.
But those are exclusions, and shouldn't be the default tip to follow.

If you have such requirements - probably you want to consider:

1. Prefetching
2. BFF layer - where you'll define client-specific API contracts, and will have a place to collect data from different sources and aggregate them in a client-friendly structure)
3. GraphQL - which is designed for such scenarios.

From another comment: Optimizing REST services is challenging and depends heavily on how you're going to use them. Always including child records can be a bad practice.

From another comment: ...You advice is effective for HTTP interactions but from a REST perspective is confusing / harmful.
If minimizing HTTP calls is optimal for your use cases and you want to aggregate data across entities, look at something else, i.e. OData, GraphQL, etc.

**But...** there is another comment which shows the other side of trade-off:


*comment by sfulibarri*:  
The biggest mistake any dev can make when building a REST API is spending hours and hours agonizing over if every little thing is 'RESTful' or not. Just get it working, you will understand more about the problem space as you work and be able to make better decisions. Trying to design for some extremely vague principals of 'RESTfulness' from the get go will only cause you pain and more often than not, unless you are building an explicitly public API, the only thing that matters is that your endpoints provide the needed functionality and behave according to the documentation. Most of the worst API's I have ever had to work with in my career were just clearly designed to be 'RESTful' for the sake of being 'RESTful' and it was a nightmare to use them.

<br/>

## Unknown aspects of scaling

These are **not** quite related to this project, but they open you eyes. This comment by Kasey Speakman is great: https://dev.to/rhymes/what-would-you-use-as-a-sortable-globally-unique-id-5akb#comment-f6em.

Good SO answer: https://stackoverflow.com/a/47155318.  

Regarding the answer below, it is better to enforce timestamp also in client-side. In other words clients should only send timestamp in their requests and receive timestamp in response. Otherwise many problems may occur. Imagine a request is sent and some fields are Date. The request is received in server and in the meantime the client experiences daylight saving. The response gets back to client. Especially imagine response is an error and client retries the request. Server **shouldn't** try to do the conversion from Date to timestamp. Because now server's perception of client timezone (which is based on running js runtime that is running on the server and has not arrived the next day (unlike client that has just arrived his next day and has just experienced daylight saving)) is considered different. You can imagine similar scenarios.

But in any case, server should store as TIMESTAMP data-type in db, so that it can exploit date-time function provided by RDBMS.
