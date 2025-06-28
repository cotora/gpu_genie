#!/bin/bash

# GPU Genie CI Utilities
# 個別のCIタスクを実行するためのユーティリティスクリプト

# メインのCIスクリプトを読み込み
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/ci.sh"

# 使用方法の表示
show_usage() {
    echo "GPU Genie CI Utilities"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  check           - 必要なツールの確認"
    echo "  frontend        - フロントエンドCIのみ実行"
    echo "  backend         - バックエンドCIのみ実行"
    echo "  terraform       - Terraform検証のみ実行"
    echo "  security        - セキュリティスキャンのみ実行"
    echo "  docker          - Dockerビルドテストのみ実行"
    echo "  lint            - 全体のlintチェックのみ実行"
    echo "  test            - 全体のテストのみ実行"
    echo "  build           - 全体のビルドテストのみ実行"
    echo "  format          - コードフォーマットの修正"
    echo "  fix             - 自動修正可能な問題を修正"
    echo "  watch           - ファイル変更を監視してCIを実行"
    echo ""
    echo "Examples:"
    echo "  $0 check"
    echo "  $0 frontend"
    echo "  $0 lint"
    echo "  $0 format"
    echo "  $0 watch frontend"
}

# Lintチェックのみ実行
run_lint_only() {
    log_info "=== Running Lint Checks Only ==="
    
    ERROR_COUNT=0
    
    # フロントエンドLint
    log_info "Running frontend lint..."
    cd frontend
    if ! npm run lint; then
        record_error "Frontend lint failed"
    fi
    cd ..
    
    # バックエンドLint
    log_info "Running backend lint..."
    cd backend/lambda
    if ! npx eslint "src/**/*.{ts,js}" --max-warnings 0; then
        record_error "Backend lint failed"
    fi
    cd ../..
    
    # Terraform Format
    if command -v terraform &> /dev/null; then
        log_info "Running terraform format check..."
        cd terraform
        if ! terraform fmt -check; then
            record_error "Terraform format check failed"
        fi
        cd ..
    fi
    
    if [ $ERROR_COUNT -eq 0 ]; then
        log_success "✅ All lint checks passed!"
    else
        log_error "❌ Lint checks failed with $ERROR_COUNT error(s)"
        return 1
    fi
}

# テストのみ実行
run_test_only() {
    log_info "=== Running Tests Only ==="
    
    ERROR_COUNT=0
    
    # バックエンドテスト
    log_info "Running backend tests..."
    cd backend/lambda
    
    # 依存関係の確認
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        npm ci
    fi
    
    export NODE_ENV=test
    export AWS_REGION=us-east-1
    export DYNAMODB_ENDPOINT=http://localhost:8000
    export RESERVATIONS_TABLE=gpu-genie-reservations-test
    export USERS_TABLE=gpu-genie-users-test
    export GPU_SERVERS_TABLE=gpu-genie-gpu-servers-test
    
    if ! npm test; then
        record_error "Backend tests failed"
    fi
    cd ../..
    
    # フロントエンドにはテストがないため、TypeScriptチェックを実行
    log_info "Running frontend type check..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        npm ci
    fi
    
    if ! npx tsc --noEmit; then
        record_error "Frontend type check failed"
    fi
    cd ..
    
    if [ $ERROR_COUNT -eq 0 ]; then
        log_success "✅ All tests passed!"
    else
        log_error "❌ Tests failed with $ERROR_COUNT error(s)"
        return 1
    fi
}

# ビルドテストのみ実行
run_build_only() {
    log_info "=== Running Build Tests Only ==="
    
    ERROR_COUNT=0
    
    # フロントエンドビルド
    log_info "Building frontend..."
    cd frontend
    
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        npm ci
    fi
    
    export NEXT_PUBLIC_AWS_REGION=us-east-1
    export NEXT_PUBLIC_API_GATEWAY_URL=https://dummy-api.execute-api.us-east-1.amazonaws.com/dev
    export NEXT_PUBLIC_COGNITO_USER_POOL_ID=dummy
    export NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=dummy
    export NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=dummy
    
    if ! npm run build; then
        record_error "Frontend build failed"
    fi
    cd ..
    
    # バックエンドビルド
    log_info "Building backend..."
    cd backend/lambda
    
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        npm ci
    fi
    
    if ! npm run build; then
        record_error "Backend build failed"
    fi
    cd ../..
    
    if [ $ERROR_COUNT -eq 0 ]; then
        log_success "✅ All builds passed!"
    else
        log_error "❌ Builds failed with $ERROR_COUNT error(s)"
        return 1
    fi
}

