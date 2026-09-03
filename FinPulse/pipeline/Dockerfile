# Build context: repository root (see docker-compose.yml build.context)
FROM node:20-alpine AS build
WORKDIR /repo

COPY package.json ./
COPY pipeline/package.json pipeline/package.json
COPY shared shared
COPY pipeline pipeline

RUN npm install --workspace pipeline --no-audit --no-fund
RUN npm run build --workspace pipeline

FROM node:20-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production

COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/pipeline/dist ./dist
COPY --from=build /repo/pipeline/package.json ./pipeline/package.json

# Default to the producer; docker-compose overrides `command` for the consumer service.
CMD ["node", "dist/pipeline/src/producer/index.js"]
