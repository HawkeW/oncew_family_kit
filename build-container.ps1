# Build inside a Docker container and extract output via volume mount
$image = "oncew-family-kit-builder:latest"
$containerName = "oncew-builder-tmp"
$outputDir = "$PSScriptRoot\output_extracted"
$tarPath = "$PSScriptRoot\build_output.tar.gz"

# Clean up any existing container
docker rm -f $containerName 2>$null

# Create output directory
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

Write-Host "Building inside Docker container..."

# Run build in container with output directory mounted
docker run --name $containerName `
    -v "${PSScriptRoot}:/app" `
    -w /app `
    $image `
    sh -c "pnpm install --frozen-lockfile && NUXT_DEVTOOLS=false pnpm run build" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build failed inside container"
    exit 1
}

# The output is now in /app/.output on the container
# Copy it out using docker cp
Write-Host "Extracting build output..."
docker cp "${containerName}:/app/.output" "$outputDir\.output"

# Verify
if (Test-Path "$outputDir\.output\server") {
    Write-Host "[SUCCESS] Build output extracted to $outputDir\.output"
} else {
    Write-Host "[ERROR] Output extraction failed"
    exit 1
}

# Cleanup
docker rm $containerName | Out-Null
