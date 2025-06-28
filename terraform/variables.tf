variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "domain_name" {
  description = "Domain name for CloudFront distribution"
  type        = string
  default     = ""
}

variable "vercel_domain" {
  description = "Vercel domain name for frontend hosting"
  type        = string
  default     = ""
}

variable "bedrock_model_id" {
  description = "Amazon Bedrock model ID for AI priority judgment"
  type        = string
  default     = "deepseek.r1-v1:0"
}

variable "aws_profile" {
  description = "AWS profile name to use for deployment"
  type        = string
  default     = null
}