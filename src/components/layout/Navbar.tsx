"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabaseClient";
import type { Profile } from "@/src/types/database";
import { LogoutButton } from "@/src/components/auth/LogoutButton";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profileData as Profile | null);

        // スーパー管理者かどうかを確認
        try {
          const response = await fetch("/api/admin/check-super-admin");
          if (response.ok) {
            const { isSuperAdmin: isAdmin } = await response.json();
            setIsSuperAdmin(isAdmin);
          }
        } catch (error) {
          console.error("Failed to check super admin status:", error);
        }
      }

      setLoading(false);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setProfile(profileData as Profile | null);

        // スーパー管理者かどうかを確認
        try {
          const response = await fetch("/api/admin/check-super-admin");
          if (response.ok) {
            const { isSuperAdmin: isAdmin } = await response.json();
            setIsSuperAdmin(isAdmin);
          }
        } catch (error) {
          console.error("Failed to check super admin status:", error);
        }
      } else {
        setProfile(null);
        setIsSuperAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = profile?.role === "admin";

  return (
    <nav className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        {user ? (
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent cursor-default">
            AI Interview Scheduler
          </span>
        ) : (
          <Link
            href="/"
            className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
          >
            AI Interview Scheduler
          </Link>
        )}
        {loading ? (
          <div className="text-sm text-slate-500">読み込み中...</div>
        ) : user ? (
          <div className="flex items-center gap-3 text-sm text-slate-600">
            {isSuperAdmin && (
              <Link
                href="/admin/tenants"
                className="rounded-lg border border-purple-200 bg-purple-50/50 px-4 py-2 font-semibold text-purple-700 transition hover:bg-purple-100 hover:border-purple-300"
              >
                管理画面
              </Link>
            )}
            {isAdmin && (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-lg border border-indigo-200 bg-indigo-50/50 px-4 py-2 font-semibold text-indigo-700 transition hover:bg-indigo-100 hover:border-indigo-300"
                >
                  ダッシュボード
                </Link>
                <Link
                  href="/settings/users"
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
                >
                  ユーザー管理
                </Link>
              </>
            )}
            <span className="text-slate-500">
              ログイン中:{" "}
              <span className="font-medium text-slate-900">{user.email}</span>
            </span>
            <LogoutButton />
          </div>
        ) : (
          <div></div>
        )}
      </div>
    </nav>
  );
}

