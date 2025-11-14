# スーパー管理者機能の実装計画

## 🎯 目的

SaaS運営者（あなた）が、すべての企業（テナント）を一元管理できる機能を追加します。

## 📋 実装すべき機能

### 1. スーパー管理者の判定方法

**オプションA: 環境変数で指定（推奨）**
- `.env.local`に`SUPER_ADMIN_EMAIL`を設定
- そのメールアドレスのユーザーがスーパー管理者

**オプションB: データベースで管理**
- `profiles`テーブルに`is_super_admin`カラムを追加
- 特定のユーザーをスーパー管理者に設定

**推奨**: オプションA（シンプルで安全）

### 2. テナント管理画面（`/admin/tenants`）

#### 機能一覧
- ✅ 全テナント一覧表示
- ✅ 新規テナント作成フォーム
- ✅ テナント詳細（ユーザー数、案件数など）
- ✅ テナントの有効化/無効化（オプション）
- ✅ テナント削除（オプション、慎重に）

#### UI構成
```
/admin/tenants
├── ヘッダー
│   ├── 「テナント管理」タイトル
│   └── 統計情報（総テナント数、総ユーザー数など）
├── 新規テナント作成フォーム
│   ├── テナント名入力
│   ├── 管理者メールアドレス入力
│   └── パスワード（オプション）
└── テナント一覧テーブル
    ├── テナント名
    ├── 作成日
    ├── ユーザー数
    ├── 案件数
    └── 操作ボタン（詳細、削除など）
```

### 3. APIエンドポイント

#### 既存
- ✅ `POST /api/tenants/create` - テナント作成

#### 追加が必要
- `GET /api/admin/tenants` - 全テナント一覧取得
- `GET /api/admin/tenants/[id]` - テナント詳細取得
- `DELETE /api/admin/tenants/[id]` - テナント削除（オプション）

### 4. セキュリティ

- スーパー管理者のみアクセス可能
- middlewareで`/admin/*`を保護
- APIルートでスーパー管理者チェック

---

## 🔧 実装手順

### Step 1: スーパー管理者判定ヘルパー
- `src/lib/admin.ts`を作成
- `isSuperAdmin()`関数を実装

### Step 2: テナント管理API
- `app/api/admin/tenants/route.ts` - 一覧取得
- 既存の`/api/tenants/create`を`/api/admin/tenants/create`に移動（オプション）

### Step 3: テナント管理ページ
- `app/admin/tenants/page.tsx` - サーバーコンポーネント
- `src/components/admin/TenantManagementClient.tsx` - クライアントコンポーネント

### Step 4: ナビゲーション
- Navbarにスーパー管理者のみ表示される「管理画面」リンクを追加

### Step 5: Middleware更新
- `/admin/*`を保護パスに追加

---

## 📊 データ取得クエリ例

### テナント一覧（統計情報含む）
```sql
SELECT 
  t.id,
  t.name,
  t.created_at,
  COUNT(DISTINCT p.id) as user_count,
  COUNT(DISTINCT c.id) as case_count
FROM tenants t
LEFT JOIN profiles p ON p.tenant_id = t.id
LEFT JOIN cases c ON c.tenant_id = t.id
GROUP BY t.id, t.name, t.created_at
ORDER BY t.created_at DESC;
```

---

## ⚠️ 注意事項

1. **テナント削除は慎重に**
   - 削除前に確認ダイアログを表示
   - 関連データ（案件、ユーザーなど）の扱いを明確に

2. **スーパー管理者の権限**
   - 全テナントのデータにアクセス可能
   - セキュリティを最優先に

3. **パフォーマンス**
   - テナント数が増えた場合のページネーション
   - 統計情報のキャッシュ（オプション）

---

## 🎨 UIデザイン案

- ダッシュボード風のレイアウト
- カード形式でテナント情報を表示
- 検索・フィルタ機能（オプション）
- 統計グラフ（オプション）

---

## ✅ 実装の優先度

### 必須（MVP）
1. スーパー管理者判定
2. テナント一覧表示
3. 新規テナント作成

### 推奨
4. テナント詳細表示
5. 統計情報表示

### オプション
6. テナント削除
7. 検索・フィルタ
8. 統計グラフ


