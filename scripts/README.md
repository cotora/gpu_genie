# GPU Genie Manual Deployment Scripts

このディレクトリには、AWSクラウドシェル上でGPU Genieアプリケーションを手動デプロイするためのスクリプトと、ローカルでCIを実行するためのスクリプトが含まれています。

## 前提条件

### AWSクラウドシェルの設定
1. AWSコンソールにログイン
2. 右上の「CloudShell」アイコンをクリック
3. クラウドシェルが起動するまで待機

### 必要な権限
以下のAWSサービスへの権限が必要です：
- IAM (ロール作成・管理)
- Lambda (関数作成・更新)
- API Gateway (API作成・管理)
- DynamoDB (テーブル作成・管理)
- S3 (バケット作成・管理)
- CloudFront (ディストリビューション作成・管理)
- Cognito (ユーザープール作成・管理)
- Bedrock (モデル利用)

## スクリプト一覧

### デプロイスクリプト
- `deploy.sh` - メインのデプロイスクリプト
- `deploy-utils.sh` - 個別デプロイタスク用ユーティリティ

### CIスクリプト
- `ci.sh` - メインのCIスクリプト
- `ci-utils.sh` - 個別CIタスク用ユーティリティ

## CI（継続的インテグレーション）の使用方法

### 1. 完全CI実行

```bash
# 全てのCIチェックを実行
./scripts/ci.sh
```

### 2. 個別CIタスクの実行

```bash
# 必要なツールの確認
./scripts/ci-utils.sh check

# フロントエンドCIのみ
./scripts/ci-utils.sh frontend

# バックエンドCIのみ
./scripts/ci-utils.sh backend

# Terraform検証のみ
./scripts/ci-utils.sh terraform

# セキュリティスキャンのみ
./scripts/ci-utils.sh security

# Dockerビルドテストのみ
./scripts/ci-utils.sh docker
```

### 3. 特定のチェックのみ実行

```bash
# Lintチェックのみ
./scripts/ci-utils.sh lint

# テストのみ
./scripts/ci-utils.sh test

# ビルドテストのみ
./scripts/ci-utils.sh build
```

### 4. コード修正ツール

```bash
# コードフォーマットの自動修正
./scripts/ci-utils.sh format

# 自動修正可能な問題を全て修正
./scripts/ci-utils.sh fix
```

### 5. 開発支援ツール

```bash
# ファイル変更を監視してCIを自動実行
./scripts/ci-utils.sh watch

# 特定の部分のみ監視
./scripts/ci-utils.sh watch frontend
./scripts/ci-utils.sh watch backend

# パフォーマンス測定
./scripts/ci-utils.sh performance
```

## CIスクリプトの詳細

### ci.sh
GitHub ActionsのCIワークフローをローカルで実行。以下のチェックを実行：

1. **フロントエンドCI**
   - ESLint（コード品質チェック）
   - TypeScript型チェック
   - Prettierフォーマットチェック
   - ビルドテスト

2. **バックエンドCI**
   - ESLint（コード品質チェック）
   - TypeScriptビルド
   - Prettierフォーマットチェック
   - ユニットテスト実行

3. **Terraform検証**
   - フォーマットチェック
   - 構文検証
   - tflint静的解析

4. **セキュリティスキャン**
   - Trivy脆弱性スキャン

5. **Dockerビルドテスト**
   - フロントエンド・バックエンドのDockerイメージビルド

### ci-utils.sh
個別タスクと開発支援機能を提供：

| コマンド | 説明 |
|---------|------|
| `check` | 必要なツールの確認 |
| `frontend` | フロントエンドCIのみ実行 |
| `backend` | バックエンドCIのみ実行 |
| `terraform` | Terraform検証のみ実行 |
| `security` | セキュリティスキャンのみ実行 |
| `docker` | Dockerビルドテストのみ実行 |
| `lint` | 全体のlintチェックのみ実行 |
| `test` | 全体のテストのみ実行 |
| `build` | 全体のビルドテストのみ実行 |
| `format` | コードフォーマットの修正 |
| `fix` | 自動修正可能な問題を修正 |
| `watch` | ファイル変更を監視してCIを実行 |
| `performance` | パフォーマンス測定 |

## デプロイメントの使用方法

### 1. プロジェクトのクローン

```bash
# GitHubからプロジェクトをクローン
git clone https://github.com/your-username/gpu_genie.git
cd gpu_genie

# スクリプトに実行権限を付与
chmod +x scripts/*.sh
```

### 2. 完全デプロイ

