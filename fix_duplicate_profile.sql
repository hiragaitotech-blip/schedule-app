-- ============================================
-- 重複プロフィールエラーの修正SQL
-- ============================================
-- このエラーは、既存のプロフィールレコードが存在するために発生します
-- このSQLを実行すると、既存のプロフィールを確認・更新できます

-- 1. 既存のプロフィールを確認
SELECT id, tenant_id, role, is_active, created_at 
FROM public.profiles 
WHERE id = '6b5216d6-6f52-42dc-af20-29ec4289d1b6'::uuid;

-- 2. 既存のプロフィールがない場合のみ作成（安全な方法）
INSERT INTO public.profiles (id, tenant_id, role, is_active) 
SELECT 
  '6b5216d6-6f52-42dc-af20-29ec4289d1b6'::uuid,
  (SELECT id FROM public.tenants LIMIT 1),
  'admin',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = '6b5216d6-6f52-42dc-af20-29ec4289d1b6'::uuid
);

-- 3. 既存のプロフィールを更新（tenant_idとroleを設定）
UPDATE public.profiles 
SET 
  tenant_id = COALESCE(tenant_id, (SELECT id FROM public.tenants LIMIT 1)),
  role = COALESCE(role, 'admin'),
  is_active = COALESCE(is_active, true)
WHERE id = '6b5216d6-6f52-42dc-af20-29ec4289d1b6'::uuid;

