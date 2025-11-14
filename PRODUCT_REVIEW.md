# AI Interview Scheduler - プロダクト品質レビュー

**レビュー日**: 2025年1月  
**レビュアー**: 外部CTO（プロフェッショナルエンジニア）  
**対象**: MVP リリース前の総合評価

---

## 1. プロダクトの総合評価

### 評価スコア: **6.5/10**

**強み**:
- ✅ コア機能（認証、案件管理、候補者回答）は実装済み
- ✅ UI/UXはモダンで洗練されている
- ✅ 基本的なフローは動作する

**致命的な問題**:
- 🔴 **テナント分離が完全に欠如**（重大セキュリティリスク）
- 🔴 **RLS（Row Level Security）未設定**（本番環境でデータ漏洩の危険性）
- 🔴 **認証チェックが不十分**（APIルートで認証検証が甘い）

**結論**: **現状では本番リリース不可**。セキュリティ問題を修正する必要があります。

---

## 2. 問題リスト（優先度別）

### 🔴 重大（リリース前に必須修正）

#### SEC-001: テナント分離の欠如
**場所**: `app/dashboard/page.tsx:21-24`
```typescript
// 現在: 全案件が表示される（tenant_idフィルタなし）
const { data, error: fetchError } = await supabase
  .from("cases")
  .select("id, tenant_id, title, candidate_name, stage, status, created_at")
  .order("created_at", { ascending: false });
```
**影響**: 他テナントの案件が見えてしまう。データ漏洩の重大リスク。

#### SEC-002: 案件詳細ページでテナントチェックなし
**場所**: `app/cases/[id]/page.tsx:22-26`
```typescript
// 現在: どのテナントの案件でもアクセス可能
const { data: caseData } = await supabase
  .from("cases")
  .select("*")
  .eq("id", caseId)
  .single();
```
**影響**: 他テナントの案件詳細を閲覧・編集可能。

#### SEC-003: APIルートでテナント検証なし
**場所**: 
- `app/api/cases/[caseId]/slots/route.ts` - 認証チェックなし
- `app/api/slots/[slotId]/route.ts` - 認証・テナントチェックなし
- `app/api/cases/[caseId]/status/route.ts` - 認証・テナントチェックなし
- `app/api/create-case-from-email/route.ts` - 認証チェックなし

**影響**: 未認証ユーザーや他テナントユーザーが案件を操作可能。

#### SEC-004: RLS（Row Level Security）未設定
**場所**: Supabase データベース
**影響**: アプリケーション層のバグで全データが漏洩する可能性。DB層での防御がない。

#### SEC-005: 案件作成時にtenant_idがnull
**場所**: 
- `app/api/create-case-from-email/route.ts:39` - `tenant_id: null`
- `app/api/webhooks/zapier/route.ts:50` - `tenant_id: body.tenant_id ?? null`

**影響**: 作成された案件がどのテナントにも属さない。データ整合性の問題。

---

### 🟡 中（リリース前に推奨修正）

#### BUG-001: サーバーサイドAPIで認証チェックが不十分
**場所**: `app/api/cases/[caseId]/slots/route.ts`, `app/api/slots/[slotId]/route.ts`
**問題**: `createSupabaseServerClient()` を使用しているが、認証ユーザーの検証がない。
**影響**: 未認証ユーザーがスロットを作成・編集・削除可能。

#### BUG-002: 候補者ページが完全公開
**場所**: `app/candidate/[id]/page.tsx`
**問題**: 認証不要で誰でもアクセス可能。URLを知っていれば他テナントの案件にもアクセス可能。
**影響**: セキュリティリスク（ただし、これは意図的な設計かもしれない）。

#### BUG-003: middlewareの認証チェックがcookieベースのみ
**場所**: `middleware.ts:34`
**問題**: `sb-access-token` cookieのみで判定。cookieが改ざんされた場合の検証がない。
**影響**: セキュリティが弱い。

