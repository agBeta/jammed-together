# Cheatsheet

(Based on youtube video "Docker + Node.js⧸express tutorial： Building dev⧸prod workflow with docker and Node.js" By Sanjeev Thiyagarijan)

```dockerfile
FROM node:20.11.0-alphine
```

```
docker build .
docker image ls
docker image rm >IMAGE_ID<
```

</br>

`docker build -t node-app-image . `  
`docker run -d --name node-app-container-1 node-app-image`  
`docker ps`  
`docker rm node-app-container-1 -f`  
flag `-f`: first stops the container and then deletes it.

</br> 
`docker run -p 3000:3000 -d --name node-app node-app-image` --> right number is port inside container

</br>
Inside container:

```
docker exec -it node-app bash
ls
exit
```

</br>

`docker run -v path_Local_Machine:path_Inside_Container -p 3000:3000 -d --name node-app node-app-image`  
**Note**: `.` doesn't work here in path.

`docker run -v $(pwd):/app -p 3000:3000 -d --name node-app node-app-image`

</br>
After deleting node_modules from local [45:00]:

```
docker ps -a
docker logs node-app
```

`docker run -v $(pwd):/app -v /app/node_modules -p 3000:3000 -d --name node-app node-app-image`
</br>

`docker run -v $(pwd):/app:ro -v /app/node_modules -p 3000:3000 -d --name node-app node-app-image`

</br>

`docker run -v $(pwd):/app:ro -v /app/node_modules --env PORT=4000 -p 3000:4000 -d --name node-app node-app-image`

Note: For another env variable you have to specify --env again for each one.

`printenv` --> prints env variable currently set in bash

`docker run -v $(pwd):/app:ro -v /app/node_modules --env-file ./.env -p 3000:4000 -d --name node-app node-app-image`

`docker volume ls`

`docker volume rm "VOLUME_NAME"`
OR
`docker volume prune`

`docker-compose up -d`
`docker-compose down`  
--> -v flag: If you want to also remove volumes.

`docker-compose up -d --build`

`docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d`

--> remember npm ci vs npm install
