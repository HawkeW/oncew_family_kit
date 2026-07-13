# Build stage - use Ubuntu as base which has better compatibility
FROM node:22.15.0-bookworm AS builder

# Install build dependencies for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Enable pnpm and allow native module builds
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package.json pnpm-lock.yaml ./

# Install dependencies (allow scripts for native modules)
RUN pnpm install

# Copy the rest of the application
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM debian:bookworm-slim

# Install runtime dependencies for better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    libc6 \
    libsqlite3-0 \
    libstdc++6 \
    ca-certificates \
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
RUN if [ ! -f "node_modules/better-sqlite3/build/Release/better_sqlite3.node" ]; then \
    echo "Error: better-sqlite3 binary not found"; \
    exit 1; \
    fi

# Cleanup unnecessary files to reduce image size
RUN find . -name "*.map" -type f -delete 2>/dev/null || true && \
    find . -name "*.ts" -type f -delete 2>/dev/null || true && \
    find . -name "*.d.ts" -type f -delete 2>/dev/null || true && \
    find . -name "test" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find . -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find . -name ".bin" -type d -exec rm -rf {} + 2>/dev/null || true

WORKDIR /app

EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["node", "server/index.mjs"]