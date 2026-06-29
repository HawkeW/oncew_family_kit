# Build stage
FROM node:22-bookworm AS builder

# Install build dependencies for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    gcc \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# Enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the application
RUN pnpm run build

# Production stage - minimal image
FROM node:22-slim

# Install only runtime dependencies needed for SQLite
RUN apt-get update && apt-get install -y --no-install-recommends \
    libc6 \
    libsqlite3-0 \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get autoremove -y \
    && apt-get clean

WORKDIR /app

# Copy the built Nuxt output
COPY --from=builder /app/.output ./.output

# Install production dependencies in output
WORKDIR /app/.output/server
RUN npm install --omit=dev --ignore-scripts

# Verify the build artifact exists (better-sqlite3 binary for Linux)
RUN find node_modules/better-sqlite3 -name "*.node" 2>/dev/null | grep -q . || { \
    echo "Error: better-sqlite3 binary not found"; \
    exit 1; }

# Cleanup unnecessary files to reduce image size
RUN find . -name "*.map" -type f -delete && \
    find . -name "*.ts" -type f -delete && \
    find . -name "*.d.ts" -type f -delete && \
    find . -name "test" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find . -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find . -name ".bin" -type d -exec rm -rf {} + 2>/dev/null || true

WORKDIR /app

EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["node", "server/index.mjs"]