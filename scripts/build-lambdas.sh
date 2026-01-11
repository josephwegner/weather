#!/bin/bash
set -e

echo "Building Lambda functions with esbuild..."

LAMBDAS=("get-current-weather" "get-hourly-forecast" "get-daily-forecast")
OUTPUT_DIR="dist/lambdas"

# Clean previous builds
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

for lambda in "${LAMBDAS[@]}"; do
  echo "Building $lambda..."

  # Create output directory for this lambda
  mkdir -p "$OUTPUT_DIR/$lambda"

  # Bundle with esbuild (includes node_modules)
  npx esbuild "lambdas/$lambda/index.ts" \
    --bundle \
    --platform=node \
    --target=node20 \
    --external:aws-sdk \
    --external:aws-lambda \
    --outfile="$OUTPUT_DIR/$lambda/index.js"

  # Create deployment zip
  cd "$OUTPUT_DIR/$lambda"
  zip -r "../$lambda.zip" .
  cd ../../..

  echo "✓ Created $OUTPUT_DIR/$lambda.zip"
done

echo ""
echo "All Lambda functions built successfully!"
