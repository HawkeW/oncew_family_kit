#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./build-linux.sh
#   ./build-linux.sh linux/arm64

PLATFORM="${1:-linux/amd64}"
IMAGE_NAME="oncew-family-kit-builder"

echo "Building Docker image for platform: ${PLATFORM} ..."
docker build --platform "${PLATFORM}" -t "${IMAGE_NAME}" .

echo "Creating temporary container..."
CONTAINER_ID="$(docker create "${IMAGE_NAME}")"

cleanup() {
  if [ -n "${CONTAINER_ID:-}" ]; then
    docker rm -v "${CONTAINER_ID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

echo "Extracting build artifacts to ./.output..."
rm -rf ./.output
docker cp "${CONTAINER_ID}:/app/.output" ./.output

echo "Build complete! Artifacts are in ./.output"
