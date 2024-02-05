# Cheatsheet

(Based on youtube video "Docker + Node.js⧸express tutorial： Building dev⧸prod workflow with docker and Node.js" By Sanjeev Thiyagarijan)

```bash
docker build -t <image_name> <path/to/Dockerfile or dot(.)>
docker image ls
docker image rm <IMAGE_ID>
```

BTW, according to [this SO](https://stackoverflow.com/a/56212572) you can also specify a tag (usually it's recommended to use Git version as tag) by:

```bash
# set git tag as an environment variable
GIT_REV_TAG=$(git log -1 --pretty=format:%h)
# build
docker build -t <image-name>:$GIT_REV_TAG .
# get rid of environment variable
unset GIT_REV_TAG
```

Now we have created the image (say node-app-image), you can run:

```bash
# this works but no port is published, so our container isn't accessible from outside world (even from our localhost)
docker run -d --name node-app node-app-image

docker ps

# flag -f means stop the container and then delete it. See also "Stopping" section below.
docker rm node-app -f

# port on the right side of colon is inside container
docker run -p 3000:3000 -d --name node-app node-app-image
```

Before we stop the container let's go inside it:

```bash
docker exec -it node-app bash
# if command above failed (bash shell may not exist on container), then try:
docker exec -it node-app /bin/sh

ls
# ... other linux commands
exit
```

</br>

### Stopping and removing

```bash
docker container stop node-app
docker container rm node-app
docker container ls

# assuming you also want to remove the image
docker image rm <image_name>
docker image ls
```

### Logs

```bash
docker ps -a
docker logs node-app
```

</br>

### Automatic sync in development using bind mount

The first one **will fail** if node_modules isn't present on local machine. Why? Because it will overwrite /app inside container, so it will remove node_modules INSIDE container and `start:watch` will try to run nodemon which doesn't exist.

```bash
# fails
docker run -v $(pwd):/app -p 3000:3000 -d --name node-app node-app-image

# correct way that doesn't overwrite /app/node_modules of container. See explanation below.
docker run -v $(pwd):/app    -v /app/node_modules -p 3000:3000 -d --name node-app node-app-image

# correct and more secure (read-only), though it raised read-only error for me
docker run -v $(pwd):/app:ro -v /app/node_modules -p 3000:3000 -d --name node-app node-app-image

```

BTW, **Note** dot(`.`) doesn't work here in volume path.  
If you're using Windows PowerShell you must use `${pwd}`.

Explanation: Second `-v` is an anonymous volume. The second command works because `/app/node_modules` is more specific.

</br>

### Environment variable

You can either set environment variable in Dockerfile or set it manually via command line. You can use either `--env` or use `--env-file`:

```bash
docker run -v $(pwd):/app:ro -v /app/node_modules --env-file ./.env -p 3000:4000 -d --name node-app node-app-image
```

**Important Note**: According to [this SO](https://stackoverflow.com/questions/30494050/how-do-i-pass-environment-variables-to-docker-containers), If you use `--env` (`-e`) flag, pass all `-e` values **before** the name of the docker image, otherwise no error will be raised and none of the variables will have a value.

</br>

### Volumes

As you keep spinning and deleting containers, their volumes won't get deleted automatically and eventually you'll end up having hundreds of volumes.

```bash
docker volume ls

# manually remove a volume
docker volume rm <VOLUME_NAME>

# remove all unnecessary volumes at once (Be careful)
docker volume prune

# Alternatively, -v flag also removes the associated volumes
docker rm <container_name> -fv
```

</br>

---

## Docker compose

Instead of long commands we saw previously above, use docker compose! We you run docker compose it will create a brand new network for all of your services.  
According to [this SO](https://stackoverflow.com/a/66516826) `docker-compose` is deprecated and you should now use `docker compose`.
Note, on Linux you need to install docker-compose separately.

```bash
# builds the images (if not found) and starts our services
# See notes below.
docker compose up -d

# flag -v to also remove volumes
docker compose down -v
```

Docker compose only builds the image if it doesn't exist. It **doesn't** check whether associated Dockerfile(s) are changed or not. In order to rebuild, you must:

```bash
# either
docker compose up --build -d

# ... or
docker compose build
docker compose create
docker compose start
```

</br>

### for Production
You can create different Dockerfile(s) and docker-compose files for development and production. Another approach is to have a single Dockerfile (**Note** our Dockerfile inside `/multiple-compose` is a bit different) and multiple compose files. Then for production you can run:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v
```

--> remember npm ci vs npm install
