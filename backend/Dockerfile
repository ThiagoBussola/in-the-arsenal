## Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

## Production stage
FROM node:22-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Migrações no deploy (releaseCommand / npm run db:migrate em produção)
COPY .sequelizerc sequelize.config.cjs ./
COPY src/migrations ./src/migrations
COPY src/seeders ./src/seeders

USER appuser

EXPOSE ${PORT:-3001}

CMD ["node", "dist/server.js"]
