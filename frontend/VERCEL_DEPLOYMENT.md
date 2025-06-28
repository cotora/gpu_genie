# Vercelデプロイメントガイド

## 前提条件

1. Vercel CLIをインストール
```bash
npm i -g vercel
```

2. Vercelにログイン
```bash
vercel login
```

## デプロイ手順

### 1. 初回デプロイ
```bash
cd frontend
vercel
```

### 2. 環境変数の設定
Vercelダッシュボードまたはコマンドラインで以下の環境変数を設定：

```bash
vercel env add NEXT_PUBLIC_AWS_REGION
vercel env add NEXT_PUBLIC_API_GATEWAY_URL
vercel env add NEXT_PUBLIC_COGNITO_USER_POOL_ID
vercel env add NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID
vercel env add NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID
```

### 3. 環境変数の値
```
NEXT_PUBLIC_AWS_REGION=us-east-2
NEXT_PUBLIC_API_GATEWAY_URL=https://0gy9lf6f1c.execute-api.us-east-2.amazonaws.com/dev
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-2_or4u7Cnb2
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=1c5a8a8ir9gbkn27knessvtnnj
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=us-east-2:15e73f60-68e7-4fa5-8934-f48be0033259
```

### 4. Cognitoコールバック URL の更新
Vercelドメインが決まったら、Terraformで以下のように設定：

```bash
cd ../terraform
terraform apply -var="vercel_domain=your-app-name.vercel.app"
```

## 自動デプロイ設定

### GitHub連携
1. VercelダッシュボードでGitHubリポジトリを接続
2. 自動デプロイが有効になります
3. mainブランチへのpushで自動デプロイ

### 手動デプロイ
```bash
# 本番環境にデプロイ
vercel --prod

# プレビューデプロイ
vercel
```

## トラブルシューティング

### ビルドエラー
```bash
# ローカルでビルドテスト
npm run build

# Vercel固有の問題確認
vercel logs
```

### 環境変数エラー
```bash
# 設定確認
vercel env ls

# 環境変数追加
vercel env add [変数名]
```

## メリット

1. **簡単なデプロイ**: CloudFront + S3の複雑な設定が不要
2. **自動SSL**: HTTPS が自動設定
3. **グローバルCDN**: Vercel Edge Network
4. **環境変数管理**: ダッシュボードで簡単管理
5. **プレビュー機能**: ブランチごとのプレビューURL
6. **ビルド最適化**: Next.js最適化済み
7. **ゼロ設定**: 追加設定不要