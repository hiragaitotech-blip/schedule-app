import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/src/lib/supabaseClient";
import { getCurrentUserTenantId, verifyCaseAccess } from "@/src/lib/tenant";

type Params = {
  params: {
    caseId: string;
  };
};

export async function PATCH(request: Request, { params }: Params) {
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

    // 案件が同じテナントか確認
    const hasAccess = await verifyCaseAccess(params.caseId, tenantId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "アクセス権限がありません" },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body.status !== "string") {
      return NextResponse.json(
        { error: "status を含むJSONを送信してください。" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("cases")
      .update({
        status: body.status,
        stage: typeof body.stage === "string" ? body.stage : undefined,
      })
      .eq("id", params.caseId)
      .select("id, title, status, stage")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ case: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "ステータス更新中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

