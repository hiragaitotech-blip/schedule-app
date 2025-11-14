import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabaseClient";
import { CandidateAvailabilityForm } from "@/src/components/candidate/CandidateAvailabilityForm";

export default async function CandidateCasePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const supabase = createSupabaseServerClient();
  const resolvedParams = await Promise.resolve(params);
  const caseId = resolvedParams.id;

  const { data: caseData } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .single();

  if (!caseData) {
    notFound();
  }

  const { data: slots } = await supabase
    .from("slots")
    .select("*")
    .eq("case_id", caseId)
    .order("start_time", { ascending: true });

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Interview Availability
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          {caseData.title || "面接候補日選択"}
        </h1>
        <p className="text-sm text-slate-500">
          候補者: {caseData.candidate_name || "あなた"} / ステージ:{" "}
          {caseData.stage || "-"}
        </p>
        <p className="text-sm text-slate-600">
          以下の候補日時の中から、参加可能な枠を選択してください。
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {slots && slots.length > 0 ? (
          <CandidateAvailabilityForm caseId={caseData.id} slots={slots} />
        ) : (
          <p className="text-sm text-slate-500">
            まだ候補日時が設定されていません。担当者からの連絡をお待ちください。
          </p>
        )}
      </section>
    </div>
  );
}

