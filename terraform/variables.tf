variable "visual_crossing_api_key" {
  description = "Visual Crossing Weather API key"
  type        = string
  sensitive   = true
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "weather-app"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "acm_certificate_arn" {
  description = "ARN of the ACM certificate for custom domain (must be in us-east-1)"
  type        = string
  default     = "arn:aws:acm:us-east-1:743837809639:certificate/3b977098-62d8-4f74-adab-0ea75b406b06"
}
