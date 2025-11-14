-- ============================================
-- デモ用アカウントクイックセットアップSQL
-- ============================================
-- このSQLを実行する前に、Supabase Authで以下のユーザーを作成してください：
-- 1. developer@demo.com
-- 2. admin-a@demo.com
-- 3. user-a@demo.com
-- 4. admin-b@demo.com
-- 5. user-b@demo.com

-- ============================================
-- テナント作成
-- ============================================

INSERT INTO public.tenants (name) 
SELECT 'デモ人材紹介株式会社A'
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenants WHERE name = 'デモ人材紹介株式会社A'
);

INSERT INTO public.tenants (name) 
SELECT 'デモ人材紹介株式会社B'
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenants WHERE name = 'デモ人材紹介株式会社B'
);

-- ============================================
-- プロフィール作成
-- ============================================

-- アプリ開発者（スーパー管理者）- テナントに所属しない
INSERT INTO public.profiles (id, tenant_id, role, is_active)
SELECT 
  u.id,
  NULL,
  'admin',
  true
FROM auth.users u
WHERE u.email = 'developer@demo.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = u.id
  )
ON CONFLICT (id) DO UPDATE SET
  tenant_id = NULL,
  role = 'admin',
  is_active = true;

-- デモ企業A - 管理者
INSERT INTO public.profiles (id, tenant_id, role, is_active)
SELECT 
  u.id,
  t.id,
  'admin',
  true
FROM auth.users u
CROSS JOIN public.tenants t
WHERE u.email = 'admin-a@demo.com'
  AND t.name = 'デモ人材紹介株式会社A'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = u.id
  )
ON CONFLICT (id) DO UPDATE SET
  tenant_id = (SELECT id FROM public.tenants WHERE name = 'デモ人材紹介株式会社A' LIMIT 1),
  role = 'admin',
  is_active = true;

-- デモ企業A - 一般ユーザー
INSERT INTO public.profiles (id, tenant_id, role, is_active)
SELECT 
  u.id,
  t.id,
  'member',
  true
FROM auth.users u
CROSS JOIN public.tenants t
WHERE u.email = 'user-a@demo.com'
  AND t.name = 'デモ人材紹介株式会社A'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = u.id
  )
ON CONFLICT (id) DO UPDATE SET
  tenant_id = (SELECT id FROM public.tenants WHERE name = 'デモ人材紹介株式会社A' LIMIT 1),
  role = 'member',
  is_active = true;

-- デモ企業B - 管理者
INSERT INTO public.profiles (id, tenant_id, role, is_active)
SELECT 
  u.id,
  t.id,
  'admin',
  true
FROM auth.users u
CROSS JOIN public.tenants t
WHERE u.email = 'admin-b@demo.com'
  AND t.name = 'デモ人材紹介株式会社B'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = u.id
  )
ON CONFLICT (id) DO UPDATE SET
  tenant_id = (SELECT id FROM public.tenants WHERE name = 'デモ人材紹介株式会社B' LIMIT 1),
  role = 'admin',
  is_active = true;

-- デモ企業B - 一般ユーザー
INSERT INTO public.profiles (id, tenant_id, role, is_active)
SELECT 
  u.id,
  t.id,
  'member',
  true
FROM auth.users u
CROSS JOIN public.tenants t
WHERE u.email = 'user-b@demo.com'
  AND t.name = 'デモ人材紹介株式会社B'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = u.id
  )
ON CONFLICT (id) DO UPDATE SET
  tenant_id = (SELECT id FROM public.tenants WHERE name = 'デモ人材紹介株式会社B' LIMIT 1),
  role = 'member',
  is_active = true;

-- ============================================
-- デモ案件データ作成（オプション）
-- ============================================

-- デモ企業Aの案件
INSERT INTO public.cases (tenant_id, title, candidate_name, stage, status)
SELECT 
  t.id,
  'エンジニア採用案件',
  '山田 太郎',
  '1st Interview',
  'Scheduling'
FROM public.tenants t
WHERE t.name = 'デモ人材紹介株式会社A'
  AND NOT EXISTS (
    SELECT 1 FROM public.cases 
    WHERE tenant_id = t.id 
    AND title = 'エンジニア採用案件'
  );

INSERT INTO public.cases (tenant_id, title, candidate_name, stage, status)
SELECT 
  t.id,
  'デザイナー採用案件',
  '佐藤 花子',
  '2nd Interview',
  'Awaiting Feedback'
FROM public.tenants t
WHERE t.name = 'デモ人材紹介株式会社A'
  AND NOT EXISTS (
    SELECT 1 FROM public.cases 
    WHERE tenant_id = t.id 
    AND title = 'デザイナー採用案件'
  );

-- デモ企業Bの案件
INSERT INTO public.cases (tenant_id, title, candidate_name, stage, status)
SELECT 
  t.id,
  'マーケター採用案件',
  '鈴木 一郎',
  '1st Interview',
  'Scheduling'
FROM public.tenants t
WHERE t.name = 'デモ人材紹介株式会社B'
  AND NOT EXISTS (
    SELECT 1 FROM public.cases 
    WHERE tenant_id = t.id 
    AND title = 'マーケター採用案件'
  );

INSERT INTO public.cases (tenant_id, title, candidate_name, stage, status)
SELECT 
  t.id,
  '営業採用案件',
  '田中 次郎',
  'Final Interview',
  'Confirmed'
FROM public.tenants t
WHERE t.name = 'デモ人材紹介株式会社B'
  AND NOT EXISTS (
    SELECT 1 FROM public.cases 
    WHERE tenant_id = t.id 
    AND title = '営業採用案件'
  );

-- ============================================
-- 完了
-- ============================================
-- デモアカウントのセットアップが完了しました。
-- 
-- 環境変数 .env.local に以下を設定してください：
-- SUPER_ADMIN_EMAIL=developer@demo.com


