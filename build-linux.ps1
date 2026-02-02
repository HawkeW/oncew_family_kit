# Build the Docker image
Write-Host "Building Docker image..."
docker build -t oncew-family-kit-builder .
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed. Please ensure Docker Desktop is running."
    exit 1
}

# Create a temporary container
Write-Host "Creating temporary container..."
$id = docker create oncew-family-kit-builder
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create container."
    exit 1
}

# Copy the output directory to the host
Write-Host "Extracting build artifacts to ./.output..."
if (Test-Path .\.output) {
    Remove-Item -Recurse -Force .\.output
}
docker cp "$id`:/app/.output" ./.output

# Remove the temporary container
Write-Host "Cleaning up..."
docker rm -v $id

Write-Host "Build complete! Artifacts are in ./.output"
