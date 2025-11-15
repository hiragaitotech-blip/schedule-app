import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/lib/supabaseClient";
import { isSuperAdmin } from "@/src/lib/admin";

/**
 * テナントの有効/無効を切り替え
 * PATCH /api/admin/tenants/[tenantId]/toggle-active
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> | { tenantId: string } },
) {
  try {
    // スーパー管理者チェック
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "スーパー管理者権限が必要です" },
        { status: 403 },
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const tenantId = resolvedParams.tenantId;

    const body = await request.json();
    const { is_active } = body;

    if (typeof is_active !== "boolean") {
      return NextResponse.json(
        { error: "is_active は boolean である必要があります" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient();

    const { error: updateError } = await supabase
      .from("tenants")
      .update({ is_active })
      .eq("id", tenantId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "テナントの状態を更新しました", is_active },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "テナント状態の更新中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

