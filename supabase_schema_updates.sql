-- ============================================
-- スキーマ更新SQL（要件定義対応）
-- ============================================
-- このSQLを実行して、不足しているカラムを追加します

-- ============================================
-- 1. tenants テーブルの更新
-- ============================================

-- mailbox_address カラムを追加
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS mailbox_address text;

-- is_active カラムを追加（デフォルトは true）
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;

-- 既存レコードを有効化
UPDATE public.tenants 
SET is_active = true 
WHERE is_active IS NULL;

-- ============================================
-- 2. profiles テーブルの更新
-- ============================================

-- force_password_reset カラムを追加
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS force_password_reset boolean DEFAULT false NOT NULL;

-- email カラムを追加（auth.usersから取得するため、通常はNULL）
-- 注意: このカラムは冗長ですが、要件に従って追加します
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text;

-- ============================================
-- 3. cases テーブルの更新
-- ============================================

-- public_id カラムを追加（UUID、候補者URL用）
ALTER TABLE public.cases 
ADD COLUMN IF NOT EXISTS public_id uuid DEFAULT gen_random_uuid();

-- public_id に一意制約を追加
CREATE UNIQUE INDEX IF NOT EXISTS cases_public_id_unique ON public.cases(public_id);

-- 既存レコードに public_id を生成
UPDATE public.cases 
SET public_id = gen_random_uuid() 
WHERE public_id IS NULL;

-- raw_email_body カラムを追加
ALTER TABLE public.cases 
ADD COLUMN IF NOT EXISTS raw_email_body text;

-- created_by カラムを追加（profiles.id を参照）
ALTER TABLE public.cases 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ============================================
-- 4. RLS ポリシーの更新
-- ============================================

-- cases テーブルの RLS ポリシーに created_by チェックを追加（オプション）
-- 既存のポリシーで十分な場合はスキップ

-- ============================================
-- 完了メッセージ
-- ============================================
-- スキーマ更新が完了しました。

