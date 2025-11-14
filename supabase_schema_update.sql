-- ============================================
-- スキーマ更新SQL
-- ============================================
-- このSQLを実行してから、supabase_rls_setup.sqlを実行してください

-- 1. profiles テーブルに is_active カラムを追加（まだ存在しない場合）
-- 既に存在する場合はエラーになりますが、無視して問題ありません
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;

-- 既存のレコードを有効化（is_active が null の場合）
UPDATE public.profiles 
SET is_active = true 
WHERE is_active IS NULL;

-- ============================================
-- 実行順序
-- ============================================
-- 1. まず、このファイル（supabase_schema_update.sql）を実行
-- 2. 次に、supabase_rls_setup.sql を実行

