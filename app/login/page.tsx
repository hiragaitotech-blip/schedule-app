"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/src/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("メールアドレスとパスワードを入力してください。");
      return;
    }

    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: trimmedPassword,
    });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    // プロフィールの is_active チェック（オプショナル）
    if (data.session?.user?.id) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("is_active")
          .eq("id", data.session.user.id)
          .single();

        // プロフィールが存在し、is_active が false の場合のみログインを拒否
        if (!profileError && profile && profile.is_active === false) {
          setLoading(false);
          setError("アカウントが無効化されています。管理者にお問い合わせください。");
          await supabase.auth.signOut();
          return;
        }
        // プロフィールが存在しない、またはエラーの場合はログインを許可（後方互換性）
      } catch (error) {
        // エラーが発生してもログインを許可（is_active カラムが存在しない可能性があるため）
        console.warn("プロフィールチェック中にエラーが発生しましたが、ログインを続行します:", error);
      }
    }

    setLoading(false);

    if (data.session?.access_token) {
      document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=86400; SameSite=Lax`;
    }

    // ロールに応じた遷移先を決定
    let redirectPath = redirectedFrom;
    
    if (data.session?.user?.id) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, force_password_reset")
          .eq("id", data.session.user.id)
          .single();

        if (profile) {
          // パスワードリセットが必要な場合
          if (profile.force_password_reset) {
            redirectPath = "/reset-password";
          } else {
            // ロールに応じた遷移先
            // スーパー管理者チェック（API経由）
            try {
              const adminCheckResponse = await fetch("/api/admin/check-super-admin");
              if (adminCheckResponse.ok) {
                const { isSuperAdmin: isAdmin } = await adminCheckResponse.json();
                if (isAdmin) {
                  redirectPath = "/admin/tenants";
                } else if (profile.role === "admin") {
                  redirectPath = "/dashboard";
                } else if (profile.role === "member") {
                  redirectPath = "/dashboard";
                } else {
                  redirectPath = "/dashboard";
                }
              } else {
                // APIエラーの場合はロールベースで判定
                if (profile.role === "admin") {
                  redirectPath = "/dashboard";
                } else if (profile.role === "member") {
                  redirectPath = "/dashboard";
                } else {
                  redirectPath = "/dashboard";
                }
              }
            } catch (error) {
              // エラー時はロールベースで判定
              if (profile.role === "admin") {
                redirectPath = "/dashboard";
              } else if (profile.role === "member") {
                redirectPath = "/dashboard";
              } else {
                redirectPath = "/dashboard";
              }
            }
          }
        }
      } catch (error) {
        console.warn("プロフィール取得中にエラーが発生しましたが、ログインを続行します:", error);
        // エラーが発生してもデフォルトの遷移先を使用
      }
    }

    router.push(redirectPath);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-slate-200/50">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          ログイン
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          登録済みのメールアドレスとパスワードを入力してください。
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="••••••••"
              autoComplete="current-password"
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
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}