```bash
# dev環境への完全デプロイ
./scripts/deploy.sh dev

# staging環境への完全デプロイ
./scripts/deploy.sh staging

# prod環境への完全デプロイ
./scripts/deploy.sh prod
```

### 3. 個別タスクの実行

```bash
# 必要なツールの確認
./scripts/deploy-utils.sh check

# インフラストラクチャのみデプロイ
./scripts/deploy-utils.sh deploy-infra dev

# フロントエンドのみデプロイ
./scripts/deploy-utils.sh deploy-frontend dev

# バックエンドのみデプロイ
./scripts/deploy-utils.sh deploy-backend dev
```

## 開発ワークフローの推奨例

### 1. 開発開始時
```bash
# 1. 最新コードを取得
git pull origin main

# 2. 依存関係をインストール
cd frontend && npm ci && cd ..
cd backend/lambda && npm ci && cd ../..

# 3. CIチェックを実行
./scripts/ci.sh
```

### 2. コード変更中
```bash
# ファイル変更を監視してリアルタイムチェック
./scripts/ci-utils.sh watch frontend

# または個別チェック
./scripts/ci-utils.sh lint
./scripts/ci-utils.sh test
```

### 3. コミット前
```bash
# 自動修正を実行
./scripts/ci-utils.sh fix

# 全CIチェックを実行
./scripts/ci.sh

# 問題がなければコミット
git add .
git commit -m "your commit message"
```

### 4. デプロイ前
```bash
# CI通過後にデプロイ
./scripts/deploy.sh dev
```

## スクリプトの詳細

### deploy.sh
メインのデプロイスクリプト。以下の処理を順次実行します：

1. **環境確認**: 必要なツール（Node.js、Terraform、AWS CLI等）の確認
2. **バックエンドビルド**: TypeScriptのコンパイルとZIPパッケージ作成
3. **インフラデプロイ**: Terraformによるリソース作成
4. **バックエンドデプロイ**: Lambda関数の更新
5. **フロントエンドビルド**: Next.jsアプリケーションのビルド
6. **フロントエンドデプロイ**: S3への静的ファイルアップロード
7. **スモークテスト**: 基本的な動作確認

### deploy-utils.sh
個別タスクを実行するためのユーティリティスクリプト。

#### 利用可能なコマンド

| コマンド | 説明 |
|---------|------|
| `check` | 必要なツールの確認 |
| `build-backend` | バックエンドのビルドのみ |
| `build-frontend` | フロントエンドのビルドのみ |
| `deploy-infra` | インフラストラクチャのデプロイのみ |
| `deploy-backend` | Lambda関数のデプロイのみ |
| `deploy-frontend` | フロントエンドのデプロイのみ |
| `outputs` | Terraformの出力値を表示 |
| `test` | スモークテストの実行 |
| `clean` | 一時ファイルのクリーンアップ |
| `destroy` | インフラストラクチャの削除 |
| `logs` | Lambda関数のログを表示 |
| `status` | デプロイ状況の確認 |
| `export` | 環境変数を.env.deploymentファイルにエクスポート |

## 実行例

### CI実行例

```bash
# 完全CI実行
./scripts/ci.sh

# 出力例:
# [INFO] === GPU Genie CI Script ===
# [INFO] Timestamp: Mon Jan 15 10:30:00 UTC 2024
# 
# [INFO] Checking CI requirements...
# [SUCCESS] Requirements check completed
# 
# [INFO] === Running Frontend CI ===
# [SUCCESS] Frontend CI completed
# 
# [INFO] === Running Backend CI ===
# [SUCCESS] Backend CI completed
# 
# [SUCCESS] 🎉 All CI checks passed!
```

### 初回デプロイ

```bash
# 1. プロジェクトディレクトリに移動
cd gpu_genie

# 2. CIチェック
./scripts/ci.sh

# 3. 環境確認
./scripts/deploy-utils.sh check

# 4. 完全デプロイ実行
./scripts/deploy.sh dev
```

### 部分的な更新

```bash
# フロントエンドのみ更新
./scripts/ci-utils.sh frontend
./scripts/deploy-utils.sh build-frontend dev
./scripts/deploy-utils.sh deploy-frontend dev

# バックエンドのみ更新
./scripts/ci-utils.sh backend
./scripts/deploy-utils.sh build-backend dev
./scripts/deploy-utils.sh deploy-backend dev
```

### トラブルシューティング

