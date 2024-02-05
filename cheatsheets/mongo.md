# Mongo

## via Docker

Watch out `--rm`. Flag `--rm` removes the stopped container (the one `docker run` creates), not the image it was based on. Running containers with --rm flag is good for those containers that you use for very short while just to accomplish something.

```bash
docker run --name test-mongo -dit -p 27017:27017 --rm mongo:4.4.1

docker exec -it test-mongo mongosh
```

## Resource

See [Brian Holt course](https://btholt.github.io/complete-intro-to-databases/mongodb/).