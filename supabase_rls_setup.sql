-- ============================================
-- Row Level Security (RLS) 設定
-- ============================================
-- このSQLをSupabaseのSQL Editorで実行してください
-- 実行後、各テーブルでRLSが有効化され、テナント分離が保証されます

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
-- 完了メッセージ
-- ============================================
-- RLS設定が完了しました。
-- これで、データベース層でもテナント分離が保証されます。

