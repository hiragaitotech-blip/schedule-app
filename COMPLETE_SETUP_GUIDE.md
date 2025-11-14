# Supabase セットアップ完全ガイド

## 📋 現在の状況

あなたが提供したSQLには以下のテーブルが定義されています：
- ✅ `tenants` - テナントテーブル
- ✅ `profiles` - ユーザープロフィール（ただし`is_active`カラムがない）
- ✅ `slots` - スロットテーブル
- ✅ `candidate_availabilities` - 候補者回答テーブル
- ⚠️ `cases` - 案件テーブル（既に存在していると仮定）

## 🔧 実行すべきSQLの順序

### Step 1: スキーマ更新（必須）

**ファイル**: `supabase_schema_update.sql`

このSQLを実行してください：
- `profiles`テーブルに`is_active`カラムを追加
- 既存レコードを有効化

```sql
-- profiles テーブルに is_active カラムを追加
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;

-- 既存のレコードを有効化
UPDATE public.profiles 
SET is_active = true 
WHERE is_active IS NULL;
```

### Step 2: RLS設定（必須）

**ファイル**: `supabase_rls_setup.sql`

このSQLを実行してください：
- 全テーブルにRLSを有効化
- テナント分離ポリシーを設定
- **既存のテーブル構造は変更しません**

## 📝 完全なセットアップ手順

### 1. Supabaseダッシュボードにログイン

### 2. SQL Editorを開く

### 3. まず、`supabase_schema_update.sql`を実行

```sql
-- profiles テーブルに is_active カラムを追加
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;

-- 既存のレコードを有効化
UPDATE public.profiles 
SET is_active = true 
WHERE is_active IS NULL;
```

### 4. 次に、`supabase_rls_setup.sql`を実行

（ファイル全体をコピー＆ペーストして実行）

## ⚠️ 重要な注意事項

### `supabase_rls_setup.sql`について

- ✅ **既存のテーブル構造は変更しません**
- ✅ **既存のデータは削除しません**
- ✅ **RLSポリシーのみを追加します**
- ✅ 既存のポリシーがある場合は削除してから再作成します

### 実行後の動作

- 各テーブルでRLSが有効化されます
- テナント分離がデータベース層でも保証されます
- アプリケーション層の修正と合わせて、完全なセキュリティが確保されます

## 🔍 確認方法

RLS設定後、以下を確認してください：

1. **テーブル一覧でRLSが有効化されているか確認**
   - Supabaseダッシュボード → Table Editor
   - 各テーブルの「RLS」列が「Enabled」になっているか確認

2. **ポリシーが作成されているか確認**
   - 各テーブルを開く
   - 「Policies」タブでポリシーが表示されているか確認

## ❓ よくある質問

### Q: `supabase_rls_setup.sql`を実行すると既存のデータが消えますか？

**A: いいえ、消えません。** RLSポリシーを追加するだけです。

### Q: `cases`テーブルが存在しない場合は？

**A: まず`cases`テーブルを作成してください。** 以下のSQLを実行：

```sql
CREATE TABLE IF NOT EXISTS public.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  title text,
  candidate_name text,
  stage text,
  status text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Q: エラーが出た場合は？

**A: エラーメッセージを確認してください。**
- `IF NOT EXISTS`や`DROP POLICY IF EXISTS`を使っているので、既に存在する場合はスキップされます
- 重大なエラーの場合は、エラーメッセージを確認して対応してください

## ✅ 完了

すべてのSQLを実行したら、セキュリティ設定は完了です！

