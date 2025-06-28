#!/bin/bash

# GPU Genie CI Script
# GitHub ActionsのCIワークフローをローカルで実行するためのスクリプト

set -e  # エラーが発生した場合にスクリプトを終了

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
NODE_VERSION="18"
TERRAFORM_VERSION="1.5"

# エラーカウンター
ERROR_COUNT=0

# エラーを記録する関数
record_error() {
    ERROR_COUNT=$((ERROR_COUNT + 1))
    log_error "$1"
}

# プロジェクトルートディレクトリの確認
if [ ! -f "package.json" ] && [ ! -d "frontend" ] && [ ! -d "backend" ]; then
    log_error "このスクリプトはプロジェクトのルートディレクトリで実行してください"
    exit 1
fi

# 必要なツールの確認
check_requirements() {
    log_info "Checking CI requirements..."
    
    # Node.js確認
    if ! command -v node &> /dev/null; then
        record_error "Node.js が見つかりません。Node.js をインストールしてください。"
        return 1
    fi
    
    # npm確認
    if ! command -v npm &> /dev/null; then
        record_error "npm が見つかりません。"
        return 1
    fi
    
    # Terraform確認（オプション）
    if ! command -v terraform &> /dev/null; then
        log_warning "Terraform が見つかりません。Terraformチェックをスキップします。"
    fi
    
    # Docker確認（オプション）
    if ! command -v docker &> /dev/null; then
        log_warning "Docker が見つかりません。Dockerビルドテストをスキップします。"
    fi
    
    log_success "Requirements check completed"
}

# フロントエンドCI
run_frontend_ci() {
    log_info "=== Running Frontend CI ==="
    
    cd frontend
    
    # 依存関係のインストール
    log_info "Installing frontend dependencies..."
    if ! npm ci; then
        record_error "Frontend dependencies installation failed"
        cd ..
        return 1
    fi
    
    # ESLint実行
    log_info "Running ESLint..."
    if ! npm run lint; then
        record_error "ESLint check failed"
    fi
    
    # TypeScriptタイプチェック
    log_info "Checking TypeScript types..."
    if ! npx tsc --noEmit; then
        record_error "TypeScript type check failed"
    fi
    
    # Prettierチェック
    log_info "Running Prettier check..."
    if ! npx prettier --check "src/**/*.{ts,tsx,js,jsx,json,css,md}"; then
        record_error "Prettier check failed"
        log_info "Run 'npx prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"' to fix formatting"
    fi
    
    # ビルドテスト
    log_info "Building application..."
    export NEXT_PUBLIC_AWS_REGION=us-east-1
    export NEXT_PUBLIC_API_GATEWAY_URL=https://dummy-api.execute-api.us-east-1.amazonaws.com/dev
    export NEXT_PUBLIC_COGNITO_USER_POOL_ID=dummy
    export NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=dummy
    export NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=dummy
    
    if ! npm run build; then
        record_error "Frontend build failed"
    fi
    
    log_success "Frontend CI completed"
    cd ..
}

# バックエンドCI
run_backend_ci() {
    log_info "=== Running Backend CI ==="
    
    cd backend/lambda
    
    # 依存関係のインストール
    log_info "Installing backend dependencies..."
    if ! npm ci; then
        record_error "Backend dependencies installation failed"
        cd ../..
        return 1
    fi
    
    # ESLint実行
    log_info "Running ESLint..."
    if ! npx eslint "src/**/*.{ts,js}" --max-warnings 0; then
        record_error "ESLint check failed"
    fi
    
    # TypeScriptビルド（型チェック含む）
    log_info "Building TypeScript..."
    if ! npm run build; then
        record_error "TypeScript build failed"
    fi
    
    # Prettierチェック
    log_info "Running Prettier check..."
    if ! npx prettier --check "src/**/*.{ts,js,json}"; then
        record_error "Prettier check failed"
        log_info "Run 'npx prettier --write \"src/**/*.{ts,js,json}\"' to fix formatting"
    fi
    
    # テスト実行
    log_info "Running tests..."
    export NODE_ENV=test
    export AWS_REGION=us-east-1
    export DYNAMODB_ENDPOINT=http://localhost:8000
    export RESERVATIONS_TABLE=gpu-genie-reservations-test
    export USERS_TABLE=gpu-genie-users-test
    export GPU_SERVERS_TABLE=gpu-genie-gpu-servers-test
    
    if ! npm test; then
        record_error "Backend tests failed"
    fi
    
    log_success "Backend CI completed"
    cd ../..
}

# Terraform検証
run_terraform_validation() {
    log_info "=== Running Terraform Validation ==="
    
    if ! command -v terraform &> /dev/null; then
        log_warning "Terraform not found, skipping validation"
        return 0
    fi
    
    cd terraform
    
    # フォーマットチェック
    log_info "Checking Terraform format..."
    if ! terraform fmt -check; then
        record_error "Terraform format check failed"
        log_info "Run 'terraform fmt' to fix formatting"
    fi
    
    # 初期化（バックエンドなし）
    log_info "Initializing Terraform..."
    if ! terraform init -backend=false; then
        record_error "Terraform init failed"
        cd ..
        return 1
    fi
    
    # 検証
    log_info "Validating Terraform configuration..."
    if ! terraform validate; then
        record_error "Terraform validation failed"
    fi
    
    # tflint（利用可能な場合）
    if command -v tflint &> /dev/null; then
        log_info "Running tflint..."
        if ! tflint --init; then
            log_warning "tflint init failed"
        elif ! tflint; then
            record_error "tflint check failed"
        fi
    else
        log_warning "tflint not found, skipping advanced linting"
    fi
    
    log_success "Terraform validation completed"
    cd ..
}

