import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/src/lib/supabaseClient";
import { getCurrentUserTenantId, verifyCaseAccess } from "@/src/lib/tenant";
import type { SlotInsert } from "@/src/types/database";

type Params = {
  params: {
    caseId: string;
  };
};

export async function POST(request: Request, { params }: Params) {
  try {
    const { caseId } = params;

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

    // 案件が同じテナントか確認
    const hasAccess = await verifyCaseAccess(caseId, tenantId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "アクセス権限がありません" },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => null);

    if (
      !body ||
      typeof body.start_time !== "string" ||
      typeof body.end_time !== "string"
    ) {
      return NextResponse.json(
        { error: "start_time と end_time を指定してください。" },
        { status: 400 },
      );
    }

    const { start_time, end_time, note } = body;

    const payload: SlotInsert = {
      case_id: caseId,
      start_time,
      end_time,
      note: typeof note === "string" ? note : null,
    };

    const { data, error } = await supabase
      .from("slots")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ slot: data }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "スロット作成中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

