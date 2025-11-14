"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  CandidateAvailability,
  Slot,
} from "@/src/types/database";
import { useToast } from "@/src/contexts/ToastContext";

type SlotWithResponses = Slot & { responses: CandidateAvailability[] };

type Props = {
  slots: SlotWithResponses[];
  recommendedSlotId?: string | null;
};

export function SlotList({ slots, recommendedSlotId }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<{
    start?: string;
    end?: string;
    note?: string | null;
  }>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleEditClick = (slot: SlotWithResponses) => {
    setEditingId(slot.id);
    setFormState({
      start: slot.start_time.slice(0, 16),
      end: slot.end_time.slice(0, 16),
      note: slot.note ?? "",
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormState({});
  };

  const handleSave = async (slotId: string) => {
    if (!formState.start || !formState.end) {
      showToast("開始・終了日時を入力してください", "error");
      return;
    }

    setLoadingId(slotId);

    try {
      const response = await fetch(`/api/slots/${slotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_time: new Date(formState.start).toISOString(),
          end_time: new Date(formState.end).toISOString(),
          note: formState.note ?? null,
        }),
      });

      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message || "更新に失敗しました。");
      }

      showToast("候補枠を更新しました", "success");
      handleCancel();
      router.refresh();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "エラーが発生しました",
        "error",
      );
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (slotId: string) => {
    if (
      !window.confirm(
        "この候補枠と紐づく候補者回答が削除されます。本当に削除しますか？",
      )
    ) {
      return;
    }
    setLoadingId(slotId);

    try {
      const response = await fetch(`/api/slots/${slotId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message || "削除に失敗しました。");
      }

      showToast("候補枠を削除しました", "success");
      router.refresh();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "エラーが発生しました",
        "error",
      );
    } finally {
      setLoadingId(null);
    }
  };

  const csvContent = useMemo(() => {
    const header = ["slot_id", "start_time", "end_time", "note", "responses"];
    const rows = slots.map((slot) => [
      slot.id,
      slot.start_time,
      slot.end_time,
      slot.note ?? "",
      slot.responses
        .map(
          (res) =>
            `${res.candidate_name ?? "匿名"}(${res.email ?? "N/A"}:${res.status})`,
        )
        .join("; "),
    ]);
    return [header, ...rows].map((cols) => cols.join(",")).join("\n");
  }, [slots]);

  const handleDownloadCsv = () => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `case-slots-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">候補枠と回答</h2>
        {slots.length > 0 && (
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            CSVエクスポート
          </button>
        )}
      </div>
      {slots.length === 0 ? (
        <p className="text-sm text-slate-500">まだ候補枠が登録されていません。</p>
      ) : (
        <div className="space-y-4">
          {slots.map((slot) => {
            const isEditing = editingId === slot.id;
            return (
              <div
                key={slot.id}
                className={`rounded-xl border p-4 shadow-sm ${
                  recommendedSlotId === slot.id
                    ? "border-indigo-300 bg-indigo-50/40"
                    : "border-slate-100"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    {isEditing ? (
                      <>
                        <div className="flex flex-wrap gap-3">
                          <label className="text-xs text-slate-500">
                            開始
                            <input
                              type="datetime-local"
                              value={formState.start}
                              onChange={(event) =>
                                setFormState((prev) => ({
                                  ...prev,
                                  start: event.target.value,
                                }))
                              }
                              className="ml-2 rounded border border-slate-300 px-2 py-1 text-xs"
                            />
                          </label>
                          <label className="text-xs text-slate-500">
                            終了
                            <input
                              type="datetime-local"
                              value={formState.end}
                              onChange={(event) =>
                                setFormState((prev) => ({
                                  ...prev,
                                  end: event.target.value,
                                }))
                              }
                              className="ml-2 rounded border border-slate-300 px-2 py-1 text-xs"
                            />
                          </label>
                        </div>
                        <input
                          type="text"
                          value={formState.note ?? ""}
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              note: event.target.value,
                            }))
                          }
                          className="w-full rounded border border-slate-200 px-3 py-1 text-xs"
                          placeholder="メモ"
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatSlot(slot.start_time, slot.end_time)}
                        </p>
                        {slot.note && (
                          <p className="text-xs text-slate-500">{slot.note}</p>
                        )}
                        {recommendedSlotId === slot.id && (
                          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                            Recommended
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSave(slot.id)}
                          disabled={loadingId === slot.id}
                          className="rounded-full bg-indigo-600 px-3 py-1 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                          保存
                        </button>
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          キャンセル
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleEditClick(slot)}
                          className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(slot.id)}
                          disabled={loadingId === slot.id}
                          className="rounded-full border border-red-200 px-3 py-1 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          削除
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {slot.responses.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {slot.responses.map((response) => (
                      <li
                        key={response.id}
                        className="flex flex-wrap items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-slate-800">
                          {response.candidate_name || "匿名の候補者"}
                        </span>
                        <div className="text-xs text-slate-500">
                          {response.email ?? "メールなし"} /{" "}
                          {new Date(response.created_at).toLocaleString("ja-JP", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatSlot(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  })} ${startDate.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${endDate.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