#### UX-001: ダッシュボードで全案件が表示される
**場所**: `app/dashboard/page.tsx`
**問題**: ログインユーザーのテナントの案件のみ表示すべき。
**影響**: ユーザーが混乱する。他テナントのデータが見える。

---

### 🟢 軽微（後回し可）

#### CODE-001: 重複コード
- `formatSlotLabel` 関数が複数箇所に存在する可能性
- 日付フォーマット処理が重複

#### CODE-002: エラーハンドリングの不統一
- 一部のAPIでtry-catchがない
- エラーメッセージが不統一

#### UX-002: ローディング状態の改善
- 一部のページでローディング表示がない

---

## 3. すぐに修正すべき点（開発者のTODO）

### 優先度A（リリース前に必須）

#### TODO-1: ダッシュボードでテナントフィルタリング
**ファイル**: `app/dashboard/page.tsx`
**修正内容**:
```typescript
// ログインユーザーのプロフィールを取得
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from("profiles")
  .select("tenant_id")
  .eq("id", user.id)
  .single();

// tenant_idでフィルタリング
const { data, error: fetchError } = await supabase
  .from("cases")
  .select("id, tenant_id, title, candidate_name, stage, status, created_at")
  .eq("tenant_id", profile?.tenant_id) // 追加
  .order("created_at", { ascending: false});
```

#### TODO-2: 案件詳細ページでテナントチェック
**ファイル**: `app/cases/[id]/page.tsx`
**修正内容**: 案件取得時にログインユーザーのtenant_idと一致するか確認

#### TODO-3: APIルートに認証・テナントチェックを追加
**対象ファイル**:
- `app/api/cases/[caseId]/slots/route.ts`
- `app/api/slots/[slotId]/route.ts`
- `app/api/cases/[caseId]/status/route.ts`
- `app/api/create-case-from-email/route.ts`

**修正内容**: 各APIルートで以下を実装
1. 認証チェック（cookieからaccessToken取得 → getUser）
2. プロフィール取得（tenant_id確認）
3. 操作対象のリソースが同じtenant_idか確認

#### TODO-4: 案件作成時にtenant_idを自動設定
**ファイル**: 
- `app/api/create-case-from-email/route.ts`
- `app/api/webhooks/zapier/route.ts`

**修正内容**: ログインユーザー（またはWebhook経由の場合はリクエストから）のtenant_idを設定

#### TODO-5: Supabase RLS設定
**場所**: Supabase SQL Editor
**実行SQL**: 後述の「RLS設定SQL」を参照

---

### 優先度B（リリース前に推奨）

#### TODO-6: middlewareの認証検証を強化
**ファイル**: `middleware.ts`
**修正内容**: cookieのaccessTokenをSupabaseで検証

#### TODO-7: 候補者ページのアクセス制御
**ファイル**: `app/candidate/[id]/page.tsx`
**修正内容**: 
- オプション1: 完全公開のまま（URLを知っている人のみアクセス可能）
- オプション2: トークンベースの認証を追加

---

## 4. 開発ロードマップ

### Phase 1: セキュリティ修正（1-2日）【最優先】

#### Day 1: テナント分離の実装
- [ ] TODO-1: ダッシュボードでテナントフィルタリング
- [ ] TODO-2: 案件詳細ページでテナントチェック
- [ ] TODO-4: 案件作成時にtenant_idを自動設定

#### Day 2: API認証・認可の強化
- [ ] TODO-3: 全APIルートに認証・テナントチェック追加
- [ ] TODO-5: Supabase RLS設定

### Phase 2: バグ修正・改善（1日）

- [ ] TODO-6: middlewareの認証検証を強化
- [ ] TODO-7: 候補者ページのアクセス制御検討
- [ ] エラーハンドリングの統一

### Phase 3: テスト・検証（1日）

- [ ] 全機能の動作確認
- [ ] セキュリティテスト（他テナントのデータにアクセスできないか確認）
- [ ] パフォーマンステスト

### Phase 4: 本番準備（0.5日）

- [ ] 環境変数の設定確認
- [ ] ビルド確認
- [ ] デプロイ

---

