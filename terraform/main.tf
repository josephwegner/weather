# State migration: moved blocks map old resource addresses to new module addresses.
# Remove these after the first successful `terraform apply`.

# Lambdas
moved {
  from = aws_lambda_function.current_weather
  to   = module.lambdas["current"].aws_lambda_function.this
}
moved {
  from = aws_lambda_function.hourly_forecast
  to   = module.lambdas["hourly"].aws_lambda_function.this
}
moved {
  from = aws_lambda_function.daily_forecast
  to   = module.lambdas["daily"].aws_lambda_function.this
}

# API Gateway
moved {
  from = aws_apigatewayv2_api.weather_api
  to   = module.api.aws_apigatewayv2_api.this
}
moved {
  from = aws_apigatewayv2_stage.default
  to   = module.api.aws_apigatewayv2_stage.default
}

# Integrations
moved {
  from = aws_apigatewayv2_integration.current_weather
  to   = module.api.aws_apigatewayv2_integration.this["GET /api/weather/current/{lat}/{lng}"]
}
moved {
  from = aws_apigatewayv2_integration.hourly_forecast
  to   = module.api.aws_apigatewayv2_integration.this["GET /api/weather/hourly/{lat}/{lng}/{date}"]
}
moved {
  from = aws_apigatewayv2_integration.daily_forecast
  to   = module.api.aws_apigatewayv2_integration.this["GET /api/weather/daily/{lat}/{lng}/{startDate}/{endDate}"]
}

# Routes
moved {
  from = aws_apigatewayv2_route.current_weather
  to   = module.api.aws_apigatewayv2_route.this["GET /api/weather/current/{lat}/{lng}"]
}
moved {
  from = aws_apigatewayv2_route.hourly_forecast
  to   = module.api.aws_apigatewayv2_route.this["GET /api/weather/hourly/{lat}/{lng}/{date}"]
}
moved {
  from = aws_apigatewayv2_route.daily_forecast
  to   = module.api.aws_apigatewayv2_route.this["GET /api/weather/daily/{lat}/{lng}/{startDate}/{endDate}"]
}

# Lambda permissions
moved {
  from = aws_lambda_permission.current_weather
  to   = module.api.aws_lambda_permission.this["GET /api/weather/current/{lat}/{lng}"]
}
moved {
  from = aws_lambda_permission.hourly_forecast
  to   = module.api.aws_lambda_permission.this["GET /api/weather/hourly/{lat}/{lng}/{date}"]
}
moved {
  from = aws_lambda_permission.daily_forecast
  to   = module.api.aws_lambda_permission.this["GET /api/weather/daily/{lat}/{lng}/{startDate}/{endDate}"]
}

# Frontend hosting
moved {
  from = aws_s3_bucket.frontend
  to   = module.frontend.aws_s3_bucket.frontend
}
moved {
  from = aws_s3_bucket_public_access_block.frontend
  to   = module.frontend.aws_s3_bucket_public_access_block.frontend
}
moved {
  from = aws_cloudfront_origin_access_control.frontend
  to   = module.frontend.aws_cloudfront_origin_access_control.frontend
}
moved {
  from = aws_s3_bucket_policy.frontend
  to   = module.frontend.aws_s3_bucket_policy.frontend
}
moved {
  from = aws_cloudfront_distribution.frontend
  to   = module.frontend.aws_cloudfront_distribution.frontend
}

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
