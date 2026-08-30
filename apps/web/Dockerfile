# ==========================================
# Stage 1: Build Web App Bundle
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configurations
COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/config ./packages/config
COPY packages/ml ./packages/ml
COPY apps/web ./apps/web

# Install dependencies and build shared packages & web app
RUN npm ci
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/ml
RUN npm run build --workspace=apps/web

# ==========================================
# Stage 2: Nginx Alpine Production Image
# ==========================================
FROM nginx:alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts from Stage 1
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
