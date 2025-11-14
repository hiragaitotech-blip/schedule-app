import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/lib/supabaseClient";
import { parseEmailWithAI } from "@/src/lib/ai/emailParser";
import type { CaseInsert } from "@/src/types/database";

export async function POST(request: Request) {
  const secret = process.env.ZAPIER_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "ZAPIER_WEBHOOK_SECRET が設定されていません。" },
      { status: 500 },
    );
  }

  const incomingSecret = request.headers.get("x-zapier-secret");
  if (!incomingSecret || incomingSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "JSONボディが必要です。" }, { status: 400 });
  }

  const emailText =
    typeof body.email_text === "string"
      ? body.email_text
      : typeof body.body === "string"
        ? body.body
        : "";

  if (!emailText || emailText.trim().length < 20) {
    return NextResponse.json(
      { error: "メール本文 (email_text) を含む十分なテキストを送信してください。" },
      { status: 400 },
    );
  }

  try {
    const parsed = await parseEmailWithAI(emailText.trim());

    const supabase = createSupabaseServerClient();

    // tenant_idの検証
    let finalTenantId: string | null = body.tenant_id ?? null;

    // tenant_idが指定されている場合、そのテナントが存在するか確認
    if (finalTenantId) {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("id", finalTenantId)
        .single();

      if (!tenant) {
        return NextResponse.json(
          { error: "指定されたテナントが見つかりません" },
          { status: 400 },
        );
      }
    }

    const payload: CaseInsert = {
      title: body.title ?? parsed.title ?? "未設定の案件",
      candidate_name:
        body.candidate_name ?? parsed.candidate_name ?? "候補者名未設定",
      stage: body.stage ?? parsed.stage ?? "1st Interview",
      status: body.status ?? parsed.status ?? "Scheduling",
      tenant_id: finalTenantId,
    };

    const { data, error } = await supabase
      .from("cases")
      .insert(payload)
      .select("id, title, candidate_name, stage, status, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { case: data, source: "zapier_webhook" },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI解析中にエラーが発生しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