## 5. 推奨される改善案（実装コード）

### 改善案1: テナント分離ヘルパー関数の作成

**ファイル**: `src/lib/tenant.ts`（新規作成）
```typescript
import { createSupabaseServerClient } from "./supabaseClient";
import { cookies } from "next/headers";

export async function getCurrentUserTenantId(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  
  if (!accessToken) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  
  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  return profile?.tenant_id ?? null;
}

export async function verifyCaseAccess(
  caseId: string,
  tenantId: string | null
): Promise<boolean> {
  if (!tenantId) return false;

  const supabase = createSupabaseServerClient();
  const { data: caseData } = await supabase
    .from("cases")
    .select("tenant_id")
    .eq("id", caseId)
    .single();

  return caseData?.tenant_id === tenantId;
}
```

### 改善案2: ダッシュボードの修正

**ファイル**: `app/dashboard/page.tsx`
```typescript
// fetchCases関数を修正
const fetchCases = useCallback(async () => {
  setLoading(true);
  setListError(null);

  // ログインユーザーのプロフィールを取得
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    setListError("ログインが必要です");
    setLoading(false);
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile?.tenant_id) {
    setListError("テナント情報が見つかりません");
    setLoading(false);
    return;
  }

  // tenant_idでフィルタリング
  const { data, error: fetchError } = await supabase
    .from("cases")
    .select("id, tenant_id, title, candidate_name, stage, status, created_at")
    .eq("tenant_id", profile.tenant_id) // 追加
    .order("created_at", { ascending: false });

  if (fetchError) {
    setListError(fetchError.message);
  } else {
    setCases(data ?? []);
  }

  setLoading(false);
}, []);
```

### 改善案3: APIルートの認証チェック追加

**ファイル**: `app/api/cases/[caseId]/slots/route.ts`
```typescript
export async function POST(request: Request, { params }: Params) {
  // 認証チェック
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  
  if (!accessToken) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  // プロフィール取得
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: "テナント情報が見つかりません" }, { status: 403 });
  }

  // 案件が同じテナントか確認
  const { data: caseData } = await supabase
    .from("cases")
    .select("tenant_id")
    .eq("id", params.caseId)
    .single();

  if (!caseData || caseData.tenant_id !== profile.tenant_id) {
    return NextResponse.json({ error: "アクセス権限がありません" }, { status: 403 });
  }

  // 以下、既存の処理...
}
```

---

## 6. RLS設定SQL（Supabaseで実行）

```sql
-- ============================================
-- Row Level Security (RLS) 設定
-- ============================================

-- 1. profiles テーブル
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

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

-- 3. slots テーブル
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

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

-- 認証済みユーザーは自分のテナントの案件のスロットを更新・削除可能
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

-- 5. tenants テーブル（必要に応じて）
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

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
```

---

## 7. 将来の拡張性に関する懸念

### 懸念点1: スケーラビリティ
- 現在の設計は小規模運用には適している
- 大規模なテナント数になると、RLSポリシーが複雑になる可能性
- インデックスの最適化が必要になる可能性

### 懸念点2: 機能追加のしやすさ
- ✅ モジュール化されている
- ✅ 型定義が整備されている
- ⚠️ テナント分離のロジックが各所に散在している（ヘルパー関数化が必要）

### 懸念点3: 多テナント運用
- ⚠️ 現状、tenant_idの扱いが一貫していない
- ⚠️ テナント間のデータ分離が不完全

---

## 8. まとめ

### リリース可否
**❌ 現状ではリリース不可**

### 必須対応事項
1. **テナント分離の実装**（最優先）
2. **RLS設定**（最優先）
3. **API認証・認可の強化**（最優先）

### 推奨対応事項
1. middlewareの認証検証強化
2. エラーハンドリングの統一
3. コードのリファクタリング（テナント分離ロジックの共通化）

### 見積もり
- **セキュリティ修正**: 1-2日
- **テスト・検証**: 1日
- **合計**: 2-3日

修正後、再度レビューを実施することを推奨します。

