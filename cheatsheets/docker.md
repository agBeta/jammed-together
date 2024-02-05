# Docker

### Permission

Based on [this SO](https://stackoverflow.com/questions/48957195/how-to-fix-docker-got-permission-denied-issue): If you want to run docker as non-root user then you need to add it to the docker group.

1. Create the docker group if it does not exist: `sudo groupadd docker`
2. Add your user to the docker group: `sudo usermod -aG docker $USER`
3. Log in to the new `docker` group (to avoid having to log out / log in again; but if not enough, try to reboot): `newgrp docker`
4. Check if docker can be run without root: `docker run hello-world`
5. if still got error, restart docker or reboot the computer: `sudo systemctl restart docker`

## Practice

See nodejs-dockerized folder.

## Other resources

- Dockerize [MySQL & Nestjs](https://dev.to/gustavocontreiras/how-to-create-a-dockerized-full-stack-environment-with-mysql-nestjs-and-nextjs-27oh).
- About [pm2 and docker](https://dev.to/mandraketech/pm2-and-docker-in-the-world-of-nodejs-1lg8).
