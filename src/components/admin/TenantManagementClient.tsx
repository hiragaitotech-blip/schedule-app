"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/src/contexts/ToastContext";

type Tenant = {
  id: string;
  name: string;
  created_at: string;
  user_count: number;
  case_count: number;
};

export function TenantManagementClient() {
  const router = useRouter();
  const { showToast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null,
  );

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/tenants");
      if (!response.ok) {
        throw new Error("テナント一覧の取得に失敗しました");
      }
      const { tenants: tenantsData } = await response.json();
      setTenants(tenantsData || []);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "エラーが発生しました",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!tenantName.trim()) {
      showToast("テナント名を入力してください", "error");
      return;
    }

    if (!adminEmail.trim()) {
      showToast("管理者のメールアドレスを入力してください", "error");
      return;
    }

    setCreateLoading(true);

    try {
      const response = await fetch("/api/tenants/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_name: tenantName.trim(),
          admin_email: adminEmail.trim().toLowerCase(),
          admin_password: adminPassword.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message || "テナント作成に失敗しました");
      }

      const { password } = await response.json();
      setGeneratedPassword(password);
      setTenantName("");
      setAdminEmail("");
      setAdminPassword("");
      setShowCreateForm(false);
      showToast("テナントと管理者アカウントを作成しました", "success");
      fetchTenants();
      router.refresh();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "エラーが発生しました",
        "error",
      );
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {generatedPassword && (
        <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-6">
          <h3 className="text-lg font-semibold text-indigo-900">
            テナント作成成功
          </h3>
          <p className="mt-2 text-sm text-indigo-700">
            管理者の一時パスワードをコピーして、ユーザーに共有してください。
          </p>
          <div className="mt-4 flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-white px-4 py-3 font-mono text-sm font-semibold text-indigo-900">
              {generatedPassword}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(generatedPassword);
                showToast("パスワードをコピーしました", "success");
              }}
              className="rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              コピー
            </button>
            <button
              type="button"
              onClick={() => setGeneratedPassword(null)}
              className="rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              閉じる
            </button>
          </div>
          <p className="mt-3 text-xs text-indigo-600">
            ※ このパスワードは一度だけ表示されます。再取得はできません。
          </p>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            テナント一覧
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              総数: <span className="font-semibold">{tenants.length}</span> 件
            </span>
            <button
              type="button"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {showCreateForm ? "キャンセル" : "+ 新規テナント作成"}
            </button>
          </div>
        </div>

        {showCreateForm && (
          <form
            onSubmit={handleCreateTenant}
            className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <h3 className="text-sm font-semibold text-slate-900">
              新規テナント作成
            </h3>
            <div>
              <label
                htmlFor="tenant_name"
                className="block text-sm font-medium text-slate-700"
              >
                テナント名（企業名）
              </label>
              <input
                id="tenant_name"
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="株式会社○○人材紹介"
              />
            </div>
            <div>
              <label
                htmlFor="admin_email"
                className="block text-sm font-medium text-slate-700"
              >
                管理者メールアドレス
              </label>
              <input
                id="admin_email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="admin_password"
                className="block text-sm font-medium text-slate-700"
              >
                管理者パスワード（オプション）
              </label>
              <input
                id="admin_password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="未入力の場合は自動生成されます"
              />
              <p className="mt-1 text-xs text-slate-500">
                8文字以上で指定してください。未入力の場合は自動生成されます。
              </p>
            </div>
            <button
              type="submit"
              disabled={createLoading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {createLoading ? "作成中..." : "テナントを作成"}
            </button>
          </form>
        )}

        {loading ? (
          <div className="mt-6 py-12 text-center text-sm text-slate-500">
            読み込み中...
          </div>
        ) : tenants.length === 0 ? (
          <div className="mt-6 py-12 text-center">
            <p className="text-sm text-slate-500">
              テナントがまだ登録されていません。
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-3 pr-4 font-medium">テナント名</th>
                  <th className="py-3 pr-4 font-medium">ユーザー数</th>
                  <th className="py-3 pr-4 font-medium">案件数</th>
                  <th className="py-3 pr-4 font-medium">作成日</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="align-top">
                    <td className="py-4 pr-4 font-medium text-slate-900">
                      {tenant.name}
                    </td>
                    <td className="py-4 pr-4">
                      <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700">
                        {tenant.user_count} 人
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        {tenant.case_count} 件
                      </span>
                    </td>
                    <td className="py-4 text-slate-500">
                      {new Date(tenant.created_at).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}


