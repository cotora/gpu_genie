# GPU Genie

GPU Genieは、自然言語による直感的な予約インターフェースとAIによる優先度判定機能を備えたGPUサーバーリソース管理システムです。

## 概要

従来の属人的な手動予約による非効率性を解決し、公平で自動化された予約体験を提供します。

## システム構成

AWSマネージドサービスを活用したサーバーレスアーキテクチャ：

```
ユーザー → CloudFront → S3 (Next.js静的エクスポート) → API Gateway → Lambda → DynamoDB
                                                            ↓
                                                    Amazon Bedrock (AI判定)
```

## 技術スタック

### フロントエンド
- Next.js (React フレームワーク)
- TypeScript
- Tailwind CSS
- AWS Amplify (認証)

### バックエンド
- AWS Lambda (Node.js/TypeScript)
- Amazon API Gateway (RESTful API)
- Amazon DynamoDB (NoSQL)
- Amazon Bedrock (AI判定)

### 認証・セキュリティ
- Amazon Cognito (ユーザー認証)
- AWS IAM (アクセス管理)

### インフラ管理
- Terraform (Infrastructure as Code)

## プロジェクト構造

```
gpu_genie/
├── frontend/                    # Next.jsフロントエンド
│   ├── src/
│   │   ├── app/                # App Router
│   │   ├── components/         # Reactコンポーネント
│   │   └── lib/               # ユーティリティ・設定
│   └── package.json
├── backend/
│   └── lambda/                 # Lambda関数
│       ├── src/
│       │   ├── handlers/       # Lambda ハンドラー
│       │   ├── services/       # ビジネスロジック
│       │   └── types/         # TypeScript型定義
│       └── package.json
├── terraform/                  # インフラストラクチャコード
│   ├── main.tf
│   ├── dynamodb.tf
│   ├── lambda.tf
│   ├── api_gateway.tf
│   ├── s3.tf
│   ├── cloudfront.tf
│   ├── cognito.tf
│   └── outputs.tf
└── claude.md                   # システム要件定義書
```

## 主要機能

### ユーザー機能
- **自然言語による予約**: 「明日15時から3時間、V100を2台予約」のような自然な表現で予約
- **予約確認・管理**: 自身の予約状況を一覧表示・キャンセル
- **AI判定結果確認**: 優先度判定の理由と結果を確認

### システム機能
- **AI自然言語解析**: Amazon Bedrock（Claude 3 Haiku）による高精度な予約リクエスト解析
- **AI優先度判定**: Amazon Bedrock（Claude 3 Sonnet）を利用した公平な優先度判定
- **拒否確認ワークフロー**: 段階的な拒否プロセス

## ローカル開発環境

### Docker Composeを使った開発環境

```bash
# 開発環境を起動
docker-compose up -d

# ログを確認
docker-compose logs -f

# 開発環境を停止
docker-compose down
```

起動後のアクセス先：
- **フロントエンド**: http://localhost:3000
- **API**: http://localhost:3001
- **DynamoDB Admin**: http://localhost:8001
- **DynamoDB Local**: http://localhost:8000

### ローカル開発（Docker Composeなし）

#### 1. DynamoDB Local

```bash
# DynamoDB Localを起動
docker run -p 8000:8000 amazon/dynamodb-local

# テーブル初期化
cd scripts
node init-dynamodb.js
```

#### 2. バックエンドAPI

```bash
cd backend/lambda
npm install
npm run dev
```

#### 3. フロントエンド

```bash
cd frontend
npm install
npm run dev
```

### 本番環境デプロイ

#### 1. インフラストラクチャ

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

#### 2. 環境変数設定

```bash
# frontend/.env.local
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your_user_pool_id
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=your_client_id
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=your_identity_pool_id
NEXT_PUBLIC_API_GATEWAY_URL=your_api_gateway_url
```

## デプロイ

### フロントエンド
```bash
cd frontend
npm run build
npm run export
# S3バケットにアップロード
```

### バックエンド
```bash
cd backend/lambda
npm run build
# Lambdaファンクションをデプロイ
```

### インフラストラクチャ
```bash
cd terraform
terraform apply
```

## 使用方法

1. **ユーザー登録**: `/auth/signup` でアカウント作成
2. **ログイン**: `/auth/signin` でログイン
3. **予約作成**: `/reservations` で自然言語による予約
4. **予約管理**: `/dashboard` で予約状況確認・管理

## API エンドポイント

- `POST /reservations` - 予約作成
- `GET /reservations/{userId}` - ユーザーの予約一覧
- `PUT /reservations/update/{id}` - 予約更新
- `POST /users` - ユーザー作成
- `GET /users/{id}` - ユーザー情報取得

## 開発

### フロントエンド開発サーバー
```bash
cd frontend
npm run dev
```

### バックエンドテスト
```bash
cd backend/lambda
npm test
npm run test:coverage  # カバレッジ付き
npm run test:watch     # ファイル変更を監視
```

### 型チェック・リンター・フォーマッター
```bash
# フロントエンド
cd frontend
npm run type-check
npm run lint
npm run format

# バックエンド
cd backend/lambda
npm run build         # TypeScript型チェック
npm run lint
npm run format
```

## CI/CD

### GitHub Actions

#### CI（プルリクエスト時）
- **リンター**: ESLint、Prettier
- **型チェック**: TypeScript
- **テスト**: Jest（カバレッジ付き）
- **ビルド**: Next.js、Lambda
- **セキュリティ**: Trivy脆弱性スキャン
- **Terraform**: フォーマット、バリデーション、TFLint

#### CD（mainブランチへのコミット時）
1. **ビルド**: フロントエンド・バックエンドの並列ビルド
2. **インフラデプロイ**: Terraformによる自動デプロイ
3. **バックエンドデプロイ**: Lambda関数の更新
4. **フロントエンドデプロイ**: S3への静的サイトデプロイ
5. **スモークテスト**: デプロイ後のヘルスチェック

### 必要なGitHub Secrets

```bash
AWS_ACCESS_KEY_ID          # AWSアクセスキー
AWS_SECRET_ACCESS_KEY      # AWSシークレットキー
AWS_REGION                 # AWSリージョン（例: us-east-1）
API_GATEWAY_URL           # API GatewayのURL
COGNITO_USER_POOL_ID      # CognitoユーザープールID
COGNITO_USER_POOL_CLIENT_ID # CognitoクライアントID
COGNITO_IDENTITY_POOL_ID   # Cognito Identity Pool ID
CODECOV_TOKEN             # Codecovトークン（オプション）
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。