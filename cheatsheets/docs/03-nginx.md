# Nginx

_(most of the content is based on 'Nginx Perfect Server')_

**Side Note 1**: if you want to use docker, it _might be better_ to start from scratch (i.e. **not using** ~~`nginx:alpine`~~, but `alpine` linux itself). See [this SO](https://stackoverflow.com/questions/76237701/how-to-enable-brotli-compression-in-nginx-and-docker-for-angular-app).

Side Note 2: Depending on the distribution, the file could be located in any of the following paths:
- /etc/nginx/nginx.conf
- /usr/local/nginx/conf/nginx.conf
- /usr/local/etc/nginx/nginx.conf

First, installing Nginx. 


```sh
# (optional) ondrej repo is trusted
sudo add-apt-repository ppa:ondrej/nginx-mainline

sudo apt install nginx libnginx-mod-http-cache-purge libnginx-mod-http-headers-more-filter libnginx-mod-http-brotli-filter libnginx-mod-http-brotli-static

cd /etc/nginx/sites-available/default

sudo systemctl is-enabled nginx

ls /var/www/html/
```

Mariadb:

```sh
sudo apt install mariadb-server

sudo systemctl status mariadb

sudo systemctl is-enabled mariadb
```

---

## Nginx config

```sh
# test config file
sudo nginx -t

sudo systemctl reload nginx
```

### Nginx contexts

- main: not contained within curly brackets.
- `events`: sets global options that affects how nginx handles connections.
- `http`: configures http service
- `server`: it is contained within `http` context. It contained configuration for virtual hosts (i.e. server block).
- `location`: it is contained within `server` context. Configures how nginx responds to requests within _the_ `server`.

</br>

### `location` modifiers

_(based on [digitalocean blog](https://www.digitalocean.com/community/tutorials/nginx-location-directive#1-nginx-location-matching-all-requests))_

To find location matching a given request, nginx first checks locations defined using the **prefix strings** (prefix locations). Among them, the location with the longest matching prefix is selected and remembered. Then regular expressions are checked, in the order of their appearance in the configuration file. The search of regular expressions terminates on the first match, and the corresponding configuration is used. If no match with a regular expression is found then the configuration of the prefix location remembered earlier is used. ([nginx docs](https://nginx.org/en/docs/http/ngx_http_core_module.html#location))

- No modifier at all means that the location is **interpreted as a prefix**. To determine a match, the location will now be matched against the beginning of the URI.

- `=` The equal sign is used to match a location block exactly against a requested URI.  
**Note**: if a “/” request happens frequently, defining `location = /` will **speed up** the processing of these requests, as search terminates right after the first comparison

Some useful examples:

- In the following example the prefix location / will match **all requests** but will be used _as a last resort_ if no matches are found.

    ```nginx
    location / {
        try_files $uri $uri/ /index.html$is_args$args;
    }
    ```

    btw, see [**Embedded Variables**](https://nginx.org/en/docs/http/ngx_http_core_module.html#variables) for `$uri`. it is different from [`$request_uri`](https://nginx.org/en/docs/http/ngx_http_core_module.html#variables).


- The following location block will match with the URL https://domain.com/images but the URL https://domain.com/images/index.html or https://domain.com/images/ **will not** be matched.
    ```nginx
    location = /images { 
        ...
    }
    ```

- The “/” request will match configuration A, the “/index.html” request will match configuration B, the “/documents/document.html” request will match configuration C. (based on [nginx docs](https://nginx.org/en/docs/http/ngx_http_core_module.html#location))
    ```nginx
    location = / {
        [ configuration A ]
    }

    location / {
        [ configuration B ]
    }

    location /documents/ {
        [ configuration C ]
    }
    ```

Btw, you can configure nginx (using `@` named location) to try serving a file. if no such file exists, hand the request to upstream nodejs server. See[this SO](https://stackoverflow.com/a/20577112).

</br>

## Harden & Optimize Nginx

```sh
cd /etc/nginx/
# create a backup first:
sudo cp nginx.conf nginx.conf.bak

sudo nano nginx.conf
```

Add the following directives to the **main** context:

```nginx
# maximum number of file descriptors PER worker:
worker_rlimit_nofile 30000;

# [WRONG; see P.S.4 -->] worker_priority -10;
worker_priority 0; # default

timer_resolution 100ms;

# dynamically compiles regular expressions into optimized machine code:
pcre_jit on;
```

</br>

### Tuning `events`

Modify and add the following directives to the `events` context:

```nginx
events {
    ...
    # maximum number of connection each worker handles:
    worker_connections 4096;
    # [This is wrong, see P.S.4 -->] prevents multiple workers accepting the same connection simultaneously:
    accept_mutex on;
    accept_mutex_delay 200ms;
    # use epoll event notification mechanism on linux:
    use epoll;
}
```

P.S.4: The course 'Nginx Perfect Server' is wrong in some places:
- `worker_priority`: based on 'Nginx HTTP Server' book, it is **NOT recommended** that you set the priority to -5 or less; because kernel processes run at priority level -5. See also [`nice` & priority](https://askubuntu.com/questions/656771/process-niceness-vs-priority).

### Tuning `http`

We are going to use `include` files directive rather than adding all into nginx.conf.

```sh
sudo mkdir includes
cd includes

sudo touch basic_settings.conf buffers.conf timeouts.conf file_handle_cache.conf gzip.conf brotli.conf
```

#### basic settings

`sudo nano basic_settings.conf`:

```nginx
##
# BASIC SETTINGS
## 
charset utf-8;
sendfile on;
sendfile_max_chunk 512k;
tcp_nopush on;
tcp_nodelay on;
server_tokens off;
more_clear_headers 'Server';
more_clear_headers 'X-Powered';
server_name_in_redirect off;
server_names_hash_bucket_size 64;
variables_hash_max_size 2048;
types_hash_max_size 2048;
include /etc/nginx/mime.types;
default_type application/octet-stream;
# [MANUALLY ADDED:]
underscores_in_headers on;
```

#### buffers

open `buffers.conf`.  

There are different types of buffers in nginx:
- Input buffers: stores client request before it is passed to the upstream server. `client_body_buffer_size` control input buffers.
- Output buffers: stores response body from the upstream server before sending it to the client.
- Fastcgi buffers

```nginx
##
# BUFFERS
## 
client_body_buffer_size 256k;
client_body_in_file_only off;
client_header_buffer_size 64k;
# client max body size - reduce size to 8m after setting up site
# Large value is to allow theme, plugins or asset uploading.
client_max_body_size 100m;

connection_pool_size 512; # default for 64-bit systems

# It can be useful for serving large files (over given size: 4 megabytes)
directio 4m;

ignore_invalid_headers on;
large_client_header_buffers 8 64k;
output_buffers 8 256k;
postpone_output 1460;
request_pool_size 32k;
```

Notes:
- [`client_body_in_file_only`](http://nginx.org/en/docs/http/ngx_http_core_module.html#client_body_in_file_only): setting `on` or `clean` is mostly useful during debugging.

#### timeouts

`sudo nano timeouts.conf`.

```nginx
##
# TIMEOUTS
## 

# [You may change this]
keepalive_timeout 20;

keepalive_requests 500;

lingering_time 20s;
lingering_timeout 5s;
keepalive_disable msie6;
reset_timedout_connection on;

send_timeout 15s;

client_header_timeout 8s;
client_body_timeout 10s;
```

#### gzip

`sudo nano gzip.conf`

you may also [compression (admin-guide)](http://docs.nginx.com/nginx/admin-guide/web-server/compression/) and [gzip module](https://nginx.org/en/docs/http/ngx_http_gzip_module.html).

```nginx
##
# GZIP
## 
gzip on;
gzip_vary on;
gzip_disable "MSIE [1-6]\.";
gzip_static on;
gzip_min_length 1400;
gzip_buffers 32 8k;
gzip_http_version 1.0;
gzip_comp_level 5;
gzip_proxied any;
gzip_types text/plain text/css text/xml application/javascript application/x-javascript application/xml application/xml+rss application/ecmascript application/json image/svg+xml;
```

#### File handle cache

`sudo nano file_handle_cache.conf`

```nginx
##
# FILE HANDLE CACHE
## 
open_file_cache max=50000 inactive=60s;
open_file_cache_valid 120s;
open_file_cache_min_uses 2;
open_file_cache_errors off;
```

Now open `/etc/nginx/nginx.conf`.

Finally we need to `include` previously-created config files. Note: do NOT remove directives under 'Virtual Hosts Configs'. Also do not remove 'Logging settings'.

```nginx
http {

    ...
    # do NOT forget the semicolon.
    include /etc/nginx/includes/basic_settings.conf;

}
```

Finally test & reload the server:

```sh
sudo nginx -t
sudo systemctl reload nginx
```

### Open file limits (for nginx)

_lesson 23_

Required if you encountered 'Too many open files' error.

```sh
# Find the pid of nginx process:
ps aux | grep nginx
# or: ps aux | grep www-data

# assuming pid = 42304
cat /proc/42304/limits
```

</br>


---

_lesson 30 onward_

## `server` blocks (+ logging)

First, read [How nginx processes a request](https://nginx.org/en/docs/http/request_processing.html).


To check if domain name(DNS) is working correctly, first, login into the server. then:

```sh
ping www.example.com
```

```sh
cd /etc/nginx/sites-available

# create a server block for example.com site
sudo nano --nowrap example.com.conf
```

Add the following lines (for a wordpress php site). make sure to read [Side Notes](#side-notes) section after.

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    # public files
    root /var/www/example.com/public_html;
    # index page ( served when uri=/ , i.e. when url=http://example.com/). For wordpress sites it is index.php file.
    index index.php;

    location / {

        # First check the uri; if the file exists serve it; 
        # Otherwise if the **DIRECTORY** (= appending / at the end of uri) exists then serve the directory; 
        # Otherwise ...
        try_files $uri $uri/ /index.php$is_args$args;
    }

    # server php files (ending in .php) differently:
    location ~ \.php$  {
        ...
    }

    # log files
    access_log /var/log/nginx/access.log.example.com.log combined buffer=256k flush=10m;
    error_log /var/log/nginx/error.log.example.com.log warn;
}
```

Save and exit. Make sure you nginx config file `include`s this server block.

Conventionally (for nginx + wordpress), There is the following `include` directive inside `nginx.conf` file:
```nginx
http {
    ...

    ##
    # Virtual Hosts Config
    ##
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*; # notice, NOT *.conf
}
```

So nginx will include all files inside `sites-enabled/` directory. Each file inside `sites-enabled/` directory is a **symlink** to a file in `sites-available/` directory.

### Side Notes

**Note 1**: For serving an SPA frontend, you should (probably?) omit `$uri/` and `/index.php...` from `try_files` directive.

**Note 2**: If you enable [`buffer`](https://nginx.org/en/docs/http/ngx_http_log_module.html#access_log) for `access_log`, then writes to log will be buffered.  
Note, by enabling buffer, logs might be out of order. Meaning chronologically. e.g. _Log lines_ for 2017-02-21 09:13:26 may come be before lines for 2017-02-21 09:13:25 ([this SO](https://stackoverflow.com/questions/41901948/nginx-logs-are-out-of-order-probably-due-to-buffered-logging)). **However, it is fine**, because Log analytic systems will sort the logs by self.

**Note 3**: `flush=10m` **does not mean** the nginx will always wait 10m between each flush to disk. Don't worry. The data will be written to the file if the next log line does not fit into the buffer.

**Note 4**: For nodejs backend & SPA frontend you **may** (may?? see below) use `json_combined escape=json`. Note, `error_log` **cannot** produce JSON logs. (based on [SO comment](https://stackoverflow.com/a/42564710) and [this SO 2021](https://stackoverflow.com/a/67467463)).  

- Note, [fluentd nginx parser plugin](https://docs.fluentd.org/parser/nginx) parses the **default** Nginx logs (NOT ~~JSON log format~~). But there is also a [fluentd json parser](https://docs.fluentd.org/parser/json); so you may feed nginx `access_log`s into json parser; But for `error_log`s you have no choice but nginx parser.

**Note 5**: Some tunings (differs from video) based on [Configuring logging (admin-guide)](https://docs.nginx.com/nginx/admin-guide/monitoring/logging/).

- add `warn` at the end of `error_log`.
- add `upstream_time` to `http` block for more-descriptive logs.
     

</br>

## Certificate 

Before issuing SSL (TLS) certificate make sure your **DNS works** correctly. All A and CNAME records should resolve to the server.

### certbot

_(lesson 39)_

```sh
sudo apt update
sudo apt upgrade

sudo apt install certbot

# (optional; for cloudflare integration)
sudo apt install python3-certbot-dns-cloudflare
```

We only install certificate for domain and www domain (for now). For wildcard certificate see later.

```sh
sudo certbot certonly --webroot -w /var/www/example.com/public_html \
    -d example.com \
    -d www.example.com 

# you'll be prompted to enter email address for urgent renewal (& etc.)
```

Explanation:
- `certonly`: obtain a certificate but not install it.
- `--webroot`: use webroot plugin for authentication. webroot plugin works by temporarily placing a special file in webroot directory of your domain to prove the ownership.
- `-w`: the directory where the aforementioned temporary auth file(s) will be placed. For (nginx + wordpress) setup, files are placed inside /var/www/example.com/public_html. 

### Nginx

Now, let's configure nginx to use these certificate files.

#### Step 1: Diffie-Hellman (nginx)

The contents of `dhparam.pem` defines how OpenSSL performs the Diffie-Hellman key exchange. This file will be used for **all sites** on the server (not site-specific). No need to recreate this file for each site.

```sh
cd /etc/nginx/
sudo mkdir ssl/
cd ssl/

# openssl command may take a while; Do NOT interrupt the process
sudo openssl dhparam -out dhparam.pem 2048

ls
```

#### Step 2: Site-specific certificate `include` file

It is a **site-specific** file (i.e. each site on the server will have itw own unique file).

```sh
sudo nano --nowrap /etc/nginx/ssl/ssl_certs_example.com.conf
```

Add the following lines directly into the file (i.e. no need to wrap inside any nginx block/context):

```nginx
ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
# SSL STAPLING
ssl_trusted_certificate /etc/letsencrypt/live/example.com/chain.pem;
```

#### Step 3: General SSL config

This file will be used by **all sites** on the server. No need to recreate for additional sites.

```sh
sudo nano --nowrap /etc/nginx/ssl/ssl_all_sites.conf
```

Copy and paste the following lines into the file:

```nginx
# CONFIGURATION RESULTS IN A+ RATING AT SSLLABS.COM
# WILL UPDATE DIRECTIIVES TO MAINTAIN A+ RATING - CHECK DATE
# DATE: OCTOBER 2024

# --- SSL CACHING AND PROTOCOLS ---
ssl_session_cache shared:SSL:20m;
ssl_session_timeout 180m;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
# ssl_ciphers must be on a single line, do not split over multiple lines
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-CHACHA20-POLY1305;
ssl_dhparam /etc/nginx/ssl/dhparam.pem;
ssl_stapling on;
ssl_stapling_verify on;
# resolver set to Cloudflare
# timeout can be set up to 30s
resolver 1.1.1.1 1.0.0.1;
resolver_timeout 15s;
ssl_session_tickets off;

# --- HSTS HEADERS ---
add_header Strict-Transport-Security "max-age=31536000;" always;
# After setting up ALL of your sub domains - comment the above and uncomment the directive hereunder, then reload the nginx
# add_header Strict-Transport-Security "max-age=31536000; includeSubDomains;" always;

# --- Enable QUIC and HTTP/3 ---
# ssl_early_data on;
# add_header Alt-Svc 'h3=":$server_port"; ma=86400';
# add_header x-quic 'H3' ;
# quic_retry on;
```

### Step 4: Configure Nginx

We need to configure nginx to make use of those created files.

#### 4.1 

```sh
cd /etc/nginx/sites-available
sudo nano --nowrap example.com.conf
```

Now, create a new `server` block to redirect from http to https.

```nginx
server {
    listen 80;

    server_name example.com www.example.com;

    # ADD REDIRECT TO HTTPS: 301 PERMANENT 302 TEMPORARY
    return 301 https://example.com$request_uri;
}
```

Now modify the original (http) server block to serve over https.  
_watch min 15 lesson 40_.


## certbot (contd)

```sh
# list all installed certificates
sudo certbot certificates

sudo certbot delete

# renew **ALL** certificates; you may append `--dry-run` if you want to test
sudo certbot renew

sudo certbot --force-renewal
```

### renewal (cron job)

> <span style="color: brown;">**WARNING**</span>  
> Since we've st HSTS headers, if you fail to renew your certificates in time, no visitor can view your site.  
It is highly recommended to set a reminder one day after renewal to check if renewal was successful or not (e.g. via `sudo certbot certificates`).

Let's create a root cron job. Run `sudo crontab -e`.

**\[Side Note 1\]**: You might get **rate limited** by Let's Encrypt, if you try to renew too many times. So you can ignore the recommendation of the course tutor (renewing ~~twice a month~~). see also [letsencrypt forum](https://community.letsencrypt.org/t/is-it-ok-to-force-renewal-every-months/207733).


**\[Side Note 2\]**: The debian certbot package **includes a cron job by default**, well, it indeed includes a cron job and a systemd timer. You should have it here `/etc/cron.d/certbot`. Read more in [this letsencrypt forum](https://community.letsencrypt.org/t/cerbot-cron-job/23895/3) for a detailed explanation

The `renew` command includes **hooks** for running commands or scripts before or after a certificate is renewed. For example, if you have a single certificate obtained using the standalone plugin, you might need to stop the webserver before renewing so standalone can bind to the necessary ports, and then restart it after the plugin is finished (based on [official docs](https://eff-certbot.readthedocs.io/en/latest/using.html#renewing-certificates)). Example:

```sh
certbot renew --pre-hook "service nginx stop" --post-hook "service nginx start"
```

Hooks **will only be run if** a certificate is due for renewal (when less than 1/3rd of its lifetime remains), so you can run the above command frequently without unnecessarily stopping your webserver. `certbot renew` exit status will be 0 if no certificate needs to be updated.

based on [Setting up automated renewal](https://eff-certbot.readthedocs.io/en/latest/using.html#automated-renewals), Run the following line, which will add a cron job to /etc/crontab:

```sh
SLEEPTIME=$(awk 'BEGIN{srand(); print int(rand()*(3600+1))}'); echo "0 0,12 * * * root sleep $SLEEPTIME && certbot renew -q" | sudo tee -a /etc/crontab > /dev/null
```

If you needed **to stop your webserver** to run Certbot, you’ll want to add pre and post hooks to stop and start your webserver automatically.  
(_Read more in the link_).

You can also configure [automated email notification for cron jobs](https://www.baeldung.com/linux/crontab-email-notifications).


</br>

## Caching & HTTP Headers

_watch lesson 42 minute 7 and minute 10._

### ETag

Nodejs fastify has [etag plugin](https://github.com/fastify/fastify-etag). All hashing algorithms are supported. see also [benchmarks](https://github.com/fastify/fastify-etag?tab=readme-ov-file#benchmarks). For very small payloads (< 2 kb), it recommends to use 'fnv1a' hashing algorithm.

</br>

## Hardening (more)

We use nginx to block access to important resources. It also helps against sql injection & common exploits.

```sh
cd /etc/nginx/includes
sudo nano --nowrap nginx_security_directives.conf
```

Add the following lines. Some of the lines are removed from video, because they wre wordpress-specific (see next line). Also the variable `$susquery` (stands for suspicious-query) is omitted (why? see 'if is Evil' below); instead we `return` immediately.

**Side Note 1**: use `if()` carefully. see [if is Evil](https://github.com/nginxinc/nginx-wiki/blob/master/source/start/topics/depth/ifisevil.rst) article.

Side Note 2: You may also see [Bad bots](https://github.com/mitchellkrogza/nginx-ultimate-bad-bot-blocker?tab=readme-ov-file#definition-of-bad-bots).  

Nginx has a error called 444 which just literally drops the connection. All these rules issue a 444 response so if a rule matches, the requesting IP simply get's no response and it would appear that your server does not exist to them or appears to be offline. (based on [here](https://github.com/mitchellkrogza/nginx-ultimate-bad-bot-blocker?tab=readme-ov-file#drop-them-and-thats-it))

**Side Note 3**: Testing query_string against all these regexes _may_ slow down a bit (how much slower?). So you may omit some of these.

Finally this file seems fine. We don't need to take care of all exploits or bots and it is not possible either.

```nginx
# Filter Request Methods
if ( $request_method ~* ^(TRACE)$ ) { return 403; }

if ( $args ~* "\.\./" ) { return 403; }
if ( $args ~* "\.(bash|git|hg|log|svn|swp|cvs|env)" ) { return 403; }

# BLOCK COMMON EXPLOITS
if ($query_string ~ "(<|%3C).*script.*(>|%3E)") { return 403; }

# BLOCK FILE INJECTIONS
if ($query_string ~ "[a-zA-Z0-9_]=http://") { return 403; }
if ($query_string ~ "[a-zA-Z0-9_]=(\.\.//?)+") { return 403; }
if ($query_string ~ "[a-zA-Z0-9_]=/([a-z0-9_.]//?)+") { return 403; }
```

Save. Then add the following in `example.com.conf`:

```nginx
server {

    ...
    include /etc/nginx/includes/nginx_security_directives.conf;
}
```

Explanation:

- why block `TRACE` method? see [this SO](https://stackoverflow.com/a/61953063).


</br>

### Prevent DDoS & Rate limit

see nginx docs and watch the video.


---

### Nginx & Docker 

<span style="color: gray">(based on youtube video "How to Secure Your Applications with HTTPS Using Docker, NGINX, and Let's Encrypt") </span>

#### Step 1

Contents of docker-compose.yml:

```yml
services:
  helloworld:
    # a simple webapp
    image: crccheck/hello-world
    container_name: helloworld
    # no need to specify ports. Just know that the webapp listens on port 8000.

  nginx:
    image: nginx
    container_name: nginx
    restart: unless-stopped
    ports:
      - 80:80
      - 443:443
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf # [maybe also ro] (?)

```

Contents of ./nginx/nginx.conf:

```nginx
events {
    worker_connections 1024;
}

http {

    server_tokens off;
    charset utf-8;
    server {
        listen 80 default_server;

        server_name _;

        location / {
            proxy_pass http://helloworld:8000;
        }
    }
}
```

At the moment, if you open the browser and type `http://<ip-address>`, you should see the response from the webapp container.

#### Step 2 (Setting up SSL)

Add the following to `http` context of nginx.conf file:

```nginx

http {
    ...

    location ~ /.well-known/acme-challenge {
        root /var/www/certbot;
    }
}
```

Add the following volumes to `nginx` service in compose file. Also add `certbot` service:

```yml
  nginx:
    ...
    volumes:
      - ... # nginx conf
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot

  certbot:
    image: certbot/certbot
    container_name: certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    command: certonly --webroot -w /var/www/certbot --email A@test.com -d example.com --agree-tos
```

Now run compose. You should get certificated stored in ./certbot.

About DNS TTL:
Common values are 86400 (24 hours) if you don’t make frequent changes and don’t require quick response. Many websites use 3600 (1 hour), which is a good middle ground.

#### Step 3

Now complete the nginx conf to use TLS and also redirect from http to https:

```nginx
https {
    # redirect from http to https
    server {
        ...
    }


    # https
    server {
        listen 443 ssl http2; # [http2 ??]

        ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
        server_name example.com;
        root /var/www/html;

        location / {
            proxy_pass http://helloworld:8000/;
        }

        # used for certificate renewal (since we have http->https redirect)
        location ~ /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
    }
}
```


#### Step 4 (Renewal)

```sh
whereis docker
crontab -e
```

Add the following command:

```sh
# every even month on on the first day at 5 a.m.
0 5 1 */2 * /usr/bin/docker compose -f /path/to/compose.yml up certbot
```

\[BTW\]: You may also utilize [ansible cron module](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/cron_module.html).