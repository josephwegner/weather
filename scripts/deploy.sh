#!/bin/bash
set -e

# Full deployment script for weather app
# Usage: ./scripts/deploy.sh [--lambdas-only|--frontend-only]

MODE=${1:-all}

echo "════════════════════════════════════════════════"
echo "  Weather App Deployment"
echo "════════════════════════════════════════════════"
echo "Mode: $MODE"
echo ""

# Deploy Lambdas
if [[ "$MODE" == "all" || "$MODE" == "--lambdas-only" ]]; then
  echo "┌─────────────────────────────────────────────┐"
  echo "│  Step 1: Building Lambda Functions         │"
  echo "└─────────────────────────────────────────────┘"
  npm run build:lambdas
  echo ""

  echo "┌─────────────────────────────────────────────┐"
  echo "│  Step 2: Uploading to S3                   │"
  echo "└─────────────────────────────────────────────┘"
  bash scripts/upload-lambdas.sh
  echo ""

  echo "┌─────────────────────────────────────────────┐"
  echo "│  Step 3: Updating Lambda Functions         │"
  echo "└─────────────────────────────────────────────┘"
  bash scripts/update-lambdas.sh
  echo ""
fi

# Deploy Frontend
if [[ "$MODE" == "all" || "$MODE" == "--frontend-only" ]]; then
  echo "┌─────────────────────────────────────────────┐"
  echo "│  Step 4: Building & Deploying Frontend     │"
  echo "└─────────────────────────────────────────────┘"
  bash scripts/deploy-frontend.sh
  echo ""
fi

echo "════════════════════════════════════════════════"
echo "  ✓ Deployment Complete!"
echo "════════════════════════════════════════════════"
echo ""
echo "Your app is live at:"
echo "  App: https://d1fgesuzlvjnvv.cloudfront.net"
echo ""
echo "Test API:"
echo "  API: https://on8xl20zmd.execute-api.us-east-1.amazonaws.com/api/weather/current/41.8781/-87.6298"
echo ""
