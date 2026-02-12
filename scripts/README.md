# Deployment Scripts

Scripts for deploying the weather app to AWS production.

## Quick Start

```bash
# Full deployment (lambdas + frontend)
npm run deploy

# Deploy only lambdas
npm run deploy:lambdas

# Deploy only frontend
npm run deploy:frontend
```

## Individual Scripts

### `build-lambdas.sh`

Builds Lambda functions with esbuild and creates deployment zips.

```bash
bash scripts/build-lambdas.sh
```

**Output:** `dist/lambdas/*.zip`

### `upload-lambdas.sh`

Uploads Lambda deployment packages to S3.

```bash
bash scripts/upload-lambdas.sh
```

**Uploads to:** `s3://lambda-deployments-743837809639/weather-app/prod/`

### `update-lambdas.sh`

Updates Lambda functions to use new deployment packages from S3.

```bash
bash scripts/update-lambdas.sh
```

**Updates functions:**

- `weather-app-current-prod`
- `weather-app-hourly-prod`
- `weather-app-daily-prod`

### `deploy-frontend.sh`

Builds and deploys frontend to S3.

```bash
bash scripts/deploy-frontend.sh
```

**Deploys to:** `s3://weather-app-frontend-prod-743837809639/`

### `deploy.sh`

Master deployment script that orchestrates full deployment.

```bash
# Full deployment
bash scripts/deploy.sh

# Lambdas only
bash scripts/deploy.sh --lambdas-only

# Frontend only
bash scripts/deploy.sh --frontend-only
```

## Typical Workflow

### Code Changes to Lambda Functions

```bash
# 1. Make changes to lambdas/**/*.ts
# 2. Deploy only lambdas
npm run deploy:lambdas
```

### Code Changes to Frontend

```bash
# 1. Make changes to src/**/*.vue
# 2. Deploy only frontend
npm run deploy:frontend
```

### Full Deployment

```bash
# Deploy everything
npm run deploy
```

## Production URLs

- **App:** https://d1fgesuzlvjnvv.cloudfront.net
- **API:** https://on8xl20zmd.execute-api.us-east-1.amazonaws.com

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform infrastructure deployed (see `../infrastructure/environments/weather-app/prod/`)
- Node.js and npm installed

## Troubleshooting

### "Lambda function not found"

Make sure Terraform infrastructure is deployed first:

```bash
cd ../infrastructure/environments/weather-app/prod
terraform init
terraform apply
```

### "Access Denied" to S3

Check your AWS credentials:

```bash
aws sts get-caller-identity
```

### Lambda update takes time

Lambda functions may take 5-10 seconds to become active after update. Wait a moment before testing.

## CloudFront Caching

**Note:** CloudFront caches frontend files. After deploying frontend updates:

- Static assets may take a few minutes to update globally
- API calls (`/api/*`) are not cached
- To force immediate update, invalidate CloudFront cache:

```bash
DISTRIBUTION_ID=E1GOZ7VHRYR38T

aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```
