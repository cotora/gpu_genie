#!/bin/bash

# GPU Genie - ユーザー有効化スクリプト
# 使用方法: ./activate-user.sh <email>

if [ $# -eq 0 ]; then
    echo "使用方法: $0 <email>"
    echo "例: $0 user@example.com"
    exit 1
fi

EMAIL=$1
USER_POOL_ID="us-east-2_or4u7Cnb2"

echo "ユーザー '$EMAIL' を有効化しています..."

# ユーザーの確認ステータスを有効化
AWS_PROFILE=Student-959285956395 aws cognito-idp admin-confirm-sign-up \
    --user-pool-id $USER_POOL_ID \
    --username $EMAIL

if [ $? -eq 0 ]; then
    echo "✅ ユーザー '$EMAIL' が正常に有効化されました。"
    echo "ユーザーはログイン可能になりました。"
else
    echo "❌ ユーザーの有効化に失敗しました。"
    echo "エラーの原因:"
    echo "1. ユーザーが存在しない"
    echo "2. ユーザーが既に有効化されている"
    echo "3. 権限不足"
fi