output "api_gateway_url" {
  description = "API Gateway URL"
  value       = aws_api_gateway_stage.gpu_genie_stage.invoke_url
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "s3_bucket_name" {
  description = "S3 bucket name for frontend"
  value       = aws_s3_bucket.frontend.bucket
}

output "dynamodb_tables" {
  description = "DynamoDB table names"
  value = {
    reservations = aws_dynamodb_table.reservations.name
    users        = aws_dynamodb_table.users.name
    gpu_servers  = aws_dynamodb_table.gpu_servers.name
  }
}

output "lambda_functions" {
  description = "Lambda function names"
  value = {
    reservations_handler      = aws_lambda_function.reservations_handler.function_name
    get_reservations_handler  = aws_lambda_function.get_reservations_handler.function_name
    update_reservation_handler = aws_lambda_function.update_reservation_handler.function_name
    users_handler            = aws_lambda_function.users_handler.function_name
    get_user_handler         = aws_lambda_function.get_user_handler.function_name
  }
}

output "cognito_config" {
  description = "Cognito configuration"
  value = {
    user_pool_id        = aws_cognito_user_pool.gpu_genie_pool.id
    user_pool_client_id = aws_cognito_user_pool_client.gpu_genie_client.id
    identity_pool_id    = aws_cognito_identity_pool.gpu_genie_identity_pool.id
    domain              = aws_cognito_user_pool_domain.gpu_genie_domain.domain
    region              = var.aws_region
  }
}