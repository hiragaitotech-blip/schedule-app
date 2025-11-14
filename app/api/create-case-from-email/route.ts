import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/src/lib/supabaseClient";
import { getCurrentUserTenantId } from "@/src/lib/tenant";
import { parseEmailWithAI } from "@/src/lib/ai/emailParser";
import type { Case, CaseInsert } from "@/src/types/database";

export async function POST(request: Request) {
  try {
    // 認証チェック
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // テナントIDを取得
    const tenantId = await getCurrentUserTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { error: "テナント情報が見つかりません" },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body.email_text !== "string") {
      return NextResponse.json(
        { error: "email_text を含むJSONを送信してください。" },
        { status: 400 },
      );
    }

    const emailText = body.email_text.trim();

    if (emailText.length < 20) {
      return NextResponse.json(
        {
          error: "メール本文が短すぎます。もう少し詳細なテキストを入力してください。",
        },
        { status: 400 },
      );
    }

    const parsed = await parseEmailWithAI(emailText);

    const { data, error } = await supabase
      .from("cases")
      .insert<CaseInsert>({
        title: parsed.title || "未設定の案件",
        candidate_name: parsed.candidate_name || "候補者名未設定",
        stage: parsed.stage || "1st Interview",
        status: parsed.status || "Scheduling",
        tenant_id: tenantId, // ログインユーザーのtenant_idを設定
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ case: data as Case }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI解析中にエラーが発生しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