# コードフォーマットの修正
run_format_fix() {
    log_info "=== Fixing Code Format ==="
    
    # フロントエンドフォーマット
    log_info "Formatting frontend code..."
    cd frontend
    if [ -d "node_modules" ]; then
        npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"
        log_success "Frontend code formatted"
    else
        log_warning "Frontend dependencies not installed, skipping format"
    fi
    cd ..
    
    # バックエンドフォーマット
    log_info "Formatting backend code..."
    cd backend/lambda
    if [ -d "node_modules" ]; then
        npx prettier --write "src/**/*.{ts,js,json}"
        log_success "Backend code formatted"
    else
        log_warning "Backend dependencies not installed, skipping format"
    fi
    cd ../..
    
    # Terraformフォーマット
    if command -v terraform &> /dev/null; then
        log_info "Formatting terraform code..."
        cd terraform
        terraform fmt
        log_success "Terraform code formatted"
        cd ..
    fi
    
    log_success "✅ Code formatting completed!"
}

# 自動修正可能な問題を修正
run_auto_fix() {
    log_info "=== Running Auto-fix ==="
    
    # フォーマット修正
    run_format_fix
    
    # ESLintの自動修正
    log_info "Running ESLint auto-fix..."
    
    # フロントエンド
    cd frontend
    if [ -d "node_modules" ]; then
        npm run lint -- --fix || log_warning "Some frontend lint issues could not be auto-fixed"
    fi
    cd ..
    
    # バックエンド
    cd backend/lambda
    if [ -d "node_modules" ]; then
        npx eslint "src/**/*.{ts,js}" --fix || log_warning "Some backend lint issues could not be auto-fixed"
    fi
    cd ../..
    
    log_success "✅ Auto-fix completed!"
}

# ファイル変更監視
run_watch() {
    local watch_target=${1:-"all"}
    
    log_info "=== Starting Watch Mode for $watch_target ==="
    log_info "Press Ctrl+C to stop watching"
    
    if ! command -v fswatch &> /dev/null && ! command -v inotifywait &> /dev/null; then
        log_error "File watching requires 'fswatch' (macOS) or 'inotify-tools' (Linux)"
        log_info "Install with:"
        log_info "  macOS: brew install fswatch"
        log_info "  Linux: sudo apt-get install inotify-tools"
        return 1
    fi
    
    # 監視対象のディレクトリ
    case $watch_target in
        "frontend")
            WATCH_DIRS="frontend/src"
            WATCH_CMD="run_frontend_ci"
            ;;
        "backend")
            WATCH_DIRS="backend/lambda/src"
            WATCH_CMD="run_backend_ci"
            ;;
        "terraform")
            WATCH_DIRS="terraform"
            WATCH_CMD="run_terraform_validation"
            ;;
        *)
            WATCH_DIRS="frontend/src backend/lambda/src terraform"
            WATCH_CMD="main"
            ;;
    esac
    
    log_info "Watching directories: $WATCH_DIRS"
    
    # ファイル監視の実行
    if command -v fswatch &> /dev/null; then
        # macOS
        fswatch -o $WATCH_DIRS | while read f; do
            log_info "File change detected, running $watch_target CI..."
            $WATCH_CMD
        done
    else
        # Linux
        inotifywait -m -r -e modify,create,delete $WATCH_DIRS | while read path action file; do
            log_info "File change detected: $path$file, running $watch_target CI..."
            $WATCH_CMD
        done
    fi
}

# パフォーマンス測定
run_performance_test() {
    log_info "=== Running Performance Tests ==="
    
    # 各CIタスクの実行時間を測定
    declare -A task_times
    
    # フロントエンドCI
    log_info "Measuring frontend CI performance..."
    start_time=$(date +%s)
    run_frontend_ci
    end_time=$(date +%s)
    task_times["frontend"]=$((end_time - start_time))
    
    # バックエンドCI
    log_info "Measuring backend CI performance..."
    start_time=$(date +%s)
    run_backend_ci
    end_time=$(date +%s)
    task_times["backend"]=$((end_time - start_time))
    
    # Terraform検証
    log_info "Measuring terraform validation performance..."
    start_time=$(date +%s)
    run_terraform_validation
    end_time=$(date +%s)
    task_times["terraform"]=$((end_time - start_time))
    
    # 結果表示
    echo ""
    echo "=== Performance Results ==="
    for task in "${!task_times[@]}"; do
        echo "$task: ${task_times[$task]} seconds"
    done
}

# メイン処理
main() {
    COMMAND=${1:-help}
    shift
    
    case $COMMAND in
        "check")
            check_requirements
            ;;
        "frontend")
            run_frontend_ci
            ;;
        "backend")
            run_backend_ci
            ;;
        "terraform")
            run_terraform_validation
            ;;
        "security")
            run_security_scan
            ;;
        "docker")
            run_docker_build_test
            ;;
        "lint")
            run_lint_only
            ;;
        "test")
            run_test_only
            ;;
        "build")
            run_build_only
            ;;
        "format")
            run_format_fix
            ;;
        "fix")
            run_auto_fix
            ;;
        "watch")
            run_watch "$@"
            ;;
        "perf"|"performance")
            run_performance_test
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