# not slim because we need github depedencies
FROM node:16-buster

RUN apt-get update
RUN apt-get install build-essential -y
RUN apt install -y meson
RUN apt install -y python3-testresources
RUN apt-get install -y python3-venv
RUN apt-get install python3-pip -y
# Create app directory
WORKDIR /app

RUN npm install -g lerna cross-env rimraf --loglevel notice

# to make use of caching, copy only package files and install dependencies
COPY package.json .
COPY packages/analytics/package.json ./packages/analytics/
COPY packages/client/package.json ./packages/client/
COPY packages/client-core/package.json ./packages/client-core/
COPY packages/common/package.json ./packages/common/
COPY packages/editor/package.json ./packages/editor/
COPY packages/engine/package.json ./packages/engine/
COPY packages/matchmaking/package.json ./packages/matchmaking/
COPY packages/gameserver/package.json ./packages/gameserver/
COPY packages/matchmaking/package.json ./packages/matchmaking/
COPY packages/server/package.json ./packages/server/
COPY packages/server-core/package.json ./packages/server-core/
COPY packages/projects/package.json ./packages/projects/

#RUN  npm ci --verbose  # we should make lockfile or shrinkwrap then use npm ci for predicatble builds
RUN npm install --production=false --loglevel notice --legacy-peer-deps

COPY . .

# copy then compile the code

ARG MYSQL_HOST
ARG MYSQL_PORT
ARG MYSQL_USER
ARG MYSQL_PASSWORD
ARG MYSQL_DATABASE
ENV MYSQL_HOST=$MYSQL_HOST
ENV MYSQL_PORT=$MYSQL_PORT
ENV MYSQL_USER=$MYSQL_USER
ENV MYSQL_PASSWORD=$MYSQL_PASSWORD
ENV MYSQL_DATABASE=$MYSQL_DATABASE

RUN npm run build-client

ENV APP_ENV=production

CMD ["scripts/start-server.sh"]
