# Build context: repository root (see docker-compose.yml build.context)
FROM node:20-alpine AS build
WORKDIR /repo

COPY package.json ./
COPY client/package.json client/package.json
COPY client client

RUN npm install --workspace client --no-audit --no-fund
RUN npm run build --workspace client

FROM nginx:1.27-alpine AS runtime
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/client/dist /usr/share/nginx/html

EXPOSE 80
