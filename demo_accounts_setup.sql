-- ============================================
-- デモ用アカウントセットアップSQL
-- ============================================
-- このSQLをSupabaseのSQL Editorで実行してください
-- 3種類のデモアカウントが作成されます：
-- 1. アプリ開発者用（スーパー管理者）
-- 2. 企業用（テナント管理者）
-- 3. 企業のユーザー用（一般ユーザー）

-- ============================================
-- ステップ1: テナント（企業）を作成
-- ============================================

-- デモ企業A（既に存在する場合はスキップ）
INSERT INTO public.tenants (name) 
SELECT 'デモ人材紹介株式会社A'
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenants WHERE name = 'デモ人材紹介株式会社A'
);

-- デモ企業B（既に存在する場合はスキップ）
INSERT INTO public.tenants (name) 
SELECT 'デモ人材紹介株式会社B'
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenants WHERE name = 'デモ人材紹介株式会社B'
);

-- ============================================
-- ステップ2: ユーザーアカウントを作成（Supabase Authで手動作成が必要）
-- ============================================
-- 以下のメールアドレスでSupabase Authでユーザーを作成してください：
--
-- 1. アプリ開発者用（スーパー管理者）
--    メール: developer@demo.com
--    パスワード: DemoDeveloper123!
--
-- 2. デモ企業A - 管理者
--    メール: admin-a@demo.com
--    パスワード: DemoAdminA123!
--
-- 3. デモ企業A - 一般ユーザー
--    メール: user-a@demo.com
--    パスワード: DemoUserA123!
--
-- 4. デモ企業B - 管理者
--    メール: admin-b@demo.com
--    パスワード: DemoAdminB123!
--
-- 5. デモ企業B - 一般ユーザー
--    メール: user-b@demo.com
--    パスワード: DemoUserB123!
--
-- Supabaseダッシュボード → Authentication → Users → Add user
-- で上記のユーザーを作成してください。

-- ============================================
-- ステップ3: プロフィールを作成
-- ============================================
-- 上記のユーザーを作成後、以下のSQLでプロフィールを作成してください
-- （ユーザーIDはSupabase Authで確認してください）

-- テナントIDを取得
DO $$
DECLARE
  tenant_a_id uuid;
  tenant_b_id uuid;
  developer_user_id uuid;
  admin_a_user_id uuid;
  user_a_user_id uuid;
  admin_b_user_id uuid;
  user_b_user_id uuid;
BEGIN
  -- テナントIDを取得
  SELECT id INTO tenant_a_id FROM public.tenants WHERE name = 'デモ人材紹介株式会社A' LIMIT 1;
  SELECT id INTO tenant_b_id FROM public.tenants WHERE name = 'デモ人材紹介株式会社B' LIMIT 1;

  -- ユーザーIDを取得（メールアドレスから）
  SELECT id INTO developer_user_id FROM auth.users WHERE email = 'developer@demo.com' LIMIT 1;
  SELECT id INTO admin_a_user_id FROM auth.users WHERE email = 'admin-a@demo.com' LIMIT 1;
  SELECT id INTO user_a_user_id FROM auth.users WHERE email = 'user-a@demo.com' LIMIT 1;
  SELECT id INTO admin_b_user_id FROM auth.users WHERE email = 'admin-b@demo.com' LIMIT 1;
  SELECT id INTO user_b_user_id FROM auth.users WHERE email = 'user-b@demo.com' LIMIT 1;

  -- プロフィールを作成
  -- 1. アプリ開発者用（スーパー管理者）- テナントに所属しない
  IF developer_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, tenant_id, role, is_active)
    VALUES (developer_user_id, NULL, 'admin', true)
    ON CONFLICT (id) DO UPDATE SET
      tenant_id = NULL,
      role = 'admin',
      is_active = true;
  END IF;

  -- 2. デモ企業A - 管理者
  IF admin_a_user_id IS NOT NULL AND tenant_a_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, tenant_id, role, is_active)
    VALUES (admin_a_user_id, tenant_a_id, 'admin', true)
    ON CONFLICT (id) DO UPDATE SET
      tenant_id = tenant_a_id,
      role = 'admin',
      is_active = true;
  END IF;

  -- 3. デモ企業A - 一般ユーザー
  IF user_a_user_id IS NOT NULL AND tenant_a_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, tenant_id, role, is_active)
    VALUES (user_a_user_id, tenant_a_id, 'member', true)
    ON CONFLICT (id) DO UPDATE SET
      tenant_id = tenant_a_id,
      role = 'member',
      is_active = true;
  END IF;

  -- 4. デモ企業B - 管理者
  IF admin_b_user_id IS NOT NULL AND tenant_b_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, tenant_id, role, is_active)
    VALUES (admin_b_user_id, tenant_b_id, 'admin', true)
    ON CONFLICT (id) DO UPDATE SET
      tenant_id = tenant_b_id,
      role = 'admin',
      is_active = true;
  END IF;

  -- 5. デモ企業B - 一般ユーザー
  IF user_b_user_id IS NOT NULL AND tenant_b_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, tenant_id, role, is_active)
    VALUES (user_b_user_id, tenant_b_id, 'member', true)
    ON CONFLICT (id) DO UPDATE SET
      tenant_id = tenant_b_id,
      role = 'member',
      is_active = true;
  END IF;
END $$;

-- ============================================
-- ステップ4: デモ案件データを作成（オプション）
-- ============================================

DO $$
DECLARE
  tenant_a_id uuid;
  tenant_b_id uuid;
  case_a_id uuid;
  case_b_id uuid;
BEGIN
  -- テナントIDを取得
  SELECT id INTO tenant_a_id FROM public.tenants WHERE name = 'デモ人材紹介株式会社A' LIMIT 1;
  SELECT id INTO tenant_b_id FROM public.tenants WHERE name = 'デモ人材紹介株式会社B' LIMIT 1;

  -- デモ企業Aの案件
  IF tenant_a_id IS NOT NULL THEN
    INSERT INTO public.cases (tenant_id, title, candidate_name, stage, status)
    VALUES 
      (tenant_a_id, 'エンジニア採用案件', '山田 太郎', '1st Interview', 'Scheduling'),
      (tenant_a_id, 'デザイナー採用案件', '佐藤 花子', '2nd Interview', 'Awaiting Feedback')
    RETURNING id INTO case_a_id;
  END IF;

  -- デモ企業Bの案件
  IF tenant_b_id IS NOT NULL THEN
    INSERT INTO public.cases (tenant_id, title, candidate_name, stage, status)
    VALUES 
      (tenant_b_id, 'マーケター採用案件', '鈴木 一郎', '1st Interview', 'Scheduling'),
      (tenant_b_id, '営業採用案件', '田中 次郎', 'Final Interview', 'Confirmed')
    RETURNING id INTO case_b_id;
  END IF;
END $$;

-- ============================================
-- 完了メッセージ
-- ============================================
-- デモアカウントのセットアップが完了しました。
-- 
-- 環境変数 .env.local に以下を設定してください：
-- SUPER_ADMIN_EMAIL=developer@demo.com
--
-- ログイン情報：
-- 1. アプリ開発者: developer@demo.com / DemoDeveloper123!
-- 2. 企業A管理者: admin-a@demo.com / DemoAdminA123!
-- 3. 企業Aユーザー: user-a@demo.com / DemoUserA123!
-- 4. 企業B管理者: admin-b@demo.com / DemoAdminB123!
-- 5. 企業Bユーザー: user-b@demo.com / DemoUserB123!

