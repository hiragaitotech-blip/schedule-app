"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Slot } from "@/src/types/database";
import { supabase } from "@/src/lib/supabaseClient";
import { useToast } from "@/src/contexts/ToastContext";

type Props = {
  caseId: string;
  publicId: string;
  slots: Slot[];
};

export function CandidateCalendarForm({ caseId, publicId, slots }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // スロットを週ごとにグループ化
  const slotsByWeek = groupSlotsByWeek(slots);

  const handleSlotToggle = (slotId: string) => {
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) {
        next.delete(slotId);
      } else {
        next.add(slotId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedSlots.size === 0) {
      showToast("少なくとも1つの枠を選択してください", "error");
      return;
    }

    setSubmitting(true);

    try {
      // 選択された各スロットに対して回答を作成
      const insertPromises = Array.from(selectedSlots).map((slotId) =>
        supabase.from("candidate_availabilities").insert({
          case_id: caseId,
          slot_id: slotId,
          status: "available",
        }),
      );

      const results = await Promise.all(insertPromises);
      const errors = results.filter((result) => result.error);

      if (errors.length > 0) {
        throw new Error("回答の送信に失敗しました");
      }

      showToast("回答を送信しました", "success");
      
      // 完了画面へ遷移
      router.push(`/c/${publicId}/complete`);
    } catch (error) {
      console.error("回答送信エラー:", error);
      showToast("回答の送信に失敗しました", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(slotsByWeek).map(([weekKey, weekSlots]) => (
        <div key={weekKey} className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">
            {formatWeekLabel(weekKey)}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {weekSlots.map((slot) => {
              const isSelected = selectedSlots.has(slot.id);
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => handleSlotToggle(slot.id)}
                  className={`rounded-lg border-2 p-4 text-left transition ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50 shadow-md"
                      : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">
                        {formatSlotDate(slot.start_time)}
                      </div>
                      <div className="text-sm text-slate-600">
                        {formatSlotTime(slot.start_time)} -{" "}
                        {formatSlotTime(slot.end_time)}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="ml-3 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            {selectedSlots.size} 個の枠を選択中
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || selectedSlots.size === 0}
            className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "送信中..." : "送信"}
          </button>
        </div>
      </div>
    </div>
  );
}

// スロットを週ごとにグループ化
function groupSlotsByWeek(slots: Slot[]): Record<string, Slot[]> {
  const grouped: Record<string, Slot[]> = {};

  slots.forEach((slot) => {
    const startDate = new Date(slot.start_time);
    const weekKey = getWeekKey(startDate);
    
    if (!grouped[weekKey]) {
      grouped[weekKey] = [];
    }
    grouped[weekKey].push(slot);
  });

  // 各週のスロットを開始時刻でソート
  Object.keys(grouped).forEach((key) => {
    grouped[key].sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
  });

  return grouped;
}

// 週のキーを生成（YYYY-WW形式）
function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${week.toString().padStart(2, "0")}`;
}

// 週番号を取得
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// 週のラベルをフォーマット
function formatWeekLabel(weekKey: string): string {
  const [year, week] = weekKey.split("-W");
  const weekNum = parseInt(week, 10);
  
  // その週の最初の日を計算
  const jan1 = new Date(parseInt(year, 10), 0, 1);
  const daysOffset = (weekNum - 1) * 7;
  const weekStart = new Date(jan1);
  weekStart.setDate(jan1.getDate() + daysOffset - jan1.getDay() + 1);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return `${weekStart.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  })} - ${weekEnd.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  })}`;
}

// スロットの日付をフォーマット
function formatSlotDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

// スロットの時刻をフォーマット
function formatSlotTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

