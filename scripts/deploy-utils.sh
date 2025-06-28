#!/bin/bash

# GPU Genie Deployment Utilities
# 個別のタスクを実行するためのユーティリティスクリプト

# メインのデプロイスクリプトを読み込み
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/deploy.sh"

# 使用方法の表示
show_usage() {
    echo "GPU Genie Deployment Utilities"
    echo ""
    echo "Usage: $0 <command> [environment] [--profile <aws_profile>]"
    echo ""
    echo "Commands:"
    echo "  check          - 必要なツールの確認"
    echo "  build-backend  - バックエンドのビルドのみ"
    echo "  build-frontend - フロントエンドのビルドのみ"
    echo "  deploy-infra   - インフラストラクチャのデプロイのみ"
    echo "  deploy-backend - Lambda関数のデプロイのみ"
    echo "  deploy-frontend- フロントエンドのデプロイのみ"
    echo "  outputs        - Terraformの出力値を表示"
    echo "  test           - スモークテストの実行"
    echo "  clean          - 一時ファイルのクリーンアップ"
    echo "  destroy        - インフラストラクチャの削除"
    echo "  logs           - Lambda関数のログを表示"
    echo "  status         - デプロイ状況の確認"
    echo ""
    echo "Environment: dev (default), staging, prod"
    echo ""
    echo "Options:"
    echo "  --profile <name> - Use a specific AWS profile from your config"
    echo ""
    echo "Examples:"
    echo "  $0 check"
    echo "  $0 build-backend dev"
    echo "  $0 deploy-infra staging --profile my-aws-profile"
    echo "  $0 outputs prod"
}

# Terraformの出力値を表示
show_terraform_outputs() {
    log_info "Showing Terraform outputs for environment: $ENVIRONMENT"
    
    cd terraform
    
    if [ ! -f "terraform.tfstate" ]; then
        log_error "Terraform state file not found. Run 'deploy-infra' first."
        exit 1
    fi
    
    echo ""
    echo "=== Terraform Outputs ==="
    terraform output
    echo ""
    
    # JSON形式でも表示
    echo "=== JSON Format ==="
    terraform output -json | jq .
    
    cd ..
}

# インフラストラクチャの削除
destroy_infrastructure() {
    log_warning "⚠️  DANGER: This will destroy all infrastructure for environment: $ENVIRONMENT"
    echo ""
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log_info "Operation cancelled."
        exit 0
    fi
    
    log_info "Destroying infrastructure..."
    
    cd terraform
    
    # S3バケットの中身を削除（バケット削除のため）
    if [ -f "terraform.tfstate" ]; then
        S3_BUCKET=$(terraform output -raw s3_bucket_name 2>/dev/null || echo "")
        if [ ! -z "$S3_BUCKET" ]; then
            log_info "Emptying S3 bucket: $S3_BUCKET"
            aws s3 rm s3://$S3_BUCKET --recursive $AWS_PROFILE_FLAG || log_warning "Failed to empty S3 bucket"
        fi
    fi
    
    # Terraformで削除
    terraform destroy \
        -var="environment=$ENVIRONMENT" \
        -var="aws_region=$(aws configure get region $AWS_PROFILE_FLAG)" \
        $TERRAFORM_PROFILE_VAR \
        -auto-approve
    
    log_success "Infrastructure destroyed successfully"
    
    cd ..
}

# Lambda関数のログを表示
show_lambda_logs() {
    log_info "Showing Lambda function logs for environment: $ENVIRONMENT"
    
    # 関数名を指定
    if [ -z "$2" ]; then
        echo "Available functions:"
        echo "  reservations"
        echo "  get-reservations"
        echo "  update-reservation"
        echo "  users"
        echo "  get-user"
        echo ""
        read -p "Enter function name: " function_name
    else
        function_name="$2"
    fi
    
    FULL_FUNCTION_NAME="gpu-genie-$function_name-$ENVIRONMENT"
    
    log_info "Fetching logs for function: $FULL_FUNCTION_NAME"
    
    # 最新のログストリームを取得
    LOG_GROUP="/aws/lambda/$FULL_FUNCTION_NAME"
    
    # ログストリームの一覧を取得
    aws logs describe-log-streams \
        --log-group-name "$LOG_GROUP" \
        --order-by LastEventTime \
        --descending \
        --max-items 1 \
        --query 'logStreams[0].logStreamName' \
        --output text $AWS_PROFILE_FLAG | xargs -I {} aws logs get-log-events \
        --log-group-name "$LOG_GROUP" \
        --log-stream-name {} \
        --query 'events[*].[timestamp,message]' \
        --output table $AWS_PROFILE_FLAG
}

