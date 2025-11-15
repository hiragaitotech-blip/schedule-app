"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkPasswordResetRequired = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("force_password_reset")
        .eq("id", user.id)
        .single();

      if (!profile || !profile.force_password_reset) {
        // パスワードリセットが不要な場合はダッシュボードへ
        router.push("/dashboard");
        return;
      }

      setChecking(false);
    };

    checkPasswordResetRequired();
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedPassword || !trimmedConfirm) {
      setError("パスワードを入力してください。");
      return;
    }

    if (trimmedPassword.length < 8) {
      setError("パスワードは8文字以上で入力してください。");
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      setError("パスワードが一致しません。");
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setError("ログインが必要です。");
      setLoading(false);
      return;
    }

    // パスワードを更新
    const { error: updateError } = await supabase.auth.updateUser({
      password: trimmedPassword,
    });

    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    // force_password_reset を false に更新
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ force_password_reset: false })
      .eq("id", user.id);

    if (profileError) {
      console.error("プロフィール更新エラー:", profileError);
      // パスワード更新は成功しているので、エラーを表示しない
    }

    setLoading(false);

    // ロールに応じた遷移先を決定
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    let redirectPath = "/dashboard";
    
    // スーパー管理者チェック
    try {
      const adminCheckResponse = await fetch("/api/admin/check-super-admin");
      if (adminCheckResponse.ok) {
        const { isSuperAdmin: isAdmin } = await adminCheckResponse.json();
        if (isAdmin) {
          redirectPath = "/admin/tenants";
        } else if (profile?.role === "admin") {
          redirectPath = "/dashboard";
        } else if (profile?.role === "member") {
          redirectPath = "/dashboard";
        }
      }
    } catch (error) {
      console.warn("管理者チェック中にエラーが発生しました:", error);
    }

    router.push(redirectPath);
    router.refresh();
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-sm text-slate-500">確認中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-slate-200/50">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          パスワード変更
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          初回ログインのため、パスワードを変更してください。
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              新しいパスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="8文字以上"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              パスワード（確認）
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="8文字以上"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "変更中..." : "パスワードを変更"}
          </button>
        </form>
      </div>
    </div>
  );
}

