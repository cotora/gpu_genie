resource "aws_api_gateway_rest_api" "gpu_genie_api" {
  name        = "${local.project_name}-api-${var.environment}"
  description = "GPU Genie API Gateway"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# CORS用のOPTIONSメソッド設定
resource "aws_api_gateway_method" "cors_method" {
  rest_api_id   = aws_api_gateway_rest_api.gpu_genie_api.id
  resource_id   = aws_api_gateway_rest_api.gpu_genie_api.root_resource_id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "cors_integration" {
  rest_api_id = aws_api_gateway_rest_api.gpu_genie_api.id
  resource_id = aws_api_gateway_rest_api.gpu_genie_api.root_resource_id
  http_method = aws_api_gateway_method.cors_method.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "cors_method_response" {
  rest_api_id = aws_api_gateway_rest_api.gpu_genie_api.id
  resource_id = aws_api_gateway_rest_api.gpu_genie_api.root_resource_id
  http_method = aws_api_gateway_method.cors_method.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "cors_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.gpu_genie_api.id
  resource_id = aws_api_gateway_rest_api.gpu_genie_api.root_resource_id
  http_method = aws_api_gateway_method.cors_method.http_method
  status_code = aws_api_gateway_method_response.cors_method_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# /reservations リソース
resource "aws_api_gateway_resource" "reservations" {
  rest_api_id = aws_api_gateway_rest_api.gpu_genie_api.id
  parent_id   = aws_api_gateway_rest_api.gpu_genie_api.root_resource_id
  path_part   = "reservations"
}

# POST /reservations (予約作成)
resource "aws_api_gateway_method" "create_reservation" {
  rest_api_id   = aws_api_gateway_rest_api.gpu_genie_api.id
  resource_id   = aws_api_gateway_resource.reservations.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "create_reservation_integration" {
  rest_api_id = aws_api_gateway_rest_api.gpu_genie_api.id
  resource_id = aws_api_gateway_resource.reservations.id
  http_method = aws_api_gateway_method.create_reservation.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.reservations_handler.invoke_arn
}

# /reservations/{userId} リソース
resource "aws_api_gateway_resource" "user_reservations" {
  rest_api_id = aws_api_gateway_rest_api.gpu_genie_api.id
  parent_id   = aws_api_gateway_resource.reservations.id
  path_part   = "{userId}"
}

# GET /reservations/{userId} (ユーザーの予約一覧取得)
resource "aws_api_gateway_method" "get_reservations" {
  rest_api_id   = aws_api_gateway_rest_api.gpu_genie_api.id
  resource_id   = aws_api_gateway_resource.user_reservations.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_reservations_integration" {
  rest_api_id = aws_api_gateway_rest_api.gpu_genie_api.id
  resource_id = aws_api_gateway_resource.user_reservations.id
  http_method = aws_api_gateway_method.get_reservations.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.get_reservations_handler.invoke_arn
}

# /reservations/update/{id} リソース
resource "aws_api_gateway_resource" "update_reservation" {
  rest_api_id = aws_api_gateway_rest_api.gpu_genie_api.id
  parent_id   = aws_api_gateway_resource.reservations.id
  path_part   = "update"
}

resource "aws_api_gateway_resource" "update_reservation_id" {
  rest_api_id = aws_api_gateway_rest_api.gpu_genie_api.id
  parent_id   = aws_api_gateway_resource.update_reservation.id
  path_part   = "{id}"
}

# PUT /reservations/update/{id} (予約更新)
resource "aws_api_gateway_method" "update_reservation_method" {
  rest_api_id   = aws_api_gateway_rest_api.gpu_genie_api.id
  resource_id   = aws_api_gateway_resource.update_reservation_id.id
  http_method   = "PUT"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "update_reservation_integration" {
  rest_api_id = aws_api_gateway_rest_api.gpu_genie_api.id
  resource_id = aws_api_gateway_resource.update_reservation_id.id
  http_method = aws_api_gateway_method.update_reservation_method.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.update_reservation_handler.invoke_arn
}

# /users リソース
resource "aws_api_gateway_resource" "users" {
  rest_api_id = aws_api_gateway_rest_api.gpu_genie_api.id
  parent_id   = aws_api_gateway_rest_api.gpu_genie_api.root_resource_id
  path_part   = "users"
}

# POST /users (ユーザー作成)
resource "aws_api_gateway_method" "create_user" {
  rest_api_id   = aws_api_gateway_rest_api.gpu_genie_api.id
  resource_id   = aws_api_gateway_resource.users.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "create_user_integration" {
  rest_api_id = aws_api_gateway_rest_api.gpu_genie_api.id
  resource_id = aws_api_gateway_resource.users.id
  http_method = aws_api_gateway_method.create_user.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.users_handler.invoke_arn
}

# /users/{id} リソース
resource "aws_api_gateway_resource" "user_detail" {
  rest_api_id = aws_api_gateway_rest_api.gpu_genie_api.id
  parent_id   = aws_api_gateway_resource.users.id
  path_part   = "{id}"
}

# GET /users/{id} (ユーザー情報取得)
resource "aws_api_gateway_method" "get_user" {
  rest_api_id   = aws_api_gateway_rest_api.gpu_genie_api.id
  resource_id   = aws_api_gateway_resource.user_detail.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_user_integration" {
  rest_api_id = aws_api_gateway_rest_api.gpu_genie_api.id
  resource_id = aws_api_gateway_resource.user_detail.id
  http_method = aws_api_gateway_method.get_user.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.get_user_handler.invoke_arn
}

# Lambda実行権限
resource "aws_lambda_permission" "api_gateway_reservations" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.reservations_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.gpu_genie_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_get_reservations" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_reservations_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.gpu_genie_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_update_reservation" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update_reservation_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.gpu_genie_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_users" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.users_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.gpu_genie_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_get_user" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_user_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.gpu_genie_api.execution_arn}/*/*"
}

# API Gateway デプロイメント
resource "aws_api_gateway_deployment" "gpu_genie_deployment" {
  depends_on = [
    aws_api_gateway_method.create_reservation,
    aws_api_gateway_method.get_reservations,
    aws_api_gateway_method.update_reservation_method,
    aws_api_gateway_method.create_user,
    aws_api_gateway_method.get_user,
    aws_api_gateway_integration.create_reservation_integration,
    aws_api_gateway_integration.get_reservations_integration,
    aws_api_gateway_integration.update_reservation_integration,
    aws_api_gateway_integration.create_user_integration,
    aws_api_gateway_integration.get_user_integration,
  ]

  rest_api_id = aws_api_gateway_rest_api.gpu_genie_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.reservations.id,
      aws_api_gateway_method.create_reservation.id,
      aws_api_gateway_integration.create_reservation_integration.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "gpu_genie_stage" {
  deployment_id = aws_api_gateway_deployment.gpu_genie_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.gpu_genie_api.id
  stage_name    = var.environment

  tags = {
    Name = "${local.project_name}-api-stage-${var.environment}"
  }
}