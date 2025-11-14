"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Slot } from "@/src/types/database";
import { useToast } from "@/src/contexts/ToastContext";

type Props = {
  caseId: string;
  slots: Slot[];
};

export function CandidateAvailabilityForm({ caseId, slots }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [candidateName, setCandidateName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleSlot = (slotId: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId],
    );
  };

  const selectedLabels = slots
    .filter((slot) => selectedSlots.includes(slot.id))
    .map((slot) => formatSlotLabel(slot));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedSlots.length === 0) {
      showToast("参加可能な枠を少なくとも1つ選択してください", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/candidate-availabilities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          case_id: caseId,
          slot_ids: selectedSlots,
          candidate_name: candidateName,
          email,
        }),
      });

      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message || "送信に失敗しました。");
      }

      showToast("ご回答ありがとうございました！", "success");
      setCandidateName("");
      setEmail("");
      setSelectedSlots([]);
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
      <div className="grid gap-1">
        <label className="text-sm font-medium text-slate-700">お名前</label>
        <input
          type="text"
          value={candidateName}
          onChange={(event) => setCandidateName(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          placeholder="例：山田 太郎"
        />
      </div>
      <div className="grid gap-1">
        <label className="text-sm font-medium text-slate-700">
          返信用メールアドレス
        </label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-700">
          ご参加可能な枠を選択してください
        </p>
        <div className="space-y-2">
          {slots.map((slot) => {
            const label = formatSlotLabel(slot);
            const checked = selectedSlots.includes(slot.id);
            return (
              <label
                key={slot.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm ${
                  checked
                    ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                    : "border-slate-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSlot(slot.id)}
                  className="h-4 w-4"
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </div>
      {selectedLabels.length > 0 && (
        <div className="rounded-xl border border-slate-100 px-4 py-3 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-800">選択中の枠</p>
            <button
              type="button"
              onClick={() => setSelectedSlots([])}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              クリア
            </button>
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {selectedLabels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="submit"
        disabled={loading || selectedSlots.length === 0}
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "送信中..." : "選択した枠で参加可能"}
      </button>
    </form>
  );
}

function formatSlotLabel(slot: Slot) {
  const start = new Date(slot.start_time);
  const end = new Date(slot.end_time);
  return `${start.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  })} ${start.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${end.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

