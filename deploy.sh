#!/bin/bash

# Configuration
REMOTE_USER="root"
REMOTE_HOST="8.155.13.240"
REMOTE_PATH="/www/wwwroot/oncew_family_kit"
LOCAL_BUILD_DIR=".output"
ARCHIVE_NAME="deploy_package.tar.gz"

# Check if build directory exists
if [ ! -d "$LOCAL_BUILD_DIR" ]; then
    echo "Error: Build directory '$LOCAL_BUILD_DIR' not found."
    echo "Please run your build command first (e.g., pnpm build)."
    exit 1
fi

echo "Deploying to $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"

# 1. Compress the .output directory
echo "[1/4] Compressing '$LOCAL_BUILD_DIR'..."
# Check if tar command exists
if ! command -v tar &> /dev/null; then
    echo "Error: 'tar' command not found."
    exit 1
fi

# Create tar file
tar -czf "$ARCHIVE_NAME" "$LOCAL_BUILD_DIR"

if [ $? -eq 0 ]; then
    echo "      Successfully created $ARCHIVE_NAME"
else
    echo "      Failed to create archive file"
    exit 1
fi

# 2. Push to remote server
echo "[2/4] Uploading to remote server..."
scp "$ARCHIVE_NAME" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"

if [ $? -eq 0 ]; then
    echo "      Upload successful"
else
    echo "      Upload failed"
    rm "$ARCHIVE_NAME"
    exit 1
fi

# 3. Extract on remote server
echo "[3/4] Extracting on remote server..."
# Remote commands:
# 1. cd to target directory
# 2. Remove old .output directory if it exists
# 3. Extract the new package
# 4. Remove the archive file
ssh "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_PATH && rm -rf $LOCAL_BUILD_DIR && tar -xzf $ARCHIVE_NAME && rm $ARCHIVE_NAME"

if [ $? -eq 0 ]; then
    echo "      Remote extraction successful"
else
    echo "      Remote extraction failed"
    # Don't exit here, still try to cleanup local file
fi

# 4. Cleanup local
echo "[4/4] Cleaning up local files..."
rm "$ARCHIVE_NAME"

echo "Deployment finished successfully!"