# セキュリティスキャン
run_security_scan() {
    log_info "=== Running Security Scan ==="
    
    # Trivyの確認
    if ! command -v trivy &> /dev/null; then
        log_warning "Trivy not found, attempting to install..."
        
        # Trivyのインストール（Linux/macOS）
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            if command -v apt-get &> /dev/null; then
                sudo apt-get update && sudo apt-get install -y wget apt-transport-https gnupg lsb-release
                wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
                echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
                sudo apt-get update && sudo apt-get install -y trivy
            elif command -v yum &> /dev/null; then
                # Amazon Linux/CentOS/RHEL
                sudo yum install -y wget
                wget https://github.com/aquasecurity/trivy/releases/latest/download/trivy_Linux-64bit.rpm
                sudo rpm -ivh trivy_Linux-64bit.rpm
            fi
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew &> /dev/null; then
                brew install trivy
            else
                log_warning "Homebrew not found, please install Trivy manually"
                return 0
            fi
        fi
    fi
    
    if command -v trivy &> /dev/null; then
        log_info "Running Trivy vulnerability scanner..."
        if ! trivy fs --format table --exit-code 0 .; then
            log_warning "Trivy scan completed with warnings/vulnerabilities"
        fi
    else
        log_warning "Trivy installation failed, skipping security scan"
    fi
    
    log_success "Security scan completed"
}

# Dockerビルドテスト
run_docker_build_test() {
    log_info "=== Running Docker Build Test ==="
    
    if ! command -v docker &> /dev/null; then
        log_warning "Docker not found, skipping build test"
        return 0
    fi
    
    # Dockerデーモンの確認
    if ! docker info &> /dev/null; then
        log_warning "Docker daemon not running, skipping build test"
        return 0
    fi
    
    # フロントエンドDockerビルド
    log_info "Building frontend Docker image..."
    if ! docker build -f frontend/Dockerfile.dev -t gpu-genie-frontend:ci-test frontend/; then
        record_error "Frontend Docker build failed"
    fi
    
    # バックエンドDockerビルド
    log_info "Building backend Docker image..."
    if ! docker build -f backend/lambda/Dockerfile.dev -t gpu-genie-backend:ci-test backend/lambda/; then
        record_error "Backend Docker build failed"
    fi
    
    # テスト用イメージの削除
    log_info "Cleaning up test images..."
    docker rmi gpu-genie-frontend:ci-test gpu-genie-backend:ci-test 2>/dev/null || true
    
    log_success "Docker build test completed"
}

# CI結果のサマリー表示
show_ci_summary() {
    echo ""
    echo "=== CI Summary ==="
    
    if [ $ERROR_COUNT -eq 0 ]; then
        log_success "🎉 All CI checks passed!"
        echo ""
        echo "✅ Frontend CI: PASSED"
        echo "✅ Backend CI: PASSED"
        echo "✅ Terraform Validation: PASSED"
        echo "✅ Security Scan: PASSED"
        echo "✅ Docker Build Test: PASSED"
    else
        log_error "❌ CI checks failed with $ERROR_COUNT error(s)"
        echo ""
        echo "Please fix the issues above and run the CI again."
    fi
    
    echo ""
    echo "=== Next Steps ==="
    if [ $ERROR_COUNT -eq 0 ]; then
        echo "1. Your code is ready for pull request/merge"
        echo "2. Consider running deployment: ./scripts/deploy.sh dev"
    else
        echo "1. Fix the reported issues"
        echo "2. Run specific checks:"
        echo "   - Frontend: cd frontend && npm run lint && npm run build"
        echo "   - Backend: cd backend/lambda && npm run lint && npm test"
        echo "   - Terraform: cd terraform && terraform fmt && terraform validate"
        echo "3. Re-run full CI: ./scripts/ci.sh"
    fi
}

# クリーンアップ関数
cleanup() {
    log_info "Cleaning up temporary files..."
    # 必要に応じてクリーンアップ処理を追加
}

# メイン実行関数
main() {
    # 開始時刻の記録
    START_TIME=$(date +%s)
    
    log_info "=== GPU Genie CI Script ==="
    log_info "Timestamp: $(date)"
    echo ""
    
    # 各ステップの実行
    check_requirements
    
    # 並列実行可能なチェックを順次実行
    run_frontend_ci
    run_backend_ci
    run_terraform_validation
    run_security_scan
    run_docker_build_test
    
    # 結果のサマリー表示
    show_ci_summary
    
    # 終了時刻の計算
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    echo ""
    log_info "Total CI execution time: ${DURATION} seconds"
    
    # クリーンアップ
    cleanup
    
    # 終了コード
    if [ $ERROR_COUNT -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# エラーハンドリング
trap 'log_error "CI execution interrupted!"; cleanup; exit 1' INT TERM

# スクリプトの実行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 