#!/bin/bash
set -e

# Build and deploy frontend to S3
# Usage: ./scripts/deploy-frontend.sh

export NODE_ENV=production

ENVIRONMENT="prod"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET="weather-app-frontend-$ENVIRONMENT-$ACCOUNT_ID"

echo "Building and deploying frontend..."
echo "Bucket: $BUCKET"
echo ""

# Build frontend
echo "Building frontend..."
npm run build:frontend

echo ""
echo "Uploading to S3..."
aws s3 sync dist/ "s3://$BUCKET/" --delete

echo ""
echo "✓ Frontend deployed successfully!"
echo "CloudFront URL: https://$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Origins.Items[?DomainName=='$BUCKET.s3.us-east-1.amazonaws.com']].DomainName | [0]" \
  --output text)"
