"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/src/types/database";
import { useToast } from "@/src/contexts/ToastContext";

type UserWithEmail = Profile & {
  email: string;
};

type Props = {
  currentUserId: string;
  users: UserWithEmail[];
  tenantId: string | null;
};

export function UserManagementClient({
  currentUserId,
  users,
  tenantId,
}: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "member">("member");
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null,
  );

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    if (userId === currentUserId) {
      showToast("自分自身を無効化することはできません", "error");
      return;
    }

    setLoading(userId);

    try {
      const response = await fetch(`/api/users/${userId}/toggle-active`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: !currentStatus,
        }),
      });

      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message || "更新に失敗しました");
      }

      showToast(
        currentStatus ? "ユーザーを無効化しました" : "ユーザーを有効化しました",
        "success",
      );
      router.refresh();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "エラーが発生しました",
        "error",
      );
    } finally {
      setLoading(null);
    }
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newUserEmail.trim()) {
      showToast("メールアドレスを入力してください", "error");
      return;
    }

    setCreateLoading(true);

    try {
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newUserEmail.trim().toLowerCase(),
          role: newUserRole,
          tenant_id: tenantId,
        }),
      });

      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message || "ユーザー作成に失敗しました");
      }

      const { password } = await response.json();
      setGeneratedPassword(password);
      setNewUserEmail("");
      setNewUserRole("member");
      setShowCreateForm(false);
      showToast("ユーザーを作成しました", "success");
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
            ユーザー作成成功
          </h3>
          <p className="mt-2 text-sm text-indigo-700">
            一時パスワードをコピーして、ユーザーに共有してください。
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
          <h2 className="text-xl font-semibold text-slate-900">ユーザー一覧</h2>
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {showCreateForm ? "キャンセル" : "+ 新規ユーザー追加"}
          </button>
        </div>

        {showCreateForm && (
          <form
            onSubmit={handleCreateUser}
            className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <h3 className="text-sm font-semibold text-slate-900">
              新規ユーザー作成
            </h3>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-slate-700"
              >
                ロール
              </label>
              <select
                id="role"
                value={newUserRole}
                onChange={(e) =>
                  setNewUserRole(e.target.value as "admin" | "member")
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={createLoading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {createLoading ? "作成中..." : "ユーザーを作成"}
            </button>
          </form>
        )}

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-4 font-medium">メールアドレス</th>
                <th className="py-2 pr-4 font-medium">ロール</th>
                <th className="py-2 pr-4 font-medium">ステータス</th>
                <th className="py-2 pr-4 font-medium">作成日</th>
                <th className="py-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="align-top">
                  <td className="py-3 pr-4 font-medium text-slate-900">
                    {user.email}
                    {user.id === currentUserId && (
                      <span className="ml-2 text-xs text-slate-500">
                        (あなた)
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        user.role === "admin"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {user.role || "member"}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        user.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.is_active ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500">
                    {new Date(user.created_at).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(user.id, user.is_active)}
                      disabled={
                        loading === user.id || user.id === currentUserId
                      }
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                        user.is_active
                          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {loading === user.id
                        ? "処理中..."
                        : user.is_active
                          ? "無効化"
                          : "有効化"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

