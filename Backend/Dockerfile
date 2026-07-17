# ─────────────────────────────────────────────
# Stage 1 – Install dependencies
# ─────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

# ─────────────────────────────────────────────
# Stage 2 – Runtime image
# ─────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Create uploads directory (persisted via volume)
RUN mkdir -p uploads

# Expose the port the app listens on
EXPOSE 3000

# Healthcheck – ping the root endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node", "index.js"]
