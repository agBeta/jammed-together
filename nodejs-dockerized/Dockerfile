FROM node:20.11-alpine
WORKDIR /app
# Below, we could set /app instead of dot(.)
COPY package.json .
# (?) COPY package-lock.json . and npm ci
RUN npm install
# Another layer, though technically we have already copied package.json. Our package.json 
# doesn't change very frequently, so docker caching the result of previous layer will become
# beneficial for us.
# Though for development we're using volume bind mount, but for production we definitely need
# to copy.
COPY . ./
ENV PORT 3000
EXPOSE $PORT
CMD ["npm", "run", "start:watch"]
# Also see best practices inside cheatsheet.md.