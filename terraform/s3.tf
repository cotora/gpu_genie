# S3バケット - フロントエンド用
resource "aws_s3_bucket" "frontend" {
  bucket = "${local.project_name}-frontend-${var.environment}-${random_string.bucket_suffix.result}"

  tags = {
    Name = "${local.project_name}-frontend-${var.environment}"
  }
}

# S3バケット用のrandom_string
resource "random_string" "bucket_suffix" {
  length  = 8
  upper   = false
  special = false
}

# Cognito用のrandom_stringは有効のまま（Cognitoで使用されているため）
resource "random_string" "cognito_domain_suffix" {
  length  = 8
  upper   = false
  special = false
}

# S3バケット設定 - Website使用時はパブリックアクセスを許可
resource "aws_s3_bucket_public_access_block" "frontend_public" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_cors_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}