# デプロイ状況の確認
check_deployment_status() {
    log_info "Checking deployment status for environment: $ENVIRONMENT"
    
    echo ""
    echo "=== Infrastructure Status ==="
    
    # Terraformの状態確認
    cd terraform
    if [ -f "terraform.tfstate" ]; then
        log_success "Terraform state exists"
        
        # リソースの一覧表示
        terraform state list | head -10
        if [ $(terraform state list | wc -l) -gt 10 ]; then
            echo "... and $(( $(terraform state list | wc -l) - 10 )) more resources"
        fi
    else
        log_warning "Terraform state not found"
    fi
    cd ..
    
    echo ""
    echo "=== Lambda Functions Status ==="
    
    # Lambda関数の状態確認
    FUNCTIONS=(
        "gpu-genie-reservations-$ENVIRONMENT"
        "gpu-genie-get-reservations-$ENVIRONMENT"
        "gpu-genie-update-reservation-$ENVIRONMENT"
        "gpu-genie-users-$ENVIRONMENT"
        "gpu-genie-get-user-$ENVIRONMENT"
    )
    
    for function in "${FUNCTIONS[@]}"; do
        if aws lambda get-function --function-name "$function" $AWS_PROFILE_FLAG > /dev/null 2>&1; then
            log_success "✓ $function"
        else
            log_error "✗ $function"
        fi
    done
    
    echo ""
    echo "=== S3 and CloudFront Status ==="
    
    # S3バケットの確認
    if [ -f "terraform/terraform.tfstate" ]; then
        cd terraform
        S3_BUCKET=$(terraform output -raw s3_bucket_name 2>/dev/null || echo "")
        CLOUDFRONT_DOMAIN=$(terraform output -raw cloudfront_domain_name 2>/dev/null || echo "")
        
        if [ ! -z "$S3_BUCKET" ]; then
            if aws s3api head-bucket --bucket "$S3_BUCKET" $AWS_PROFILE_FLAG > /dev/null 2>&1; then
                log_success "✓ S3 Bucket: $S3_BUCKET"
                
                # ファイル数を確認
                FILE_COUNT=$(aws s3 ls s3://$S3_BUCKET --recursive $AWS_PROFILE_FLAG | wc -l)
                echo "  Files: $FILE_COUNT"
            else
                log_error "✗ S3 Bucket: $S3_BUCKET"
            fi
        fi
        
        if [ ! -z "$CLOUDFRONT_DOMAIN" ]; then
            log_success "✓ CloudFront: https://$CLOUDFRONT_DOMAIN"
        fi
        
        cd ..
    fi
}

# 環境変数のエクスポート（他のスクリプトから利用可能にする）
export_terraform_outputs() {
    if [ ! -f "terraform/terraform.tfstate" ]; then
        log_error "Terraform state file not found. Run 'deploy-infra' first."
        exit 1
    fi
    
    cd terraform
    
    # 出力値を環境変数としてエクスポート
    export API_GATEWAY_URL=$(terraform output -raw api_gateway_url)
    export S3_BUCKET_NAME=$(terraform output -raw s3_bucket_name)
    export CLOUDFRONT_DOMAIN=$(terraform output -raw cloudfront_domain_name)
    
    COGNITO_CONFIG=$(terraform output -json cognito_config)
    export COGNITO_USER_POOL_ID=$(echo $COGNITO_CONFIG | jq -r '.user_pool_id')
    export COGNITO_USER_POOL_CLIENT_ID=$(echo $COGNITO_CONFIG | jq -r '.user_pool_client_id')
    export COGNITO_IDENTITY_POOL_ID=$(echo $COGNITO_CONFIG | jq -r '.identity_pool_id')
    export AWS_REGION=$(echo $COGNITO_CONFIG | jq -r '.region')
    
    cd ..
    
    # .envファイルの生成
    cat > .env.deployment << EOF
# Generated by deploy-utils.sh on $(date)
API_GATEWAY_URL=$API_GATEWAY_URL
S3_BUCKET_NAME=$S3_BUCKET_NAME
CLOUDFRONT_DOMAIN=$CLOUDFRONT_DOMAIN
COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID
COGNITO_USER_POOL_CLIENT_ID=$COGNITO_USER_POOL_CLIENT_ID
COGNITO_IDENTITY_POOL_ID=$COGNITO_IDENTITY_POOL_ID
AWS_REGION=$AWS_REGION
ENVIRONMENT=$ENVIRONMENT
EOF
    
    log_success "Environment variables exported to .env.deployment"
}

# メイン処理
main() {
    # 引数解析
    POSITIONAL_ARGS=()
    while [[ $# -gt 0 ]]; do
      case $1 in
        --profile)
          export AWS_PROFILE="$2"
          shift 2
          ;;
        *)
          POSITIONAL_ARGS+=("$1")
          shift
          ;;
      esac
    done
    set -- "${POSITIONAL_ARGS[@]}"

    COMMAND=${1:-help}
    ENVIRONMENT=${2:-dev}

    # AWSプロファイル設定
    AWS_PROFILE_FLAG=""
    TERRAFORM_PROFILE_VAR=""
    if [ -n "$AWS_PROFILE" ]; then
        log_info "Using AWS Profile: $AWS_PROFILE"
        AWS_PROFILE_FLAG="--profile $AWS_PROFILE"
        TERRAFORM_PROFILE_VAR="-var=aws_profile=$AWS_PROFILE"
    fi
    
    case $COMMAND in
        "check")
            check_requirements
            ;;
        "build-backend")
            build_backend
            ;;
        "build-frontend")
            export_terraform_outputs
            build_frontend
            ;;
        "deploy-infra")
            build_backend
            deploy_infrastructure
            ;;
        "deploy-backend")
            deploy_backend
            ;;
        "deploy-frontend")
            export_terraform_outputs
            build_frontend
            deploy_frontend
            ;;
        "outputs")
            show_terraform_outputs
            ;;
        "test")
            export_terraform_outputs
            run_smoke_tests
            ;;
        "clean")
            cleanup
            ;;
        "destroy")
            destroy_infrastructure
            ;;
        "logs")
            shift # command
            shift # env
            show_lambda_logs "$@"
            ;;
        "status")
            check_deployment_status
            ;;
        "export")
            export_terraform_outputs
            ;;
        "help"|*)
            show_usage
            ;;
    esac
}

# スクリプトが直接実行された場合のみmainを呼び出し
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 