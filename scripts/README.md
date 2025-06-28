# GPU Genie Manual Deployment Scripts

このディレクトリには、AWSクラウドシェル上でGPU Genieアプリケーションを手動デプロイするためのスクリプトが含まれています。

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

## 使用方法

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

### 初回デプロイ

```bash
# 1. プロジェクトディレクトリに移動
cd gpu_genie

# 2. 環境確認
./scripts/deploy-utils.sh check

# 3. 完全デプロイ実行
./scripts/deploy.sh dev
```

### 部分的な更新

```bash
# フロントエンドのみ更新
./scripts/deploy-utils.sh build-frontend dev
./scripts/deploy-utils.sh deploy-frontend dev

# バックエンドのみ更新
./scripts/deploy-utils.sh build-backend dev
./scripts/deploy-utils.sh deploy-backend dev
```

### トラブルシューティング

```bash
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

### 成功時の出力

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

### ログの確認

```bash
# 詳細なログを確認
./scripts/deploy-utils.sh logs dev reservations

# Terraformの状態確認
cd terraform
terraform show
```

## サポート

問題が発生した場合は、以下の情報を含めてイシューを作成してください：

1. 実行したコマンド
2. エラーメッセージ
3. 環境情報（AWSリージョン、権限等）
4. ログファイル 