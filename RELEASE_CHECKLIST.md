# リリース前チェックリスト

## ✅ 必須項目

### 1. 環境変数の設定
本番環境（Vercel等）で以下の環境変数を設定してください：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Zapier/Make Webhook（オプション）
ZAPIER_WEBHOOK_SECRET=your_webhook_secret
```

### 2. Supabase データベース設定

#### テーブルの確認
以下のテーブルが作成されているか確認：
- ✅ `tenants`
- ✅ `profiles` (is_active カラム含む)
- ✅ `cases`
- ✅ `slots`
- ✅ `candidate_availabilities`

#### Row Level Security (RLS) の設定
**重要**: 本番環境では必ずRLSを有効化してください。

```sql
-- profiles テーブルのRLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のプロフィールのみ閲覧可能
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- cases テーブルのRLS（必要に応じて）
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが閲覧可能（必要に応じて調整）
CREATE POLICY "Authenticated users can view cases"
ON public.cases FOR SELECT
TO authenticated
USING (true);

-- 認証済みユーザーが作成可能
CREATE POLICY "Authenticated users can create cases"
ON public.cases FOR INSERT
TO authenticated
WITH CHECK (true);
```

### 3. ビルドの確認

```bash
# ビルドが成功するか確認
npm run build

# 本番モードで起動して動作確認
npm run start
```

### 4. セキュリティ設定

#### Supabase Auth設定
- [ ] メール確認を有効化（本番環境推奨）
- [ ] パスワードポリシーを設定
- [ ] レート制限を設定

#### API エンドポイントの保護
- [x] `/api/webhooks/zapier` は `ZAPIER_WEBHOOK_SECRET` で保護済み
- [x] 認証が必要なAPIは middleware で保護済み

### 5. エラーハンドリング

- [x] ログイン時のエラーハンドリング実装済み
- [x] API エラーハンドリング実装済み
- [ ] 本番環境でのエラーログ収集（Sentry等の導入を検討）

### 6. パフォーマンス

- [ ] 画像最適化（必要に応じて）
- [ ] データベースクエリの最適化
- [ ] キャッシュ戦略の検討

## 📋 推奨項目

### 1. 監視・ログ
- [ ] エラートラッキング（Sentry等）
- [ ] パフォーマンス監視
- [ ] アクセスログの確認

### 2. バックアップ
- [ ] Supabase の自動バックアップ設定
- [ ] データベースの定期バックアップ

### 3. ドキュメント
- [ ] API ドキュメント
- [ ] ユーザーガイド
- [ ] 管理者ガイド

### 4. テスト
- [ ] 主要機能の動作確認
- [ ] ブラウザ互換性テスト
- [ ] モバイル対応確認

## 🚀 デプロイ手順

### Vercel へのデプロイ

1. **プロジェクトをVercelに接続**
   ```bash
   vercel
   ```

2. **環境変数を設定**
   - Vercel Dashboard → Settings → Environment Variables
   - 上記の環境変数をすべて設定

3. **デプロイ**
   ```bash
   vercel --prod
   ```

### デプロイ後の確認

- [ ] ログインページが表示される
- [ ] ログインが正常に動作する
- [ ] ダッシュボードが表示される
- [ ] 案件一覧が表示される
- [ ] 案件詳細ページが表示される
- [ ] 候補者ページが表示される
- [ ] Webhookエンドポイントが動作する（Zapier/Make連携）

## ⚠️ 注意事項

1. **サービスロールキーの取り扱い**
   - `SUPABASE_SERVICE_ROLE_KEY` は絶対にクライアント側に公開しない
   - 環境変数としてのみ使用

2. **OpenAI API キー**
   - 使用量に注意（コスト管理）
   - レート制限の確認

3. **Supabase の制限**
   - 無料プランの制限を確認
   - 必要に応じてプランアップグレード

## 📝 次のステップ（将来の改善）

- [ ] メール通知機能
- [ ] 案件の編集・削除機能
- [ ] より詳細なレポート機能
- [ ] 多言語対応
- [ ] ダークモード対応（オプション）

