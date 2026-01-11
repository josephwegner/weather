#!/bin/bash
set -e

# Upload Lambda deployment packages to S3
# Usage: ./scripts/upload-lambdas.sh

BUCKET="lambda-deployments-743837809639"
APP_NAME="weather-app"
ENVIRONMENT="prod"

echo "Uploading Lambda packages to S3..."
echo "Bucket: $BUCKET"
echo ""

LAMBDAS=("get-current-weather" "get-hourly-forecast" "get-daily-forecast")

for lambda in "${LAMBDAS[@]}"; do
  echo "Uploading $lambda..."
  aws s3 cp "dist/lambdas/$lambda.zip" \
    "s3://$BUCKET/$APP_NAME/$ENVIRONMENT/$lambda.zip"
  echo "✓ Uploaded $lambda.zip"
done

echo ""
echo "All Lambda packages uploaded successfully!"
