# Just for documentation and future reference
FROM node:20.11-alpine
WORKDIR /app
COPY package.json .

# See dev and prod docker compose files for NODE_ENV
ARG COMPOSE_ENV
RUN if [ COMPOSE_ENV = "development" ]; \
    then npm install; \
    else npm install --only=production; \
    fi

COPY . ./
ENV PORT 3000
EXPOSE $PORT
# This will be overwritten by docker compose files.
CMD ["npm", "run", "start:watch"]
