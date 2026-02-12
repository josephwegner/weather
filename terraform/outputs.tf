output "api_gateway_url" {
  description = "API Gateway endpoint URL"
  value       = module.api.api_endpoint
}

output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = module.frontend.cloudfront_url
}

output "s3_bucket" {
  description = "S3 bucket name for frontend"
  value       = module.frontend.s3_bucket_name
}

output "lambda_functions" {
  description = "Lambda function names"
  value = {
    current_weather = module.lambdas["current"].function_name
    hourly_forecast = module.lambdas["hourly"].function_name
    daily_forecast  = module.lambdas["daily"].function_name
  }
}
