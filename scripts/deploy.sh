#!/bin/bash

# GPU Genie Manual Deployment Script for AWS CloudShell
# このスクリプトはAWSクラウドシェル上で実行することを想定しています

set -e  # エラーが発生した場合にスクリプトを終了

# AWSプロファイル設定
AWS_PROFILE_FLAG=""
TERRAFORM_PROFILE_VAR=""
if [ -n "$AWS_PROFILE" ]; then
    AWS_PROFILE_FLAG="--profile $AWS_PROFILE"
    TERRAFORM_PROFILE_VAR="-var=aws_profile=$AWS_PROFILE"
fi

# 色付きの出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 設定変数
ENVIRONMENT=${1:-dev}
NODE_VERSION="18"
TERRAFORM_VERSION="1.5"

log_info "Starting GPU Genie deployment for environment: $ENVIRONMENT"

# プロジェクトルートディレクトリの確認
if [ ! -f "package.json" ] && [ ! -d "terraform" ]; then
    log_error "このスクリプトはプロジェクトのルートディレクトリで実行してください"
    exit 1
fi

# 必要なツールの確認
check_requirements() {
    log_info "Checking requirements..."
    
    # Node.js確認
    if ! command -v node &> /dev/null; then
        log_error "Node.js が見つかりません。Node.js をインストールしてください。"
        exit 1
    fi
    
    # npm確認
    if ! command -v npm &> /dev/null; then
        log_error "npm が見つかりません。"
        exit 1
    fi
    
    # AWS CLI確認
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI が見つかりません。"
        exit 1
    fi
    
    # Terraform確認
    if ! command -v terraform &> /dev/null; then
        log_warning "Terraform が見つかりません。インストールを試みます..."
        install_terraform
    fi
    
    # jq確認
    if ! command -v jq &> /dev/null; then
        log_warning "jq が見つかりません。インストールを試みます..."
        sudo yum install -y jq
    fi
    
    log_success "Requirements check completed"
}

# Terraformのインストール
install_terraform() {
    log_info "Installing Terraform..."
    
    # Terraformのダウンロードとインストール
    cd /tmp
    wget https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}.0/terraform_${TERRAFORM_VERSION}.0_linux_amd64.zip
    unzip terraform_${TERRAFORM_VERSION}.0_linux_amd64.zip
    sudo mv terraform /usr/local/bin/
    
    # 元のディレクトリに戻る
    cd - > /dev/null
    
    log_success "Terraform installed successfully"
}

# バックエンドビルド
build_backend() {
    log_info "Building backend..."
    
    cd backend/lambda
    
    # 依存関係のインストール
    log_info "Installing backend dependencies..."
    npm ci
    
    # TypeScriptビルド
    log_info "Building TypeScript..."
    npm run build
    
    # デプロイメントパッケージの作成
    log_info "Creating deployment package..."
    cd dist
    zip -r ../lambda-function.zip .
    cd ..
    
    log_success "Backend build completed"
    
    # プロジェクトルートに戻る
    cd ../..
}

# インフラストラクチャのデプロイ
deploy_infrastructure() {
    log_info "Deploying infrastructure..."
    
    cd terraform
    
    # Terraformの初期化
    log_info "Initializing Terraform..."
    terraform init
    
    # Terraformプラン
    log_info "Creating Terraform plan..."
    terraform plan \
        -var="environment=$ENVIRONMENT" \
        -var="aws_region=$(aws configure get region $AWS_PROFILE_FLAG)" \
        $TERRAFORM_PROFILE_VAR \
        -out=tfplan
    
    # Terraformの適用
    log_info "Applying Terraform plan..."
    terraform apply tfplan
    
    # 出力値の取得
    log_info "Getting Terraform outputs..."
    
    # 出力値をファイルに保存
    terraform output -json > ../terraform-outputs.json
    
    # 個別の出力値を取得
    export API_GATEWAY_URL=$(terraform output -raw api_gateway_url)
    export S3_BUCKET_NAME=$(terraform output -raw s3_bucket_name)
    export CLOUDFRONT_DOMAIN=$(terraform output -raw cloudfront_domain_name)
    
    # Cognito設定の取得
    COGNITO_CONFIG=$(terraform output -json cognito_config)
    export COGNITO_USER_POOL_ID=$(echo $COGNITO_CONFIG | jq -r '.user_pool_id')
    export COGNITO_USER_POOL_CLIENT_ID=$(echo $COGNITO_CONFIG | jq -r '.user_pool_client_id')
    export COGNITO_IDENTITY_POOL_ID=$(echo $COGNITO_CONFIG | jq -r '.identity_pool_id')
    export AWS_REGION=$(echo $COGNITO_CONFIG | jq -r '.region')
    
    log_success "Infrastructure deployment completed"
    log_info "API Gateway URL: $API_GATEWAY_URL"
    log_info "CloudFront Domain: $CLOUDFRONT_DOMAIN"
    
    # プロジェクトルートに戻る
    cd ..
}

# Lambda関数のデプロイ
deploy_backend() {
    log_info "Deploying Lambda functions..."
    
    # Lambda関数名のリスト
    FUNCTIONS=(
        "gpu-genie-reservations-$ENVIRONMENT"
        "gpu-genie-get-reservations-$ENVIRONMENT"
        "gpu-genie-update-reservation-$ENVIRONMENT"
        "gpu-genie-users-$ENVIRONMENT"
        "gpu-genie-get-user-$ENVIRONMENT"
    )
    
    for function in "${FUNCTIONS[@]}"; do
        log_info "Updating function: $function"
        aws lambda update-function-code \
            --function-name "$function" \
            --zip-file fileb://backend/lambda/lambda-function.zip \
            --region $(aws configure get region $AWS_PROFILE_FLAG) $AWS_PROFILE_FLAG || log_warning "Function $function not found, skipping..."
    done
    
    log_success "Backend deployment completed"
}

