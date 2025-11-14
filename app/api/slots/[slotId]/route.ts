import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/src/lib/supabaseClient";
import { getCurrentUserTenantId, verifySlotAccess } from "@/src/lib/tenant";

type Params = {
  params: {
    slotId: string;
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

    // スロットが同じテナントか確認
    const hasAccess = await verifySlotAccess(params.slotId, tenantId);
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

    const { data, error } = await supabase
      .from("slots")
      .update({
        start_time: body.start_time,
        end_time: body.end_time,
        note: typeof body.note === "string" ? body.note : null,
      })
      .eq("id", params.slotId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ slot: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "スロット更新中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
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

    // スロットが同じテナントか確認
    const hasAccess = await verifySlotAccess(params.slotId, tenantId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "アクセス権限がありません" },
        { status: 403 },
      );
    }

    const { error } = await supabase.from("slots").delete().eq("id", params.slotId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "スロット削除中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

