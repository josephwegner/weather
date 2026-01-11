#!/bin/bash
set -e

# Update Lambda functions to use new deployment packages from S3
# Usage: ./scripts/update-lambdas.sh

ENVIRONMENT="prod"
BUCKET="lambda-deployments-743837809639"
APP_NAME="weather-app"

echo "Updating Lambda functions from S3..."
echo ""

# Array of Lambda function names and their S3 keys
LAMBDAS=(
  "$APP_NAME-current-$ENVIRONMENT:get-current-weather.zip"
  "$APP_NAME-hourly-$ENVIRONMENT:get-hourly-forecast.zip"
  "$APP_NAME-daily-$ENVIRONMENT:get-daily-forecast.zip"
)

for lambda_entry in "${LAMBDAS[@]}"; do
  # Split on colon
  function_name="${lambda_entry%%:*}"
  zip_file="${lambda_entry##*:}"
  s3_key="$APP_NAME/$ENVIRONMENT/$zip_file"

  echo "Updating $function_name..."

  aws lambda update-function-code \
    --function-name "$function_name" \
    --s3-bucket "$BUCKET" \
    --s3-key "$s3_key" \
    --output json > /dev/null

  echo "✓ Updated $function_name"
done

echo ""
echo "All Lambda functions updated successfully!"
echo "Note: Functions may take a few seconds to become active."