# フロントエンドビルド
build_frontend() {
    log_info "Building frontend..."
    
    cd frontend
    
    # 依存関係のインストール
    log_info "Installing frontend dependencies..."
    npm ci
    
    # 環境変数を設定してビルド
    log_info "Building frontend with environment variables..."
    export NEXT_PUBLIC_AWS_REGION="$AWS_REGION"
    export NEXT_PUBLIC_API_GATEWAY_URL="$API_GATEWAY_URL"
    export NEXT_PUBLIC_COGNITO_USER_POOL_ID="$COGNITO_USER_POOL_ID"
    export NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID="$COGNITO_USER_POOL_CLIENT_ID"
    export NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID="$COGNITO_IDENTITY_POOL_ID"
    
    # Next.jsビルド
    npm run build
    
    # 静的エクスポート
    log_info "Exporting static files..."
    npm run export || npm run build
    
    log_success "Frontend build completed"
    
    # プロジェクトルートに戻る
    cd ..
}

# フロントエンドのデプロイ
deploy_frontend() {
    log_info "Deploying frontend to S3..."
    
    # S3への同期（キャッシュ設定付き）
    log_info "Syncing files to S3 with cache settings..."
    
    # 静的アセット（長期キャッシュ）
    aws s3 sync ./frontend/out s3://$S3_BUCKET_NAME \
        --delete \
        --cache-control "public,max-age=31536000,immutable" \
        --exclude "*.html" \
        --exclude "service-worker.js" \
        --exclude "manifest.json" $AWS_PROFILE_FLAG
    
    # HTMLファイル（短期キャッシュ）
    aws s3 sync ./frontend/out s3://$S3_BUCKET_NAME \
        --delete \
        --cache-control "public,max-age=0,must-revalidate" \
        --include "*.html" \
        --include "service-worker.js" \
        --include "manifest.json" $AWS_PROFILE_FLAG
    
    # CloudFrontキャッシュの無効化
    log_info "Invalidating CloudFront cache..."
    CLOUDFRONT_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items!=null && contains(Aliases.Items, '$CLOUDFRONT_DOMAIN')].Id" --output text $AWS_PROFILE_FLAG)
    
    if [ -z "$CLOUDFRONT_ID" ]; then
        log_warning "CloudFront distribution not found for domain $CLOUDFRONT_DOMAIN. Skipping invalidation."
    else
        aws cloudfront create-invalidation \
            --distribution-id $CLOUDFRONT_ID \
            --paths "/*" $AWS_PROFILE_FLAG
        log_success "CloudFront cache invalidation requested"
    fi
    
    log_success "Frontend deployment completed"
}

# スモークテスト
run_smoke_tests() {
    log_info "Running smoke tests..."
    
    # API健全性チェック
    log_info "Testing API health endpoint: $API_GATEWAY_URL/health"
    if curl -f "$API_GATEWAY_URL/health" > /dev/null 2>&1; then
        log_success "API health check passed"
    else
        log_warning "API health endpoint not available"
    fi
    
    # フロントエンドアクセシビリティチェック
    FRONTEND_URL="https://$CLOUDFRONT_DOMAIN"
    log_info "Testing frontend accessibility: $FRONTEND_URL"
    if curl -f "$FRONTEND_URL" > /dev/null 2>&1; then
        log_success "Frontend accessibility check passed"
    else
        log_error "Frontend accessibility check failed"
        return 1
    fi
    
    log_success "Smoke tests completed"
}

# デプロイ結果の表示
show_deployment_summary() {
    log_success "🚀 Deployment completed successfully!"
    echo ""
    echo "=== Deployment Summary ==="
    echo "Environment: $ENVIRONMENT"
    echo "Frontend URL: https://$CLOUDFRONT_DOMAIN"
    echo "API URL: $API_GATEWAY_URL"
    echo ""
    echo "=== Environment Variables Used ==="
    echo "AWS Region: $AWS_REGION"
    echo "Cognito User Pool ID: $COGNITO_USER_POOL_ID"
    echo "Cognito Client ID: $COGNITO_USER_POOL_CLIENT_ID"
    echo "Cognito Identity Pool ID: $COGNITO_IDENTITY_POOL_ID"
    echo ""
    echo "=== Next Steps ==="
    echo "1. フロントエンドにアクセス: https://$CLOUDFRONT_DOMAIN"
    echo "2. APIテスト: $API_GATEWAY_URL"
    echo "3. Cognitoコンソールでユーザー管理"
}

# クリーンアップ関数
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f terraform-outputs.json
    rm -f terraform/tfplan
}

# メイン実行関数
main() {
    # 開始時刻の記録
    START_TIME=$(date +%s)
    
    log_info "=== GPU Genie Deployment Script ==="
    log_info "Environment: $ENVIRONMENT"
    log_info "Timestamp: $(date)"
    echo ""
    
    # 各ステップの実行
    check_requirements
    build_backend
    deploy_infrastructure
    deploy_backend
    build_frontend
    deploy_frontend
    run_smoke_tests
    show_deployment_summary
    
    # 終了時刻の計算
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    log_success "Total deployment time: ${DURATION} seconds"
    
    # クリーンアップ
    cleanup
}

# エラーハンドリング
trap 'log_error "Deployment failed! Check the logs above for details."; cleanup; exit 1' ERR

# スクリプトの実行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 