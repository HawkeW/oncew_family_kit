# Use Node.js 22 LTS
FROM node:22-slim

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

# Prepare the output for production
# We go into the output directory and install production dependencies.
# This ensures native modules like better-sqlite3 are present and built for Linux.
WORKDIR /app/.output/server
# Use npm to avoid pnpm's security restrictions on scripts in the generated package.json
RUN npm install --omit=dev

# Verify the build artifact exists (better-sqlite3 binary)
RUN find node_modules/better-sqlite3 -name "*.node" | grep . || (echo "Error: better-sqlite3 binary not found" && exit 1)

# Cleanup unnecessary files to reduce image size and file count
RUN find . -name "*.map" -type f -delete && \
    find . -name "*.ts" -type f -delete && \
    find . -name "*.md" -type f -delete && \
    find . -name "*.d.ts" -type f -delete && \
    find . -name "test" -type d -exec rm -rf {} + && \
    find . -name "tests" -type d -exec rm -rf {} + && \
    find . -name ".bin" -type d -exec rm -rf {} +

# Reset workdirVerify the build artifact exists
WORKDIR /app
RUN ls -la .output