```bash
# CIエラーの修正
./scripts/ci-utils.sh fix
./scripts/ci.sh

# デプロイ状況の確認
./scripts/deploy-utils.sh status dev

# Terraformの出力値確認
./scripts/deploy-utils.sh outputs dev

# Lambda関数のログ確認
./scripts/deploy-utils.sh logs dev reservations

# 環境変数の確認
./scripts/deploy-utils.sh export dev
cat .env.deployment
```

## 出力例

### CI成功時の出力

```
[INFO] === GPU Genie CI Script ===
[INFO] Timestamp: Mon Jan 15 10:30:00 UTC 2024

[INFO] Checking CI requirements...
[SUCCESS] Requirements check completed

[INFO] === Running Frontend CI ===
[INFO] Installing frontend dependencies...
[INFO] Running ESLint...
[INFO] Checking TypeScript types...
[INFO] Running Prettier check...
[INFO] Building application...
[SUCCESS] Frontend CI completed

[INFO] === Running Backend CI ===
[INFO] Installing backend dependencies...
[INFO] Running ESLint...
[INFO] Building TypeScript...
[INFO] Running Prettier check...
[INFO] Running tests...
[SUCCESS] Backend CI completed

[SUCCESS] 🎉 All CI checks passed!

=== CI Summary ===
✅ Frontend CI: PASSED
✅ Backend CI: PASSED
✅ Terraform Validation: PASSED
✅ Security Scan: PASSED
✅ Docker Build Test: PASSED

=== Next Steps ===
1. Your code is ready for pull request/merge
2. Consider running deployment: ./scripts/deploy.sh dev

[INFO] Total CI execution time: 45 seconds
```

### デプロイ成功時の出力

```
[INFO] === GPU Genie Deployment Script ===
[INFO] Environment: dev
[INFO] Timestamp: Mon Jan 15 10:30:00 UTC 2024

[INFO] Checking requirements...
[SUCCESS] Requirements check completed

[INFO] Building backend...
[SUCCESS] Backend build completed

[INFO] Deploying infrastructure...
[SUCCESS] Infrastructure deployment completed
[INFO] API Gateway URL: https://abc123.execute-api.us-east-1.amazonaws.com/dev
[INFO] CloudFront Domain: d1234567890123.cloudfront.net

[SUCCESS] 🚀 Deployment completed successfully!

=== Deployment Summary ===
Environment: dev
Frontend URL: https://d1234567890123.cloudfront.net
API URL: https://abc123.execute-api.us-east-1.amazonaws.com/dev

=== Environment Variables Used ===
AWS Region: us-east-1
Cognito User Pool ID: us-east-1_ABCDEFGHI
Cognito Client ID: 1a2b3c4d5e6f7g8h9i0j
Cognito Identity Pool ID: us-east-1:12345678-1234-1234-1234-123456789012
```

## 注意事項

### セキュリティ
- AWSクラウドシェルは一時的な環境です
- 機密情報はセッション終了時に削除されます
- 本番環境では適切なIAMロールと権限を設定してください

### コスト
- 作成されるリソースには料金が発生します
- 不要になったリソースは`destroy`コマンドで削除してください
- 特にBedrockの利用には注意してください

### 制限事項
- CloudShellのセッションタイムアウトは20分です
- 大きなファイルの処理には時間がかかる場合があります
- 同時実行数に制限があります

## エラー対処

### よくあるエラー

#### 1. 権限不足
```
Error: AccessDenied: User is not authorized to perform: iam:CreateRole
```
**対処法**: IAM権限を確認し、必要な権限を付与してください

#### 2. リソース名の重複
```
Error: S3 bucket name already exists
```
**対処法**: 環境名を変更するか、既存のリソースを削除してください

#### 3. Terraform状態の不整合
```
Error: Resource already exists
```
**対処法**: `terraform import`コマンドで既存リソースをインポートするか、`terraform destroy`で削除してください

#### 4. CIエラー
```
Error: ESLint check failed
```
**対処法**: 
```bash
# 自動修正を試行
./scripts/ci-utils.sh fix

# 個別確認
./scripts/ci-utils.sh lint
```

### ログの確認

```bash
# 詳細なログを確認
./scripts/deploy-utils.sh logs dev reservations

# Terraformの状態確認
cd terraform
terraform show

# CIの詳細確認
./scripts/ci-utils.sh frontend
```

## サポート

問題が発生した場合は、以下の情報を含めてイシューを作成してください：

1. 実行したコマンド
2. エラーメッセージ
3. 環境情報（AWSリージョン、権限等）
4. ログファイル 