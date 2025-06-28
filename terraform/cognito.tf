resource "aws_cognito_user_pool" "gpu_genie_pool" {
  name = "${local.project_name}-user-pool-${var.environment}"

  username_attributes = ["email"]

  # メール確認を無効化（学生アカウントのメール送信制限を回避）
  # auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  # メール設定を改善
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
    # reply_to_email_address = "noreply@example.com"  # 必要に応じて設定
  }

  # メール確認を完全に無効化
  # verification_message_template は削除

  # アカウント復旧設定
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # 管理者作成ユーザー設定
  admin_create_user_config {
    allow_admin_create_user_only = false
    invite_message_template {
      email_subject = "GPU Genie - アカウント招待"
      email_message = "GPU Genieにご招待いたします。<br>ユーザー名: {username}<br>一時パスワード: {####}"
      sms_message   = "GPU Genie招待: ユーザー名 {username} パスワード {####}"
    }
  }

  # 標準属性のみを使用（カスタムスキーマを削除）
  # email と name は標準属性なので、schema ブロックで定義する必要がない
  # role 属性は後でカスタム属性として追加可能

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

  # Vercelドメインとローカル開発用URLを両方サポート
  callback_urls = concat(
    [
      "http://localhost:3000/auth/callback",
      "http://localhost:3002/auth/callback"
    ],
    var.vercel_domain != "" ? ["https://${var.vercel_domain}/auth/callback"] : [],
    var.domain_name != "" ? ["https://${var.domain_name}/auth/callback"] : []
  )

  logout_urls = concat(
    [
      "http://localhost:3000",
      "http://localhost:3002"
    ],
    var.vercel_domain != "" ? ["https://${var.vercel_domain}"] : [],
    var.domain_name != "" ? ["https://${var.domain_name}"] : []
  )

  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile", "aws.cognito.signin.user.admin"]
  allowed_oauth_flows_user_pool_client = true
  
  # CloudFrontでの認証をサポート
  read_attributes = ["email", "name", "email_verified"]
  write_attributes = ["email", "name"]

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
# Temporarily commented out due to IAM PassRole permission issues
# resource "aws_cognito_identity_pool_roles_attachment" "gpu_genie_roles" {
#   identity_pool_id = aws_cognito_identity_pool.gpu_genie_identity_pool.id
#
#   roles = {
#     "authenticated"   = aws_iam_role.cognito_authenticated.arn
#     "unauthenticated" = aws_iam_role.cognito_unauthenticated.arn
#   }
# }