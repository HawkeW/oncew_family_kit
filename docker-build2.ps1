# Build Nuxt app inside Docker container and upload to server
$image = "node:22-slim"
$containerName = "nuxt-build-tmp"
$projectDir = "D:\projects\oncew_family_kit"

# Clean up any existing container
docker rm -f $containerName 2>$null

# Start a container in detached mode and keep it alive
Write-Host "Starting container..."
docker run -d --name $containerName $image sleep infinity
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to start container"
    exit 1
}

# Copy source into the container
Write-Host "Copying source into container..."
$exclude = @(".git", "node_modules", ".output", ".nuxt", ".output_linux*", "dist", "coverage")
Get-ChildItem -Path $projectDir -Force | ForEach-Object {
    $name = $_.Name
    if ($name -notin $exclude -and $_.Exists) {
        docker cp "$($_.FullName)" "${containerName}:/app/" | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[WARN] Failed to copy $name"
        }
    }
}

# Install build dependencies for better-sqlite3
Write-Host "Installing build dependencies..."
$result = docker exec $containerName sh -c "apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*" 2>&1
if ($LASTEXITCODE -ne 0) { $result | Write-Host }

# Enable pnpm and install dependencies
Write-Host "Installing dependencies..."
$result = docker exec $containerName sh -c "corepack enable && corepack prepare pnpm@9 --activate" 2>&1
if ($LASTEXITCODE -ne 0) { $result | Write-Host }
$result = docker exec $containerName sh -c "cd /app && pnpm install" 2>&1
if ($LASTEXITCODE -ne 0) { $result | Write-Host }
Write-Host "Install complete"

# Build
Write-Host "Building..."
$result = docker exec $containerName sh -c "cd /app && env NUXT_DEVTOOLS=false pnpm run build" 2>&1
if ($LASTEXITCODE -ne 0) { $result | Write-Host; Write-Host "[ERROR] Build failed"; docker rm -f $containerName | Out-Null; exit 1 }
Write-Host "Build complete"

# Install production dependencies in .output to get better-sqlite3 binary
Write-Host "Installing production dependencies in output..."
$result = docker exec $containerName sh -c "cd /app/.output/server && npm install --omit=dev" 2>&1
if ($LASTEXITCODE -ne 0) { $result | Write-Host; Write-Host "[ERROR] npm install in output failed"; docker rm -f $containerName | Out-Null; exit 1 }

# Verify better-sqlite3 binary in container
Write-Host "Verifying better-sqlite3 in container..."
$result = docker exec $containerName sh -c "find /app/.output/server/node_modules -name '*.node' 2>/dev/null | head -5"
$result | Write-Host

# Tar the output
Write-Host "Tarring output..."
docker exec $containerName sh -c "cd /app && tar -czf /tmp/build_output.tar.gz .output" 2>&1
if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] Tar failed"; docker rm -f $containerName | Out-Null; exit 1 }

# Copy tar to local
$tarPath = "$projectDir\build_output.tar.gz"
Remove-Item -Force $tarPath -ErrorAction SilentlyContinue
docker cp "${containerName}:/tmp/build_output.tar.gz" "$tarPath"
docker rm -f $containerName | Out-Null

# Check tar size
$tarInfo = Get-Item $tarPath
Write-Host "Tar created: $($tarInfo.Length) bytes"

# Upload to server and extract
Write-Host "Uploading to server..."
$serverPath = "root@8.155.13.240:/www/wwwroot/oncew_family_kit/build_output.tar.gz"
scp -o StrictHostKeyChecking=no "$tarPath" $serverPath
if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] Upload failed"; exit 1 }

# Clean up local tar
Remove-Item -Force $tarPath -ErrorAction SilentlyContinue

# Extract on server, preserving old data.db
Write-Host "Extracting on server..."
ssh root@8.155.13.240 @'
cd /www/wwwroot/oncew_family_kit

# Backup old data.db path
OLD_DB=".output_old/server/data.db"
NEW_DB=".output/server/data.db"

# Extract new build
tar -xzf build_output.tar.gz
if [ $? -ne 0 ]; then
  echo "[ERROR] Extract failed"
  exit 1
fi
echo "Extracted OK"

# Verify better-sqlite3 binary
ls .output/server/node_modules/better-sqlite3/build/Release/*.node 2>&1 || echo "Binary not found"

# Restore data.db if it existed in old output
if [ -f "$OLD_DB" ]; then
  echo "Restoring data.db from old build..."
  cp "$OLD_DB" "$NEW_DB"
  chown www:www "$NEW_DB"
  echo "data.db restored: $(stat -c%s $NEW_DB) bytes"
else
  echo "[WARN] No old data.db found, using fresh database"
fi

# Cleanup old output and tar
rm -rf .output_old build_output.tar.gz 2>/dev/null
echo "Cleanup done"
'@

Write-Host "[SUCCESS] Build deployed to server"
