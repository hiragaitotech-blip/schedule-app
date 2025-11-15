import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/src/lib/supabaseClient";
import { getCurrentUserTenantId, verifyCaseAccess } from "@/src/lib/tenant";
import type { CandidateAvailability, Slot, Case } from "@/src/types/database";
import { CreateSlotForm } from "@/src/components/slots/CreateSlotForm";
import { SlotList } from "@/src/components/slots/SlotList";
import { CaseInsights } from "@/src/components/cases/CaseInsights";
import { CopyButton } from "@/src/components/ui/CopyButton";

type SlotWithResponses = Slot & {
  responses: CandidateAvailability[];
};

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const supabase = createSupabaseServerClient();
  const resolvedParams = await Promise.resolve(params);
  const caseId = resolvedParams.id;

  // テナントIDを取得
  const tenantId = await getCurrentUserTenantId();
  if (!tenantId) {
    redirect("/login?redirectedFrom=/cases/" + caseId);
  }

  // 案件を取得
  const { data: caseData } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .single();

  if (!caseData) {
    notFound();
  }

  // created_by のメールアドレスを取得
  let creatorEmail: string | null = null;
  if (caseData.created_by) {
    try {
      const adminClient = createSupabaseAdminClient();
      const { data: authUser } = await adminClient.auth.admin.getUserById(caseData.created_by);
      creatorEmail = authUser?.user?.email || null;
    } catch (error) {
      console.warn("作成者情報の取得に失敗しました:", error);
    }
  }

  // 候補者用URLを生成（public_idを使用）
  const candidateUrl = caseData.public_id
    ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/c/${caseData.public_id}`
    : null;

  // テナントアクセス権限を確認
  const hasAccess = await verifyCaseAccess(caseId, tenantId);
  if (!hasAccess) {
    redirect("/dashboard");
  }

  const { data: slots } = await supabase
    .from("slots")
    .select("*")
    .eq("case_id", caseId)
    .order("start_time", { ascending: true });

  const { data: availabilities } = await supabase
    .from("candidate_availabilities")
    .select("*")
    .eq("case_id", caseId);

  const slotsWithResponses: SlotWithResponses[] =
    slots?.map((slot) => ({
      ...slot,
      responses:
        availabilities?.filter((availability) => availability.slot_id === slot.id) ??
        [],
    })) ?? [];

  const totalResponses = slotsWithResponses.reduce(
    (sum, slot) => sum + slot.responses.length,
    0,
  );

  const recommendedSlot = slotsWithResponses
    .filter((slot) => slot.responses.length > 0)
    .sort((a, b) => b.responses.length - a.responses.length)[0];

  const recommendedSummary = recommendedSlot
    ? {
        id: recommendedSlot.id,
        label: formatSlotLabel(recommendedSlot),
        count: recommendedSlot.responses.length,
      }
    : null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Case Detail
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            {caseData?.title || "案件詳細"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            候補者: {caseData?.candidate_name || "-"} / ステージ:{" "}
            {caseData?.stage || "-"} / ステータス: {caseData?.status || "-"}
          </p>
          {creatorEmail && (
            <p className="mt-1 text-xs text-slate-400">
              担当者: {creatorEmail}
            </p>
          )}
        </div>
        <Link
          href="/dashboard"
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          一覧に戻る
        </Link>
      </div>

      {/* 候補者用URL表示 */}
      {candidateUrl && (
        <section className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-indigo-900 mb-2">
            候補者用リンク
          </h2>
          <p className="text-sm text-indigo-700 mb-3">
            このURLを候補者に送付してください。
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-white px-4 py-2 font-mono text-sm text-indigo-900 break-all">
              {candidateUrl}
            </code>
            <CopyButton text={candidateUrl} />
          </div>
        </section>
      )}

      {/* メール本文表示 */}
      {caseData.raw_email_body && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            メール本文
          </h2>
          <div className="rounded-lg bg-slate-50 p-4 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono">
              {caseData.raw_email_body}
            </pre>
          </div>
        </section>
      )}

      {creatorEmail && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            担当ユーザー
          </h2>
          <p className="text-sm text-slate-600">{creatorEmail}</p>
        </section>
      )}

      <CaseInsights
        caseId={caseData.id}
        status={caseData.status}
        totalResponses={totalResponses}
        totalSlots={slotsWithResponses.length}
        bestSlot={recommendedSummary}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <SlotList
          slots={slotsWithResponses}
          recommendedSlotId={recommendedSummary?.id}
        />
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">候補枠を追加</h2>
        <p className="mt-2 text-sm text-slate-500">
          面接候補日時を追加すると、候補者ページに即時反映されます。
        </p>
        <div className="mt-4">
          <CreateSlotForm caseId={caseData.id} />
        </div>
      </section>
    </div>
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


