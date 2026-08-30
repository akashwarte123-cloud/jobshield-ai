# Multi-stage Dockerfile for Node.js ML Classifier Service
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/config ./packages/config
COPY packages/ml ./packages/ml
COPY apps/server ./apps/server

RUN npm ci
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/ml
RUN npm run build --workspace=apps/server

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
COPY packages/ml/package.json ./packages/ml/
COPY apps/server/package.json ./apps/server/

RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/config ./packages/config
COPY --from=builder /app/packages/ml/dist ./packages/ml/dist
COPY --from=builder /app/apps/server/dist ./apps/server/dist

EXPOSE 5000

USER node

CMD ["node", "apps/server/dist/index.js"]
