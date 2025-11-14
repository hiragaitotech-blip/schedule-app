# デモアカウントセットアップガイド

## 🎯 概要

デモ環境用に3種類のアカウントを用意します：

1. **アプリ開発者用**（スーパー管理者）
   - 全テナントを管理
   - 新規企業のオンボーディング

2. **企業用**（テナント管理者）
   - 自社のユーザー管理
   - 案件管理

3. **企業のユーザー用**（一般ユーザー）
   - 案件の閲覧
   - 候補者ページの管理

---

## 📋 セットアップ手順

### Step 1: 環境変数の設定

`.env.local`に以下を追加：

```env
# スーパー管理者のメールアドレス（デモ開発者用）
SUPER_ADMIN_EMAIL=developer@demo.com
```

### Step 2: Supabase Authでユーザーを作成

Supabaseダッシュボード → Authentication → Users → Add user

以下の5つのユーザーを作成してください：

| メールアドレス | パスワード | 役割 |
|--------------|-----------|------|
| `developer@demo.com` | `DemoDeveloper123!` | スーパー管理者 |
| `admin-a@demo.com` | `DemoAdminA123!` | 企業A管理者 |
| `user-a@demo.com` | `DemoUserA123!` | 企業A一般ユーザー |
| `admin-b@demo.com` | `DemoAdminB123!` | 企業B管理者 |
| `user-b@demo.com` | `DemoUserB123!` | 企業B一般ユーザー |

### Step 3: SQLを実行

**推奨**: `demo_accounts_quick_setup.sql`をSupabaseのSQL Editorで実行してください。

（または、`demo_accounts_setup.sql`も使用できますが、より複雑です）

これにより：
- ✅ 2つのデモテナント（企業A、企業B）が作成されます
- ✅ 各ユーザーのプロフィールが作成されます
- ✅ デモ案件データが作成されます（オプション）

---

## 🔐 ログイン情報一覧

### 1. アプリ開発者（スーパー管理者）

- **メール**: `developer@demo.com`
- **パスワード**: `DemoDeveloper123!`
- **権限**: 
  - 全テナントの管理
  - 新規テナント作成
  - `/admin/tenants`にアクセス可能

### 2. デモ企業A - 管理者

- **メール**: `admin-a@demo.com`
- **パスワード**: `DemoAdminA123!`
- **権限**: 
  - 企業Aのユーザー管理
  - 企業Aの案件管理
  - `/dashboard`、`/settings/users`にアクセス可能

### 3. デモ企業A - 一般ユーザー

- **メール**: `user-a@demo.com`
- **パスワード**: `DemoUserA123!`
- **権限**: 
  - 企業Aの案件閲覧
  - 候補者ページの管理

### 4. デモ企業B - 管理者

- **メール**: `admin-b@demo.com`
- **パスワード**: `DemoAdminB123!`
- **権限**: 
  - 企業Bのユーザー管理
  - 企業Bの案件管理
  - `/dashboard`、`/settings/users`にアクセス可能

### 5. デモ企業B - 一般ユーザー

- **メール**: `user-b@demo.com`
- **パスワード**: `DemoUserB123!`
- **権限**: 
  - 企業Bの案件閲覧
  - 候補者ページの管理

---

## 🧪 デモシナリオ

### シナリオ1: スーパー管理者として新規企業をオンボーディング

1. `developer@demo.com`でログイン
2. Navbarの「管理画面」をクリック
3. 「+ 新規テナント作成」をクリック
4. テナント情報を入力
5. 生成されたパスワードをコピー
6. 企業の管理者に共有

### シナリオ2: 企業管理者としてユーザーを追加

1. `admin-a@demo.com`でログイン
2. 「ユーザー管理」をクリック
3. 「+ 新規ユーザー追加」をクリック
4. メールアドレスとロールを入力
5. 生成されたパスワードをコピー
6. ユーザーに共有

### シナリオ3: テナント分離の確認

1. `admin-a@demo.com`でログイン
2. ダッシュボードで企業Aの案件のみ表示されることを確認
3. `admin-b@demo.com`でログイン
4. ダッシュボードで企業Bの案件のみ表示されることを確認
5. 企業Aの案件にアクセスできないことを確認

---

## 📊 デモデータ

### デモ企業A
- **案件1**: エンジニア採用案件（山田 太郎、1st Interview、Scheduling）
- **案件2**: デザイナー採用案件（佐藤 花子、2nd Interview、Awaiting Feedback）

### デモ企業B
- **案件1**: マーケター採用案件（鈴木 一郎、1st Interview、Scheduling）
- **案件2**: 営業採用案件（田中 次郎、Final Interview、Confirmed）

---

## ⚠️ 注意事項

1. **本番環境では使用しない**
   - デモ用のパスワードは簡単なものになっています
   - 本番環境では必ず強力なパスワードを使用してください

2. **環境変数の管理**
   - `.env.local`はGitにコミットしないでください
   - デモ環境でも本番環境でも、環境変数は適切に管理してください

3. **データのリセット**
   - デモデータをリセットしたい場合は、SQLを再実行してください
   - `ON CONFLICT DO NOTHING`を使用しているため、既存データは保持されます

---

## 🔄 データリセット

デモデータをリセットしたい場合：

```sql
-- 注意: このSQLはすべてのデモデータを削除します
DELETE FROM public.candidate_availabilities;
DELETE FROM public.slots;
DELETE FROM public.cases;
DELETE FROM public.profiles WHERE email LIKE '%@demo.com';
DELETE FROM public.tenants WHERE name LIKE 'デモ%';
```

その後、`demo_accounts_setup.sql`を再実行してください。

---

## ✅ 完了

これで、デモ環境のセットアップは完了です！

3種類のアカウントで、すべての機能をテストできます。

