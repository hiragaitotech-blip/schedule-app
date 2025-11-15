"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import type { Case } from "@/src/types/database";
import { useToast } from "@/src/contexts/ToastContext";
import { TableSkeleton } from "@/src/components/ui/LoadingSkeleton";

type CaseWithCreator = Case & {
  created_by_email?: string | null;
};

export default function DashboardPage() {
  const { showToast } = useToast();
  const [cases, setCases] = useState<CaseWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [copiedCaseId, setCopiedCaseId] = useState<string | null>(null);

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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      setListError("テナント情報が見つかりません");
      setLoading(false);
      return;
    }

    // ロールに応じてフィルタリング
    let query = supabase
      .from("cases")
      .select("id, public_id, tenant_id, title, candidate_name, stage, status, created_at, created_by")
      .eq("tenant_id", profile.tenant_id);

    // member の場合は created_by = 自分 のみ表示
    if (profile.role === "member") {
      query = query.eq("created_by", user.id);
    }
    // admin の場合は全案件表示（tenant_id のみフィルタ）

    const { data, error: fetchError } = await query.order("created_at", { ascending: false });

    if (fetchError) {
      setListError(fetchError.message);
    } else {
      // created_by のメールアドレスを取得（オプション）
      const casesWithCreator: CaseWithCreator[] = await Promise.all(
        (data ?? []).map(async (caseItem) => {
          if (!caseItem.created_by) {
            return { ...caseItem, created_by_email: null };
          }
          
          // created_by のメールアドレスを取得
          try {
            const { data: creatorProfile } = await supabase
              .from("profiles")
              .select("id")
              .eq("id", caseItem.created_by)
              .single();
            
            // auth.users からメールアドレスを取得（Admin API が必要）
            // 簡易版: created_by のIDを表示
            return { ...caseItem, created_by_email: caseItem.created_by.substring(0, 8) + "..." };
          } catch {
            return { ...caseItem, created_by_email: null };
          }
        }),
      );
      
      setCases(casesWithCreator);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCases();
    // 定期的に案件一覧を更新（30秒ごと）
    const interval = setInterval(fetchCases, 30000);
    return () => clearInterval(interval);
  }, [fetchCases]);

  const handleCopyLink = async (caseItem: CaseWithCreator) => {
    setCopiedCaseId(null);
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      // public_idを使用（なければcase.idをフォールバック）
      const publicId = (caseItem as any).public_id || caseItem.id;
      const url = `${origin}/c/${publicId}`;
      await navigator.clipboard.writeText(url);
      setCopiedCaseId(caseItem.id);
      showToast("候補者URLをコピーしました", "success");
      setTimeout(() => setCopiedCaseId(null), 2000);
    } catch (error) {
      console.error(error);
      showToast("リンクのコピーに失敗しました", "error");
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-12">
      <header className="mb-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent sm:text-4xl">
          ダッシュボード
        </h1>
        <div className="mt-3 flex items-center gap-4">
          <p className="text-sm font-medium text-slate-600 sm:text-base">
            <span className="font-bold text-indigo-600">{cases.length}</span> 件の案件
          </p>
          <span className="text-slate-300">•</span>
          <p className="text-xs text-slate-500">
            メールが自動的に受信され、AIが案件を作成します
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm p-6 shadow-lg shadow-slate-200/50 sm:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            案件一覧
          </h2>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
            {cases.length} 件
          </span>
        </div>

        {loading && <TableSkeleton rows={5} />}

        {listError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {listError}
          </div>
        )}

        {!loading && !listError && cases.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-500">
              案件はまだ登録されていません。
            </p>
            <p className="mt-2 text-xs text-slate-400">
              メールが受信されると、自動的に案件が作成されます。
            </p>
          </div>
        )}

        {!loading && !listError && cases.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-3 pr-4 font-medium">タイトル</th>
                  <th className="py-3 pr-4 font-medium">候補者</th>
                  <th className="py-3 pr-4 font-medium">ステージ</th>
                  <th className="py-3 pr-4 font-medium">ステータス</th>
                  <th className="py-3 pr-4 font-medium">作成日</th>
                  <th className="py-3 pr-4 font-medium">リンク</th>
                  <th className="py-3 font-medium">詳細</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cases.map((jobCase) => (
                  <tr
                    key={jobCase.id}
                    className="align-top transition hover:bg-slate-50"
                  >
                    <td className="py-4 pr-4 font-medium text-slate-900">
                      {jobCase.title || "-"}
                    </td>
                    <td className="py-4 pr-4">{jobCase.candidate_name || "-"}</td>
                    <td className="py-4 pr-4">{jobCase.stage || "-"}</td>
                    <td className="py-4 pr-4">{jobCase.status || "-"}</td>
                    <td className="py-4 text-slate-500">
                      {new Date(jobCase.created_at).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-4 pr-4 text-xs text-slate-500">
                      {jobCase.created_by_email || "-"}
                    </td>
                    <td className="py-4 pr-4">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(jobCase)}
                        className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 hover:border-indigo-300"
                      >
                        {copiedCaseId === jobCase.id
                          ? "✓ コピー済み"
                          : "候補者URL"}
                      </button>
                    </td>
                    <td className="py-4">
                      <Link
                        href={`/cases/${jobCase.id}`}
                        className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                      >
                        詳細を見る →
                      </Link>
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
