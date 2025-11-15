"use client";

import { useState } from "react";
import { useToast } from "@/src/contexts/ToastContext";

type Props = {
  text: string;
  label?: string;
};

export function CopyButton({ text, label = "コピー" }: Props) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast("コピーしました", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("コピーに失敗しました:", error);
      showToast("コピーに失敗しました", "error");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
    >
      {copied ? "✓ コピー済み" : label}
    </button>
  );
}

