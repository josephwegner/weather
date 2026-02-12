data "terraform_remote_state" "shared" {
  backend = "s3"
  config = {
    bucket = "terraform-state-743837809639"
    key    = "shared/terraform.tfstate"
    region = "us-east-1"
  }
}

locals {
  lambda_bucket = data.terraform_remote_state.shared.outputs.lambda_deployments_bucket
}

data "aws_caller_identity" "current" {}

resource "aws_iam_role" "lambda_role" {
  name = "${var.app_name}-lambda-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "${var.app_name}-lambda-role"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

module "lambdas" {
  source   = "git::https://github.com/josephwegner/family-paas.git//terraform/modules/lambda-function?ref=main"
  for_each = {
    "current" = { s3_key = "${var.app_name}/${var.environment}/get-current-weather.zip" }
    "hourly"  = { s3_key = "${var.app_name}/${var.environment}/get-hourly-forecast.zip" }
    "daily"   = { s3_key = "${var.app_name}/${var.environment}/get-daily-forecast.zip" }
  }

  function_name         = each.key
  app_name              = var.app_name
  environment           = var.environment
  lambda_role_arn       = aws_iam_role.lambda_role.arn
  s3_bucket             = local.lambda_bucket
  s3_key                = each.value.s3_key
  environment_variables = {
    VISUAL_CROSSING_API_KEY  = var.visual_crossing_api_key
    VISUAL_CROSSING_BASE_URL = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline"
  }
}

module "api" {
  source      = "git::https://github.com/josephwegner/family-paas.git//terraform/modules/api-gateway?ref=main"
  app_name    = var.app_name
  environment = var.environment
  routes = [
    { route_key = "GET /api/weather/current/{lat}/{lng}", function_arn = module.lambdas["current"].invoke_arn, function_name = module.lambdas["current"].function_name },
    { route_key = "GET /api/weather/hourly/{lat}/{lng}/{date}", function_arn = module.lambdas["hourly"].invoke_arn, function_name = module.lambdas["hourly"].function_name },
    { route_key = "GET /api/weather/daily/{lat}/{lng}/{startDate}/{endDate}", function_arn = module.lambdas["daily"].invoke_arn, function_name = module.lambdas["daily"].function_name },
  ]
}

module "frontend" {
  source               = "git::https://github.com/josephwegner/family-paas.git//terraform/modules/frontend-hosting?ref=main"
  app_name             = var.app_name
  environment          = var.environment
  api_gateway_endpoint = module.api.api_endpoint
  domain_name          = "weather.joewegner.com"
  acm_certificate_arn  = var.acm_certificate_arn
}
