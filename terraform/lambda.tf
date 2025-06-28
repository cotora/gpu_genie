data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambda/dist"
  output_path = "${path.module}/lambda-function.zip"
}

resource "aws_iam_role" "lambda_role" {
  name = "${local.project_name}-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "${local.project_name}-lambda-policy-${var.environment}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.reservations.arn,
          "${aws_dynamodb_table.reservations.arn}/*",
          aws_dynamodb_table.users.arn,
          "${aws_dynamodb_table.users.arn}/*",
          aws_dynamodb_table.gpu_servers.arn,
          "${aws_dynamodb_table.gpu_servers.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = "arn:aws:bedrock:${var.aws_region}::foundation-model/*"
      }
    ]
  })
}

resource "aws_lambda_function" "reservations_handler" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${local.project_name}-reservations-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "handlers/reservations.createReservation"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "nodejs18.x"
  timeout          = 30

  environment {
    variables = {
      RESERVATIONS_TABLE = aws_dynamodb_table.reservations.name
      USERS_TABLE        = aws_dynamodb_table.users.name
      GPU_SERVERS_TABLE  = aws_dynamodb_table.gpu_servers.name
      BEDROCK_MODEL_ID   = var.bedrock_model_id
    }
  }

  depends_on = [
    aws_iam_role_policy.lambda_policy,
    aws_cloudwatch_log_group.lambda_logs,
  ]
}

resource "aws_lambda_function" "get_reservations_handler" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${local.project_name}-get-reservations-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "handlers/reservations.getReservations"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "nodejs18.x"
  timeout          = 30

  environment {
    variables = {
      RESERVATIONS_TABLE = aws_dynamodb_table.reservations.name
      USERS_TABLE        = aws_dynamodb_table.users.name
      GPU_SERVERS_TABLE  = aws_dynamodb_table.gpu_servers.name
    }
  }

  depends_on = [
    aws_iam_role_policy.lambda_policy,
    aws_cloudwatch_log_group.lambda_logs,
  ]
}

resource "aws_lambda_function" "update_reservation_handler" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${local.project_name}-update-reservation-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "handlers/reservations.updateReservation"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "nodejs18.x"
  timeout          = 30

  environment {
    variables = {
      RESERVATIONS_TABLE = aws_dynamodb_table.reservations.name
      USERS_TABLE        = aws_dynamodb_table.users.name
      GPU_SERVERS_TABLE  = aws_dynamodb_table.gpu_servers.name
    }
  }

  depends_on = [
    aws_iam_role_policy.lambda_policy,
    aws_cloudwatch_log_group.lambda_logs,
  ]
}

resource "aws_lambda_function" "users_handler" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${local.project_name}-users-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "handlers/users.createUser"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "nodejs18.x"
  timeout          = 30

  environment {
    variables = {
      RESERVATIONS_TABLE = aws_dynamodb_table.reservations.name
      USERS_TABLE        = aws_dynamodb_table.users.name
      GPU_SERVERS_TABLE  = aws_dynamodb_table.gpu_servers.name
    }
  }

  depends_on = [
    aws_iam_role_policy.lambda_policy,
    aws_cloudwatch_log_group.lambda_logs,
  ]
}

resource "aws_lambda_function" "get_user_handler" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${local.project_name}-get-user-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "handlers/users.getUser"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "nodejs18.x"
  timeout          = 30

  environment {
    variables = {
      RESERVATIONS_TABLE = aws_dynamodb_table.reservations.name
      USERS_TABLE        = aws_dynamodb_table.users.name
      GPU_SERVERS_TABLE  = aws_dynamodb_table.gpu_servers.name
    }
  }

  depends_on = [
    aws_iam_role_policy.lambda_policy,
    aws_cloudwatch_log_group.lambda_logs,
  ]
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${local.project_name}-${var.environment}"
  retention_in_days = 14
}