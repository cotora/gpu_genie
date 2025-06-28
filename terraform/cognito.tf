resource "aws_cognito_user_pool" "gpu_genie_pool" {
  name = "${local.project_name}-user-pool-${var.environment}"

  username_attributes = ["email"]

  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "GPU Genie - アカウント確認"
    email_message        = "認証コード: {####} を入力してアカウントを確認してください。"
  }

  schema {
    attribute_data_type = "String"
    name                = "email"
    required            = true
    mutable             = true
  }

  schema {
    attribute_data_type = "String"
    name                = "name"
    required            = true
    mutable             = true
  }

  schema {
    attribute_data_type = "String"
    name                = "role"
    required            = false
    mutable             = true
  }

  tags = {
    Name = "${local.project_name}-user-pool-${var.environment}"
  }
}

resource "aws_cognito_user_pool_client" "gpu_genie_client" {
  name         = "${local.project_name}-client-${var.environment}"
  user_pool_id = aws_cognito_user_pool.gpu_genie_pool.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  supported_identity_providers = ["COGNITO"]

  callback_urls = [
    "http://localhost:3000/auth/callback",
    var.domain_name != "" ? "https://${var.domain_name}/auth/callback" : "https://${aws_cloudfront_distribution.frontend.domain_name}/auth/callback"
  ]

  logout_urls = [
    "http://localhost:3000",
    var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.frontend.domain_name}"
  ]

  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  allowed_oauth_flows_user_pool_client = true

  prevent_user_existence_errors = "ENABLED"

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 30
}

resource "aws_cognito_user_pool_domain" "gpu_genie_domain" {
  domain       = "${local.project_name}-${var.environment}-${random_string.cognito_domain_suffix.result}"
  user_pool_id = aws_cognito_user_pool.gpu_genie_pool.id
}

resource "random_string" "cognito_domain_suffix" {
  length  = 8
  upper   = false
  special = false
}

# Identity Pool (Federated Identities)
resource "aws_cognito_identity_pool" "gpu_genie_identity_pool" {
  identity_pool_name               = "${local.project_name}_identity_pool_${var.environment}"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.gpu_genie_client.id
    provider_name           = aws_cognito_user_pool.gpu_genie_pool.endpoint
    server_side_token_check = false
  }

  tags = {
    Name = "${local.project_name}-identity-pool-${var.environment}"
  }
}

# IAM Role for authenticated users
resource "aws_iam_role" "cognito_authenticated" {
  name = "${local.project_name}-cognito-authenticated-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.gpu_genie_identity_pool.id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "authenticated"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "cognito_authenticated_policy" {
  name = "${local.project_name}-cognito-authenticated-policy-${var.environment}"
  role = aws_iam_role.cognito_authenticated.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "execute-api:Invoke"
        ]
        Resource = "${aws_api_gateway_rest_api.gpu_genie_api.execution_arn}/*"
      }
    ]
  })
}

# IAM Role for unauthenticated users (limited access)
resource "aws_iam_role" "cognito_unauthenticated" {
  name = "${local.project_name}-cognito-unauthenticated-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.gpu_genie_identity_pool.id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "unauthenticated"
          }
        }
      }
    ]
  })
}

# Identity Pool Role Attachment
resource "aws_cognito_identity_pool_roles_attachment" "gpu_genie_roles" {
  identity_pool_id = aws_cognito_identity_pool.gpu_genie_identity_pool.id

  roles = {
    "authenticated"   = aws_iam_role.cognito_authenticated.arn
    "unauthenticated" = aws_iam_role.cognito_unauthenticated.arn
  }
}