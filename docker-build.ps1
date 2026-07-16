# Build Nuxt app inside Docker container and copy output back
$image = "node:22-slim"
$containerName = "nuxt-build-tmp"
$projectDir = "D:\projects\oncew_family_kit"
$outputDir = "$projectDir\.output_linux_new"

# Clean up any existing container
docker rm -f $containerName 2>$null

# Create a temporary container (don't start it)
# We use the image that was successfully pulled earlier
docker create --name $containerName $image sh | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to create container from local image"
    exit 1
}

# Copy source into the container
Write-Host "Copying source into container..."
docker cp "$projectDir\.git" "${containerName}:/app\.git"
docker cp "$projectDir\nuxt.config.ts" "${containerName}:/app\"
docker cp "$projectDir\package.json" "${containerName}:/app\"
docker cp "$projectDir\pnpm-lock.yaml" "${containerName}:/app\"
docker cp "$projectDir\app" "${containerName}:/app\"
docker cp "$projectDir\server" "${containerName}:/app\"
docker cp "$projectDir\pages" "${containerName}:/app\"
docker cp "$projectDir\components" "${containerName}:/app\"
docker cp "$projectDir\layouts" "${containerName}:/app\"
docker cp "$projectDir\composables" "${containerName}:/app\"
docker cp "$projectDir\middleware" "${containerName}:/app\"
docker cp "$projectDir\public" "${containerName}:/app\"
docker cp "$projectDir\assets" "${containerName}:/app\"
docker cp "$projectDir\utils" "${containerName}:/app\"
docker cp "$projectDir\models" "${containerName}:/app\"
docker cp "$projectDir\playwright.config.ts" "${containerName}:/app\"

Write-Host "Installing dependencies..."
docker start $containerName
docker exec $containerName sh -c "corepack enable && corepack prepare pnpm@9 --activate && pnpm install --frozen-lockfile" 2>&1 | Write-Host

Write-Host "Building..."
docker exec $containerName sh -c "NUXT_DEVTOOLS=false pnpm run build" 2>&1 | Write-Host

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build failed"
    docker rm -f $containerName | Out-Null
    exit 1
}

# Copy output back
Write-Host "Copying output back..."
docker cp "${containerName}:/app/.output" "$outputDir"

docker rm -f $containerName | Out-Null

if (Test-Path "$outputDir\server") {
    Write-Host "[SUCCESS] Build output extracted to $outputDir"
} else {
    Write-Host "[ERROR] Output extraction failed"
    exit 1
}
