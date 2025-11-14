-- ============================================
-- AI Interview Scheduler - 完全セットアップSQL
-- ============================================
-- このSQLをSupabaseのSQL Editorで実行すれば、すべてのテーブルとRLS設定が完了します
-- 既存のテーブルがある場合は、IF NOT EXISTSでスキップされます

-- ============================================
-- 1. 拡張機能の有効化
-- ============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. テーブル作成
-- ============================================

-- tenants（企業）
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- profiles（auth.users を補完する拡張テーブル）
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  role text DEFAULT 'member',
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- cases（案件）- 既に存在する場合はスキップ
CREATE TABLE IF NOT EXISTS public.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  title text,
  candidate_name text,
  stage text,
  status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- slots（案件ごとの候補枠）
CREATE TABLE IF NOT EXISTS public.slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- candidate_availabilities（候補者が回答した枠）
CREATE TABLE IF NOT EXISTS public.candidate_availabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  slot_id uuid NOT NULL REFERENCES public.slots(id) ON DELETE CASCADE,
  candidate_name text,
  email text,
  status text DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (case_id, slot_id, email)
);

-- ============================================
-- 3. 既存テーブルの更新（is_activeカラム追加）
-- ============================================

-- profiles テーブルに is_active カラムを追加（まだ存在しない場合）
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;

-- 既存のレコードを有効化（is_active が null の場合）
UPDATE public.profiles 
SET is_active = true 
WHERE is_active IS NULL;

-- ============================================
-- 4. Row Level Security (RLS) 設定
-- ============================================

-- 1. profiles テーブル
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（エラーが出る場合は無視してください）
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view tenant profiles" ON public.profiles;

-- ユーザーは自分のプロフィールのみ閲覧可能
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- ユーザーは自分のプロフィールのみ更新可能
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- 管理者は同じテナントのプロフィールを閲覧可能
CREATE POLICY "Admins can view tenant profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
    AND p.tenant_id = profiles.tenant_id
  )
);

-- 2. cases テーブル
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view own tenant cases" ON public.cases;
DROP POLICY IF EXISTS "Users can create cases in own tenant" ON public.cases;
DROP POLICY IF EXISTS "Users can update own tenant cases" ON public.cases;
DROP POLICY IF EXISTS "Users can delete own tenant cases" ON public.cases;

-- 認証済みユーザーは自分のテナントの案件のみ閲覧可能
CREATE POLICY "Users can view own tenant cases"
ON public.cases FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- 認証済みユーザーは自分のテナントの案件を作成可能
CREATE POLICY "Users can create cases in own tenant"
ON public.cases FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- 認証済みユーザーは自分のテナントの案件を更新可能
CREATE POLICY "Users can update own tenant cases"
ON public.cases FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- 認証済みユーザーは自分のテナントの案件を削除可能
CREATE POLICY "Users can delete own tenant cases"
ON public.cases FOR DELETE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- 3. slots テーブル
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view own tenant slots" ON public.slots;
DROP POLICY IF EXISTS "Users can create slots in own tenant cases" ON public.slots;
DROP POLICY IF EXISTS "Users can update own tenant slots" ON public.slots;
DROP POLICY IF EXISTS "Users can delete own tenant slots" ON public.slots;

-- 認証済みユーザーは自分のテナントの案件のスロットのみ閲覧可能
CREATE POLICY "Users can view own tenant slots"
ON public.slots FOR SELECT
TO authenticated
USING (
  case_id IN (
    SELECT id FROM public.cases
    WHERE tenant_id IN (
      SELECT tenant_id FROM public.profiles
      WHERE id = auth.uid()
    )
  )
);

-- 認証済みユーザーは自分のテナントの案件のスロットを作成可能
CREATE POLICY "Users can create slots in own tenant cases"
ON public.slots FOR INSERT
TO authenticated
WITH CHECK (
  case_id IN (
    SELECT id FROM public.cases
    WHERE tenant_id IN (
      SELECT tenant_id FROM public.profiles
      WHERE id = auth.uid()
    )
  )
);

-- 認証済みユーザーは自分のテナントの案件のスロットを更新可能
CREATE POLICY "Users can update own tenant slots"
ON public.slots FOR UPDATE
TO authenticated
USING (
  case_id IN (
    SELECT id FROM public.cases
    WHERE tenant_id IN (
      SELECT tenant_id FROM public.profiles
      WHERE id = auth.uid()
    )
  )
);

-- 認証済みユーザーは自分のテナントの案件のスロットを削除可能
CREATE POLICY "Users can delete own tenant slots"
ON public.slots FOR DELETE
TO authenticated
USING (
  case_id IN (
    SELECT id FROM public.cases
    WHERE tenant_id IN (
      SELECT tenant_id FROM public.profiles
      WHERE id = auth.uid()
    )
  )
);

-- 4. candidate_availabilities テーブル
ALTER TABLE public.candidate_availabilities ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view own tenant availabilities" ON public.candidate_availabilities;
DROP POLICY IF EXISTS "Anyone can create availability" ON public.candidate_availabilities;

-- 認証済みユーザーは自分のテナントの案件の回答を閲覧可能
CREATE POLICY "Users can view own tenant availabilities"
ON public.candidate_availabilities FOR SELECT
TO authenticated
USING (
  case_id IN (
    SELECT id FROM public.cases
    WHERE tenant_id IN (
      SELECT tenant_id FROM public.profiles
      WHERE id = auth.uid()
    )
  )
);

-- 誰でも（認証不要）回答を作成可能（候補者ページ用）
CREATE POLICY "Anyone can create availability"
ON public.candidate_availabilities FOR INSERT
WITH CHECK (true);

-- 5. tenants テーブル
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view own tenant" ON public.tenants;

-- 認証済みユーザーは自分のテナントのみ閲覧可能
CREATE POLICY "Users can view own tenant"
ON public.tenants FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT tenant_id FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- ============================================
-- 5. ダミーデータ（オプション）
-- ============================================
-- 必要に応じてコメントアウトを外してください
-- 既存のデータがある場合は、ON CONFLICT DO NOTHING で安全にスキップされます

-- テナントのダミーデータ（既に存在する場合はスキップ）
-- INSERT INTO public.tenants (name) 
-- VALUES ('Demo Talent Agency')
-- ON CONFLICT DO NOTHING;

-- プロフィールのダミーデータ（既に存在する場合はスキップ）
-- 注意: このIDは既存のユーザーIDと一致する必要があります
-- INSERT INTO public.profiles (id, tenant_id, role) 
-- SELECT 
--   '6b5216d6-6f52-42dc-af20-29ec4289d1b6'::uuid,
--   (SELECT id FROM public.tenants LIMIT 1),
--   'admin'
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.profiles 
--   WHERE id = '6b5216d6-6f52-42dc-af20-29ec4289d1b6'::uuid
-- );

-- ============================================
-- 完了メッセージ
-- ============================================
-- すべてのテーブルとRLS設定が完了しました。
-- これで、データベース層でもテナント分離が保証されます。

