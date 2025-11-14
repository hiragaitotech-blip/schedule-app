"use client";

import { useState } from "react";
import { useToast } from "@/src/contexts/ToastContext";

type Props = {
  caseId: string;
  status: string | null;
  totalResponses: number;
  totalSlots: number;
  bestSlot?: {
    id: string;
    label: string;
    count: number;
  } | null;
};

export function CaseInsights({
  caseId,
  status,
  totalResponses,
  totalSlots,
  bestSlot,
}: Props) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleConfirmSlot = async () => {
    if (!bestSlot) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/cases/${caseId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Confirmed" }),
      });

      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message || "更新に失敗しました。");
      }

      showToast("案件ステータスを Confirmed に更新しました", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "エラーが発生しました",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Responses Overview
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">
            合計 {totalResponses} 件の回答
          </h2>
          <p className="text-sm text-slate-500">
            候補枠 {totalSlots} 件 / 現在ステータス:{" "}
            <span className="font-semibold text-slate-900">
              {status ?? "未設定"}
            </span>
          </p>
        </div>
        {bestSlot && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
            <p className="text-xs font-semibold uppercase tracking-wide">
              推奨枠（最多回答）
            </p>
            <p className="mt-1 font-semibold">{bestSlot.label}</p>
            <p className="text-xs text-indigo-800">
              {bestSlot.count} 件の参加希望
            </p>
          </div>
        )}
      </div>

      {bestSlot && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleConfirmSlot}
            disabled={loading}
            className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "更新中..." : "この枠でステータスを更新"}
          </button>
          <p className="text-xs text-slate-500">
            ステータスを Confirmed に変更します。
          </p>
        </div>
      )}

    </section>
  );
}

