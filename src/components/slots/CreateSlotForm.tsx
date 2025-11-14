"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/src/contexts/ToastContext";

type Props = {
  caseId: string;
};

export function CreateSlotForm({ caseId }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!startTime || !endTime) {
      showToast("開始日時と終了日時を入力してください", "error");
      return;
    }

    if (new Date(endTime) <= new Date(startTime)) {
      showToast("終了日時は開始日時より後にしてください", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/cases/${caseId}/slots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          note: note || null,
        }),
      });

      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message || "候補枠の作成に失敗しました。");
      }

      showToast("候補枠を追加しました", "success");
      setStartTime("");
      setEndTime("");
      setNote("");
      router.refresh();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "エラーが発生しました",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
      <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
        <div className="grid gap-1">
          <label className="text-sm font-medium text-slate-700">開始日時</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium text-slate-700">終了日時</label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>
      <div className="grid gap-1">
        <label className="text-sm font-medium text-slate-700">メモ（任意）</label>
        <input
          type="text"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          placeholder="オンライン / Zoom など"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "追加中..." : "候補枠を追加"}
      </button>
    </form>
  );
}

