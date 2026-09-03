# Build context: repository root (see docker-compose.yml build.context)
FROM node:20-alpine AS build
WORKDIR /repo

COPY package.json ./
COPY server/package.json server/package.json
COPY shared shared
COPY server server

RUN npm install --workspace server --no-audit --no-fund
RUN npm run build --workspace server

FROM node:20-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production

COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/server/dist ./dist
COPY --from=build /repo/server/package.json ./server/package.json

EXPOSE 4000
CMD ["node", "dist/server/src/server.js"]
