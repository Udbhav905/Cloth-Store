# ─────────────────────────────────────────────
# Stage 1 – Build the Vite app
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Pass build-time env variable for Stripe key
ARG VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY

COPY . .
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2 – Serve with Nginx
# ─────────────────────────────────────────────
FROM nginx:stable-alpine AS runner

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (SPA routing support)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
