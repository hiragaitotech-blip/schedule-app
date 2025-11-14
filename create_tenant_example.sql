-- ============================================
-- 新しいテナント（企業）と管理者アカウントを作成するSQL例
-- ============================================
-- このSQLをSupabaseのSQL Editorで実行してください

-- ============================================
-- ステップ1: テナント（企業）を作成
-- ============================================
INSERT INTO public.tenants (name) 
VALUES ('株式会社○○人材紹介')
RETURNING id, name;

-- テナントIDをコピーしてください（例: '123e4567-e89b-12d3-a456-426614174000'）

-- ============================================
-- ステップ2: 管理者アカウントを作成
-- ============================================
-- 方法A: 既存のユーザーを管理者にする

-- 1. 既存のユーザーIDを確認
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- 2. プロフィールを作成または更新
INSERT INTO public.profiles (id, tenant_id, role, is_active)
VALUES (
  '既存のユーザーID'::uuid,  -- 上記で確認したID
  'テナントID'::uuid,        -- ステップ1で取得したテナントID
  'admin',
  true
)
ON CONFLICT (id) 
DO UPDATE SET 
  tenant_id = EXCLUDED.tenant_id,
  role = 'admin',
  is_active = true;

-- ============================================
-- 方法B: 新しい管理者アカウントを作成（Supabase Authで手動作成が必要）
-- ============================================
-- 1. Supabaseダッシュボード → Authentication → Users
-- 2. 「Add user」をクリック
-- 3. メールアドレスとパスワードを設定
-- 4. 以下のSQLでプロフィールを作成

-- INSERT INTO public.profiles (id, tenant_id, role, is_active)
-- VALUES (
--   '新規ユーザーID'::uuid,  -- Supabase Authで作成したユーザーID
--   'テナントID'::uuid,      -- ステップ1で取得したテナントID
--   'admin',
--   true
-- );

-- ============================================
-- 完了
-- ============================================
-- これで、新しいテナントと管理者アカウントが作成されました。
-- 管理者でログイン後、/settings/users から追加ユーザーを作成できます。

